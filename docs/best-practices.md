# 最佳实践

本文档总结 Claude Code 的最佳实践，来自 Boris Cherny 团队和社区经验。

## Prompting 技巧

### 1. 挑战 Claude

```
grill me on these changes and don't make a PR until I pass your test
```

让 Claude 验证你的理解，确保代码质量。

### 2. 糟糕修复后重来

```
knowing everything you know now, scrap this and implement the elegant solution
```

如果第一次实现不够优雅，利用 Claude 的上下文重新实现。

### 3. 让 Claude 自己修 bug

粘贴错误信息，说 "fix"，不要微观管理。Claude 通常能自己诊断和修复。

### 4. 使用子代理

```
use subagents
```

投入更多计算力，同时保持主上下文清洁。

## Planning/Specs 技巧

### 1. 始终从 Plan Mode 开始

复杂任务先进入计划模式，让 Claude 设计方案。

### 2. 让 Claude 面试你

让 Claude 使用 AskUserQuestion 工具来澄清需求。

### 3. 分阶段门控计划

每个阶段有明确的测试标准，通过后才进入下一阶段。

### 4. 启动第二个 Claude 审查

作为 staff engineer 审查计划，提供独立视角。

### 5. 编写详细规格

交接工作前编写详细规格，减少歧义。

## Workflows 技巧

### 1. CLAUDE.md 控制在 200 行以内

过长的 CLAUDE.md 会：
- 超出上下文窗口限制
- 降低 Claude 的注意力
- 增加维护成本

### 2. Monorepo 使用多个 CLAUDE.md

祖先 + 后代加载机制：
```
/monorepo/
├── CLAUDE.md           # 根级别共享配置
├── frontend/
│   └── CLAUDE.md       # 前端特定配置
└── backend/
    └── CLAUDE.md       # 后端特定配置
```

### 3. 使用 `.claude/rules/` 分割指令

将大型指令拆分为多个规则文件。

### 4. 工作流使用 commands 而不是 sub-agents

Commands 更轻量，适合提示模板。

### 5. Feature-specific agents + skills

避免创建通用的 "qa-engineer" 或 "backend-developer"，而是创建具体功能的代理和技能。

### 6. 定期管理上下文

- 在 50% 上下文时手动 `/compact`
- 切换任务时用 `/clear` 重置

### 7. 小任务直接处理

简单的任务（几行代码修改）不需要任何工作流，直接让 Claude 处理。

### 8. 使用 `/model` 选择合适模型

- Haiku: 快速简单任务
- Sonnet: 平衡性能和成本
- Opus: 复杂推理任务

### 9. 启用 Thinking Mode

在 `/config` 中开启 thinking mode 和 Explanatory Output Style。

### 10. 使用 `ultrathink` 关键词

在提示中使用 `ultrathink` 获得 Claude 的高努力推理。

### 11. 重命名和恢复会话

```
/rename important-session
# 稍后
/resume important-session
```

## 文件组织最佳实践

### 目录结构

```
project/
├── CLAUDE.md                    # 项目上下文
├── .claude/
│   ├── commands/                # 自定义命令
│   ├── skills/                  # 自定义技能
│   ├── agents/                  # 自定义代理
│   └── rules/                   # 规则文件
└── docs/                        # 文档
```

### CLAUDE.md 内容建议

1. **项目概述** - 技术栈、目录结构
2. **编码规范** - 命名、格式、模式
3. **关键决策** - 重要架构决策记录
4. **常用命令** - 构建、测试、部署命令
5. **注意事项** - 常见陷阱和解决方案

## 调试技巧

### 1. 让 Claude 自己诊断

粘贴错误，说 "debug this" 或 "fix"。

### 2. 使用 `/debug` 技能

内置 debug 技能可以帮助诊断问题。

### 3. 隔离问题

创建最小复现示例，让 Claude 聚焦问题。

## 参考资源

- [Boris Cherny (@bcherny)](https://x.com/bcherny) - Claude Code 创作者
- [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) - 最佳实践合集
- [Claude Code subreddit](https://www.reddit.com/r/ClaudeCode/) - 社区讨论