# dsh-unity 设计说明

`@aqian0/dsh-unity` 把 34 个 Unity 技能作为 DSH 技能提供出去。它与"把 Markdown 目录挂进技能注册表"的区别在于**在哪注册**和**怎么服务**：注册按 agent 进行，目录按会话所在工程筛选，工程事实写进该会话的运行时上下文，技能目录的变化实时刷新。本文记录这套设计。

代码是唯一事实来源：`src/index.ts`、`src/registry.ts`、`src/project.ts`、`src/gating.ts`、`src/requirements.ts`、`src/watch.ts`、`src/skills.ts`、`src/frontmatter.ts`、`src/harness.ts`；本文与代码冲突时以代码为准。文中提到"代码"时指 `src/*.ts`，`lib/*.js` 只在讨论构建产物时出现。

## 1. 目标与范围

- **一个包，34 个技能**：装进 profile 后，技能出现在会话目录里，按需加载。
- **目录跟随会话**：不在 Unity 工程里只保留起步技能；在工程里按 Editor 版本与已装包筛掉不适用的技能。
- **事实交给模型**：把检测到的工程事实与"哪些技能被隐藏、为什么"写进运行时上下文，让模型陈述而不是猜。
- **零运行时依赖**：只用 Node 内置模块（`node:fs`、`node:path`、`node:child_process` 经服务封装）；构建只在仓库侧发生（`npm run build` / `prepack` 产出 `lib/`），安装已发布的包时不再编译，也没有第三方安装依赖。
- **可卸载**：所有监听、watcher 与注册都在 `ctx.effect` 里，fiber 释放时统一注销。

不在范围内：技能正文怎么写、什么时候该用哪个技能（由模型按描述判断），以及技能的版本管理。

## 2. 组成

| 文件 | 作用 |
| --- | --- |
| `src/index.ts` | 行入口：校验配置、共享解析缓存、创建 agent registry、监听 `agent/created`/`agent/disposed`、启动 watcher、在 fiber 释放时统一注销 |
| `src/registry.ts` | 每个 agent 一份注册；事实与项目覆盖的缓存；provider 实现；全局回退 provider |
| `src/project.ts` | 工程检测（向上找 marker、Editor 版本、manifest、Editor 锁、`unity` CLI）、工程自有技能名、`factsKey` |
| `src/gating.ts` | 可见性决策（工作区技能、需求、项目覆盖）、候选改写、运行时上下文渲染 |
| `src/requirements.ts` | 版本与包的解析、比较，需求的读取与求值 |
| `src/watch.ts` | `skills/` 的 `fs.watch`，200ms 防抖，只在 `SKILL.md` 变化时触发 |
| `src/skills.ts` | 技能发现与加载，外加按 (path, mtime, size) 命中的共享解析缓存 |
| `src/frontmatter.ts` | 自包含的 YAML 子集读取器与 invocation 解析 |
| `src/harness.ts` | 本包用到的 harness 契约的结构化声明（provider、prompt context、agent scope、可选服务），使构建不需要依赖 `@deepseek-ai/*` |
| `cordis.patch.yml` | 只插入一个 Host 行 `unity-skills`（`config: {}`） |
| `skills/` | 34 个技能目录，每个是 `<name>/SKILL.md` + 可选的 `references/`、`scripts/`、`resources/` |

**构建形态**与官方插件包一致：仓库里是 `src/` 下的 TypeScript，`npm run build`（`tsc -p tsconfig.json`）产出 `lib/*.js` 与 `lib/types/*.d.ts`，`prepack` 会再跑一次构建，因此 `npm pack` 出来的 tarball 只有编译产物、`cordis.patch.yml`、`locale/`、`skills/`、图标，以及 `README.md`、`docs/`、`CHANGELOG.md` 与 `LICENSE.md`、`LICENSE-UNITY-COMPANION.md`、`NOTICE.md`。`lib/` 被 `.gitignore` 忽略，不随仓库提交；按目录安装前需要先构建。`tsconfig.test.json` 只做类型检查（`src/`、`test/`、`scripts/`），测试与脚本由 Node 内置的类型剥离直接运行 `.ts`（`engines` 要求 Node.js >=22.18）。

