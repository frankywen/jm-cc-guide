# AI Agents 配置指南

> 版本: 1.0.0 | 更新日期: 2026-03-16

本文档为 AI Agents 提供统一的配置和行为规范。

---

## 支持的 AI 平台

| 平台 | 配置文件 | 模型 |
|------|----------|------|
| Claude Code | CLAUDE.md | claude-sonnet-4-6, claude-opus-4-6 |
| Gemini CLI | GEMINI.md | gemini-2.0-flash, gemini-2.0-pro |
| GitHub Copilot | .github/copilot-instructions.md | GPT-4 |

---

## 统一指令格式

### 项目概述

```markdown
## 项目概述

- 名称：[项目名称]
- 类型：[Web/API/CLI/库]
- 技术栈：[主要技术]
- 目标：[项目目标]
```

### 编码规范

```markdown
## 编码规范

- 语言：[主要语言]
- 风格：[代码风格]
- 测试：[测试要求]
- 文档：[文档要求]
```

### 工作流

```markdown
## 工作流

1. 分析需求
2. 设计方案
3. 实现代码
4. 编写测试
5. 更新文档
```

---

## 平台特定配置

### Claude Code 特性

```markdown
## Claude 特定

- 使用 ES Modules
- 优先 async/await
- 添加 JSDoc 注释
- 遵循 CLAUDE.md 上下文限制
```

### Gemini CLI 特性

```markdown
## Gemini 特定

- 利用大上下文窗口处理长文本
- 使用多模态能力分析图像
- 选择合适的模型 (Flash/Pro)
```

### GitHub Copilot 特性

```markdown
## Copilot 特定

- 在注释中提供上下文
- 使用有意义的变量名
- 保持函数简洁
```

---

## 最佳实践

### 1. 同步更新配置文件

当更新一个配置文件时，同步更新其他平台的配置：

```bash
# 更新顺序
CLAUDE.md → GEMINI.md → .github/copilot-instructions.md
```

### 2. 共享核心内容

将共享的内容提取到独立文件：

```
docs/
├── project-overview.md    # 项目概述
├── coding-standards.md    # 编码规范
└── workflow.md            # 工作流
```

### 3. 平台特定优化

| 平台 | 优化重点 |
|------|----------|
| Claude | 技能、代理、工具调用 |
| Gemini | 多模态、长上下文 |
| Copilot | 实时补全、上下文感知 |

---

## 迁移指南

### 从 Claude Code 迁移到 Gemini CLI

1. 复制 CLAUDE.md 内容
2. 移除 Claude 特定语法
3. 添加 Gemini 特定配置
4. 测试并调整

### 从 Gemini CLI 迁移到 Claude Code

1. 复制 GEMINI.md 内容
2. 添加 Claude 技能支持
3. 配置 MCP Server（如需要）
4. 测试并调整