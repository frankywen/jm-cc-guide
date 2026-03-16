# 命令详解

本文档介绍 Claude Code Commands 的概念和使用方法。

## 什么是命令（Commands）？

Commands 是存储在 `.claude/commands/` 目录下的 Markdown 文件，作为可复用的提示模板。用户可以通过 `/command-name` 调用。

## 命令结构

```
.claude/commands/
├── review.md         # /review 命令
├── test.md           # /test 命令
└── deploy.md         # /deploy 命令
```

## 命令文件格式

```markdown
# 命令标题

命令描述和指令内容...

## 步骤

1. 第一步
2. 第二步

## 输出格式

期望的输出格式说明...
```

## 内置命令

Claude Code 提供以下内置命令：

| 命令 | 用途 |
|------|------|
| `/help` | 显示帮助信息 |
| `/clear` | 清除上下文 |
| `/compact` | 压缩上下文 |
| `/model` | 选择模型 |
| `/context` | 查看上下文使用 |
| `/usage` | 检查计划限制 |
| `/rename` | 重命名会话 |
| `/resume` | 恢复会话 |

## 自定义命令示例

### 代码审查命令

创建文件 `.claude/commands/review.md`:

```markdown
# Code Review

请对当前变更进行代码审查，关注以下方面：

## 检查项

1. **代码质量**
   - 是否有重复代码？
   - 命名是否清晰？
   - 是否有未使用的代码？

2. **潜在问题**
   - 是否有安全漏洞？
   - 是否有性能问题？
   - 是否有边界情况未处理？

3. **最佳实践**
   - 是否遵循项目规范？
   - 是否有更好的实现方式？

## 输出格式

按严重程度分类列出发现的问题：
- 🔴 Critical: 必须修复
- 🟡 Warning: 建议修复
- 🟢 Info: 可选改进
```

### 测试命令

创建文件 `.claude/commands/test.md`:

```markdown
# Run Tests

执行项目的测试套件并分析结果。

## 步骤

1. 检测项目类型（npm/pip/go等）
2. 运行适当的测试命令
3. 分析测试结果
4. 如果有失败，分析原因并建议修复

## 命令映射

| 项目类型 | 测试命令 |
|----------|----------|
| Node.js | `npm test` |
| Python | `pytest` |
| Go | `go test ./...` |
| Rust | `cargo test` |
```

## 命令 vs 技能

| 维度 | Commands | Skills |
|------|----------|--------|
| 位置 | `.claude/commands/` | `.claude/skills/` |
| 触发方式 | 用户显式调用 `/name` | 可自动加载或显式调用 |
| 上下文 | 注入当前上下文 | 可配置 fork 隔离 |
| 复杂度 | 简单提示模板 | 完整知识模块 |

## 最佳实践

1. **命名简洁** - 使用动词或名词短语
2. **单一职责** - 每个命令做一件事
3. **提供上下文** - 说明命令的使用场景
4. **输出明确** - 指定期望的输出格式