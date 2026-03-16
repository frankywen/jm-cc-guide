# Claude Code 协作指南整合项目设计文档

> 设计日期: 2026-03-16
> 状态: Phase 2 完成
> 版本: 0.2.0

---

## 问题陈述

当前Claude Code生态存在多个优秀项目，但分散在不同仓库，用户面临以下痛点：

| 痛点 | 说明 |
|------|------|
| **内容分散** | 需要分别访问多个仓库获取不同类型的内容 |
| **知识重叠** | 各项目有重复内容，用户需要自行去重和整合 |
| **场景割裂** | 新项目和已有项目的使用方式不统一 |
| **安装复杂** | 缺乏统一的安装和管理工具 |

**本项目旨在解决**：将分散的Claude Code生态资源整合为分层知识库和工具链，提供统一的学习路径和安装体验。

---

## 项目概述

### 项目名称

jm-cc-guide（Claude Code 协作指南）

### 项目目标

整合现有Claude Code生态项目精华，构建分层知识库和工具链，支持系统性AI协作。

### 成功标准

| 阶段 | 成功标准 | 验证方式 |
|------|----------|----------|
| Phase 1-a | CLAUDE.md 120-180行，可被Claude Code正确加载 | 在Claude Code中验证上下文加载 |
| Phase 1-b | 模块化文档完整覆盖7个主题 + README.md | 检查所有文件存在且包含必需章节 |
| Phase 2-a | 插件包可通过 `/plugin install` 安装 | 在新项目中测试安装 |
| Phase 2-b | 基础层 + 3个扩展层可用 | 功能验证测试 |
| Phase 3-a | CLI支持新项目和已有项目两种场景 | 端到端测试 |
| Phase 3-b | 冲突检测准确率 > 95% | 测试用例验证 |

### 核心产物

1. **知识库** - CLAUDE.md + 模块化文档
2. **插件包** - 可安装的skills/commands/agents
3. **CLI工具** - 智能初始化、合并、冲突检测

### 实施路径

- Phase 1：文档与知识库（基础层）
- Phase 2：插件包（基础层 + 扩展层）
- Phase 3：CLI工具（支持新项目/已有项目）

### 演进设计

**背景说明**：在设计过程中，我们评估了多种架构方案：

| 方案 | 核心思路 | 特点 |
|------|----------|------|
| **方案A（轻量整合）** | 以文档和知识库为核心，插件包和CLI作为辅助工具 | 快速产出，渐进实施 |
| **方案B（一体化插件）** | 以插件包为核心，文档嵌入插件内 | 安装体验统一，灵活性受限 |
| **方案C（CLI优先）** | 以CLI工具为核心，插件包作为内容源 | 最大灵活性，开发成本高 |

**决策**：采用方案A结构，保留向方案C演进的能力。

**演进路径说明**：

| 阶段 | 用户入口 | 内容位置 | 目录结构 |
|------|----------|----------|----------|
| Phase 1-2 | 文档阅读 / 插件安装 | `.claude/skills/` 等 | 保持不变 |
| Phase 3 | CLI命令 | 同上，无需移动 | 保持不变 |

**关键设计决策**：CLI是内容的读取者，不改变内容存放位置。演进仅体现在入口方式变化，目录结构保持稳定。

---

## 目录结构设计

```
jm-cc-guide/
├── CLAUDE.md                    # 基础层知识入口（~150行）
├── .claude/
│   ├── skills/
│   │   ├── core/                # 基础层技能（必装）
│   │   │   └── SKILL.md
│   │   └── extensions/          # 扩展层技能（选装）
│   │       ├── development/     # 开发技能
│   │       ├── workflows/       # 工作流代理
│   │       └── beginner-cn/     # 中文入门
│   ├── commands/
│   │   └── *.md                 # 命令模板
│   └── agents/
│       └── *.md                 # 代理配置
├── docs/
│   ├── README.md                # 项目总览
│   ├── getting-started.md       # 快速开始
│   ├── skills.md                # 技能详解
│   ├── commands.md              # 命令详解
│   ├── workflows.md             # 工作流详解
│   ├── agents.md                # 代理详解
│   ├── best-practices.md        # 最佳实践
│   ├── architecture.md          # 架构与演进说明
│   └── reference/
│       └── frontmatter.md       # 技能元数据参考
├── plugins/                     # Phase 2
│   ├── core/
│   │   └── plugin.json
│   └── extensions/
│       ├── development/
│       ├── workflows/
│       └── beginner-cn/
└── cli/                         # Phase 3
    └── cc-guide/
```

