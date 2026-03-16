# Phase 2: 插件包 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建可安装的扩展层插件包，包括 development、workflows、beginner-cn 三个扩展。

**Architecture:** 扩展层位于 .claude/skills/extensions/ 目录，每个扩展包含 SKILL.md 和可选的辅助文件。plugins/ 目录存放 plugin.json 元数据供 Claude Code 插件市场使用。

**Tech Stack:** Markdown, Claude Code Skills, plugin.json

**Spec:** `docs/superpowers/specs/2026-03-16-jm-cc-guide-design.md`

---

## 文件结构规划

```
jm-cc-guide/
├── .claude/
│   └── skills/
│       └── extensions/
│           ├── development/
│           │   └── SKILL.md
│           ├── workflows/
│           │   └── SKILL.md
│           └── beginner-cn/
│               └── SKILL.md
└── plugins/
    ├── core/
    │   └── plugin.json
    ├── development/
    │   └── plugin.json
    ├── workflows/
    │   └── plugin.json
    └── beginner-cn/
        └── plugin.json
```

---

## Task 2.1: 创建 development 扩展

**Files:**
- Create: `.claude/skills/extensions/development/SKILL.md`
- Create: `plugins/development/plugin.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p .claude/skills/extensions/development
mkdir -p plugins/development
```

- [ ] **Step 2: 创建 development SKILL.md**

创建文件 `.claude/skills/extensions/development/SKILL.md`:

```markdown
---
name: cc-guide-development
description: 开发技能扩展 - 文档技能、开发技能模板、高级编排模式
user-invocable: true
argument-hint: <skill-name>
---

# Development Skills Extension

本扩展提供高级开发技能和文档处理能力。

## 包含技能

### 文档技能

来自 anthropics/skills 的生产级文档处理能力：

| 技能 | 用途 |
|------|------|
| `docx` | Word 文档处理 |
| `pdf` | PDF 文档处理 |
| `pptx` | PowerPoint 处理 |
| `xlsx` | Excel 电子表格处理 |

**使用场景**：
- 生成项目文档
- 解析需求文档
- 创建报告模板

### 开发技能模板

#### API 开发模板

```markdown
## API 设计规范

1. 使用 RESTful 风格
2. 版本控制：`/api/v1/resource`
3. 响应格式：
   ```json
   {
     "data": {},
     "error": null,
     "meta": {"page": 1, "total": 100}
   }
   ```
```

#### 测试技能模板

```markdown
## 测试规范

1. 单元测试覆盖核心逻辑
2. 集成测试覆盖 API 端点
3. E2E 测试覆盖关键用户流程
```

### 高级编排模式

#### Command → Agent → Skill 链式调用

```
用户请求 → Command (解析)
              ↓
         Agent (处理复杂逻辑)
              ↓
         Skill (提供领域知识)
              ↓
         输出结果
```

#### 并行子代理模式

```markdown
---
name: parallel-analysis
context: fork
agent: general-purpose
---

并行分析多个独立模块，最后汇总结果。
```

## 使用方式

```
/cc-guide-development <skill-name>
```

或在提示中引用：
```
使用 development 扩展中的 API 设计规范
```

## 参考资源

- [anthropics/skills](https://github.com/anthropics/skills) - 官方文档技能
- [../skills.md](../../../docs/skills.md) - 技能详解
```

- [ ] **Step 3: 创建 development plugin.json**

创建文件 `plugins/development/plugin.json`:

```json
{
  "name": "jm-cc-guide-development",
  "version": "1.0.0",
  "description": "Claude Code 协作指南 - 开发技能扩展",
  "author": "jm-cc-guide",
  "skills": [".claude/skills/extensions/development"]
}
```

- [ ] **Step 4: 验证文件创建**

Run: `ls -la .claude/skills/extensions/development/ plugins/development/`
Expected: SKILL.md and plugin.json exist

- [ ] **Step 5: 提交**

```bash
git add .claude/skills/extensions/development/SKILL.md plugins/development/plugin.json
git commit -m "feat: add development extension skill and plugin config"
```

---

## Task 2.2: 创建 workflows 扩展

**Files:**
- Create: `.claude/skills/extensions/workflows/SKILL.md`
- Create: `plugins/workflows/plugin.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p .claude/skills/extensions/workflows
mkdir -p plugins/workflows
```

- [ ] **Step 2: 创建 workflows SKILL.md**

创建文件 `.claude/skills/extensions/workflows/SKILL.md`:

