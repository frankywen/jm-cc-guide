---
name: cc-guide-core
description: Claude Code 协作指南基础技能 - 核心概念和最佳实践
user-invocable: false
---

# CC Guide Core Skills

本技能提供 Claude Code 的核心知识和最佳实践。

## 使用方式

本技能自动加载，为 Claude 提供协作指南的基础上下文。

## 核心原则

1. **YAGNI** - 只实现当前需要的功能
2. **DRY** - 不要重复自己
3. **简单优先** - 小任务直接处理，复杂任务才使用工作流
4. **上下文管理** - 定期 `/compact`，切换任务时 `/clear`

## Prompting 最佳实践

- 挑战 Claude 验证理解
- 让 Claude 自己诊断和修复问题
- 使用子代理处理复杂任务
- 明确说 "use subagents" 来保持主上下文清洁

## 参考文档

详细内容请参考项目根目录的 CLAUDE.md 文件。