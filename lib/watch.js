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

/**
 * Start watching a skill directory for catalog-relevant changes.
 *
 * Only `SKILL.md` additions, removals, and edits matter: resource files below a
 * skill are read on demand and do not change discovery.
 *
 * @param {object} options - watcher options.
 * @param {string} options.dir - skill directory to watch.
 * @param {() => void} options.onChange - called after a debounced change.
 * @param {{ warn: (message: string) => void }} options.logger - warning sink.
 * @param {number} [options.debounceMs] - coalescing window.
 * @returns {() => void} disposer that stops the watcher.
 */
export function startSkillsWatcher({ dir, onChange, logger, debounceMs = DEFAULT_DEBOUNCE_MS }) {
  let timer;
  let watcher;
  let disposed = false;

  const schedule = () => {
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

  watcher.on('error', (error) => {
    logger.warn(`unity skills: skill watcher stopped on ${dir}: ${String(error)}`);
    dispose();
  });

  function dispose() {
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
