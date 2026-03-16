---
name: cc-guide-agent-sdk
description: Agent SDK 扩展 - 构建自主代理应用
user-invocable: true
argument-hint: <template>
---

# Agent SDK 扩展

本扩展提供 Claude Agent SDK 开发指南和模板，帮助构建自主代理应用。

## 什么是 Agent SDK?

Claude Agent SDK 是 Anthropic 提供的官方 SDK，用于构建能够自主执行任务的 AI 代理。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Agent** | 自主执行任务的 AI 实体 |
| **Tool** | Agent 可调用的函数或 API |
| **Prompt** | 指导 Agent 行为的指令 |
| **Context** | Agent 执行时的上下文信息 |

### Agent vs 传统 AI 调用

| 维度 | 传统 API 调用 | Agent SDK |
|------|--------------|-----------|
| 执行模式 | 单次请求-响应 | 自主多轮执行 |
| 工具使用 | 需手动编排 | 自动选择和调用 |
| 错误处理 | 需自行实现 | 内置重试机制 |
| 状态管理 | 无状态 | 支持持久化状态 |

## 快速开始

### 安装

```bash
npm install @anthropic-ai/agent-sdk
```

### 基础 Agent

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';

const agent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: '你是一个有帮助的助手。',
  tools: [
    {
      name: 'get_weather',
      description: '获取指定城市的天气',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' }
        },
        required: ['city']
      },
      execute: async ({ city }) => {
        // 实现天气获取逻辑
        return { temperature: 25, condition: '晴天' };
      }
    }
  ]
});

// 执行任务
const result = await agent.run('北京今天天气怎么样？');
console.log(result);
```

## 可用模板

### 1. 基础代理 (basic-agent)

最简单的 Agent 配置，适合入门学习。

```
/cc-guide-agent-sdk basic-agent
```

### 2. 工具调用代理 (tool-calling-agent)

包含多个工具的完整示例。

```
/cc-guide-agent-sdk tool-calling-agent
```

### 3. 多代理协作 (multi-agent)

多个 Agent 协作完成复杂任务。

```
/cc-guide-agent-sdk multi-agent
```

### 4. 人机协作代理 (human-in-the-loop)

支持人工确认和干预的 Agent。

```
/cc-guide-agent-sdk human-in-the-loop
```

## 工具定义规范

### 工具结构

```javascript
const tool = {
  name: 'tool_name',           // 工具名称（snake_case）
  description: '工具描述',      // 清晰描述工具功能
  input_schema: {              // JSON Schema 格式的参数定义
    type: 'object',
    properties: {
      param1: { type: 'string', description: '参数1描述' },
      param2: { type: 'number', description: '参数2描述' }
    },
    required: ['param1']
  },
  execute: async (params) => { // 异步执行函数
    // 实现逻辑
    return { result: 'value' };
  }
};
```

### 最佳实践

1. **命名清晰**：使用动词+名词格式，如 `send_email`、`create_file`
2. **描述完整**：说明工具功能、适用场景、返回值格式
3. **参数验证**：在 execute 函数中验证必要参数
4. **错误处理**：返回明确的错误信息，便于 Agent 理解和重试
5. **幂等设计**：工具调用应该尽可能幂等

## 高级模式

### 流式执行

```javascript
const stream = await agent.stream('执行任务');

for await (const event of stream) {
  if (event.type === 'text') {
    process.stdout.write(event.text);
  } else if (event.type === 'tool_use') {
    console.log(`调用工具: ${event.tool_name}`);
  }
}
```

### 状态持久化

```javascript
// 保存状态
const state = await agent.getState();
await fs.writeFile('agent-state.json', JSON.stringify(state));

// 恢复状态
const savedState = JSON.parse(await fs.readFile('agent-state.json'));
await agent.setState(savedState);
```

### 钩子系统

```javascript
const agent = new Agent({
  // ...配置
  hooks: {
    beforeToolCall: async (tool, params) => {
      console.log(`即将调用: ${tool.name}`);
      return params; // 可以修改参数
    },
    afterToolCall: async (tool, result) => {
      console.log(`调用完成: ${tool.name}`);
      return result; // 可以修改结果
    }
  }
});
```

## 常见问题

### Q: Agent 如何决定使用哪个工具?

Agent 根据工具的 `description` 和当前上下文自动选择最合适的工具。确保工具描述清晰准确。

### Q: 如何限制 Agent 的执行时间?

使用 `maxSteps` 或 `timeout` 配置：

```javascript
const agent = new Agent({
  // ...
  maxSteps: 10,    // 最大执行步骤
  timeout: 60000   // 超时时间（毫秒）
});
```

### Q: 如何调试 Agent 行为?

启用详细日志：

```javascript
const agent = new Agent({
  // ...
  debug: true
});
```

## 参考资源

- [Agent SDK 文档](https://docs.anthropic.com/agent-sdk)
- [Tool Calling 指南](https://docs.anthropic.com/tool-use)
- [示例项目](https://github.com/anthropics/agent-sdk-examples)