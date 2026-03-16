# 技能详解

本文档详细介绍 Claude Code Skills 的概念、结构和最佳实践。

## 什么是技能（Skills）？

Skills 是指令、脚本和资源的文件夹，Claude 动态加载以提高专业任务的表现。Skills 教 Claude 如何以可重复的方式完成特定任务。

## 技能结构

```
.claude/skills/<skill-name>/
├── SKILL.md          # 必需：技能定义文件
├── templates/        # 可选：模板文件
└── examples/         # 可选：示例文件
```

## SKILL.md 格式

```markdown
---
name: my-skill-name
description: 清晰描述技能作用和使用时机
argument-hint: [可选参数提示]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(npm run *), Edit(/docs/**)
model: sonnet
context: fork
agent: general-purpose
---

# My Skill Name

[Claude 将遵循的指令]

## Examples
- 示例用法 1
- 示例用法 2

## Guidelines
- 指南 1
- 指南 2
```

## Frontmatter 字段说明

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 否 | 显示名称和 `/slash-command` 标识符 |
| `description` | string | 推荐 | 技能作用的描述，用于自动发现 |
| `argument-hint` | string | 否 | 自动完成时显示的提示 |
| `disable-model-invocation` | boolean | 否 | 设为 `true` 阻止 Claude 自动调用 |
| `user-invocable` | boolean | 否 | 设为 `false` 从 `/` 菜单隐藏 |
| `allowed-tools` | string | 否 | 技能激活时无需权限提示的工具 |
| `model` | string | 否 | 技能运行时使用的模型 |
| `context` | string | 否 | 设为 `fork` 在隔离子代理上下文运行 |
| `agent` | string | 否 | `context: fork` 时的子代理类型 |
| `hooks` | object | 否 | 此技能范围的生命周期钩子 |

## 技能类型

### 知识注入型（默认）

加载到当前上下文，Claude 可以立即使用其中的知识。

```markdown
---
name: project-context
description: 项目上下文知识
---
```

### 隔离执行型

在独立子代理中运行，不污染主上下文。

```markdown
---
name: complex-analysis
description: 复杂分析任务
context: fork
agent: general-purpose
---
```

## 最佳实践

1. **描述清晰** - description 决定了 Claude 何时使用这个技能
2. **单一职责** - 每个技能专注一个领域
3. **提供示例** - 帮助 Claude 理解预期输出
4. **限制工具权限** - 只授予必要的工具访问

## 官方技能示例

| 技能 | 用途 |
|------|------|
| `simplify` | 代码审查和重构建议 |
| `batch` | 批量文件操作 |
| `debug` | 问题诊断 |
| `loop` | 定时任务执行 |
| `claude-api` | API 开发辅助 |

## 参考资源

- [frontmatter.md](reference/frontmatter.md) - 完整字段参考
- [anthropics/skills](https://github.com/anthropics/skills) - 官方技能仓库