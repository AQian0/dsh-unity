# dsh-unity

本仓维护 **34 个 Unity 技能**，并把它们接入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）。装上之后，每个会话按自己所在的工程决定目录里出现哪些技能：不在 Unity 工程里只留 3 个起步技能，在工程里再按 Editor 版本和已装包筛掉不适用的，并把工程事实写进该会话的运行时上下文。

## 简介

`@aqian0/dsh-unity` 是一个 DSH bundle 包。`skills/` 下是 34 个技能目录，插件按 **agent** 注册 provider：每个会话在自己的层里拿到一份目录，因此同名技能归本插件，目录内容也能随这个会话的工程变化。

- **技能就在本仓**：34 个技能目录在 `skills/` 里，编辑、新增、删除都在这里完成。
- **按 agent 注册**：`apply()` 监听 `agent/created` / `agent/disposed`，经 `agent.ctx` 把 provider 注册进该 agent 自己的层，而不是只注册一份全局 provider。
- **工程门控**：从会话工作目录向上找 `ProjectSettings/ProjectVersion.txt`，据此读 Editor 版本、`Packages/manifest.json` 里的包与渲染管线、Editor 是否打开、`unity` CLI 是否可用。
- **需求被真正执行**：技能声明的 `required_editor_version` / `required_packages` 不满足时，该技能离开模型的目录，但仍可用 `/技能名` 显式载入；事实未知时不会隐藏任何技能。
- **运行时上下文**：每个 agent 注入一条 `unity:project` 上下文，说明工程路径、Editor 版本、渲染管线、Editor/CLI 状态，以及本工程里被隐藏的技能与原因。
- **实时刷新**：每个 step 前用 `ProjectVersion.txt`、`manifest.json`、`UnityLockfile` 的指纹检查工程事实，变化时重新门控；`skills/` 由 watcher 与 DSH 的 `fs/observed` 共同失效，不用重启。
- **DSH 原生配置与兼容声明**：导出 schemastery `Config`（Plugins 页可编辑、加载期校验），并在 `package.json` 声明 `engines.dsh` 与 `@deepseek-ai/dsh-skill` / `schemastery` peer，`plugin_manager` 能拒绝不兼容的安装/升级。
- **`/unity-status`**：面向人的只读命令，输出与目录共用同一套检测/门控，排障不用翻日志。
- **上游可追踪**：`upstream.lock.json` 记录 Unity 官方插件版本与逐文件 hash；每周 workflow 报告 drift，人工 port，不自动覆盖本地改写。
- **一行插件、零运行时依赖**：`cordis.patch.yml` 只插入一个 Host 行 `unity-skills`；运行时只用 Node 内置模块，不依赖任何第三方包。仓库里的源码是 TypeScript，`pnpm pack`（`prepack`）时编译成 `lib/` 发布，因此按目录安装前要先构建一次，见[安装](#安装)。
- **设计说明**：为什么必须按 agent 注册、门控与降级的取舍，见 [docs/design.md](./docs/design.md)。

> 这些技能会直接改你的 Unity 工程（脚本、场景、资产）；Unity CLI 可用时还会在打开的 Editor 里执行 C#。请先把工程纳入版本控制，再让 agent 动手。

## 功能

34 个技能，按主题分组，括号里是技能名。当前工程用不上的会被隐藏，见[技能何时出现](#技能何时出现项目门控)。

### UI 与编辑器工具（7）

- `ui` — UI 请求路由：先判断该用 UI Toolkit、uGUI 还是 IMGUI，并回答框架选型问题，写任何 UI 代码前先看它。
- `ui-uitk` — UI Toolkit：UXML/USS、flex 布局、UIElements、UIDocument、PanelSettings 与运行时绑定。
- `ui-ugui` — Canvas 层级、RectTransform、Layout Group 与 prefab UI 的读写。
- `ui-imgui` — 传统 IMGUI：EditorWindow、自定义 Inspector、PropertyDrawer、OnGUI 的生成与维护。
- `generate-editor-search-query` — 把"找出引用了某资产的对象"翻成 Unity Search 查询并打开搜索窗口。
- `asset-transformer-toolkit` — 用 Asset Transformer Toolkit（原 Pixyz）导入 3D 模型/点云，编写 RuleSet、Action 与 LOD。
- `build-gtk` — 用 Unity 6.6+ 的 Graph Toolkit 搭图编辑器、6.7+ 的状态机与运行时资产导入器。

### 2D、物理与场景（8）

- `2d-pixel-perfect` — PixelPerfectCamera 的配置、诊断与修复（URP / Built-in）。
- `create-2d-physics` — 2D Physics Core 与旧版 Rigidbody 2D 两套系统的创建与修复。
- `fix-3d-physics-collisions` — PhysX 碰撞、触发器、射线与 MeshCollider 问题的排查。
- `initialize-ai-navigation` — NavMesh 表面、Agent、障碍与 Link 的搭建，以及寻路与巡逻路线。
- `create-tile-palette-or-rule-tiles` — 从贴图生成瓦片调色板，或做随邻居变化的 Rule Tile。
- `manage-sprite-atlas` — 主/变体 SpriteAtlas、打包设置与平台覆盖，走 prebuild 管线。
- `sprite-editor` — 生成 C# 脚本修改 sprite 的 rect、border、pivot、outline 与切片。
- `sprite-segment-3x3grid` — 把 Sprite 切成 3×3 并分析各格的颜色分布。

### 音频、文本与性能优化（5）

- `audio-setup-mixers` — 把 Audio Source 按用途路由到 Audio Mixer Group。
- `optimize-audio` — 用导入设置与 Mixer 降音频内存/CPU，调 Load Type、采样率、编解码与 3D 声道路由。
- `optimize-text-mesh-pro` — TMP 字体资产栈、fallback 图集、SDF 质量、worldspace 文本与构建体积。
- `localize-unity-project` — Unity Localization：locale、String/Asset Table 与 CJK 字体。
- `optimize-web` — WebGL/WebGPU 构建体积、首屏加载与浏览器内性能。

### 渲染与 Shader（4）

- `migrate-birp-to-urp` — Built-in 渲染管线到 URP 的迁移方案、执行与视觉修复。
- `shader-graph-create-custom-node` — 从 HLSL 生成 Shader Graph 自定义节点。
- `urp-postprocessing` — 用 Volume 框架配置和排查 bloom、tonemapping、景深、暗角等后处理。
- `validate-urp-render-graph-renderer-feature` — 审查 Unity 6 URP 里使用 Render Graph 的 ScriptableRendererFeature。

### 多人、语音与商业化（5）

- `setup-multiplayer-services` — Unity Multiplayer Services：拓扑选择、托管、匹配与房间/大厅会话。
- `setup-vivox-voice-chat` — Vivox 语音与文字聊天：队伍频道、空间语音、静音、私信。
- `build-live-game` — Unity Gaming Services 后端：玩家进度、云存档、远程配置、成就、通行证与排行榜。
- `implement-in-app-purchases` — Unity IAP：商品目录、订阅、收据校验、恢复购买与 D2C。
- `levelplay-unity-integration` — LevelPlay 广告聚合：激励/插页/横幅、隐私配置与 iOS/Android 依赖问题。

### 项目与包管理（3）

- `new-unity-project` — 从概念、平台、变现到源码管理与包安装的新项目引导。
- `craft-game-floors` — 把原型做成"成品感"：美术风格、灯光、手感、音效、菜单与存档。
- `unity-package-management` — 在 Editor 之外增删升级、查找 UPM 包（headless/CI）。

### 构建与管线（2）

- `unity-cli` — 用命令行控制 Editor 与工程：装 Editor、许可证、构建、测试、改场景、跑 C#。
- `unity-pipeline` — 通过 unity-pipeline 包编译、跑测试、eval、方法级热重载、进 Play Mode、截图。

## 安装

**前置**：一个可用的 DSH profile（Web / Desktop / CLI 均可）、Node.js 22.18+（推荐 24 LTS；`pnpm test` 与 `pnpm run validate` 直接运行 `.ts`，依赖 Node 内置的类型剥离）与 pnpm（`packageManager` 固定 `pnpm@12.16.1`，用 corepack 或单独安装都行）。源码是 TypeScript，包入口是编译后的 `lib/index.js`（与官方插件包的发布形态一致：仓库里是 `src/`，`pnpm pack` 时才编译出 `lib/`），所以**按目录安装前要先构建一次**：

```bash
git clone https://github.com/AQian0/dsh-unity.git
cd dsh-unity
pnpm install       # 开发依赖就是工具链：typescript、@types/node 与 vite-plus
pnpm run build     # src/ → lib/*.js + lib/types/*.d.ts（不入库）
```

运行时不依赖任何第三方包；构建产物也不需要额外安装。依赖版本由入库的 `pnpm-lock.yaml` 固定（`pnpm install --frozen-lockfile` 与 CI 用同一份），仓库里不再有 `package-lock.json`。

**Web GUI**：打开左侧栏的「插件 / Plugins」页，安装时 spec 填本仓库的绝对路径（换成你自己的 checkout 路径）：

```
/path/to/dsh-unity
```

Profile 的 Settings 里那份插件列表是只读的，安装与启停都在「插件」页。

**Agent 侧**：调用 `plugin_manager`：

```
action: install_bundle
target: /path/to/dsh-unity
```

这个操作要求 full access 或审批。

安装会做两件事：在 profile 里加入 `@aqian0/dsh-unity` 这个 bundle，并在组合里插入 `unity-skills` 行（`config: {}`，即用默认配置）。确认方式：插件页出现「Unity 技能」（英文界面为 Unity skills），该 bundle 下能看到 `unity-skills` 行。

### 安装形态与生效方式

- **registry / 发布版安装**（npm、Desktop 发布版）：profile 里是包的一份**拷贝**。编辑 checkout 的 `skills/` 不会影响已安装副本；升级走 `plugin_manager` 的 `updateBundle`，替换后需要重启 DSH 才会加载新的 `lib/`。本机 profile 当前就是这种形态。
- **link 安装**（source Web / development Desktop）：profile 直接引用 checkout。编辑 `skills/` 立即生效；改 `src/` 需要 `pnpm run build` 并重启。
- **技能正文的改动**：每次 `load()` 重读文件，下一次加载即生效。
- **新增或删除技能目录、修改 frontmatter**：watcher（外部编辑器）与 `fs/observed`（DSH 自己的 write/edit）都会清空解析缓存并让目录缓存失效，下一个会话步骤就能看到；watcher 不可用时退回"重启后生效"。
- **工程事实变化**（装包、换 Editor 版本、Editor 开/关）：下一个 step 的指纹检查会重新检测并让目录缓存失效。
- 插件装在 profile 上：安装与启停会把技能提供给该 profile 的**所有会话**（可见范围仍由各自的工程决定）。

## 使用

技能目录里只放名称和描述；模型判断当前请求需要某个技能时，才用 `skill` 工具加载它的正文，正文里引用的 `references/`、`scripts/`、`resources/` 中的文件再按需读取。

| 你说                                                          | 会用到的技能                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| "像素画在摄像机移动时又糊又抖"                                | `2d-pixel-perfect`                                          |
| "做一个设置界面"                                              | `ui` → `ui-uitk` / `ui-ugui`                                |
| "加内购，并用 LevelPlay 接激励视频广告"                       | `implement-in-app-purchases`、`levelplay-unity-integration` |
| "TextMeshPro 里中文显示成方框"                                | `optimize-text-mesh-pro`、`localize-unity-project`          |
| "帮我检查这个 ScriptableRendererFeature 的 Render Graph 问题" | `validate-urp-render-graph-renderer-feature`                |

也可以直接点名技能，例如"用 `unity-cli` 看看当前 Editor 连的是哪个工程"。被门控隐藏的技能不会出现在模型的目录里，但仍然可以这样按名字加载：不在 Unity 工程里时目录默认只剩 3 个起步技能（`workspaceSkills`），其余技能都只能通过显式点名使用。

想看当前会话检测到的工程与隐藏原因，用 `/unity-status`；它和目录共用同一套检测与门控逻辑，只读、不启动进程。

## 与 DSH 的契约

- **技能字段**：哪些字段被 DSH 消费、哪些由本插件执行、哪些只是信息，见 [docs/frontmatter.md](docs/frontmatter.md)。
- **版本兼容**：DSH / Node / Unity 的范围与安装形态，见 [docs/compatibility.md](docs/compatibility.md)。
- **正文预算**：`SKILL.md` 正文低于 8192 字符（目标 7000），细节放 `references/`。
- **配置与 schema**：导出的 `Config` 是唯一字段来源；`resolveSettings` 只补跨字段语义检查。
- **目录生命周期**：per-agent provider + `agent/pre-step` 指纹 + `fs/observed`，不依赖 registry 缓存命中时的 `list()`。
- **上游维护**：`pnpm run upstream:check` / `upstream:fetch` / `upstream:lock`，每周 workflow 开报告 PR。

## 配置

所有键都可选，写在 profile 的 `cordis.patch.yml` 里覆盖 `unity-skills` 行：

| 键                    | 默认                                                       | 说明                                                                                                            |
| --------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `providerName`        | `unity`                                                    | 注册到 `ctx.skills` 的 provider 名，会标在技能候选上；不能为空，不能用保留名 `runtime`                          |
| `rank`                | `600`                                                      | 同一层内的排序值；层先于 rank 决定重名，层内 project（100/200）/ custom（300）根优先，runtime 注册（250）也会赢 |
| `skillDir`            | 包内 `skills/`                                             | 技能目录；相对路径按**包根**解析                                                                                |
| `exclude`             | `[]`                                                       | 不加载的技能名，按目录名匹配                                                                                    |
| `gateByProject`       | `true`                                                     | 关掉后不再按工程筛选：不在 Unity 工程里也列出全部技能                                                           |
| `workspaceSkills`     | `[new-unity-project, unity-cli, unity-package-management]` | 不在 Unity 工程时仍出现在模型目录里的技能                                                                       |
| `enforceRequirements` | `true`                                                     | 关掉后不再执行 `required_editor_version` / `required_packages`                                                  |
| `injectContext`       | `true`                                                     | 关掉后不再注入 `unity:project` 上下文行                                                                         |
| `watchSkills`         | `true`                                                     | 关掉后不再监视 `skills/`，目录变更需要重启                                                                      |
| `respectProjectRoots` | `true`                                                     | 关掉后不再让工程自己的 `.dsh/skills`、`.agents/skills` 接管同名技能                                             |
| `statusCommand`       | `true`                                                     | 是否注册 `/unity-status` 命令                                                                                   |

```yaml
# profile 的 cordis.patch.yml
- id: unity-skills
  name: '@aqian0/dsh-unity'
  config:
    exclude: [unity-pipeline] # 不加载 unity-pipeline
    workspaceSkills: [unity-cli] # 非 Unity 工程里只留一个
    gateByProject: false # 不做工程筛选
```

覆盖行用 `id: unity-skills` 定位 bundle 补丁里的那一行。插件导出 schemastery `Config`：类型与默认值由 DSH 在**加载期**校验，Plugins 页也按同一份 schema 渲染；`resolveSettings` 再补语义检查（`providerName` 非空且不是保留名 `runtime`、`skillDir` 非空、数组元素非空）。改完配置后需要重新组成该行：重启 DSH 一定生效，开启 HMR 的 profile 也可能即时重组。

## 技能何时出现（项目门控）

### 注册位置

每个 agent 创建时，插件经 `agent.ctx` 把 provider 注册进**该 agent 自己的层**。DSH 的合并规则是"最近的层直接胜出，rank 只在同一层内比较"，所以：

| 情况                                                     | 结果                                                    |
| -------------------------------------------------------- | ------------------------------------------------------- |
| 与工程自己的 `<工程>/.dsh/skills`、`.agents/skills` 同名 | 插件不提供该名字，工程那份生效（`respectProjectRoots`） |
| 与 `~/.dsh/skills`、`~/.agents/skills` 等外部副本同名    | 插件在 agent 自己的层里，最近层胜出——插件赢             |
| 与同层 runtime 注册（rank 250）同名                      | 同层内按 rank：本插件 600 落后于 runtime 注册           |
| 组合里根本没有安装插件（或它被禁用）                     | 这些技能不存在                                          |

上表第二行不是特例，而是层规则的直接结果：插件把 provider 注册进 agent 自己的层，比任何全局层或外部根都近，"最近的层胜出"与 `rank` 无关，所以外部目录里的同名副本盖不掉插件的版本。

### 工程检测与可见性

会话工作目录可以是工程里的任意子目录，插件向上最多 8 级寻找 `ProjectSettings/ProjectVersion.txt`，找到的目录即工程根；随后读：

- `ProjectSettings/ProjectVersion.txt` 的 `m_EditorVersion:`；
- `Packages/manifest.json` 的 `dependencies`（包 id → 版本），并据此推断渲染管线（HDRP / URP / Built-in）；
- `Temp/UnityLockfile` 是否存在（Editor 是否正开着这个工程）；
- `unity` 是否在 PATH 上（通过 `ctx.subprocess.resolveExecutable`）。

这些事实按工作目录缓存 2 秒，但 DSH 的目录缓存命中时 `list()` 不会被调用，所以不能只靠 TTL：每个 agent 在 `agent/pre-step` 上比较这三个文件的指纹（mtime/size/存在性），变化时重新检测、重新门控并 `invalidate()`；`unity` 是否在 PATH 上单独缓存 60 秒。工程自有技能名同时按 **DSH 项目根**（最近的 `.git` 祖先）与 Unity 根扫描，monorepo 里两处的 `.dsh/skills` 都生效。

| 会话所在                        | 模型的技能目录                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| 不在 Unity 工程里               | 只有 `workspaceSkills`（默认 3 个：`new-unity-project`、`unity-cli`、`unity-package-management`） |
| 在 Unity 工程里，技能要求都满足 | 该技能可见                                                                                        |
| 在 Unity 工程里，技能要求不满足 | 该技能离开模型目录，但仍可用 `/技能名` 载入                                                       |
| 工程自己提供了同名技能          | 插件不提供该名字                                                                                  |

### 需求表

技能 frontmatter 里声明的需求会被实际执行（`enforceRequirements`）。当前有需求的技能：

| 技能                                | 要求                                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| `build-gtk`                         | Editor `>=6000.6`                                                     |
| `fix-3d-physics-collisions`         | Editor `>=6000.3`                                                     |
| `asset-transformer-toolkit`         | `com.unity.industry.toolkit >=4.0.0`                                  |
| `create-tile-palette-or-rule-tiles` | `com.unity.2d.tilemap >=1.0.0`、`com.unity.2d.tilemap.extras >=4.0.0` |
| `setup-vivox-voice-chat`            | `com.unity.services.vivox >=16.4.0`                                   |
| `shader-graph-create-custom-node`   | `com.unity.shadergraph >=17.5.0`                                      |
| `urp-postprocessing`                | `com.unity.render-pipelines.universal >=14.0.0`                       |

版本范围支持 `>=`、`>`、`<=`、`<`、`=`、`^`、`~`，可以逗号或空格分隔，也可以写 `>= 6000.6`；两段版本（如 `6000.6`）表示那一条发布线，三段版本表示精确版本。**事实未知时不隐藏技能**：manifest 缺失、版本或范围解析不了时技能照常显示，也不会产生隐藏提示。

### 运行时上下文

每个 agent 拿到一条 `unity:project` 上下文（`order: 180`，每次组装提示词时重算）：

```
Unity project: /path/to/project (Editor 6000.3.14f1, URP, Editor open, unity CLI available). skills hidden for this project: asset-transformer-toolkit (missing package com.unity.industry.toolkit >=4.0.0), build-gtk (needs Unity >=6000.6 (project 6000.3.14f1)), …
```

隐藏技能最多列 6 条，其余写 `and N more`；不在 Unity 工程里时这段为空，由提示词渲染器整条丢弃。上下文里的原因与目录里隐藏的技能一一对应：缺哪个包、要求什么版本、工程实际是什么版本。

## 开发与验证

开发依赖就是工具链：`typescript`（构建与类型检查）、`@types/node`、`vite-plus`（`vp` CLI：Oxfmt 格式化 + Oxlint 规则）、`js-yaml`（校验脚本的严格 YAML 对照）与 `@deepseek-ai/schemastery`（`Config` 的类型与构建）。版本由入库的 `pnpm-lock.yaml` 固定，CI 用 `pnpm install --frozen-lockfile`。

```bash
pnpm install              # 安装 typescript、@types/node 与 vite-plus
pnpm run build            # 编译 src/ → lib/（发布产物，不入库）
pnpm run typecheck        # 用 tsconfig.test.json 检查 src/、test/、scripts/
pnpm test                 # 完整门禁：vp check → tsc → node --test
pnpm run test:unit        # 只跑单元测试：直接跑 TypeScript（Node 内置类型剥离）
pnpm run test:coverage    # 单元测试 + 覆盖率（只统计 src/**）
pnpm run format           # Oxfmt 格式化
pnpm run format:check     # 只检查格式、不改文件（vp check 里也含这项检查）
pnpm run lint             # Oxlint 检查
pnpm run check            # vp check --deny-warnings：格式 + lint，lint 警告也计为失败
pnpm run validate         # 技能合规性：结构、严格 YAML、需求字段、正文预算、资源引用
pnpm run upstream:check   # 上游 drift（需要网络；drift 退出 1）
pnpm run upstream:fetch   # 下载变更到 .upstream-preview/ 供人工 port
pnpm run upstream:lock    # port 完成后更新 upstream.lock.json
pnpm pack                 # 打 tarball；prepack 会先 pnpm run clean 再 pnpm run build
```

`pnpm test` 是提交前只需要记的一条门禁：先 `vp check --deny-warnings` 跑 Oxfmt 格式检查与 Oxlint 规则（lint 警告也算失败），再用 `tsc -p tsconfig.test.json` 做类型检查，最后用 `node --test` 直接跑 `test/**/*.test.ts`。CI 跑的就是这条命令。

格式化与 lint 的规则只在 `vite.config.ts` 里定义一次：Oxfmt 用 120 列、单引号，Oxlint 开 `unicorn`、`typescript`、`oxc`、`import` 插件。`vp` 只读这一份配置，不要在别处加 `.prettierrc`、`.eslintrc` 之类的副本。要自动修复就 `pnpm run check:fix`（格式 + lint）或 `pnpm run lint:fix`（只 lint）。`skills/**` 是 Unity 内容（本地压缩改写后发布），`fmt` 与 `lint` 都把它排除在外，格式化不会改写技能文件。

工具链的 Node 版本分两条线：运行时的 `engines` 是 `>=22.18`，开发用的 `vite-plus` 1.5.0 支持 `^22.18.0 || ^24.11.0 || >=26.0.0`，所以 22.18+ 与 24 LTS 都能跑。测试仍由 Node 的类型剥离直接执行 `.ts`，构建仍只用 `tsc`——Vite+ 在这里只负责格式化与 lint，不接管测试或构建。

`pnpm run validate` 检查的是：技能目录里有 `SKILL.md`、frontmatter 能被自研子集解析器**和严格 YAML 解析器**同时接受、名称是 kebab-case 且与目录一致、描述非空且不含 `<`/`>`（超过 500 字符告警）、名称唯一、正文非空、`required_*` 需求字段能解析、正文不超过 **8192 字符**（超过失败；超过 7000 告警）、provider 能 `list()` 与 `load()` 出全部技能、以及正文里技能相对路径的资源引用在磁盘上存在。失败退出码 1；警告不影响退出码。脚本会打印本次检查的技能数、资源引用数与最大的正文；`--only a,b` 可只检查指定技能。

```bash
node scripts/validate-skills.ts --report /tmp/skill-audit.md   # 另外写一份 Markdown 报告
node scripts/validate-skills.ts --only unity-cli,ui-uitk       # 只检查指定技能
```

### 上游维护

`skills/` 是对 Unity 官方 `unity-agent-plugin` 的压缩改写，`upstream.lock.json`
记录 pin 的 commit、上游版本（当前 0.1.9-beta）与每个文件的 git blob hash。
`.github/workflows/upstream.yml` 每周一跑 `--check`，drift 时把变更文件下载为
artifact、生成 `upstream-report.md` 并开/更新一个 PR；**不会自动覆盖本地技能**。
维护者按报告人工 port，改完后 `pnpm run upstream:lock` 更新基线。详见
[docs/compatibility.md](docs/compatibility.md)。

### CI 与发布

- `.github/workflows/ci.yml`：push 到 `main`、PR 与手动触发时，在 Node 22.18 与 24 的矩阵上，
  用 `pnpm/action-setup` 安装 `packageManager` 指定的 pnpm、`setup-node` 打开 pnpm 缓存，
  `pnpm install --frozen-lockfile` 后跑 `pnpm test` 与 `pnpm run validate`，再 `pnpm run build`
  并对 `pnpm pack --dry-run --ignore-scripts --json` 的清单做冒烟检查。
- `.github/workflows/release.yml`：推 `v<version>` tag 时校验 tag 与 `package.json` 版本一致、
  提交在 `main` 上，重跑同一门禁与构建，用 `pnpm pack` 校验 tarball 清单（34 个技能都在包里），
  最后用 npm 可信发布（GitHub OIDC，无需 `NPM_TOKEN`）发布到 npm 并创建 GitHub Release；
  首次发布与 trusted publisher 的配置见 workflow 顶部注释。

安装后也可以直接看：

- 插件页里的「Unity 技能」与 `unity-skills` 行；
- 非 Unity 目录的新会话里问一句"你有哪些 Unity 技能"，应只剩 3 个；把会话切到 Unity 工程后应看到更多；
- 在 Unity 工程里发一个请求（例如"给设置界面加一个音效滑杆"），工具结果里会出现 `skill` 加载记录，上下文里能看到 `Unity project: …`；
- 在 `skills/` 里新建或删除一个技能目录，下一个会话步骤就能看到目录变化，不用重启。

## 已知限制

- **正文体积有硬约束**：载入的 `SKILL.md` 是工具结果，DSH 的 `tool-result-pruner` 在压缩触发后会把超过 **8192 字符**的结果裁成 head + tail，所以 `SKILL.md` 只做路由——判断、关键安全规则、步骤、指向 `references/` 的链接；细节都放在 `references/` 里按需读取。34 个技能的正文都朝 **7000 字符**以内整理，校验脚本在超过 7000 时告警、超过 8192 时失败。新增或改写技能时请沿用这个结构，否则该技能在长会话里会被裁断。`fix-3d-physics-collisions` 为逐字保留 STOP CHECK 的安全文案，正文 7.78k：低于 8192 硬限，但会保留一条 7000 告警。
- **文件监视有边界**：watcher 只关心 `SKILL.md` 的变化（新增、删除、改名、编辑），并按 200ms 防抖合并突发写入；`references/` 等资源文件靠加载时读取，不需要刷新。平台或沙箱不允许监视时，会记录一条警告并退回"重启后生效"。
- **回退到全局 provider 时会退步**：如果某个 profile 里 `agent.ctx` 够不到 `skills`（或没有 `agents` 服务），插件只注册一份全局 provider，并记录一条警告。这条路径仍按每次查询的 `cwd` 做工程门控，但没有 `unity:project` 上下文，且同名的预设层技能会重新胜出。
- **非 Unity 会话只提供 3 个技能**：默认 `workspaceSkills` 是 `new-unity-project`、`unity-cli`、`unity-package-management`；需要别的技能就显式点名，或用 `workspaceSkills` 调整。
- **隐藏不等于不可用**：被门控隐藏的技能只是离开模型目录，`/技能名` 仍能载入——如果它确实不适用于当前工程，责任在使用者。
- **非标准 frontmatter 字段只被容忍或部分执行**：`required_editor_version`、`required_packages` 已执行；`allowed-tools`、`modes`、`enabled` 仍只解析不执行（DSH 没有对应机制）。`metadata` 只做透传。校验脚本把这些列成信息项。
- **技能会直接改工程**：编辑脚本、场景和资产；Unity CLI 可用时在打开的 Editor 里跑 C#。不是所有改动都能在 Editor 里撤销，先用版本控制。
- **`exclude` 按目录名匹配**：本包 34 个技能的目录名与 frontmatter `name` 全部一致（校验脚本会检查）；若将来出现不一致，`exclude` 仍以目录名为准。
- **profile 级改动**：安装与启停影响该 profile 的所有会话；替换已安装的包需要重启 DSH。
- **入口是技能目录与 `skill` 工具**：插件本身不额外注册斜杠菜单或提示词入口；`/技能名` 的显式调用来自 DSH 的技能机制，不是本包新增的入口。
- **构建产物不入库**：`lib/` 是 `pnpm run build` 的输出并被 `.gitignore` 忽略；按目录安装前必须先构建，否则插件行会因为找不到 `lib/index.js` 而加载失败。

## 许可证

本包按路径分属三套许可证，逐路径的清单见 [NOTICE.md](./NOTICE.md)。

- **整合代码（MIT）**：插件源码、测试、脚本、配置与文档（`src/`、`test/`、`scripts/`、`cordis.patch.yml`、`locale/`、`README.md`、`docs/` 等）以 MIT 许可发布，全文见 [LICENSE.md](./LICENSE.md)。
- **插件图标（ISC）**：`icon.svg` 使用 [Lucide](https://lucide.dev) 的 `gamepad-2` 图形（缩放、改色后置于圆角底板上），按其 ISC 许可证使用，版权声明与许可文本见 [NOTICE.md](./NOTICE.md)。
- **技能内容（Unity Companion License）**：`skills/` 下的技能正文与随附资源版权属于 Unity Technologies，按 Unity Companion License 使用，全文见 [LICENSE-UNITY-COMPANION.md](./LICENSE-UNITY-COMPANION.md)。该许可证要求持有有效的 Unity Engine License，且不授予商标权利。
- **标识**：本包不使用 Unity 徽标或其他 Unity 品牌资产，只在描述兼容性与内容来源时以文字提及 Unity；Unity 的名称与徽标属于 Unity Technologies，相关使用遵循 [Unity 品牌指南](https://unity.com/legal/branding-trademarks)。本包非 Unity Technologies 或其关联公司赞助或认可，与 Unity 没有隶属关系。
