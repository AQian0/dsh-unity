/**
 * Live catalog refresh for the packaged skills.
 *
 * Editing a skill body already takes effect on the next load, because loading
 * re-reads the file. Adding, removing, or changing the frontmatter of a skill is
 * different: the registry caches the discovered catalog per scope and only
 * refreshes when a provider asks it to. This watcher bridges the filesystem to
 * that contract, so a skill edit shows up in the next step instead of forcing a
 * restart.
 *
 * Watching is optional and never load-bearing: a platform or sandbox that cannot
 * watch leaves the plugin fully functional with restart-time discovery.
 *
 * @module dsh-unity/lib/watch
 */

import { watch } from 'node:fs';

/** Default coalescing window for filesystem bursts. */
const DEFAULT_DEBOUNCE_MS = 200;

/** Options for {@link startSkillsWatcher}. */
export interface WatcherOptions {
  readonly dir: string;
  readonly onChange: () => void;
  readonly logger: { warn(message: string): void };
  readonly debounceMs?: number;
}

/**
 * Start watching a skill directory for catalog-relevant changes.
 *
 * Only `SKILL.md` additions, removals, and edits matter: resource files below a
 * skill are read on demand and do not change discovery.
 *
 * @param options - watcher options.
 * @returns a disposer that stops the watcher.
 */
export function startSkillsWatcher(options: WatcherOptions): () => void {
  const { dir, onChange, logger, debounceMs = DEFAULT_DEBOUNCE_MS } = options;
  let timer: NodeJS.Timeout | undefined;
  let watcher: ReturnType<typeof watch> | undefined;
  let disposed = false;

  const schedule = (): void => {
    if (disposed) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (disposed) return;
      try {
        onChange();
      } catch (error) {
        logger.warn(`unity skills: catalog refresh failed: ${String(error)}`);
      }
    }, debounceMs);
    timer.unref?.();
  };

  try {
    watcher = watch(dir, { recursive: true, persistent: false }, (_event, filename) => {
      if (filename === null || filename === undefined) {
        schedule();
        return;
      }
      if (String(filename).endsWith('SKILL.md')) schedule();
    });
  } catch (error) {
    logger.warn(`unity skills: cannot watch ${dir}, catalog changes need a restart: ${String(error)}`);
    return () => {};
  }

  watcher.on('error', (error: unknown) => {
    logger.warn(`unity skills: skill watcher stopped on ${dir}: ${String(error)}`);
    dispose();
  });

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    try {
      watcher?.close();
    } catch {
      // Closing an already-closed watcher is not an error worth surfacing.
    }
  }

  return dispose;
}
