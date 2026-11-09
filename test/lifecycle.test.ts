import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { apply, resolveSettings } from '../src/index.ts';
import type { PluginConfig } from '../src/index.ts';
import type {
  AgentLike,
  AgentsService,
  PluginContext,
  PromptContext,
  SkillProvider,
  SkillProviderControl,
} from '../src/harness.ts';

/** The fake agent's two scoped services. */
interface AgentScopedServices {
  readonly skills: {
    registerProvider(create: (control: SkillProviderControl) => SkillProvider): () => void;
  };
  readonly systemPrompt: {
    context(contribution: PromptContext): () => void;
  };
}

/** A fake agent, exposing what the plugin registered on it. */
interface AgentFake extends AgentLike {
  readonly session: { id: string; header: { cwd: string } };
  readonly ctx: { get(name: string): unknown };
  skillsCalls: number;
  promptCalls: number;
  provider: SkillProvider | undefined;
  context: PromptContext | undefined;
  providerDisposed: boolean;
  readonly services: AgentScopedServices;
}

/** What the fake context recorded. */
interface HarnessRecord {
  globalProviders: SkillProvider[];
  handlers: Map<string, (payload: unknown) => unknown>;
  warnings: string[];
  cleanup: (() => void) | undefined;
}

/** A fake plugin context that records registrations. */
function createHarness(agents: AgentsService | undefined): { ctx: PluginContext; record: HarnessRecord } {
  const record: HarnessRecord = { globalProviders: [], handlers: new Map(), warnings: [], cleanup: undefined };
  const ctx = {
    logger: { warn: (message: string) => record.warnings.push(message) },
    skills: {
      registerProvider: (create: (control: SkillProviderControl) => SkillProvider) => {
        record.globalProviders.push(create({ signal: new AbortController().signal, invalidate: () => {} }));
        return () => {};
      },
    },
    get: (name: string): unknown => (name === 'agents' ? agents : undefined),
    on: (event: string, listener: (payload: unknown) => unknown) => {
      record.handlers.set(event, listener);
      return () => record.handlers.delete(event);
    },
    effect: (create: () => () => void) => {
      record.cleanup = create();
      return () => {};
    },
  } as PluginContext;
  return { ctx, record };
}

/** A fake agent whose scoped services record what they receive. */
function createAgent(id: string, cwd: string, options: { skills?: boolean; prompt?: boolean } = {}): AgentFake {
  const services: AgentScopedServices = {
    skills: {
      registerProvider: (create) => {
        agent.skillsCalls += 1;
        agent.provider = create({ signal: new AbortController().signal, invalidate: () => {} });
        return () => {
          agent.providerDisposed = true;
        };
      },
    },
    systemPrompt: {
      context: (contribution) => {
        agent.promptCalls += 1;
        agent.context = contribution;
        return () => {};
      },
    },
  };
  const agent: AgentFake = {
    session: { id, header: { cwd } },
    ctx: {
      get: (name: string): unknown => {
        if (name === 'skills') return options.skills === false ? undefined : services.skills;
        if (name === 'systemPrompt') return options.prompt === false ? undefined : services.systemPrompt;
        return undefined;
      },
    },
    skillsCalls: 0,
    promptCalls: 0,
    provider: undefined,
    context: undefined,
    providerDisposed: false,
    services,
  };
  return agent;
}

/** Create a throwaway Unity project. */
async function createProject(
  options: { version?: string; packages?: Record<string, string> } = {},
): Promise<string> {
  const { version = '6000.3.14f1', packages = { 'com.unity.ugui': '2.0.0' } } = options;
  const root = await mkdtemp(join(tmpdir(), 'dsh-unity-lifecycle-'));
  await mkdir(join(root, 'ProjectSettings'), { recursive: true });
  await writeFile(join(root, 'ProjectSettings', 'ProjectVersion.txt'), `m_EditorVersion: ${version}\n`);
  await mkdir(join(root, 'Packages'), { recursive: true });
  await writeFile(join(root, 'Packages', 'manifest.json'), JSON.stringify({ dependencies: packages }));
  return root;
}

/** Fire the recorded `agent/created` handler. */
async function created(record: HarnessRecord, agent: AgentFake): Promise<void> {
  const handler = record.handlers.get('agent/created');
  assert.ok(handler);
  await handler({ agent });
}

const CONFIG: PluginConfig = { watchSkills: false };

test('each agent gets its own provider registered through its scoped context', async () => {
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, CONFIG);
  const agent = createAgent('s1', '/tmp');

  await created(record, agent);
  assert.equal(agent.skillsCalls, 1);
  assert.equal(agent.provider?.name, 'unity');
  assert.equal(record.globalProviders.length, 0, 'no global provider when per-agent registration works');
  assert.equal(agent.context?.name, 'unity:project');
  assert.equal(agent.context?.order, 180);

  const candidates = await agent.provider?.list({ cwd: '/tmp' });
  assert.ok(candidates);
  assert.equal(candidates.length, 34);
  const visible = candidates.filter((candidate) => candidate.invocation.modelInvocable).map((candidate) => candidate.name);
  assert.deepEqual(visible.sort(), ['new-unity-project', 'unity-cli', 'unity-package-management']);

  record.handlers.get('agent/disposed')?.({ agent });
  assert.equal(agent.providerDisposed, true);
});