此外，`locale/en.json` / `locale/zh.json` 与 `icon.svg` 提供插件页的标题、描述与图标（图标使用 Lucide 的 `gamepad-2` 图形，按 ISC 许可，见 `NOTICE.md`）。许可证按路径划分：整合代码（`src/`、`test/`、`scripts/`、配置与文档）是 MIT，全文见 `LICENSE.md`；`skills/` 下的技能内容版权属于 Unity Technologies，按 Unity Companion License 使用，全文见 `LICENSE-UNITY-COMPANION.md`；各覆盖哪些路径由 `NOTICE.md` 记录。这些文件与 `CHANGELOG.md` 一起随包发布。`scripts/validate-skills.ts` 与 `test/*.test.ts` 是开发期工具（见 7.3 与第 9 节）。

## 3. 为什么用 provider，为什么必须按 agent 注册

### 3.1 为什么不是纯配置

**备选 A：纯配置 bundle** —— 把某个目录加进 `skill-filesystem` 的 `customSkillDirs`。

- 需要绝对路径（或用 `!!js` 在补丁里求值），路径随 checkout 变，换机器就断。
- `customSkillDirs` 是固定的扫描根，不能按工程（Editor 版本、已装包）决定目录内容。
- `source` 标签只能是 `custom`，和项目/用户的自定义根混在一起，无法单独启停或标识。

**备选 B：在 `apply()` 里逐个 `ctx.skills.register()`** —— 把 34 个技能注册成 runtime 条目。

- 启动时要把 34 份正文读进内存，失去"目录只放名称与描述、正文按需加载"的收益。
- runtime 条目的排序语义是固定的（同层内 project > runtime > user），没有可配置的 rank 落点。
- 每个条目都要手工程造 `SkillDefinition`，与"把磁盘上的技能目录当作目录包"的模型不符。

**结论**：注册一个 provider。它解析包内技能目录（`import.meta.url`），延迟发现、懒加载，自带 rank、`source` 标签与 `resourceBase`。

### 3.2 为什么必须按 agent 注册

DSH 把技能注册按**层**组织：一次注册落在调用上下文所在的层。bundle 行是 host 行，落在全局层；agent 预设的 standing composition 落在该预设的层。读取时把全局层和观察 scope 的层链合并，规则是——**最近的层直接胜出重名，rank 只在同一层内比较**。

两个后果决定了设计：

1. **只在全局层注册会输掉同名技能**：预设层里挂着 `skill-filesystem`，它扫描到的同名技能属于更近的层，"最近的层胜出"让全局 provider 的 rank 形同虚设。
2. **全局注册无法按工程变化**：一份全局目录要被所有会话共用，不能按某个会话的 Editor 版本和包列表裁剪。

所以 `apply()` 不做"注册一次"，而是监听 agent 生命周期，拿到每个 agent 后经 `agent.ctx` 把 provider 注册进**该 agent 自己的层**。这样它在该层里赢得自己拥有的名字，目录也可以按这个 agent 的工程计算。这条胜负关系由层的位置决定，不靠 `rank` 或运气：插件注册在 agent 自己的层，比全局层和外部技能根都近，所以外部根里的同名副本不会盖掉插件的版本。

### 3.3 回退路径

如果某个 profile 里 `agent.ctx` 够不到 `skills`（或者根本没有 `agents` 服务），插件注册**一份全局 provider** 并记录一条警告（每行只注册一次）。这条路径：

- 仍按每次查询的 `cwd` 做工程门控；
- 没有 `unity:project` 上下文（上下文是 agent 作用域的贡献）；
- 同名的预设层技能会重新胜出（因为回到了全局层）。

## 4. provider 契约与 per-agent 生命周期

### 4.1 注册表契约

`ctx.skills.registerProvider(create)` 在插件 `apply()` 期间**同步**注册，注册进入调用上下文所在层。同层重名与保留名会抛错。`create` 收到 `control`：`signal` 是本注册的生命周期，`invalidate()` 用来主动让注册表丢弃已缓存的目录；fiber 释放时注销 provider 并让缓存失效。

本包的 provider 是 `{ name, list(options), get(candidate, options) }`：

- `list()` 返回**裸数组**也是合法观察结果——注册表把它归一化为 `{ candidates, complete: true }`，即"这轮发现是完整的"，允许进缓存。本包按目录整体读取，没有"部分根失败"这种半完成状态。
- `get()` 直接落到共享 reader 的 `load()`，每次重读文件。

