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