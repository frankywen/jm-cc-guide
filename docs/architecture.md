# 架构与演进说明

本文档描述 Claude Code 协作指南项目的架构设计和演进路径。

## 架构方案

本项目采用 **方案A（轻量整合）** 架构：

| 方案 | 核心思路 | 特点 |
|------|----------|------|
| **方案A（轻量整合）** | 以文档和知识库为核心 | 快速产出，渐进实施 |
| 方案B（一体化插件） | 以插件包为核心 | 安装体验统一 |
| 方案C（CLI优先） | 以CLI工具为核心 | 最大灵活性 |

## 目录结构

```
jm-cc-guide/
├── CLAUDE.md                    # 基础层知识入口
├── .claude/
│   └── skills/
│       ├── core/                # 基础层技能
│       └── extensions/          # 扩展层技能
├── docs/                        # 模块化文档
├── plugins/                     # Phase 2: 插件包
└── cli/                         # Phase 3: CLI工具
```

## 分层设计

### 基础层（必装）

- CLAUDE.md（120-180行）
- `.claude/skills/core/`

**内容来源**：
- anthropics/skills 官方内置技能概念
- claude-code-best-practice 核心技巧

### 扩展层（选装）

| 扩展包 | 内容 |
|--------|------|
| development | 文档技能、开发技能模板 |
| workflows | 企业级工作流代理 |
| beginner-cn | 中文入门教程 |

## 演进路径

### Phase 1: 文档与知识库

**状态**: ✅ 完成

**产物**:
- CLAUDE.md
- docs/*.md
- .claude/skills/core/

**用户入口**: 文档阅读

### Phase 2: 插件包

**状态**: ✅ 完成

**产物**:
- .claude/skills/extensions/
- plugins/*/plugin.json

**用户入口**: `/plugin install`

### Phase 3: CLI工具

**状态**: 🔜 规划中

**产物**:
- cli/cc-guide/

**用户入口**: `cc-guide init`

## 关键设计决策

### 1. CLI 作为读取者

CLI 工具读取现有内容，不改变内容存放位置。

**理由**:
- 降低迁移成本
- 保持目录结构稳定
- 支持渐进式演进

### 2. 目录结构保持稳定

从 Phase 1 到 Phase 3，内容位置不变。

**理由**:
- 用户学习一次即可
- 无需重新组织文件
- 减少破坏性变更

### 3. 分级整合

基础层 + 扩展层分离。

**理由**:
- 匹配插件包拆分
- 适配不同用户需求
- 控制上下文窗口占用

## 向方案C演进

当 CLI 成熟后，可以演变为方案C架构：

| 变化 | Phase 1-2 | Phase 3+ |
|------|-----------|----------|
| 主要入口 | 文档/插件 | CLI命令 |
| 内容管理 | 手动 | CLI自动化 |
| 目录结构 | 不变 | 不变 |

**演进不需要重构目录结构**，CLI 只是增加了新的入口方式。

## 扩展阅读

- [getting-started.md](getting-started.md) - 快速开始
- [workflows.md](workflows.md) - 工作流详解