### 4.2 每个 agent 的注册状态

`src/registry.ts` 为每个 agent 保存：会话 id、agent 引用、provider 注册的 `control`、最近一次的工程事实与隐藏列表、`factsKey`、以及两个 disposer（provider 注册和上下文条目）。

- **解析工作目录**：优先 `ctx.workingDirectory.get(session)`，退回 `session.header.cwd`；每次 `list()` 都重新解析，所以会话切换工作目录会立即重新门控。
- **注册**：`agent.ctx.skills.registerProvider(...)`。拿不到 `skills` 时 `add()` 返回 `unavailable`，由 `src/index.ts` 触发一次全局回退。
- **上下文**：若 `injectContext` 且 `agent.ctx.systemPrompt` 可用，注册 `{ name: 'unity:project', order: 180, text: () => renderContext(...) ?? '' }`，每次组装提示词时重算。
- **预热**：注册完成后立刻读一次工程事实，让第一次提示词组装就带上上下文。
- **注销**：`agent/disposed` 时释放该 agent 的 provider 注册与上下文条目；fiber 释放时释放全部监听、watcher 与注册。
- **启动时已存在的 agent**：用 `ctx.agents.list()` 逐个 bootstrap，不需要等新会话。

### 4.3 候选字段

| 字段 | 值 |
| --- | --- |
| `name` | frontmatter `name`（kebab-case） |
| `description` | frontmatter `description` |
| `whenToUse` | frontmatter `whenToUse`，有才带（当前 34 个都没写） |
| `invocation` | 由 `disable-model-invocation` / `user-invocable` 解析，门控会再叠加 `modelInvocable` |
| `requirements` | 从 `required_editor_version` / `required_packages` 读出的需求声明，供门控使用 |
| `provider` | `providerName`，默认 `unity` |
| `source` | 固定 `unity`（自定义标签，不参与优先级） |
| `rank` | `rank` 配置，默认 240 |
| `locator` | `{ dir, file }`，加载时传回 provider |
| `resourceBase` | `{ kind: 'directory', path: <技能目录> }` |
| `path` | `SKILL.md` 路径（加载时换成 `realpath`，便于预览） |
| `metadata` | frontmatter `metadata`（纯映射时透传） |

## 5. 技能 frontmatter 的处理

### 5.1 读了哪些字段

对 34 个 `SKILL.md` 解析后的统计（字段 / 出现次数 / 处理）：

| 字段 | 次数 | 处理 |
| --- | --- | --- |
| `name` | 34 | 读取；必须是 kebab-case，与目录名不一致时告警但仍收录 |
| `description` | 34 | 读取；为空则跳过该技能 |
| `required_editor_version` | 2 | 读取并**执行**：与工程 Editor 版本比较，不满足则隐藏该技能 |
| `required_packages` | 5 | 读取并**执行**：包缺失或版本不满足则隐藏该技能 |
| `allowed-tools` | 5 | 解析但不执行（DSH 没有技能级工具白名单） |
| `modes` | 2 | 解析但不执行（`[agent, ask]` 形式的模式声明） |
| `metadata` | 1 | 纯映射时透传到候选与定义 |
| `enabled` | 1 | 解析但不执行 |
| `whenToUse` | 0 | DSH 支持，没有技能使用 |
| `disable-model-invocation` | 0 | DSH 支持，没有技能使用 |
| `user-invocable` | 0 | DSH 支持，没有技能使用 |

### 5.2 需求声明

有需求的技能共 7 个：

| 技能 | 声明 |
| --- | --- |
| `build-gtk` | Editor `>=6000.6` |
| `fix-3d-physics-collisions` | Editor `>=6000.3` |
| `asset-transformer-toolkit` | `com.unity.industry.toolkit >=4.0.0` |
| `create-tile-palette-or-rule-tiles` | `com.unity.2d.tilemap >=1.0.0`、`com.unity.2d.tilemap.extras >=4.0.0` |
| `setup-vivox-voice-chat` | `com.unity.services.vivox >=16.4.0` |
| `shader-graph-create-custom-node` | `com.unity.shadergraph >=17.5.0` |
| `urp-postprocessing` | `com.unity.render-pipelines.universal >=14.0.0` |

