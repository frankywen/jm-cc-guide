# 快速开始

本文档帮助你快速上手 Claude Code 协作指南。

## 前置条件

- 已安装 Claude Code CLI
- 基本的命令行操作知识

## 5分钟快速上手

### Step 1: 获取知识库

```bash
# 克隆仓库
git clone https://github.com/your-repo/jm-cc-guide.git
cd jm-cc-guide
```

### Step 2: 复制到你的项目

```bash
# 复制 CLAUDE.md
cp CLAUDE.md /path/to/your/project/

# 复制基础技能
cp -r .claude/skills/core /path/to/your/project/.claude/skills/
```

### Step 3: 启动 Claude Code

```bash
cd /path/to/your/project
claude
```

Claude Code 会自动加载 CLAUDE.md 和 skills。

### Step 4: 验证加载

在 Claude Code 中输入：

```
请告诉我你知道的核心概念
```

如果 Claude 回答了 Commands、Skills、Agents 等概念，说明加载成功！

## 下一步

- 阅读 [skills.md](skills.md) 了解如何创建自定义技能
- 阅读 [best-practices.md](best-practices.md) 学习最佳实践
- 阅读 [workflows.md](workflows.md) 构建复杂工作流

## 常见问题

### Q: CLAUDE.md 和 skills 有什么区别？

CLAUDE.md 是项目级持久上下文，始终加载。Skills 是可配置、可预加载的知识模块，可以按需激活。

### Q: 我的 CLAUDE.md 应该放什么内容？

建议包含：
- 项目上下文（技术栈、目录结构）
- 编码规范
- 常用命令速查
- 关键决策记录

控制在一页内（~150行）效果最佳。

### Q: 如何更新知识库？

重新从仓库复制最新文件即可。未来可通过 CLI 工具自动更新。