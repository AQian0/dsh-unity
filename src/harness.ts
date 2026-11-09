/**
 * Structural declarations for the harness surfaces this plugin uses.
 *
 * The package is a plugin bundle, not a harness package: it never imports
 * `@deepseek-ai/*` at runtime, and it deliberately keeps no build-time dependency
 * on them so a local checkout type-checks without a network install. The
 * interfaces below transcribe the parts of the harness contracts that matter
 * here — the skill registry provider contract, the prompt-context contribution,
 * the agent-scope boundary, and the optional services reached through `ctx.get`.
 *
 * Each type names the harness contract it mirrors. When the harness changes one
 * of them, this file is the single place to update.
 *
 * @module dsh-unity/lib/harness
 */

/** `SkillInvocationPolicy` from the `skills` service contract. */
export interface SkillInvocationPolicy {
  readonly modelInvocable: boolean;
  readonly userInvocable: boolean;
}

/** What a skill declares about the project it needs. */
export interface SkillRequirements {
  readonly editor?: string;
  readonly packages: ReadonlyArray<{ readonly name: string; readonly range: string }>;
}

/** The opaque handle a provider hands back to the registry and receives again on load. */
export interface SkillLocator {
  readonly dir: string;
  readonly file: string;
}

/** `SkillCandidate` — a catalog entry with its provider-private locator. */
export interface SkillCandidate {
  readonly name: string;
  readonly description: string;
  readonly whenToUse?: string;
  readonly invocation: SkillInvocationPolicy;
  readonly requirements?: SkillRequirements;
  readonly source: string;
  readonly provider: string;
  readonly rank: number;
  readonly locator: SkillLocator;
  readonly resourceBase: { readonly kind: 'directory'; readonly path: string };
  readonly path?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** `SkillDefinition` — a loaded body plus everything the candidate carried. */
export interface SkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly whenToUse?: string;
  readonly invocation: SkillInvocationPolicy;
  readonly source: string;
  readonly provider: string;
  readonly resourceBase: { readonly kind: 'directory'; readonly path: string };
  readonly path?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly content: string;
}

/** `SkillProviderControl` — the registration's lifecycle and cache invalidation. */
export interface SkillProviderControl {
  readonly signal: AbortSignal;
  readonly invalidate: () => void;
}

/** Options the registry passes to discovery and loading. */
export interface SkillLookupOptions {
  readonly cwd?: string | undefined;
  readonly signal?: AbortSignal | undefined;
}

/** `SkillProvider` — what this plugin registers. */
export interface SkillProvider {
  readonly name: string;
  list(options: SkillLookupOptions): Promise<readonly SkillCandidate[]>;
  get(candidate: SkillCandidate, options: SkillLookupOptions): Promise<SkillDefinition | undefined>;
}

/** The `skills` registry surface this plugin touches. */
export interface SkillsService {
  registerProvider(create: (control: SkillProviderControl) => SkillProvider): () => void;
}

/** `PromptContext` from the `system-prompt` contract. */
export interface PromptContext {
  readonly name: string;
  readonly order: number;
  readonly text: string | ((context: unknown) => string);
  readonly required?: boolean;
  readonly interpolate?: boolean;
}

/** The `systemPrompt` registry surface this plugin touches. */
export interface SystemPromptService {
  context(context: PromptContext): () => void;
}

/** The `workingDirectory` service surface this plugin touches. */
export interface WorkingDirectoryService {
  get(session: SessionLike | undefined): string | undefined;
}

/** The `agents` service surface this plugin touches. */
export interface AgentsService {
  list(): AgentLike[];
}

/** The `subprocess` service surface this plugin touches. */
export interface SubprocessService {
  resolveExecutable(command: string, env?: Readonly<Record<string, string>>, signal?: AbortSignal): Promise<string>;
}

/** Enough of a Session to read an identity and a fallback directory. */
export interface SessionLike {
  readonly id?: string;
  readonly header?: { readonly cwd?: string };
  readonly cwd?: string;
}

/**
 * The agent-scope boundary.
 *
 * Registrations made through this context land in the agent's own scope layer,
 * which is what makes the provider win duplicate names and vary by project.
 */
export interface AgentContext {
  get(name: string): unknown;
}

/** The agent surface this plugin touches. */
export interface AgentLike {
  readonly id?: string;
  readonly session?: SessionLike;
  readonly ctx?: AgentContext;
}

/** A logger with the two levels this plugin uses. */
export interface Logger {
  warn(message: string): void;
  debug?(message: string): void;
}

/**
 * The Cordis plugin context, narrowed to what `apply()` uses.
 *
 * `get(name)` is the optional-service accessor; `skills` is declared because the
 * plugin imports it as a hard dependency.
 */
export interface PluginContext {
  readonly logger: Logger;
  readonly skills: SkillsService;
  get(name: string): unknown;
  on(event: string, listener: (payload: unknown) => unknown): () => void;
  effect(create: () => () => void, label?: string): () => void;
}
