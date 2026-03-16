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