test('a Unity project admits the skills its editor and packages satisfy', async () => {
  const root = await createProject();
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, CONFIG);
  const agent = createAgent('s2', root);
  try {
    await created(record, agent);
    const candidates = (await agent.provider?.list({ cwd: root })) ?? [];
    const hidden = new Set(
      candidates.filter((candidate) => !candidate.invocation.modelInvocable).map((candidate) => candidate.name),
    );
    assert.equal(hidden.has('build-gtk'), true, 'needs Unity >=6000.6');
    assert.equal(hidden.has('shader-graph-create-custom-node'), true, 'needs com.unity.shadergraph');
    assert.equal(hidden.has('urp-postprocessing'), true, 'needs URP');
    assert.equal(hidden.has('fix-3d-physics-collisions'), false, 'needs Unity >=6000.3, which is satisfied');
    assert.equal(hidden.has('unity-cli'), false);
    assert.match(typeof agent.context?.text === 'function' ? agent.context.text({}) : '', /Unity project: .*Editor 6000\.3\.14f1/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a hidden skill is still loadable, which keeps explicit invocation working', async () => {
  const root = await createProject();
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, CONFIG);
  const agent = createAgent('s3', root);
  try {
    await created(record, agent);
    const candidates = (await agent.provider?.list({ cwd: root })) ?? [];
    const hidden = candidates.find((candidate) => candidate.name === 'build-gtk');
    assert.ok(hidden);
    assert.equal(hidden.invocation.modelInvocable, false);
    const loaded = await agent.provider?.get(hidden, {});
    assert.ok(loaded);
    assert.equal(loaded.name, 'build-gtk');
    assert.ok(loaded.content.length > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a project skill of the same name is left to the project', async () => {
  const root = await createProject();
  await mkdir(join(root, '.dsh', 'skills', 'ui-uitk'), { recursive: true });
  await writeFile(join(root, '.dsh', 'skills', 'ui-uitk', 'SKILL.md'), '---\nname: ui-uitk\ndescription: project copy\n---\n');
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, CONFIG);
  const agent = createAgent('s4', root);
  try {
    await created(record, agent);
    const names = ((await agent.provider?.list({ cwd: root })) ?? []).map((candidate) => candidate.name);
    assert.equal(names.includes('ui-uitk'), false);
    assert.equal(names.length, 33);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('without a reachable agent skill registry the plugin falls back once to a global provider', async () => {
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, CONFIG);
  await created(record, createAgent('s5', '/tmp', { skills: false }));
  await created(record, createAgent('s6', '/tmp', { skills: false }));
  assert.equal(record.globalProviders.length, 1, 'one global provider, not one per agent');
  assert.match(record.warnings.join('\n'), /per-agent registration is unavailable/);
});

test('agents that already exist when the plugin loads are bootstrapped', async () => {
  const existing = createAgent('old', '/tmp');
  const { ctx } = createHarness({ list: () => [existing] });
  apply(ctx, CONFIG);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(existing.skillsCalls, 1);
});

test('without an agents service the plugin still serves a global provider', () => {
  const { ctx, record } = createHarness(undefined);
  apply(ctx, CONFIG);
  assert.equal(record.globalProviders.length, 1);
});

test('config is validated before anything registers', () => {
  assert.throws(() => resolveSettings({ providerName: 'runtime' }), /reserved for runtime/);
  assert.throws(() => resolveSettings({ rank: Number.NaN }), /finite number/);
  assert.throws(() => resolveSettings({ exclude: 'ui' as never }), /array of non-empty strings/);
  assert.throws(() => resolveSettings({ workspaceSkills: [42 as never] }), /array of non-empty strings/);
  assert.throws(() => resolveSettings({ gateByProject: 'yes' as never }), /must be a boolean/);
  assert.throws(() => resolveSettings({ enforceRequirements: 1 as never }), /must be a boolean/);
  const defaults = resolveSettings({});
  assert.equal(defaults.rank, 240);
  assert.equal(defaults.gateByProject, true);
  assert.deepEqual([...defaults.workspaceSkills].sort(), ['new-unity-project', 'unity-cli', 'unity-package-management']);
});

test('disposal unwinds the listeners and the watcher', () => {
  const { ctx, record } = createHarness({ list: () => [] });
  apply(ctx, { watchSkills: true });
  assert.equal(typeof record.cleanup, 'function');
  assert.equal(record.handlers.size, 2);
  record.cleanup?.();
  assert.equal(record.handlers.size, 0);
});
