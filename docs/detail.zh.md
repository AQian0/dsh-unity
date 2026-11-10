# Unity 技能

把 Unity 官方的 34 个游戏开发技能接入 DeepSeek Harness：技能按会话所在工程筛选，
工程事实写进运行时上下文，`skills/` 的改动实时生效。

## 安装后得到什么

- **34 个技能目录**：UI 与编辑器工具、2D/物理/场景、音频与性能、渲染与 Shader、
  多人/语音/商业化、项目与包管理、构建与管线。技能正文只做路由，细节放在各自的
  `references/` 里按需读取。
- **按 agent 注册**：每个会话在自己的 scope 层拿到一份目录，不被预设层的同名技能
  盖掉，也能随该会话的工程变化。
- **工程门控**：从会话目录向上找 `ProjectSettings/ProjectVersion.txt`，读 Editor
  版本、`Packages/manifest.json`、Editor 锁与 `unity` CLI；不满足
  `required_editor_version` / `required_packages` 的技能离开模型目录，但仍可用
  `/技能名` 显式加载。事实未知时不隐藏。
- **`unity:project` 上下文**：工程路径、Editor 版本、渲染管线、Editor/CLI 状态，
  以及被隐藏的技能与原因。
- **`/unity-status`**：面向人的同一份事实与隐藏原因，只读、不启动进程。
- **实时刷新**：每个 step 前用三个文件的指纹检查工程事实；`skills/` 由 watcher 与
  DSH 的 `fs/observed` 共同失效，不用重启。

## 什么时候用

在 Unity 工程里问“做一个设置界面”“加内购并接激励视频”“像素画移动时抖动”
这类任务时，模型会按描述选技能并加载。非 Unity 目录只保留三个起步技能
（`new-unity-project`、`unity-cli`、`unity-package-management`）。

## 配置

在 profile 的 `cordis.patch.yml` 里覆盖 `unity-skills` 行，例如：

```yaml
- id: unity-skills
  name: '@aqian0/dsh-unity'
  config:
    workspaceSkills: [unity-cli]
    exclude: [unity-pipeline]
    statusCommand: false
```

字段与默认值见 `Config` schema（Plugins 页可直接编辑），`docs/frontmatter.md` 记录
技能字段如何被 DSH 消费。

## 已知限制

- 技能会直接改工程（脚本、场景、资产）；Unity CLI 可用时还会在打开的 Editor 里跑
  C#。先纳入版本控制。
- 默认 `workspace-write` 沙箱可能拒绝 Editor 安装、许可证、`~/.unity` 等
  workspace 外操作；遇到拒绝会报告并请求审批，不绕开。
- 被门控隐藏只影响模型目录，不影响 `/技能名` 显式调用。
- 技能正文必须低于 DSH 的 8192 字符裁剪线；本包以 7000 为目标，细节放
  `references/`。
- 本地技能是上游的压缩改写，上游 drift 由每周 workflow 报告，人工 port。

许可证：插件代码 MIT；`skills/` 内容为 Unity Companion License；图标 ISC。
详见包内 `NOTICE.md`。
