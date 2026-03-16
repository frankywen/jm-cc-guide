# 代理详解

本文档介绍 Claude Code Agents（子代理）的概念和使用方法。

## 什么是代理（Agents）？

Agents 是在全新隔离上下文中运行的自主执行者。它们拥有自己的工具权限、模型配置、内存和持久身份。

## 代理 vs 技能 vs 命令

| 维度 | Commands | Skills | Agents |
|------|----------|--------|--------|
| 上下文 | 注入当前 | 注入当前 | 隔离独立 |
| 执行方式 | 同步 | 同步/异步 | 异步 |
| 工具权限 | 继承主会话 | 可配置 | 独立配置 |
| 适用场景 | 简单模板 | 知识模块 | 复杂自主任务 |

## 代理结构

```
.claude/agents/
├── code-reviewer.md
├── test-runner.md
└── documentation-writer.md
```

## 代理文件格式

```markdown
---
name: my-agent
description: 代理描述
model: sonnet
tools:
  - Bash
  - Read
  - Edit
  - Write
allowed-paths:
  - /src/**
  - /tests/**
---

# My Agent

## 角色定义

代理的角色和能力描述...

## 工作流程

1. 步骤一
2. 步骤二

## 输出格式

期望的输出格式...
```

## 内置代理类型

Claude Code 提供以下内置代理类型：

| 类型 | 用途 |
|------|------|
| `general-purpose` | 通用任务 |
| `Explore` | 代码库探索 |
| `Plan` | 架构规划 |

## 自定义代理示例

### 代码审查代理

创建文件 `.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: 代码审查代理，检查代码质量和最佳实践
model: sonnet
tools:
  - Read
  - Grep
  - Glob
---

# Code Reviewer Agent

## 角色

你是一个专业的代码审查员，负责检查代码变更的质量。

## 审查标准

1. **代码质量**
   - 可读性和可维护性
   - 是否遵循项目规范
   - 是否有重复代码

2. **安全性**
   - 是否有 SQL 注入风险
   - 是否有 XSS 风险
   - 敏感信息是否暴露

3. **性能**
   - 是否有明显的性能问题
   - 是否有内存泄漏风险

## 输出格式

```markdown
## 审查摘要

[总体评价]

## 发现的问题

### 🔴 Critical
- [问题描述]

### 🟡 Warning
- [问题描述]

### 🟢 Suggestion
- [改进建议]

## 建议修改

[具体修改建议]
```
```

### 测试运行代理

创建文件 `.claude/agents/test-runner.md`:

```markdown
---
name: test-runner
description: 运行测试并分析结果
model: sonnet
tools:
  - Bash
  - Read
  - Grep
---

# Test Runner Agent

## 角色

你负责运行项目的测试套件并分析结果。

## 工作流程

1. 检测项目类型
2. 运行适当的测试命令
3. 分析测试输出
4. 对于失败的测试：
   - 分析失败原因
   - 建议修复方案

## 测试命令映射

| 项目类型 | 命令 |
|----------|------|
| Node.js/Jest | `npm test` |
| Python/pytest | `pytest -v` |
| Go | `go test -v ./...` |
| Rust | `cargo test` |

## 输出格式

```markdown
## 测试结果

- 总测试数: X
- 通过: X
- 失败: X
- 跳过: X

## 失败分析

[针对每个失败测试的分析]
```
```

## 使用代理

### 在技能中调用代理

```markdown
---
name: complex-analysis
context: fork
agent: general-purpose
---

[技能内容]
```

### 通过命令触发

用户说 "use subagents" 时，Claude Code 会创建隔离的子代理来处理任务。

## 最佳实践

1. **明确职责** - 每个代理专注一个领域
2. **限制权限** - 只授予必要的工具和路径访问
3. **清晰输出** - 定义期望的输出格式
4. **错误处理** - 代理应该能够优雅地处理错误

## 参考资源

- [workflows.md](workflows.md) - 工作流编排
- [skills.md](skills.md) - 技能详解