---

## 内容分级策略

### 基础层（必装）

目标大小：120-180行CLAUDE.md

| 来源 | 提取内容 |
|------|----------|
| anthropics/skills | 官方内置5个技能的概念说明：`simplify`、`batch`、`debug`、`loop`、`claude-api` |
| best-practice | 核心概念表、Prompting技巧(4条)、Workflows技巧精选(6条) |

### 扩展层（选装）

| 扩展包 | 来源 | 内容 |
|--------|------|------|
| `extensions/development` | anthropics/skills + best-practice | 文档技能、开发技能模板、高级编排模式 |
| `extensions/workflows` | claude-code-workflows | 端到端工作流代理（需求分析→实现→质量检查） |
| `extensions/beginner-cn` | easy-vibe | 中文入门教程精华 |

### 不纳入整合的内容

| 来源 | 原因 |
|------|------|
| everything-claude-code | 仅资源链接汇总，参考价值低 |
| best-practice 开放问题部分 | 保留在docs作为讨论参考，不进入知识库 |

---

## CLI工具功能设计（Phase 3）

### 核心命令

| 命令 | 功能 | 新项目 | 已有项目 |
|------|------|--------|----------|
| `cc-guide init` | 初始化项目配置 | 创建完整结构 | 检测并合并 |
| `cc-guide add <package>` | 添加扩展包 | 直接添加 | 冲突检测后添加 |
| `cc-guide list` | 列出可用包 | - | - |
| `cc-guide doctor` | 诊断配置问题 | - | 支持 |
| `cc-guide update` | 更新到最新版本 | 支持 | 支持 |

### 智能行为设计

| 场景 | 行为 |
|------|------|
| **新项目** | 生成标准目录结构、创建CLAUDE.md模板、安装基础层 |
| **已有项目-无CLAUDE.md** | 创建CLAUDE.md，询问是否安装扩展 |
| **已有项目-有CLAUDE.md** | 预览合并内容，确认后增量添加，标注来源 |
| **检测到冲突** | 列出冲突项，提供选择：保留原内容 / 覆盖 / 跳过 |

**冲突检测算法**：

| 检测类型 | 定义 | 处理方式 |
|----------|------|----------|
| **完全重复** | 相同行内容（逐行比对） | 标记为可跳过 |
| **部分重叠** | 提取 H2/H3 标题作为关键词，标题相同但内容不同 | 提示用户选择 |
| **边界检测** | 通过 Markdown 标题（`##`）划分内容块 | 按块合并 |

**关键词提取规则**：
1. 提取所有 `##` 和 `###` 标题文本
2. 移除 Markdown 格式符号
3. 转换为小写后比对
4. 标题相似度 > 80% 视为相同关键词

**相似度计算公式**：
```
similarity = 1 - (Levenshtein_distance / max(len(a), len(b)))
```
其中 `Levenshtein_distance` 为两字符串的最小编辑距离，`len(a)` 和 `len(b)` 为字符串长度。

**合并输出格式**：

```markdown
<!-- BEGIN jm-cc-guide/core (2026-03-16) -->
[合并的内容]
<!-- END jm-cc-guide/core -->
```

### 版本策略

| 项目 | 说明 |
|------|------|
| **版本号格式** | 语义化版本 `MAJOR.MINOR.PATCH` |
| **内容包版本** | 每个扩展包独立版本号，如 `core@1.0.0` |
| **版本存储** | `plugins/*/plugin.json` 中的 `version` 字段 |
| **更新检查** | CLI 通过 GitHub Releases API 检查远程版本 |
| **向后兼容** | MINOR 版本保持兼容，MAJOR 版本可能有破坏性变更 |

