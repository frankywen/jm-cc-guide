# 基础代理模板

这是最简单的 Agent 配置，适合入门学习。

## 完整代码

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';

// 创建基础代理
const agent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个有帮助的 AI 助手。
请用简洁、清晰的语言回答用户问题。
如果不确定答案，请诚实说明。
  `.trim(),
  tools: []
});

// 执行任务
async function main() {
  const question = process.argv[2] || '你好，请自我介绍';
  const result = await agent.run(question);
  console.log(result);
}

main().catch(console.error);
```

## 运行方式

```bash
# 安装依赖
npm install @anthropic-ai/agent-sdk

# 设置 API Key
export ANTHROPIC_API_KEY=your-api-key

# 运行
node basic-agent.js "你的问题"
```

## 配置说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `model` | 使用的模型 | `claude-sonnet-4-6` |
| `instructions` | 代理行为指令 | 必填 |
| `tools` | 可用工具列表 | `[]` |

## 下一步

- 添加自定义工具
- 配置最大执行步骤
- 实现流式输出