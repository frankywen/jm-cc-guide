# 工作流详解

本文档介绍如何使用 Claude Code 构建复杂工作流。

## 什么是工作流？

工作流是多个命令、技能和代理的编排，用于完成端到端的复杂任务。

## 工作流架构

```
用户请求 → 解析需求 → 调用组件 → 执行任务 → 输出结果
               ↓
         ┌─────┼─────┐
         ↓     ↓     ↓
      Command Agent  Skill
```

## Command → Agent → Skill 编排

推荐的工作流编排模式：

```
/weather-orchestrator (Command)
       ↓
    解析需求
       ↓
    调用 Agent (如需要)
       ↓
    使用 Skill (渐进式知识)
       ↓
    执行完成
```

## 企业级工作流示例

来自 claude-code-workflows 项目的端到端开发工作流：

```
用户请求 → requirement-analyzer
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   Large (6+ files) Medium    Small (1-2 files)
        ↓         (3-5 files)     ↓
   prd-creator        ↓      Direct Implementation
        ↓      technical-designer
        ↓            ↓
        └────→ document-reviewer
                     ↓
               design-sync
                     ↓
           acceptance-test-generator
                     ↓
               work-planner
                     ↓
              task-decomposer
                     ↓
              task-executor
                     ↓
              quality-fixer
                     ↓
           Ready to Commit
```

## 诊断工作流示例

```
问题 → investigator → 证据矩阵
                           ↓
                      复杂?
                     ↙        ↘
                   Yes         No
                    ↓          ↓
                verifier    solver
                    ↓          ↓
           验证后的结论
                           ↓
                     解决方案 + 步骤
                           ↓
                          报告
```

## 工作流最佳实践

### 1. 选择正确的组件

| 场景 | 推荐组件 |
|------|----------|
| 简单提示模板 | Command |
| 需要隔离执行 | Agent |
| 知识注入 | Skill |
| 复杂多步骤 | Command + Agent + Skill 组合 |

### 2. 上下文管理

- 主上下文保持精简
- 复杂任务使用子代理隔离
- 定期 `/compact` 压缩历史
- 切换任务时 `/clear`

### 3. 错误处理

- 每个步骤有明确的成功/失败条件
- 失败时提供可操作的恢复建议
- 记录关键决策点

### 4. 渐进式披露

- 先用简单方法尝试
- 失败后逐步增加复杂度
- 只在必要时启用高级功能

## 工作流模板

### 功能开发工作流

```markdown
# Feature Development Workflow

## Phase 1: 规划
1. 使用 plan mode 设计方案
2. 创建任务分解
3. 定义验收标准

## Phase 2: 实现
1. 使用 TDD 编写测试
2. 实现最小可行代码
3. 重构优化

## Phase 3: 验证
1. 运行测试套件
2. 代码审查
3. 集成测试

## Phase 4: 交付
1. 更新文档
2. 创建 PR
3. 合并部署
```

## 参考资源

- [claude-code-workflows](https://github.com/shinpr/claude-code-workflows) - 企业级工作流模板
- [agents.md](agents.md) - 代理详解
- [skills.md](skills.md) - 技能详解