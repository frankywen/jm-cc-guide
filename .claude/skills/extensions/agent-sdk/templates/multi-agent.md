# 多代理协作模板

多个 Agent 协作完成复杂任务。

## 架构图

```
                ┌─────────────────┐
                │   主控代理       │
                │  (Coordinator)  │
                └────────┬────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ 研究代理  │   │ 编写代理  │   │ 审核代理  │
   │(Research)│   │ (Writer) │   │(Reviewer)│
   └──────────┘   └──────────┘   └──────────┘
```

## 完整代码

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';

// 研究代理 - 收集信息
const researchAgent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个研究专员。
任务：针对给定主题，收集关键信息和要点。
输出格式：使用 Markdown 列表，简洁明了。
  `.trim(),
  tools: [],
  maxSteps: 5
});

// 编写代理 - 生成内容
const writerAgent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个内容创作者。
任务：基于研究结果，撰写结构清晰的文章。
输出格式：标题 + 正文，使用 Markdown。
  `.trim(),
  tools: [],
  maxSteps: 5
});

// 审核代理 - 检查质量
const reviewerAgent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个质量审核员。
任务：检查内容的准确性、完整性和可读性。
输出格式：评分(1-10) + 改进建议。
  `.trim(),
  tools: [],
  maxSteps: 3
});

// 主控代理 - 协调执行
const coordinatorAgent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是项目协调员，负责协调三个专家代理：
1. Researcher - 收集信息
2. Writer - 撰写内容
3. Reviewer - 审核质量

协调流程：
1. 让 Researcher 收集信息
2. 让 Writer 基于研究结果撰写内容
3. 让 Reviewer 审核质量
4. 如果评分低于 7，返回步骤 2 改进
5. 输出最终结果
  `.trim(),
  tools: [
    {
      name: 'delegate_research',
      description: '委托研究代理收集信息',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '研究主题' }
        },
        required: ['topic']
      },
      execute: async ({ topic }) => {
        return await researchAgent.run(`请研究以下主题：${topic}`);
      }
    },
    {
      name: 'delegate_write',
      description: '委托编写代理撰写内容',
      input_schema: {
        type: 'object',
        properties: {
          research: { type: 'string', description: '研究结果' },
          topic: { type: 'string', description: '文章主题' }
        },
        required: ['research', 'topic']
      },
      execute: async ({ research, topic }) => {
        return await writerAgent.run(`主题：${topic}\n\n研究资料：\n${research}`);
      }
    },
    {
      name: 'delegate_review',
      description: '委托审核代理检查内容',
      input_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '待审核内容' }
        },
        required: ['content']
      },
      execute: async ({ content }) => {
        return await reviewerAgent.run(`请审核以下内容：\n${content}`);
      }
    }
  ],
  maxSteps: 15
});

// 执行工作流
async function main() {
  const topic = process.argv[2] || '人工智能在教育领域的应用';

  console.log(`=== 多代理协作工作流 ===\n`);
  console.log(`主题: ${topic}\n`);

  const result = await coordinatorAgent.run(`请协调完成一篇关于"${topic}"的文章。`);

  console.log(`\n=== 最终结果 ===\n`);
  console.log(result);
}

main().catch(console.error);
```

## 协作模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **顺序执行** | 代理按顺序依次执行 | 有明确依赖关系的工作流 |
| **并行执行** | 多个代理同时工作 | 独立任务需要聚合结果 |
| **条件分支** | 根据条件选择不同代理 | 需要动态决策的场景 |
| **迭代优化** | 循环执行直到满足条件 | 需要持续改进的任务 |

## 最佳实践

1. **职责分离**：每个代理专注单一职责
2. **明确接口**：代理间通信格式标准化
3. **错误处理**：单个代理失败不影响整体
4. **资源控制**：限制最大步骤和递归深度
5. **日志记录**：记录每个代理的输入输出