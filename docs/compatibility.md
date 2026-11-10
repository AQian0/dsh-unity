# 兼容性

本包声明并实际依赖的运行环境。`package.json` 是机器可读的事实来源，本文解释这些
范围背后的假设。

## DSH

| 项                                             | 值                    | 说明                                                                                                                                                |
| ---------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engines.dsh`                                  | `>=0.2.2-rc.1 <1.0.0` | 基于 DSH 0.2.2-rc.1 的 skill registry、`systemPrompt.context`、`agent/pre-step` 与 `fs/observed` 契约。`plugin_manager` 用它拒绝不兼容的安装/升级。 |
| `peerDependencies["@deepseek-ai/dsh-skill"]`   | `^0.2.2-rc.1`         | `SkillProvider` / `SkillCandidate` / `SkillDefinition` 的契约来源；不随包分发。                                                                     |
| `peerDependencies["@deepseek-ai/schemastery"]` | `~3.19.0`             | 导出的 `Config` 是 schemastery schema，由宿主提供运行时副本。                                                                                       |

契约漂移由 `test/contract.test.ts` 在 `pnpm typecheck` 阶段拦截；DSH 升级后先跑
`pnpm test`，再在真实 profile 里验证目录、上下文与 `/unity-status`。

## Node.js

`engines.node >= 22.18`。这个下限同时满足：

- 构建与运行时不需要编译插件（`lib/` 由发布前的 `prepack` 生成）；
- 仓库里的测试与校验脚本直接用 Node 的类型剥离运行 `.ts`；
- `fs.watch(..., { recursive: true })` 在 macOS、Windows 与 Node 20+ 的 Linux 上可用。

## Unity

上游技能面向 **Unity 6+**。具体技能还会声明：

- `required_editor_version`：例如 `build-gtk` 需要 `>=6000.6`；
- `required_packages`：例如 `urp-postprocessing` 需要 URP 包。

不满足时技能只离开模型目录，仍可用 `/技能名` 显式加载；工程事实未知时不隐藏。

## 操作系统与沙箱

- 插件本身只用 Node 内置模块，macOS / Linux / Windows 行为一致；路径比较走
  `node:path`，技能目录允许符号链接。
- DSH 默认 `workspace-write` 沙箱。Unity CLI 安装 Editor、激活许可证、写
  `~/.unity` 等操作会落在 workspace 之外，可能被拒绝；技能会要求报告拒绝并请求
  审批或 `danger-full-access`，而不是绕过沙箱。
- `fs.watch` 在少数平台/沙箱不可用；此时退回“重启后生效”，DSH 自己的
  `write`/`edit` 仍会通过 `fs/observed` 立即失效。

## 安装形态

- **registry 安装**（npm / Desktop 发布版）：profile 里是包的一份拷贝。升级走
  `plugin_manager` 的 `updateBundle` / `listVersions`；替换后需要重启 DSH 才会加载
  新的 `lib/`。
- **link 安装**（source Web / development Desktop）：profile 直接引用 checkout。
  改 `skills/` 立即生效；改 `src/` 需要 `pnpm run build` 并重启。
- 按目录安装前先 `pnpm install && pnpm run build`，否则 `lib/index.js` 不存在。

## 兼容性检查清单

```bash
pnpm test                 # 含 test/contract.test.ts 的 DSH 类型对照
pnpm run validate         # 技能结构、YAML、需求字段、正文预算
pnpm run upstream:check   # 上游 drift（需要网络）
```

安装后在 Plugins 页确认：`Config.listConfigs` 有 schema、标题/描述/图标正确、
`/unity-status` 出现在命令菜单。