### 分发策略

| 阶段 | 分发方式 | 说明 |
|------|----------|------|
| Phase 1 | GitHub 仓库 | 用户克隆或下载 ZIP |
| Phase 2 | GitHub 仓库 + Claude Code 插件市场 | `/plugin marketplace add` 安装 |
| Phase 3 | npm registry | `npm install -g cc-guide` 全局安装 |

### 交互示例

```bash
$ cc-guide init

检测到已有 CLAUDE.md（32行）
建议添加以下内容：
  + 项目上下文指引（来自core）
  + 常用命令快捷方式（来自core）

是否继续？[Y/n/diff]
> diff    # 查看详细差异

是否继续？[Y/n]
> Y       # 确认合并

✓ 已更新 CLAUDE.md（新增28行）
✓ 已创建 .claude/skills/core/
```

---

## 实施计划

### Phase 1：文档与知识库

**前置条件**：无

| 任务 | 产出 | 验证 | 对应成功标准 |
|------|------|------|--------------|
| 1.1 编写CLAUDE.md基础层 | `CLAUDE.md`（120-180行） | Claude Code 加载测试 | Phase 1-a |
| 1.2 编写模块化文档 | `docs/*.md`（7个主题 + README + reference） | 文档链接完整性检查 | Phase 1-b |
| 1.3 创建基础层技能 | `.claude/skills/core/` | 技能加载测试 | Phase 1-a |
| 1.4 编写演进说明文档 | `docs/architecture.md` | 文档审核 | Phase 1-b |

**依赖关系**：任务 1.1 和 1.3 可并行执行，1.2 依赖 1.1 完成后确定内容框架。

**说明**：
- `.claude/skills/core/` 是 Phase 1 产物，提供可直接使用的基础技能
- `plugins/` 目录在 Phase 2 创建，用于打包分发

### Phase 2：插件包

**前置条件**：Phase 1 完成

**说明**：`/plugin install` 是 Claude Code 内置命令，用于安装插件包。本阶段将创建符合 Claude Code 插件规范的内容包。

| 任务 | 产出 | 验证 | 对应成功标准 |
|------|------|------|--------------|
| 2.1 创建development扩展 | `.claude/skills/extensions/development/` | 功能测试 | Phase 2-b |
| 2.2 创建workflows扩展 | `.claude/skills/extensions/workflows/` | 功能测试 | Phase 2-b |
| 2.3 创建beginner-cn扩展 | `.claude/skills/extensions/beginner-cn/` | 功能测试 | Phase 2-b |
| 2.4 配置插件包元数据 | `plugins/*/plugin.json` | 格式验证 | Phase 2-a |
| 2.5 测试插件安装流程 | 验证 `/plugin install` 可用 | 端到端测试 | Phase 2-a |

**依赖关系**：任务 2.1-2.3 可并行执行，2.4 依赖 2.1-2.3 完成，2.5 最后执行。

**plugin.json 格式参考**：
```json
{
  "name": "jm-cc-guide-core",
  "version": "1.0.0",
  "description": "Claude Code 协作指南 - 基础层",
  "skills": [".claude/skills/core"]
}
```

### Phase 3：CLI工具

**前置条件**：Phase 2 完成

**技术选型决策**：

| 选项 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| Node.js | 跨平台、npm生态丰富、异步处理方便 | 需要Node运行时 | ✅ 推荐 |
| Bash | 轻量、无依赖 | Windows兼容性差 | 不推荐 |
| Go | 单二进制、性能好 | 开发成本较高 | 备选 |

**决策**：选择 Node.js，理由是跨平台兼容性好，且可通过 npm 分发，与 Claude Code 生态一致。

**技术要求**：
- Node.js >= 18.0.0（LTS）
- Commander.js >= 11.0.0

