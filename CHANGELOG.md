# 更新日志

本文件记录 `@aqian0/dsh-unity` 的版本变更，格式参照
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-11-10

这一版把包从“技能包 + provider”补成符合 DSH 插件契约、内容适配 DSH 运行时、
上游可追踪的 bundle。

### 新增

- **DSH 配置契约**：新增 `src/config.ts`，用 schemastery 导出 `Config`；
  `Config.listConfigs` 现在能返回完整 schema，Plugins 页可编辑，非法配置在
  加载期被拒绝。新增 `statusCommand` 开关。
- **兼容性声明**：`package.json` 增加 `engines.dsh` 与
  `@deepseek-ai/dsh-skill`、`@deepseek-ai/schemastery` peer；新增
  `test/contract.test.ts`，DSH 类型漂移会让 `pnpm typecheck` 失败。
- **工程事实刷新**：每个 agent 在 `agent/pre-step` 用三个文件的指纹检查工程
  事实，变化时重新门控并 `invalidate()`；`fs/observed` 让 DSH 自己的
  write/edit 立即失效；CLI 可用性单独缓存 60 秒。
- **`/unity-status` 命令**：只读输出工程根、Editor/CLI 状态、可见/隐藏技能
  与原因；`statusCommand: false` 可关闭。
- **上游维护**：`upstream.lock.json`、`scripts/upstream.ts`
  （`--check` / `--fetch` / `--write-lock`）、每周
  `.github/workflows/upstream.yml` 报告 drift 并开 PR；不自动覆盖本地改写。
- **文档**：`docs/frontmatter.md`、`docs/compatibility.md`、
  `docs/detail.{zh,en}.md`、`README.en.md`；`locale/*.json` 增加
  `meta.detail`，Plugins 页按语言显示长描述。
- **内容门禁**：`scripts/validate-skills.ts` 用严格 YAML 解析对照、正文
  > 8192 失败 / >7000 告警、description >500 告警、`--only` 选择性检查；
  > 新增 `test/content-budget.test.ts`。

### 变更

- 默认 `rank` 240 → 600（与 DSH bundled root 对齐，同层 project/custom 根
  优先）；`skillDir` 的相对路径改为按包根解析。
- 21 个超过 DSH 8192 裁剪线的 `SKILL.md` 拆分到 `references/`，正文
  11.7k → 6–7.8k；fix-3d-physics-collisions 为逐字保留 STOP CHECK 保留
  7.78k（低于 8192，1 条 warning）。
- `allowed-tools` 从其它客户端工具名映射为 DSH 的
  `bash`/`read`/`write`/`edit`/`web_fetch`/`web_search`（DSH 不执行白名单）。
- `new-unity-project` 等技能按 DSH 改写：技能由 bundle 提供、`ask_user_question`、
  `AGENTS.md` 优先、workspace-write 沙箱拒绝时报告并请求审批；删除安装
  Claude/Codex 插件与镜像技能的说明。
- README 修正安装语义（registry 拷贝 vs `link:`）、刷新语义、体积约束；
  “原样发布”改为“压缩改写后发布”。

### 修复

- **暖缓存下工程事实不刷新**：DSH 目录按 `cwd + scope + revision` 缓存，
  缓存命中时 `list()` 不会被调用；原实现只在 `list()` 内失效，装包/换
  Editor 版本/Editor 开关后门控与上下文会一直陈旧。
- **monorepo 工程覆盖找错根**：工程 `.dsh/skills`、`.agents/skills` 现在同时
  按 DSH 项目根（最近 `.git`）与 Unity 根扫描。
- 注册时预热 `facts`/`hidden`，第一次提示词组装就带 `unity:project`；
  provider、context、pre-step 收进一个 `agent.ctx.effect()`；事实与工程技能名
  缓存限 64 条；检测支持 `AbortSignal`。

### 兼容性与迁移

- 需要 DSH `>=0.2.2-rc.1 <1.0.0` 与 Node 22.18+；peer 不满足时
  `plugin_manager` 会拒绝安装/升级。
- **BREAKING**：默认 `rank` 与 `skillDir` 相对路径基准改变；技能正文拆分后
  `references/` 文件增多。升级后重启 DSH 以加载新的 `lib/`。

### 变更（工具链）

- 开发工具链迁移到 pnpm + Vite+：`packageManager` 固定 `pnpm@12.16.1`，新增并提交
  `pnpm-lock.yaml`、移除 `package-lock.json`，开发命令一律改用 `pnpm install`、
  `pnpm run …`、`pnpm test`、`pnpm pack`。