`src/requirements.ts` 只支持这些技能用到的形状：算子 `>=`、`>`、`<=`、`<`、`=`、`^`、`~`，逗号或空格分隔多个比较，算子与版本之间可以有空格。两段版本（`6000.6`）表示一条发布线（`>=6000.6 <6000.7`），三段版本是精确版本。Editor 版本会去掉 `f1`/`b5` 这类构建通道后缀再比较；包版本保留预发布标签，且发布版高于预发布版。

求值结果有三种，而不是两种：

- **满足**：技能可见；
- **不满足**：技能隐藏，并给出原因（缺哪个包、要求什么版本、工程是什么版本）；
- **未知**（manifest 缺失、版本或范围解析不了）：**不隐藏**，只记录"无法检查"。

未知不隐藏是刻意的：一个写错的范围或临时的 manifest 损坏，不应该让技能从目录里静默消失。

### 5.3 invocation 与门控的叠加

`parseInvocation()` 先按 frontmatter 得到技能自己的策略：

| frontmatter | `modelInvocable` | `userInvocable` |
| --- | --- | --- |
| （两者都没写） | `true` | `true` |
| `disable-model-invocation: true` | `false` | `true` |
| `user-invocable: false` | `true` | `false` |
| 两者都写 | 按各自值 | 按各自值 |

只接受 `frontmatterBoolean` 的严格语法（YAML 布尔，以及大小写不敏感的 `true/false`、`yes/no`、`on/off`、`1/0`）；拼错的 camelCase 写法会直接报错并跳过该技能，而不是"静默允许"。

门控只在模型可见性上叠加：被隐藏的技能保持 `userInvocable: true`、`modelInvocable: false`，因此它离开模型的目录，但 `/技能名` 仍能载入。34 个技能都没写这两个字段，所以门控是它们唯一的隐藏来源。

### 5.4 resourceBase 与相对路径

技能正文里大量使用技能内相对路径（`references/api-reference.md`、`references/camera-setup-urp.cs` 等）。DSH 的技能消费者在加载正文时会把 `resourceBase` 作为"资源目录"提示一起给出，因此模型可以直接按相对路径读取这些文件，不需要改写正文里的链接。这也是候选与定义都要带 `resourceBase: { kind: 'directory', path: <技能目录> }` 的原因：只给正文不给资源根，`references/` 就成了断链。

### 5.5 解析器的边界

`src/frontmatter.ts` 是一个自包含的 YAML 子集读取器，覆盖这些技能用到的语法：顶层 `key: value` 与多层嵌套块映射、块序列与流序列、单/双引号与纯标量、字面块（`|`、`|-`、`|+`）与折叠块（`>`、`>-`、`>+`）、整行注释与纯标量后的行内注释；标量按 YAML 1.2 core schema 解析。

不支持的语法（锚点/别名、多文档、复杂键、tab 缩进）会抛 `SyntaxError`：发现阶段由 `list()` 捕获、跳过该技能并告警；加载阶段直接抛给调用方，不在 provider 里猜值。包不能带 YAML 依赖，而"猜错一个描述"比"少一个技能"更糟。

### 5.6 保留不执行字段的理由

`allowed-tools`、`modes`、`enabled` 在技能文件里存在，DSH 不执行它们。删掉只会让信息消失，不会让 DSH 更强；限制写在文档里（README 的"已知限制"与校验脚本的信息项），不是静默行为。校验脚本仍把它们（以及已执行的 `required_*`）列在"信息项"里，因为它按 DSH 认识的键判定，而 DSH 本身不消费这几个键。

## 6. rank 与层边界

同名技能的归属由**层**决定，`rank` 只解决同一层内的先后。

| 情况 | 结果 |
| --- | --- |
| 与工程自己的 `<工程>/.dsh/skills`、`.agents/skills` 同名 | 插件不提供该名字（`respectProjectRoots`），工程那份生效 |
| 与 `~/.dsh/skills`、`~/.agents/skills` 等外部副本同名 | 插件在 agent 自己的层里，最近层胜出 → 插件赢 |
| 与同层 runtime 注册（rank 250）同名 | 同层内按 rank：本包 240 排在前 |
| 回退到全局 provider 时 | 预设层的同名技能重新胜出 |

