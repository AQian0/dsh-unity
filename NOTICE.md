# NOTICE

`@aqian0/dsh-unity` is a DeepSeek Harness bundle. It bundles two separately
licensed components, and the license of each part is determined by its path.

| Path | Component | Copyright | License |
| --- | --- | --- | --- |
| `src/`, `lib/`, `test/`, `scripts/`, `cordis.patch.yml`, `locale/`, `icon.svg`, `README.md`, `docs/` | The bundle: the DSH skill provider, its configuration, tests, tooling, and documentation | © 2026 AQian | MIT — see [LICENSE.md](./LICENSE.md) |
| `skills/**` | The 34 Unity skills: Markdown guidance, reference documents, and C# sample scripts | © 2026 Unity Technologies | Unity Companion License — see [LICENSE-UNITY-COMPANION.md](./LICENSE-UNITY-COMPANION.md) |

## Unity Technologies notice

The skill content under `skills/` is adapted from Unity Technologies' Unity
Agent Plugin (https://github.com/Unity-Technologies/unity-agent-plugin) for use
with DeepSeek Harness. It remains the property of Unity Technologies ApS and is
made available only under the Unity Companion License:

> Unity Agent Plugin © 2026 Unity Technologies
>
> Licensed under the Unity Companion License for Unity-dependent projects (see
> https://unity3d.com/legal/licenses/unity_companion_license).
>
> Unless expressly provided otherwise, the Software under this license is made
> available strictly on an "AS IS" BASIS WITHOUT WARRANTY OF ANY KIND, EXPRESS
> OR IMPLIED. Please review the license for details on these and other terms
> and conditions.

The MIT license of this package does not apply to that content and does not
grant any rights that the Unity Companion License withholds. In particular, and
without replacing the license text:

- Use of the skill content is permitted only in connection with the creation,
  use, and/or distribution of applications or other content under a valid Unity
  Engine License ("Unity Companion Use Only").
- The skill content may not be used for competitive analysis or to develop a
  competing product or service.
- No right or license is granted to Unity trademarks, service marks, trade
  names, product names, or branding.

## Security notes inside the skills

Sixteen skills ship a `SECURITY.md` next to their `SKILL.md`. These are Unity's
notes about capabilities that automated scanners flag (for example running C#
in the user's open Editor, installing from a pipe, or changing agent
configuration) and about the safeguards that bound them. They sit alongside
`SKILL.md` in each skill folder, are part of the skill content, and are covered
by the Unity Companion License like the rest of `skills/**`.

## Third-party products referenced by the skills

The skills document workflows for Unity and for third-party SDKs and services,
including LevelPlay/ironSource, Vivox, Unity IAP, StoreKit, Google Play Billing,
and Unity Gaming Services. No third-party SDK code is bundled in this package;
those products remain governed by their own terms and licenses.

## Trademarks

Unity and the Unity logo are trademarks or registered trademarks of Unity
Technologies ApS or its affiliates. The `icon.svg` bundle icon is derived from
Unity's plugin icon and is used descriptively; see Unity's branding guidelines
at https://unity.com/legal/branding-trademarks. DeepSeek Harness and its marks
belong to their respective owners. This package is a third-party integration
and is not published by Unity Technologies.