```markdown
---
name: cc-guide-workflows
description: 企业级工作流扩展 - 端到端工作流代理（需求分析→实现→质量检查）
user-invocable: true
argument-hint: <workflow-type>
---

# Workflows Extension

本扩展提供端到端开发工作流，来自 claude-code-workflows 项目。

## 工作流类型

### 功能开发工作流

```
需求分析 → 技术设计 → 实现 → 测试 → 部署
```

**触发条件**：新功能开发、大型重构

**步骤**：
1. `requirement-analyzer` - 分析需求规模
2. `prd-creator` / `technical-designer` - 创建文档
3. `document-reviewer` - 审查文档
4. `task-decomposer` - 分解任务
5. `task-executor` - 执行任务
6. `quality-fixer` - 质量检查

### 诊断工作流

```
问题报告 → 调查 → 证据收集 → 解决方案 → 验证
```

**触发条件**：Bug 修复、性能问题

**步骤**：
1. `investigator` - 收集证据
2. `verifier` / `solver` - 验证和解决
3. `reporter` - 生成报告

### 任务执行工作流

```
任务描述 → 分解 → 执行 → 验证
```

**触发条件**：小任务、Bug 修复

**特点**：轻量级，快速执行

## 工作流编排模式

### 规模判断

| 规模 | 判定条件 | 处理方式 |
|------|----------|----------|
| Small | 1-2 文件 | 直接实现 |
| Medium | 3-5 文件 | technical-designer |
| Large | 6+ 文件 | prd-creator |

### 质量门控

每个阶段有明确的成功条件：
- 设计阶段：文档通过审查
- 实现阶段：测试通过
- 部署阶段：CI 通过

## 使用方式

```
/cc-guide-workflows feature    # 功能开发工作流
/cc-guide-workflows diagnose   # 诊断工作流
/cc-guide-workflows task       # 任务执行工作流
```

## 安装提示

完整工作流需要安装 claude-code-workflows 插件：

```bash
/plugin marketplace add shinpr/claude-code-workflows
/plugin install dev-workflows@claude-code-workflows
```

## 参考资源

- [claude-code-workflows](https://github.com/shinpr/claude-code-workflows) - 完整工作流插件
- [../../../docs/workflows.md](../../../docs/workflows.md) - 工作流详解
```

- [ ] **Step 3: 创建 workflows plugin.json**

创建文件 `plugins/workflows/plugin.json`:

```json
{
  "name": "jm-cc-guide-workflows",
  "version": "1.0.0",
  "description": "Claude Code 协作指南 - 企业级工作流扩展",
  "author": "jm-cc-guide",
  "skills": [".claude/skills/extensions/workflows"]
}
```

- [ ] **Step 4: 验证文件创建**

Run: `ls -la .claude/skills/extensions/workflows/ plugins/workflows/`
Expected: SKILL.md and plugin.json exist

- [ ] **Step 5: 提交**

```bash
git add .claude/skills/extensions/workflows/SKILL.md plugins/workflows/plugin.json
git commit -m "feat: add workflows extension skill and plugin config"
```

---

## Task 2.3: 创建 beginner-cn 扩展

**Files:**
- Create: `.claude/skills/extensions/beginner-cn/SKILL.md`
- Create: `plugins/beginner-cn/plugin.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p .claude/skills/extensions/beginner-cn
mkdir -p plugins/beginner-cn
```

- [ ] **Step 2: 创建 beginner-cn SKILL.md**

创建文件 `.claude/skills/extensions/beginner-cn/SKILL.md`:

```markdown
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
```

- [ ] **Step 3: 创建 beginner-cn plugin.json**

创建文件 `plugins/beginner-cn/plugin.json`:

```json
{
  "name": "jm-cc-guide-beginner-cn",
  "version": "1.0.0",
  "description": "Claude Code 协作指南 - 中文入门教程扩展",
  "author": "jm-cc-guide",
  "skills": [".claude/skills/extensions/beginner-cn"]
}
```

- [ ] **Step 4: 验证文件创建**

Run: `ls -la .claude/skills/extensions/beginner-cn/ plugins/beginner-cn/`
Expected: SKILL.md and plugin.json exist

- [ ] **Step 5: 提交**

```bash
git add .claude/skills/extensions/beginner-cn/SKILL.md plugins/beginner-cn/plugin.json
git commit -m "feat: add beginner-cn extension skill and plugin config"
```

---

## Task 2.4: 创建 core 插件配置

**Files:**
- Create: `plugins/core/plugin.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p plugins/core
```

- [ ] **Step 2: 创建 core plugin.json**

创建文件 `plugins/core/plugin.json`:

```json
{
  "name": "jm-cc-guide-core",
  "version": "1.0.0",
  "description": "Claude Code 协作指南 - 基础层",
  "author": "jm-cc-guide",
  "skills": [".claude/skills/core"]
}
```

- [ ] **Step 3: 验证文件创建**

Run: `ls plugins/core/plugin.json`
Expected: file exists

- [ ] **Step 4: 提交**

```bash
git add plugins/core/plugin.json
git commit -m "feat: add core plugin config"
```

---

## 验收检查

### 完成标准（映射到规格成功标准）

| 检查项 | 对应规格成功标准 |
|--------|------------------|
| - [ ] `.claude/skills/extensions/` 包含 3 个扩展 | Phase 2-b |
| - [ ] `plugins/` 包含 4 个 plugin.json | Phase 2-a |
| - [ ] 所有 plugin.json 格式正确 | Phase 2-a |

### 验证命令

```bash
# 检查扩展目录
find .claude/skills/extensions -name "SKILL.md" | sort

# 预期输出：
# .claude/skills/extensions/beginner-cn/SKILL.md
# .claude/skills/extensions/development/SKILL.md
# .claude/skills/extensions/workflows/SKILL.md

# 检查插件配置
find plugins -name "plugin.json" | sort

# 预期输出：
# plugins/beginner-cn/plugin.json
# plugins/core/plugin.json
# plugins/development/plugin.json
# plugins/workflows/plugin.json
```

---

## 下一步

Phase 2 完成后，继续实施 **Phase 3: CLI工具**。

详见：`docs/superpowers/plans/2026-03-16-phase3-cli.md`（待创建）