默认 `rank: 240` 就是按上表选的：正常路径下重名由层解决，这个值只需排在 runtime 注册（250）之前；它不承担"跨层竞争"的职责，也没有那个能力。

工程自有技能名来自 `<工程>/.dsh/skills` 与 `.agents/skills` 下带 `SKILL.md` 的目录（`readProjectSkillNames`），按工程根缓存 2 秒。命中的名字**整个不提供**，而不是降级为隐藏——这样工程的定制不会被本包遮住。

## 7. 错误与降级

原则：**单个技能坏掉不能拖垮目录；配置写错快速失败；事实未知不隐藏技能。**

### 7.1 检测

| 场景 | 行为 | 日志 |
| --- | --- | --- |
| 目录不在任何 Unity 工程（找不到 marker） | 返回"无工程"，按非工程门控（只留工作区技能） | 无 |
| `ProjectVersion.txt` 读不出 `m_EditorVersion:` | Editor 版本记为未知，其余事实照常 | 无 |
| `Packages/manifest.json` 缺失或不是合法 JSON | 包事实未知、渲染管线未知；Editor 版本仍保留 | 无 |
| `Temp/UnityLockfile` 不存在 | 记为 Editor 未打开 | 无 |
| `unity` 不在 PATH 或不提供服务 | 记为 CLI 不可用 | 无 |
| 工程检测本身抛错 | 本次查询按"无工程"处理 | `unity skills: project detection failed for <cwd>: <error>` |

检测全程只读、尽力而为：能读到什么就报什么，读不到就是未知，不抛给调用方。

### 7.2 门控、注册与监视

| 场景 | 行为 | 日志 |
| --- | --- | --- |
| 需求不满足 | 该候选保留在列表里，但 `modelInvocable: false`，理由写进 hidden 列表 | 无 |
| 需求无法检查（事实未知） | 不隐藏 | 无 |
| 工程提供了同名技能 | 该候选被丢弃（不提供） | 无 |
| agent 的 context 里没有 `skills` 服务 | 触发一次全局回退 | `unity skills: per-agent registration is unavailable …` |
| 没有 `agents` 服务 | 直接注册全局 provider | 同上 |
| agent 注册过程中抛错 | 跳过该 agent，不影响其他 agent | `unity skills: agent registration failed: <error>` |
| 注销时 disposer 抛错 | 继续注销其余部分 | `unity skills: registration cleanup failed: <error>` |
| watcher 起不来（平台/沙箱限制） | 退回"重启后生效"，其余功能不受影响 | `unity skills: cannot watch <dir>, catalog changes need a restart: <error>` |
| watcher 运行中报错 | 关闭 watcher | `unity skills: skill watcher stopped on <dir>: <error>` |
| 刷新回调抛错 | 记录警告，watcher 继续 | `unity skills: catalog refresh failed: <error>` |
| 配置不合法 | 抛 `TypeError`，该插件行加载失败 | 宿主记录加载错误 |

技能文件自身的降级仍由 reader 负责：缺 `SKILL.md`、无 frontmatter、名称不合法、描述为空都会跳过该技能并告警；目录不存在视为空目录；加载时文件消失返回 `undefined`。

### 7.3 校验脚本

`scripts/validate-skills.ts` 走插件的真实代码路径（`src/skills.ts` 里 `createUnitySkillReader` 的 `list()`/`load()`、`src/frontmatter.ts` 的 `parseSkillMarkdown`）。

| 场景 | 行为 |
| --- | --- |
| 缺 `SKILL.md`、frontmatter 不可解析、`name` 不是 kebab-case 或与目录不符、`description` 为空或含 `<`/`>`、重名、正文为空、provider 列不出/载不出某个技能 | failure，退出码 1 |
| 技能内相对资源引用缺失 | warning |
| `SKILL.md` 超过 16384 字节 | `size` warning（见第 10 节） |
| 出现 DSH 不执行的 frontmatter 字段 | 单独作为"信息项"汇总 |

## 8. 刷新、缓存与重启

缓存与失效方式：正文不缓存，其余四层各有各的失效条件。

