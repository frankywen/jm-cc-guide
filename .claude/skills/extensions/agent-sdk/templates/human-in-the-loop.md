# 人机协作代理模板

支持人工确认和干预的 Agent。

## 概念说明

人机协作 (Human-in-the-loop) 模式允许：
- 在关键操作前请求人工确认
- 人工修改 Agent 的执行计划
- 中断或终止 Agent 执行

## 完整代码

```javascript
import { Agent } from '@anthropic-ai/agent-sdk';
import * as readline from 'readline';

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 封装用户输入
function askUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 危险操作确认工具
const confirmationTool = {
  name: 'request_confirmation',
  description: '请求用户确认敏感操作',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: '需要确认的操作描述'
      },
      details: {
        type: 'string',
        description: '操作详情'
      }
    },
    required: ['action']
  },
  execute: async ({ action, details = '' }) => {
    console.log(`\n⚠️  需要确认的操作: ${action}`);
    if (details) console.log(`   详情: ${details}`);

    const answer = await askUser('确认执行? (y/n): ');

    return {
      confirmed: answer.toLowerCase() === 'y',
      action,
      userResponse: answer
    };
  }
};

// 文件操作工具（带确认）
const fileTools = [
  confirmationTool,

  {
    name: 'write_file',
    description: '写入文件内容',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        content: { type: 'string', description: '文件内容' }
      },
      required: ['path', 'content']
    },
    execute: async ({ path, content }) => {
      // 先请求确认
      const confirmResult = await confirmationTool.execute({
        action: `写入文件: ${path}`,
        details: `内容长度: ${content.length} 字符`
      });

      if (!confirmResult.confirmed) {
        return { success: false, message: '用户取消操作' };
      }

      // 模拟文件写入
      console.log(`   ✓ 文件已写入: ${path}`);
      return { success: true, path, size: content.length };
    }
  },

  {
    name: 'delete_file',
    description: '删除文件',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' }
      },
      required: ['path']
    },
    execute: async ({ path }) => {
      const confirmResult = await confirmationTool.execute({
        action: `删除文件: ${path}`,
        details: '此操作不可恢复'
      });

      if (!confirmResult.confirmed) {
        return { success: false, message: '用户取消操作' };
      }

      console.log(`   ✓ 文件已删除: ${path}`);
      return { success: true, path };
    }
  },

  {
    name: 'run_command',
    description: '执行 shell 命令',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' }
      },
      required: ['command']
    },
    execute: async ({ command }) => {
      const confirmResult = await confirmationTool.execute({
        action: `执行命令: ${command}`,
        details: '命令将在系统 shell 中执行'
      });

      if (!confirmResult.confirmed) {
        return { success: false, message: '用户取消操作' };
      }

      console.log(`   ✓ 命令已执行: ${command}`);
      return { success: true, command, output: '命令执行成功' };
    }
  }
];

// 创建人机协作代理
const agent = new Agent({
  model: 'claude-sonnet-4-6',
  instructions: `
你是一个文件管理助手，可以帮助用户管理文件。

重要规则：
1. 在执行任何写入、删除或命令操作前，必须先请求用户确认
2. 清晰说明将要执行的操作和潜在影响
3. 如果用户拒绝，提供替代方案
4. 保持友好和耐心的态度

可执行的操作：
- 写入文件
- 删除文件
- 执行命令
  `.trim(),
  tools: fileTools,
  maxSteps: 20
});

// 执行任务
async function main() {
  console.log('=== 人机协作代理 ===\n');
  console.log('可用功能: 文件写入、文件删除、命令执行');
  console.log('所有敏感操作都需要您的确认\n');

  const task = process.argv[2] || '帮我创建一个 README.md 文件';

  try {
    const result = await agent.run(task);
    console.log('\n=== 执行结果 ===\n');
    console.log(result);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
```

## 确认策略

| 策略 | 说明 | 配置示例 |
|------|------|----------|
| **全部确认** | 所有工具调用都需要确认 | 所有工具都包装确认 |
| **选择性确认** | 仅敏感操作需要确认 | 白名单机制 |
| **批量确认** | 一次性确认多个操作 | 展示操作列表后确认 |
| **静默模式** | 默认执行，可开启确认 | 通过参数控制 |

## 高级模式

### 修改执行计划

```javascript
// 允许用户修改 Agent 的执行计划
const planModifierTool = {
  name: 'propose_plan',
  description: '提出执行计划供用户审批',
  input_schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: { type: 'string' },
        description: '执行步骤列表'
      }
    },
    required: ['steps']
  },
  execute: async ({ steps }) => {
    console.log('\n📋 执行计划:');
    steps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));

    const answer = await askUser('\n是否批准此计划? (y/n/m 修改): ');

    if (answer.toLowerCase() === 'm') {
      const newSteps = await askUser('请输入修改后的步骤（逗号分隔）: ');
      return {
        approved: true,
        steps: newSteps.split(',').map(s => s.trim())
      };
    }

    return {
      approved: answer.toLowerCase() === 'y',
      steps
    };
  }
};
```

### 中断机制

```javascript
// 支持用户中断执行
let shouldStop = false;

process.on('SIGINT', () => {
  console.log('\n\n用户请求停止...');
  shouldStop = true;
});

const interruptableTool = {
  name: 'check_interrupt',
  description: '检查是否应该停止执行',
  input_schema: { type: 'object', properties: {} },
  execute: async () => {
    return { shouldStop };
  }
};
```

## 适用场景

- 生产环境部署
- 数据迁移操作
- 系统配置变更
- 批量文件处理
- 自动化测试执行