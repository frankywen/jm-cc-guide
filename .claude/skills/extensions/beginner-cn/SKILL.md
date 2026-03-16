---
name: cc-guide-beginner-cn
description: 中文入门教程扩展 - 零基础学习 Claude Code
user-invocable: true
argument-hint: <topic>
---

# 中文入门扩展

本扩展提供 Claude Code 中文入门教程，来自 easy-vibe 项目。

## 学习路径

### 阶段 1: 入门基础

**目标**：熟悉 Claude Code 基本操作

**内容**：
1. 安装 Claude Code
2. 启动第一个会话
3. 基本命令使用
4. 上下文管理

**练习**：
- 让 Claude 创建一个简单的 README.md
- 使用 `/compact` 压缩上下文
- 使用 `/clear` 重置会话

### 阶段 2: 技能使用

**目标**：掌握 Skills、Commands、Agents

**内容**：
1. 创建第一个 Skill
2. 创建自定义 Command
3. 理解 Agent 的使用场景

**练习**：
- 创建一个代码格式化的 Command
- 创建一个项目特定的 Skill

### 阶段 3: 工作流构建

**目标**：构建复杂工作流

**内容**：
1. Command → Agent → Skill 编排
2. 错误处理
3. 最佳实践

**练习**：
- 构建一个代码审查工作流
- 构建一个测试运行工作流

## 快速参考

### 常用命令

| 命令 | 用途 | 示例 |
|------|------|------|
| `/model` | 切换模型 | `/model opus` |
| `/compact` | 压缩上下文 | `/compact` |
| `/clear` | 清除上下文 | `/clear` |
| `/help` | 查看帮助 | `/help` |

### 常见问题

**Q: Claude 回答不符合预期怎么办？**
- 检查 CLAUDE.md 是否正确加载
- 使用 `/clear` 重置上下文
- 提供更明确的指令

**Q: 如何让 Claude 记住项目信息？**
- 在 CLAUDE.md 中写入项目上下文
- 使用 Skills 存储领域知识
- 使用 `.claude/rules/` 存储规则

**Q: 上下文太长怎么办？**
- 使用 `/compact` 压缩
- 使用子代理隔离复杂任务
- 将详细内容放入 docs/ 目录

## 使用方式

```
/cc-guide-beginner-cn          # 显示学习路径
/cc-guide-beginner-cn basic    # 入门基础
/cc-guide-beginner-cn skills   # 技能使用
/cc-guide-beginner-cn workflow # 工作流构建
```

## 参考资源

- [easy-vibe](https://github.com/datawhalechina/easy-vibe) - 完整中文教程
- [easy-vibe 在线文档](https://datawhalechina.github.io/easy-vibe/) - 交互式学习