| 任务 | 产出 | 验证 | 对应成功标准 |
|------|------|------|--------------|
| 3.1 搭建CLI框架 | Node.js + Commander.js | 单元测试 | Phase 3-a |
| 3.2 实现 `init` 命令 | 新项目初始化 + 已有项目合并 | 集成测试 | Phase 3-a |
| 3.3 实现 `add` 命令 | 扩展包安装 + 冲突检测 | 集成测试 | Phase 3-b |
| 3.4 实现 `list/doctor/update` | 辅助命令 | 单元测试 | Phase 3-a |
| 3.5 发布与文档 | npm发布 + README | 用户验收测试 | Phase 3-a |

**依赖关系**：任务 3.1 需先完成，3.2-3.4 可并行开发，3.5 在所有命令完成后执行。

---

## 测试策略

### 测试类型与覆盖

| 阶段 | 测试类型 | 覆盖目标 | 工具 |
|------|----------|----------|------|
| Phase 1 | 文档验证 | CLAUDE.md 加载成功、文档链接完整 | 手动验证 |
| Phase 2 | 功能测试 | 各技能/命令在 Claude Code 中正确执行 | 手动验证 |
| Phase 3 | 单元测试 | CLI 各函数逻辑正确 | Jest |
| Phase 3 | 集成测试 | CLI 与文件系统交互正确 | Jest + tmp |
| Phase 3 | 端到端测试 | 完整用户流程 | 手动 + 自动化脚本 |

### CLI 测试用例（Phase 3）

| 场景 | 测试用例 | 预期结果 |
|------|----------|----------|
| 新项目 | `cc-guide init` 在空目录执行 | 创建完整结构 |
| 已有项目-无CLAUDE.md | `cc-guide init` | 创建 CLAUDE.md，询问扩展安装 |
| 已有项目-有CLAUDE.md | `cc-guide init` | 预览合并，确认后增量添加 |
| 冲突-完全重复 | 相同内容块 | 自动跳过，提示用户 |
| 冲突-部分重叠 | 相同标题不同内容 | 列出冲突，等待用户选择 |
| 版本检查 | `cc-guide update` | 检测到新版本时提示更新 |

---

## 设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 产物顺序 | 文档 → 插件 → CLI | 文档优先可快速产出，为后续步骤提供蓝图 |
| 文档形式 | CLAUDE.md + 模块化文档 | CLAUDE.md支持AI自动加载，模块化文档支持人类阅读 |
| 知识结构 | 按功能主题组织 | 结构清晰，便于转换为可安装插件 |
| 内容策略 | 分级整合 | 匹配插件包拆分，适配不同用户需求 |
| 安装方式 | CLI + 插件混合 | CLI处理复杂交互，插件处理内容分发 |
| 目录演进 | 保持稳定 | CLI读取内容，不移动内容位置，降低迁移成本 |

---

## 待完善事项

> 以下问题在审核中发现，将在后续迭代中完善。

| # | 问题 | 严重度 | 计划处理阶段 |
|---|------|--------|--------------|
| 1 | 成功标准 Phase 1-b 未提及 reference 目录 | 低 | Phase 1 实施时修正 |
| 2 | CLI 目录内部结构未展开（package.json, bin/, src/） | 低 | Phase 3 设计阶段细化 |
| 3 | 扩展包的 plugin.json 结构不清晰 | 低 | Phase 2 实施时明确 |
| 4 | CLI 依赖列表不完整（需补充 fs-extra, marked, levenshtein 等） | 低 | Phase 3 开发时确定 |
| 5 | 缺少风险评估部分 | 低 | 文档迭代时补充 |
| 6 | 源项目附录缺少链接引用 | 低 | 文档迭代时补充 |

---

## 附录：源项目分析摘要

| 项目 | 核心价值 | 整合方式 |
|------|----------|----------|
| claude-code-best-practice | 一站式最佳实践 | 提取核心概念、技巧到基础层和development扩展 |
| anthropics/skills | 官方技能参考 | 官方内置技能概念入基础层，文档技能入development扩展 |
| easy-vibe | 零基础入门 | 中文教程精华入beginner-cn扩展 |
| claude-code-workflows | 企业级工作流 | 端到端工作流入workflows扩展 |
| everything-claude-code | 资源汇总 | 不纳入整合 |

---

*本设计文档基于 claude-code-projects-analysis.md 分析结果制定*