- 新增格式与 lint 门禁（`vite-plus` 1.5.0 提供 `vp` CLI）：`format`、`format:check`、
  `lint`、`lint:fix`、`check`、`check:fix`。规则只在 `vite.config.ts` 里定义——Oxfmt
  120 列、单引号，Oxlint 开 `unicorn`、`typescript`、`oxc`、`import` 插件——并且
  `vp check --deny-warnings` 让 lint 警告也计为失败。
- `skills/**` 是 Unity 内容（本地压缩改写后发布），`fmt` 与 `lint` 都把它排除在外。
- `pnpm test` 成为完整门禁：`vp check` → `tsc -p tsconfig.test.json` → `node --test`；
  只跑单元测试改用 `pnpm run test:unit`，覆盖率用 `pnpm run test:coverage`。
- CI 与发布流水线改用 pnpm：`pnpm/action-setup` 安装 `packageManager` 指定的版本、
  `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm run validate`，再用
  `pnpm pack --dry-run` 做 tarball 冒烟检查；发布仍走 npm 可信发布（OIDC）。

## [0.1.0] - 2026-11-09

首个发布版本。

### 新增

- 34 个 Unity 技能（`skills/`），覆盖 UI 与编辑器工具、2D/物理/场景、音频与性能、
  渲染与 Shader、多人/语音/商业化、项目与包管理、构建与管线；技能正文只做路由，
  细节放在各自的 `references/` 里按需加载。技能内容来自 Unity Technologies 的
  Unity Agent Plugin，按 Unity Companion License 使用，见 `LICENSE-UNITY-COMPANION.md`。
- DSH bundle 与 `unity-skills` 补丁行（`cordis.patch.yml`），安装后按 agent 注册技能
  provider。
- 工程门控：从会话工作目录向上查找 `ProjectSettings/ProjectVersion.txt`，按 Editor
  版本、`Packages/manifest.json` 里的包与渲染管线决定技能可见性；非 Unity 工程只保留
  `new-unity-project`、`unity-cli`、`unity-package-management` 三个起步技能。
- 需求执行：`required_editor_version` / `required_packages` 不满足时技能离开模型目录，
  仍可用 `/技能名` 显式载入；事实未知时不隐藏技能。
- 运行时上下文：每个 agent 注入一条 `unity:project`，说明工程路径、Editor 版本、
  渲染管线、Editor 与 CLI 状态，以及被隐藏的技能与原因。
- 实时刷新：监视 `skills/` 下 `SKILL.md` 的新增、删除与修改，清空解析缓存并让目录缓存
  失效，无需重启。
- 配置项：`providerName`、`rank`、`skillDir`、`exclude`、`gateByProject`、
  `workspaceSkills`、`enforceRequirements`、`injectContext`、`watchSkills`、
  `respectProjectRoots`，非法值会让插件行加载失败而不是静默忽略。
- 开发工具：`npm run build`（`src/` → `lib/`）、`npm run typecheck`、`npm test` 与
  `npm run validate`（技能结构、frontmatter、需求字段、正文体积与资源引用检查，
  支持 `--report <file>` 输出 Markdown 审计报告）。
- 文档：`README.md`（安装、使用、配置、门控与已知限制）与 `docs/design.md`（设计说明）。
- CI/CD：GitHub Actions 的 `ci.yml`（类型检查、测试、技能校验与 tarball 冒烟检查）与
  `release.yml`（tag 触发的 npm 可信发布与 GitHub Release）。

### 变更

- 插件图标改用 Lucide 的 `gamepad-2` 图形（ISC 许可），不再使用 Unity 徽标；
  原因与版权声明见 `NOTICE.md`。

### 许可证

- 插件代码（`lib/`、`src/`、`test/`、`scripts/` 与 bundle 元数据）采用 MIT 许可证，
  见 `LICENSE.md`。
- `skills/` 下的技能内容版权归 Unity Technologies，按 Unity Companion License 使用，
  见 `LICENSE-UNITY-COMPANION.md` 与 `NOTICE.md`。

[Unreleased]: https://github.com/AQian0/dsh-unity/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/AQian0/dsh-unity/releases/tag/v0.2.0
[0.1.0]: https://github.com/AQian0/dsh-unity/releases/tag/v0.1.0
