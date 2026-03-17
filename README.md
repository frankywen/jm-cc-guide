# jm-cc-guide

> Claude Code 协作指南 - 一站式知识库和工具链

[![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](https://github.com/frankywen/jm-cc-guide)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 项目简介

jm-cc-guide 整合 Claude Code 生态的优秀实践，构建分层知识库和工具链，支持系统性 AI 协作。

**核心产物**：

| 产物 | 说明 |
|------|------|
| **知识库** | CLAUDE.md + 模块化文档 |
| **插件包** | 可安装的 skills/commands/agents |
| **CLI工具** | 智能初始化、合并、冲突检测 |

---

## 功能特性

- **分层内容** - 基础层（必装）+ 扩展层（选装）
- **多种安装方式** - 直接复制 / 插件安装 / CLI工具
- **智能合并** - 已有项目支持内容合并，标注来源
- **冲突检测** - 自动检测重复和重叠内容
- **配置诊断** - 一键检查项目配置问题
- **多模型支持** - 支持 Claude、Gemini 配置生成
- **MCP 集成** - 内置 MCP Server 配置示例
- **Hooks 实战** - 安全验证、自动格式化等示例
- **Agent SDK** - 自主代理开发模板
- **国际化** - 支持中英文界面

---

## 安装

### 方式一：直接使用知识库

适合快速体验或简单项目。

```bash
# 复制知识库文件到你的项目
cp CLAUDE.md your-project/
cp -r .claude/skills/core your-project/.claude/skills/
```

### 方式二：使用 CLI 工具（推荐）

适合新项目和已有项目。

**步骤 1：克隆项目并安装 CLI**

```bash
# 克隆项目
git clone https://github.com/frankywen/jm-cc-guide.git
cd jm-cc-guide

# 安装 CLI 依赖
cd cli/cc-guide
npm install

# 全局链接（使 cc-guide 命令全局可用）
npm link
```

> **说明**：`npm link` 会创建一个全局符号链接，让你在任何目录都能使用 `cc-guide` 命令。

**步骤 2：初始化你的项目**

```bash
# 进入你的项目目录
cd /path/to/your-project

# 初始化（默认只创建 Claude 配置）
cc-guide init

# 多模型配置
cc-guide init --models claude,gemini,agents

# 交互式模式
cc-guide interactive

# 查看可用包
cc-guide list

# 添加扩展
cc-guide add development
cc-guide add agent-sdk
```

**卸载 CLI**

```bash
# 取消全局链接
npm unlink -g cc-guide
```

### 方式三：插件包安装

适合 Claude Code 插件市场用户。

```bash
/plugin marketplace add <repo-url>
/plugin install jm-cc-guide-core
```

---

## 快速开始

### 1. 初始化新项目

```bash
mkdir my-project && cd my-project
cc-guide init
```

输出：
```
🚀 Claude Code 协作指南 初始化

创建新项目配置...
✓ 已创建目录结构
✓ 已创建 CLAUDE.md
✓ 已创建 .claude/skills/core/
? 选择要安装的扩展： (Press <space> to select)

🎉 初始化完成！
```

### 2. 验证配置

```bash
cc-guide doctor
```

输出：
```
🔍 诊断配置问题

✓ CLAUDE.md 存在 (133 行)
✓ .claude/ 目录存在
✓ 技能目录: core, extensions

✓ 配置检查通过，未发现问题
```

### 3. 启动 Claude Code

```bash
claude
> 请告诉我你知道的核心概念
```

---

## 项目结构

```
jm-cc-guide/
├── CLAUDE.md                    # 基础层知识入口（133行）
├── .claude/
│   └── skills/
│       ├── core/                # 基础层技能
│       └── extensions/          # 扩展层技能
│           ├── development/     # 开发扩展（含 MCP/Hooks 示例）
│           ├── workflows/       # 工作流扩展
│           ├── beginner-cn/     # 中文入门
│           └── agent-sdk/       # Agent SDK 扩展
├── docs/                        # 模块化文档
├── plugins/                     # 插件包配置
├── cli/cc-guide/                # CLI工具
│   └── src/
│       ├── commands/            # CLI 命令
│       ├── lib/                 # 工具库
│       └── templates/           # 模板文件
└── demo/                        # 测试示例
```

---

## 内容分级

### 基础层（必装）

| 内容 | 说明 |
|------|------|
| CLAUDE.md | 核心概念、官方技能、Prompting技巧、工作流技巧 |
| .claude/skills/core/ | 基础技能定义 |

**内容来源**：
- anthropics/skills 官方内置技能概念
- claude-code-best-practice 核心技巧

### 扩展层（选装）

| 扩展包 | 说明 | 来源 |
|--------|------|------|
| `development` | 文档技能、开发模板、MCP/Hooks 示例 | anthropics/skills |
| `workflows` | 端到端开发工作流 | claude-code-workflows |
| `beginner-cn` | 中文入门教程 | easy-vibe |
| `agent-sdk` | Agent SDK 开发模板 | 官方文档 |

---

## CLI 命令

| 命令 | 说明 |
|------|------|
| `cc-guide init` | 初始化项目配置 |
| `cc-guide init --models claude,gemini` | 多模型配置 |
| `cc-guide add <package>` | 添加扩展包 |
| `cc-guide list` | 列出可用包 |
| `cc-guide doctor` | 诊断配置问题 |
| `cc-guide update` | 检查更新 |
| `cc-guide config` | 配置管理 |
| `cc-guide sync` | 同步上游更新 |
| `cc-guide interactive` | 交互式控制台 |

详细用法请参考 [demo/README.md](demo/README.md)。

---

## 新增功能（v1.1.0）

### MCP Server 集成示例

```json
// .claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

### Hooks 实战示例

```bash
# 命令安全验证
.claude/hooks/validate-bash.sh

# 自动格式化
.claude/hooks/format-file.sh

# 敏感信息检测
.claude/hooks/check-secrets.sh
```

### Agent SDK 模板

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';

const agent = new Agent({
  model: 'claude-sonnet-4-6',
  tools: [/* ... */]
});
```

---

## 文档目录

| 文档 | 说明 |
|------|------|
| [getting-started.md](docs/getting-started.md) | 快速开始指南 |
| [skills.md](docs/skills.md) | 技能详解 |
| [commands.md](docs/commands.md) | 命令详解 |
| [workflows.md](docs/workflows.md) | 工作流详解 |
| [agents.md](docs/agents.md) | 代理详解 |
| [best-practices.md](docs/best-practices.md) | 最佳实践 |
| [architecture.md](docs/architecture.md) | 架构与演进说明 |
| [CHANGELOG.md](CHANGELOG.md) | 版本历史 |

---

## 来源项目

本项目整合以下开源项目的精华内容：

| 项目 | 核心价值 | 整合方式 |
|------|----------|----------|
| [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | 一站式最佳实践 | 提取核心概念、技巧到基础层和 development 扩展 |
| [anthropics/skills](https://github.com/anthropics/skills) | 官方技能参考 | 官方内置技能概念入基础层，文档技能入 development 扩展 |
| [easy-vibe](https://github.com/datawholechina/easy-vibe) | 零基础入门 | 中文教程精华入 beginner-cn 扩展 |
| [claude-code-workflows](https://github.com/shinpr/claude-code-workflows) | 企业级工作流 | 端到端工作流入 workflows 扩展 |

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.1 | 2026-03-17 | 依赖更新、Node.js 引擎升级至 ≥20.0.0 |
| 1.1.0 | 2026-03-16 | 新增 MCP/Hooks 示例、Agent SDK、多模型支持、交互模式 |
| 1.0.0 | 2026-03-16 | Phase 3 完成，CLI 工具发布 |
| 0.2.0 | 2026-03-16 | Phase 2 完成，插件包可用 |
| 0.1.0 | 2026-03-16 | Phase 1 完成，知识库发布 |

---

## 开发

```bash
# 克隆项目
git clone <repo-url>
cd jm-cc-guide

# 安装 CLI 依赖
cd cli/cc-guide
npm install

# 本地链接测试
npm link

# 运行测试
npm test
```

---

## 许可证

MIT License

---

## 致谢

感谢以下项目为 Claude Code 生态做出的贡献：
- [anthropics](https://github.com/anthropics) - 官方工具和示例
- [shanraisshan](https://github.com/shanraisshan) - 最佳实践整理
- [shinpr](https://github.com/shinpr) - 企业级工作流设计
- [datawhalechina](https://github.com/datawhalechina) - 中文教程编写