| 缓存 | 键 | 失效方式 |
| --- | --- | --- |
| 正文 | 无缓存 | 每次 `load()` 重读文件 |
| 解析结果 | 文件路径 + `mtimeMs` + `size` | 文件变化或 watcher 清空 |
| 目录（注册表） | `cwd` + scope 链 + revision | provider 的 `control.invalidate()`、注册变化、provider 注销 |
| 工程事实 | 工作目录 | 2 秒 TTL（`FACTS_TTL_MS`）；`factsKey` 变化时主动 `invalidate()` |
| 工程自有技能名 | 工程根 | 2 秒 TTL |

`factsKey` 由工程根、Editor 版本、渲染管线、Editor 开关状态和包列表拼成。`list()` 每次都重新取事实；键变了就排一个 `queueMicrotask` 调 `control.invalidate()`，让下一次快照按新事实重新门控，而不是等重启。

`src/watch.ts` 用 `fs.watch(dir, { recursive: true, persistent: false })` 监视 `skills/`，只对路径以 `SKILL.md` 结尾的事件（或拿不到文件名的整目录事件）反应，按 200ms 防抖合并，随后 `parseCache.clear()` 并让每个 agent 的 `control.invalidate()`。资源文件（`references/` 等）不参与发现，靠加载时读取，不需要刷新。

仍需重启的情况：

- 改了 `src/` 里的代码（进程内模块；改完要先 `npm run build`，再重启 DSH 才会加载新的 `lib/`）；
- watcher 起不来或被关闭（退回重启时发现）；
- 替换已安装的包（换 checkout）。

## 9. 验证方式

以下命令都在仓库根目录执行，对任意 checkout 都适用：

```bash
npm run build       # src/ → lib/*.js + lib/types/*.d.ts（发布产物）
npm run typecheck   # tsc -p tsconfig.test.json 检查 src/、test/、scripts/
npm test            # 单元测试，直接运行 TypeScript（Node 内置类型剥离）
npm run validate    # 技能合规性：结构、frontmatter、需求字段、正文体积、资源引用
npm pack --dry-run  # 打包清单：确认 lib/、skills/、文档与许可证文件都在包里
```

- **`npm run build` / `npm run typecheck`**：TypeScript 无错误；构建产物加载后 provider 能 `list()` 出全部技能。
- **`npm test`**：覆盖 frontmatter 解析、需求解析与求值、工程检测、门控、per-agent 注册与生命周期、watcher 注销与 catalog 装配。
- **`npm run validate`**：技能结构与 frontmatter 合规、`required_*` 可解析、正文体积在阈值内、技能内资源引用都能在磁盘上解析；失败退出码 1，警告不影响退出码。
- **`npm pack --dry-run`**：发布前核对 tarball 内容与 `files` 字段一致。

技能在真实会话里的表现（非 Unity 目录下可见几条、进入工程后隐藏哪些、`skills/` 变更是否即时生效）按第 5、7、8 节的规则观察，本文不记录某台机器上的运行结果。

## 10. 已知缺口

- **正文体积靠约定与告警维持**：载入的 `SKILL.md` 是工具结果，压缩在超过 8192 字符时会裁剪，所以技能采用“`SKILL.md` 只做路由 + 细节放 `references/`”的结构。34 个 `SKILL.md` 都按这个结构保持在远小于 16384 字节的规模，校验脚本在超过 16384 字节时告警；新增技能若把细节写回 `SKILL.md`，长会话里会被裁断。
- **watcher 的边界**：只关心 `SKILL.md` 的增删改；`fs.watch` 在部分平台/沙箱不可用或会停止，此时只能退回重启时发现（各记录一条警告）。防抖窗口 200ms，突发写入会被合并。
- **回退路径更弱**：`agent.ctx` 够不到 `skills` 时只有一份全局 provider：没有 `unity:project` 上下文，同名的预设层技能重新胜出。
- **非 Unity 会话只有 3 个技能**：这是默认的 `workspaceSkills`；需要更多就显式点名或用配置调整。
- **隐藏不等于不可用**：`/技能名` 仍可载入被隐藏的技能；如果它确实不适用于当前工程，责任在使用者。
- **未知即放行**：需求无法检查时选择不隐藏，而且不产出任何提示——写错的范围不会让技能消失，但也不会有人告诉你这项检查没有做成。
- **事实有 2 秒陈旧窗口**：刚切换工程或装完包的两秒内，目录可能仍按旧事实门控。
- **profile 级影响**：安装、启停影响该 profile 的所有会话；替换已安装的包需要重启。
