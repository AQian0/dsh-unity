# 技能 frontmatter 与 DSH 的对应关系

`skills/<name>/SKILL.md` 的 frontmatter 是 Unity Agent Plugin 的原始格式。DSH 的
skill 注册表只消费其中一部分字段，其余字段由本插件解释或仅作为信息保留。本文记录
每个字段的实际行为，避免“写了但没生效”。

## DSH 消费的字段

| 字段                       | 行为                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `name`                     | 必填，kebab-case，必须与目录名一致（校验脚本会失败）。注册表用它做查找键。                             |
| `description`              | 必填。DSH 目录只渲染 name + description（默认截到 500 字符），**路由信息必须写在这里**。               |
| `whenToUse`                | DSH 接受，但 `dsh-tool-skill` 的目录和加载结果都不渲染它；当前 34 个技能都没有使用。不要依赖它做路由。 |
| `disable-model-invocation` | DSH 执行：`true` 时技能不进模型目录、`skill` 工具不可加载，但仍可用 `/name` 显式调用。                 |
| `user-invocable`           | DSH 执行：`false` 时 `/name` 不能调用；省略表示允许。                                                  |

## 本插件执行的字段

| 字段                      | 行为                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `required_editor_version` | 与工程的 `m_EditorVersion` 比较；不满足时只把 `modelInvocable` 置 false（离开模型目录，`/name` 仍可用）。范围解析见 `src/requirements.ts`。 |
| `required_packages`       | 映射 `包 id → 版本范围`；缺失或不满足时同样只隐藏模型可见性。manifest 缺失/损坏时“未知不隐藏”。                                             |

## 仅保留、不执行的字段

| 字段            | 现状                                                                                                                                  | 原因                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `allowed-tools` | 已从其它客户端的工具名映射为 DSH 的 `bash`/`read`/`write`/`edit`/`web_fetch`/`web_search`，供人阅读；DSH **不执行**技能级工具白名单。 | DSH 没有 skill-scoped tool policy；限制工具要用 `ctx.tools.restrict()`，它是 per-agent 的，不是 per-skill 的。 |
| `modes`         | 保留为信息。DSH 有 plan mode 等模式，但没有 `[agent, ask]` 的对应语义。                                                               | 不猜测映射，避免静默改变行为。                                                                                 |
| `enabled`       | 保留为信息。                                                                                                                          | 启停由 profile 的插件行与 `exclude` 配置决定。                                                                 |
| `metadata`      | 原样透传到候选与加载定义。                                                                                                            | 供其它消费者读取，不参与门控。                                                                                 |

## 体积预算

DSH 的 `tool-result-pruner` 在压缩触发后会把超过 **8192 字符**的工具结果裁成
head + tail；`skill` 工具的正文也是工具结果。因此：

- 硬上限：`SKILL.md` 去掉 frontmatter 后的正文 **≤ 8192 字符**（`pnpm run validate` 失败）；
- 目标：**≤ 7000 字符**（warning），给 `<skill_content>` 包装和 resource guidance 留余量；
- 细节放 `references/`，由正文里的相对链接指向；`resourceBase` 会把技能目录作为
  资源根交给模型。

新增或改写技能时请先看 `pnpm run validate` 的输出；拆分方式见
`README.md` 的“技能正文体积”一节。
