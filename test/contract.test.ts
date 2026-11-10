import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
  SkillCandidate as ShippedCandidate,
  SkillDefinition as ShippedDefinition,
  SkillProvider as ShippedProvider,
  SkillProviderControl as ShippedControl,
  SkillLookupOptions as ShippedLookupOptions,
} from '@deepseek-ai/dsh-skill';
import type {
  SkillCandidate,
  SkillDefinition,
  SkillLookupOptions,
  SkillProvider,
  SkillProviderControl,
} from '../src/harness.ts';

/** Compile-time assignability: a false branch fails `tsc`, not a runtime assertion. */
type Assignable<From, To> = [From] extends [To] ? true : false;

// The candidate this package returns must satisfy the registry's validation,
// and the control/options it consumes must accept the shipped shapes. A
// breaking change in `@deepseek-ai/dsh-skill` fails `pnpm typecheck` here
// instead of surfacing as a runtime rejection.
const candidateAssignable: Assignable<SkillCandidate, ShippedCandidate> = true;
const definitionAssignable: Assignable<SkillDefinition, ShippedDefinition> = true;
const controlAssignable: Assignable<ShippedControl, SkillProviderControl> = true;
const optionsAssignable: Assignable<ShippedLookupOptions, SkillLookupOptions> = true;

/**
 * Adapt the local provider to the shipped interface.
 *
 * The shipped `SkillCandidate.locator` is `unknown`, while this package narrows
 * it to the `{ dir, file }` handle its reader produced; the registry only ever
 * passes that handle back to the provider that returned it, so the cast is
 * sound. A function property makes the shipped interface check `get` strictly,
 * which is why a direct assignability assertion is not the right shape here.
 */
function toShippedProvider(provider: SkillProvider): ShippedProvider {
  return {
    name: provider.name,
    list: (options) => provider.list(options),
    get: (candidate, options) => provider.get(candidate as unknown as SkillCandidate, options),
  };
}

const adapter: (provider: SkillProvider) => ShippedProvider = toShippedProvider;

test('the local provider types stay assignable to the shipped DSH contract', () => {
  assert.deepEqual(
    [candidateAssignable, definitionAssignable, controlAssignable, optionsAssignable],
    [true, true, true, true],
  );
  assert.equal(typeof adapter, 'function');
});
