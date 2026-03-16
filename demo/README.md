# cc-guide CLI 使用文档

> 版本: 1.0.0
> 更新日期: 2026-03-16

---

## 概述

`cc-guide` 是 Claude Code 协作指南的命令行工具，用于快速初始化项目、安装扩展包、诊断配置问题。

## 安装

### 从 npm 安装（推荐）

```bash
npm install -g cc-guide
```

### 本地开发安装

```bash
cd cli/cc-guide
npm install
npm link
```

---

## 命令参考

### cc-guide --version

显示当前版本号。

```bash
$ cc-guide --version
1.0.0
```

### cc-guide --help

显示帮助信息。

```bash
$ cc-guide --help
Usage: cc-guide [options] [command]

Claude Code 协作指南 CLI 工具

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  init [options]           初始化项目配置
  add [options] <package>  添加扩展包
  list                     列出可用包
  doctor                   诊断配置问题
  update                   更新到最新版本
  help [command]           display help for command
```

---

### cc-guide init

初始化项目配置，支持新项目和已有项目两种场景。

**用法**:
```bash
cc-guide init           # 智能检测并初始化
cc-guide init --force   # 强制覆盖现有文件
```

**选项**:
- `-f, --force` - 强制覆盖现有 CLAUDE.md 文件

**行为说明**:

| 场景 | 行为 |
|------|------|
| 新项目（无 CLAUDE.md） | 创建完整目录结构 + CLAUDE.md + 基础技能 |
| 已有项目（有 CLAUDE.md） | 预览合并内容，确认后增量添加，标注来源 |

**示例输出（新项目）**:
```
$ cc-guide init

🚀 Claude Code 协作指南 初始化

创建新项目配置...
✓ 已创建目录结构
✓ 已创建 CLAUDE.md
✓ 已创建 .claude/skills/core/
? 选择要安装的扩展： (Press <space> to select)
 ❯◯ development - 开发扩展 - 文档技能、开发模板、编排模式
  ◯ workflows - 工作流扩展 - 端到端开发工作流
  ◯ beginner-cn - 中文入门 - 零基础学习 Claude Code

🎉 初始化完成！

启动 Claude Code 验证：
  claude
  > 请告诉我你知道的核心概念
```

**创建的目录结构**:
```
项目根目录/
├── CLAUDE.md                    # 基础层知识入口
├── .claude/
│   ├── skills/
│   │   ├── core/                # 基础层技能
│   │   └── extensions/          # 扩展层技能（可选）
│   ├── commands/
│   ├── agents/
│   ├── hooks/
│   └── rules/
└── docs/
```

---

### cc-guide add \<package\>

添加扩展包到当前项目。

**用法**:
```bash
cc-guide add <package>
cc-guide add <package> --skip-conflicts
```

**选项**:
- `-s, --skip-conflicts` - 跳过冲突检测

**可用包**:

| 包名 | 描述 |
|------|------|
| `core` | 基础层 - 核心概念和最佳实践 |
| `development` | 开发扩展 - 文档技能、开发模板、编排模式 |
| `workflows` | 工作流扩展 - 端到端开发工作流 |
| `beginner-cn` | 中文入门 - 零基础学习 Claude Code |

**示例**:
```
$ cc-guide add development

📦 安装 jm-cc-guide-development...
开发扩展 - 文档技能、开发模板、编排模式
✓ 已复制 .claude/skills/extensions/development/

✓ development 安装完成
```

---

### cc-guide list

列出所有可用包及其安装状态。

**用法**:
```bash
cc-guide list
```

**示例输出**:
```
$ cc-guide list

📦 可用包

  ✓ 已安装 core
         基础层 - 核心概念和最佳实践

  ✓ 已安装 development
         开发扩展 - 文档技能、开发模板、编排模式

  ○ 未安装 workflows
         工作流扩展 - 端到端开发工作流

  ○ 未安装 beginner-cn
         中文入门 - 零基础学习 Claude Code

使用 cc-guide add <package> 安装扩展
```

---

### cc-guide doctor

诊断项目配置问题，检查 CLAUDE.md 和 .claude 目录。

**用法**:
```bash
cc-guide doctor
```

**检查项**:

| 检查项 | 说明 |
|--------|------|
| CLAUDE.md | 是否存在，行数是否合理（< 200行） |
| .claude/ | 目录是否存在 |
| .claude/skills/ | 技能目录是否有内容 |

**示例输出（无问题）**:
```
$ cc-guide doctor

🔍 诊断配置问题

✓ CLAUDE.md 存在 (133 行)
✓ .claude/ 目录存在
✓ 技能目录: core, extensions

✓ 配置检查通过，未发现问题
```

**示例输出（有问题）**:
```
$ cc-guide doctor

🔍 诊断配置问题

发现的问题：

  ✗ 缺少 CLAUDE.md
    → 运行 cc-guide init 创建
  ⚠ 缺少 .claude/ 目录
    → 运行 cc-guide init 创建
```

---

### cc-guide update

检查并更新到最新版本。

**用法**:
```bash
cc-guide update
```

**示例输出（已发布到 npm）**:
```
$ cc-guide update

🔄 检查更新...

✓ 已是最新版本: 1.0.0
```

**示例输出（未发布）**:
```
$ cc-guide update

🔄 检查更新...

无法检查更新（可能未发布到 npm）
手动更新: npm update -g cc-guide
```

---

## 典型工作流

### 场景1：新项目初始化

```bash
# 1. 创建项目目录
mkdir my-project && cd my-project

# 2. 初始化
cc-guide init

# 3. 选择需要的扩展（可选）

# 4. 验证配置
cc-guide doctor

# 5. 启动 Claude Code
claude
```

### 场景2：已有项目添加配置

```bash
# 1. 进入已有项目
cd existing-project

# 2. 检查当前状态
cc-guide doctor

# 3. 初始化（会检测到已有 CLAUDE.md 并询问合并）
cc-guide init

# 4. 添加额外扩展
cc-guide add workflows

# 5. 查看安装状态
cc-guide list
```

### 场景3：扩展管理

```bash
# 列出可用包
cc-guide list

# 添加开发扩展
cc-guide add development

# 添加工作流扩展
cc-guide add workflows

# 再次查看状态
cc-guide list
```

---

## 测试结果

### 测试环境

- Node.js: v18.20.8
- OS: Windows 10
- 测试目录: `demo/test-project`

### 测试用例

| 命令 | 结果 | 说明 |
|------|------|------|
| `cc-guide --version` | ✅ 通过 | 正确显示 1.0.0 |
| `cc-guide --help` | ✅ 通过 | 显示完整帮助信息 |
| `cc-guide doctor`（空目录） | ✅ 通过 | 正确识别缺少配置 |
| `cc-guide init --force` | ✅ 通过 | 创建完整结构 |
| `cc-guide doctor`（初始化后） | ✅ 通过 | 显示配置正常 |
| `cc-guide list` | ✅ 通过 | 显示正确安装状态 |
| `cc-guide add development` | ✅ 通过 | 成功安装扩展 |
| `cc-guide add workflows` | ✅ 通过 | 成功安装扩展 |
| `cc-guide list`（安装后） | ✅ 通过 | 显示更新后的状态 |
| `cc-guide update` | ✅ 通过 | 正确处理未发布情况 |

### 创建的文件结构

```
demo/test-project/
├── CLAUDE.md                    # 133 行
├── .claude/
│   ├── skills/
│   │   ├── core/                # 基础技能
│   │   └── extensions/
│   │       ├── development/     # 开发扩展
│   │       └── workflows/       # 工作流扩展
│   ├── commands/
│   ├── agents/
│   ├── hooks/
│   └── rules/
└── docs/
```

---

## 故障排除

### 问题：找不到源文件

**症状**: `init` 或 `add` 命令提示"源不存在"

**解决方案**: 确保在 jm-cc-guide 项目目录下运行，或者正确设置了源目录路径。

### 问题：依赖安装失败

**症状**: `npm install` 报错

**解决方案**: 确保使用 Node.js >= 18.0.0

```bash
node --version  # 检查版本
```

---

## 相关文档

- [CLAUDE.md 说明](../CLAUDE.md)
- [架构与演进](../docs/architecture.md)
- [快速开始](../docs/getting-started.md)
- [技能详解](../docs/skills.md)