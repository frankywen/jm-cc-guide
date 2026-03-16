# 工具调用代理模板

包含多个工具的完整 Agent 示例。

## 完整代码

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';

// 定义工具
const tools = [
  {
    name: 'get_weather',
    description: '获取指定城市的当前天气信息',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，如：北京、上海'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: '温度单位，默认 celsius'
        }
      },
      required: ['city']
    },
    execute: async ({ city, unit = 'celsius' }) => {
      // 模拟天气 API 调用
      const weatherData = {
        '北京': { temp: 22, condition: '晴', humidity: 45 },
        '上海': { temp: 26, condition: '多云', humidity: 70 },
        '广州': { temp: 30, condition: '雨', humidity: 85 }
      };

      const data = weatherData[city] || { temp: 20, condition: '未知', humidity: 50 };

      return {
        city,
        temperature: unit === 'fahrenheit'
          ? Math.round(data.temp * 9/5 + 32)
          : data.temp,
        unit,
        condition: data.condition,
        humidity: data.humidity
      };
    }
  },

  {
    name: 'calculate',
    description: '执行数学计算',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: '数学表达式，如：2+2、sqrt(16)'
        }
      },
      required: ['expression']
    },
    execute: async ({ expression }) => {
      try {
        // 安全计算（仅支持基本数学运算）
        const sanitized = expression.replace(/[^0-9+\-*/().sqrt]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        return { expression, result };
      } catch (error) {
        return { expression, error: '无效的数学表达式' };
      }
    }
  },

  {
    name: 'search_web',
    description: '搜索互联网获取信息',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词'
        },
        limit: {
          type: 'number',
          description: '返回结果数量，默认 5'
        }
      },
      required: ['query']
    },
    execute: async ({ query, limit = 5 }) => {
      // 模拟搜索结果
      return {
        query,
        results: [
          { title: `关于"${query}"的结果 1`, url: 'https://example.com/1' },
          { title: `关于"${query}"的结果 2`, url: 'https://example.com/2' }
        ].slice(0, limit)
      };
    }
  }
];

// 创建代理
const agent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个智能助手，拥有以下能力：
1. 查询天气信息
2. 执行数学计算
3. 搜索互联网

请根据用户需求选择合适的工具。
回答要简洁清晰。
  `.trim(),
  tools,
  maxSteps: 10
});

// 执行任务
async function main() {
  const task = process.argv[2] || '北京今天天气怎么样？';
  console.log(`任务: ${task}\n`);

  const result = await agent.run(task);
  console.log(result);
}

main().catch(console.error);
```

## 工具调用流程

```
用户请求
    ↓
Agent 分析意图
    ↓
选择合适的工具
    ↓
调用工具执行
    ↓
处理工具结果
    ↓
生成最终回答
```

## 扩展建议

1. **添加更多工具**：文件操作、数据库查询、API 调用
2. **错误重试**：工具失败时自动重试
3. **结果缓存**：缓存频繁调用的结果
4. **权限控制**：敏感操作需要确认