# Claude Code 协作指南

> 一站式 Claude Code 知识库和工具链

## 项目简介

本项目整合 Claude Code 生态的优秀实践，提供：

- **知识库** - CLAUDE.md + 模块化文档
- **插件包** - 可安装的 skills/commands/agents
- **CLI工具** - 智能初始化、合并、冲突检测

## 快速开始

### 方式一：直接使用知识库

1. 将 `CLAUDE.md` 复制到你的项目根目录
2. 将 `.claude/skills/core/` 复制到你的项目
3. 启动 Claude Code，内容自动加载

### 方式二：安装插件包（Phase 2）

```bash
/plugin marketplace add <repo>
/plugin install jm-cc-guide-core
```

### 方式三：使用CLI工具（Phase 3）

```bash
npm install -g cc-guide
cc-guide init
```

## 文档目录

| 文档 | 说明 |
|------|------|
| [getting-started.md](getting-started.md) | 快速开始指南 |
| [skills.md](skills.md) | 技能详解 |
| [commands.md](commands.md) | 命令详解 |
| [workflows.md](workflows.md) | 工作流详解 |
| [agents.md](agents.md) | 代理详解 |
| [best-practices.md](best-practices.md) | 最佳实践 |
| [architecture.md](architecture.md) | 架构与演进说明 |
| [reference/frontmatter.md](reference/frontmatter.md) | 技能元数据参考 |

## 项目来源

本项目整合以下开源项目的精华内容：

- [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) - 最佳实践
- [anthropics/skills](https://github.com/anthropics/skills) - 官方技能示例
- [easy-vibe](https://github.com/datawhalechina/easy-vibe) - 中文入门教程
- [claude-code-workflows](https://github.com/shinpr/claude-code-workflows) - 企业级工作流

## 许可证

MIT License