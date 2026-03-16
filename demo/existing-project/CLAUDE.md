# 我的项目

> 这是一个测试项目

## 项目说明

这是一个已有项目，用于测试cc-guide的合并功能。

## 技术栈

- Node.js
- React

## 编码规范

- 使用 camelCase 命名


<!-- BEGIN jm-cc-guide/core (2026-03-16) -->
# Claude Code 协作指南

> 版本: 1.0.0 | 更新日期: 2026-03-16

本文档为 Claude Code 提供核心概念、最佳实践和常用技能的快速参考。

---

## 核心概念

| 机制 | 位置 | 用途 |
|------|------|------|
| **Commands** | `.claude/commands/<name>.md` | 用户调用的提示模板 |
| **Subagents** | `.claude/agents/<name>.md` | 隔离上下文中自主执行的代理 |
| **Skills** | `.claude/skills/<name>/SKILL.md` | 可配置、可预加载的知识模块 |
| **Hooks** | `.claude/hooks/` | 事件触发的确定性脚本 |
| **MCP Servers** | `.claude/settings.json` | 连接外部工具和 API |
| **Memory** | `CLAUDE.md`, `.claude/rules/` | 持久上下文存储 |

### Commands vs Skills vs Agents

| 维度 | Commands | Skills | Agents |
|------|----------|--------|--------|
| 上下文 | 注入当前 | 注入当前 | 隔离独立 |
| 触发方式 | 用户显式调用 | 可自动加载 | 异步执行 |
| 适用场景 | 简单模板 | 知识模块 | 复杂任务 |

---

## 官方内置技能

| 技能 | 用途 | 调用方式 |
|------|------|----------|
| `simplify` | 审查代码变更，发现重用和质量问题 | `/simplify` |
| `batch` | 批量跨多个文件运行命令 | `/batch` |
| `debug` | 调试失败命令或代码问题 | `/debug` |
| `loop` | 按循环间隔运行提示（最多3天） | `/loop 10m /cmd` |
| `claude-api` | 使用 Claude API 构建应用 | 自动触发 |

---

## Prompting 技巧

### 技巧 1: 挑战 Claude
```
grill me on these changes and don't make a PR until I pass your test
```
让 Claude 验证你对代码的理解，确保变更正确。

### 技巧 2: 糟糕修复后重来
```
knowing everything you know now, scrap this and implement the elegant solution
```
如果第一次实现是"打补丁"式的，让 Claude 用更优雅的方式重写。

### 技巧 3: 让 Claude 自己修 bug
粘贴错误信息，说 "fix"，不要微观管理。Claude 通常能自己诊断和修复。

### 技巧 4: 使用子代理
```
use subagents
```
投入更多计算力，同时保持主上下文清洁。

---

## Workflows 技巧

### 技巧 1: CLAUDE.md 控制在 200 行以内
- 超出上下文窗口限制（~200 行后截断）
- 使用 `.claude/rules/` 分割大型指令
- 详细内容放入 `docs/` 目录

### 技巧 2: Monorepo 使用多个 CLAUDE.md
```
/monorepo/CLAUDE.md           # 根级别共享配置
/monorepo/frontend/CLAUDE.md  # 前端特定配置
/monorepo/backend/CLAUDE.md   # 后端特定配置
```

### 技巧 3: 工作流使用 commands 而不是 sub-agents
Commands 更轻量，适合提示模板。Sub-agents 适合需要隔离执行的复杂任务。

### 技巧 4: Feature-specific agents + skills
避免创建通用的 "qa-engineer"，创建具体功能的代理：
- `agents/api-design-reviewer.md` ✅
- `agents/backend-developer.md` ❌ 太泛化

### 技巧 5: 定期管理上下文
- 在 **50% 上下文**时手动 `/compact`
- **切换任务**时用 `/clear` 重置

---

## 上下文管理

| 场景 | 使用命令 |
|------|----------|
| 上下文超过 50% | `/compact` |
| 切换到完全不相关的任务 | `/clear` |
| 任务可以并行执行 | 子代理 |

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `/model` | 选择模型（haiku/sonnet/opus） |
| `/context` | 查看上下文使用情况 |
| `/usage` | 检查 API 计划限制 |
| `/compact` | 压缩上下文 |
| `/clear` | 清除上下文 |
| `/rename` | 重命名会话 |
| `/resume` | 恢复会话 |

### 模型选择

| 模型 | 适用场景 |
|------|----------|
| `haiku` | 快速简单任务 |
| `sonnet` | 日常开发 |
| `opus` | 复杂推理 |

---

## 扩展资源

详细文档请参阅 `docs/` 目录：
- `docs/skills.md` - 技能详解
- `docs/commands.md` - 命令详解
- `docs/workflows.md` - 工作流详解
- `docs/agents.md` - 代理详解
- `docs/best-practices.md` - 最佳实践
<!-- END jm-cc-guide/core -->