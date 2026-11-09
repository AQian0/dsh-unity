# 更新日志

本文件记录 `@aqian0/dsh-unity` 的版本变更，格式参照
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 变更

- 开发工具链迁移到 pnpm + Vite+：`packageManager` 固定 `pnpm@12.16.1`，新增并提交
  `pnpm-lock.yaml`、移除 `package-lock.json`，开发命令一律改用 `pnpm install`、
  `pnpm run …`、`pnpm test`、`pnpm pack`。
- 新增格式与 lint 门禁（`vite-plus` 1.5.0 提供 `vp` CLI）：`format`、`format:check`、
  `lint`、`lint:fix`、`check`、`check:fix`。规则只在 `vite.config.ts` 里定义——Oxfmt
  120 列、单引号，Oxlint 开 `unicorn`、`typescript`、`oxc`、`import` 插件——并且
  `vp check --deny-warnings` 让 lint 警告也计为失败。
- `skills/**` 是 Unity 原样发布的内容，`fmt` 与 `lint` 都将它排除在外，格式化不会改写
  技能文件。
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

[Unreleased]: https://github.com/AQian0/dsh-unity/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AQian0/dsh-unity/releases/tag/v0.1.0
