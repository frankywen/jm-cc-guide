# 技能元数据参考

本文档提供 Claude Code Skills frontmatter 字段的完整参考。

## 必需字段

无必需字段，但推荐提供 `name` 和 `description`。

## 字段参考

### name

**类型**: `string`

**默认值**: 目录名或文件名

**描述**: 技能的显示名称，也作为 `/slash-command` 标识符。

**示例**:
```yaml
---
name: my-skill
---
```

---

### description

**类型**: `string`

**默认值**: 无

**描述**: 技能作用的描述，Claude 用于自动发现和决定何时使用此技能。

**推荐**: 清晰描述技能的用途和触发场景。

**示例**:
```yaml
---
description: Use when implementing REST API endpoints
---
```

---

### argument-hint

**类型**: `string`

**默认值**: 无

**描述**: 用户通过 `/` 命令调用时，自动完成显示的参数提示。

**示例**:
```yaml
---
argument-hint: <file-path>
---
```

---

### disable-model-invocation

**类型**: `boolean`

**默认值**: `false`

**描述**: 设为 `true` 时，阻止 Claude 自动调用此技能。只能通过用户显式调用。

**使用场景**: 需要用户明确控制的操作。

**示例**:
```yaml
---
disable-model-invocation: true
---
```

---

### user-invocable

**类型**: `boolean`

**默认值**: `true`

**描述**: 设为 `false` 时，技能不会出现在 `/` 命令菜单中。

**使用场景**: 仅作为内部知识，不需要用户直接调用。

**示例**:
```yaml
---
user-invocable: false
---
```

---

### allowed-tools

**类型**: `string`

**默认值**: 无

**描述**: 技能激活时无需权限提示的工具列表。

**格式**: `ToolName(pattern1), ToolName(pattern2)`

**支持的工具**: `Bash`, `Read`, `Edit`, `Write`, `Glob`, `Grep`

**示例**:
```yaml
---
allowed-tools: Bash(npm run *), Edit(/docs/**), Read(**)
---
```

---

### model

**类型**: `string`

**默认值**: 当前会话模型

**可选值**: `haiku`, `sonnet`, `opus`

**描述**: 技能运行时使用的模型。

**使用场景**: 简单任务用 haiku 节省成本，复杂推理用 opus。

**示例**:
```yaml
---
model: sonnet
---
```

---

### context

**类型**: `string`

**默认值**: 注入当前上下文

**可选值**: `fork`

**描述**: 设为 `fork` 时，技能在隔离的子代理上下文中运行。

**使用场景**: 复杂任务需要独立上下文，避免污染主会话。

**示例**:
```yaml
---
context: fork
agent: general-purpose
---
```

---

### agent

**类型**: `string`

**默认值**: `general-purpose`

**可选值**: `general-purpose`, `Explore`, `Plan`

**描述**: 当 `context: fork` 时使用的子代理类型。

**前提条件**: 必须同时设置 `context: fork`。

**示例**:
```yaml
---
context: fork
agent: Explore
---
```

---

### hooks

**类型**: `object`

**默认值**: 无

**描述**: 此技能范围的生命周期钩子。

**可用钩子**:
- `onActivate`: 技能激活时
- `onDeactivate`: 技能停用时

**示例**:
```yaml
---
hooks:
  onActivate: echo "Skill activated"
  onDeactivate: echo "Skill deactivated"
---
```

## 完整示例

```yaml
---
name: code-reviewer
description: Use when reviewing code changes for quality and security issues
argument-hint: <file-or-directory>
disable-model-invocation: false
user-invocable: true
allowed-tools: Read(**), Grep(**), Glob(**)
model: sonnet
context: fork
agent: general-purpose
hooks:
  onActivate: echo "Starting code review"
---

# Code Reviewer Skill

[技能内容]
```

## 相关文档

- [skills.md](../skills.md) - 技能详解
- [agents.md](../agents.md) - 代理详解