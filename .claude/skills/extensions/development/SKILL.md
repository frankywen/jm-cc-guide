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

## MCP Server 集成示例

MCP (Model Context Protocol) 是 Anthropic 推出的标准协议，用于连接 Claude 与外部工具和数据源。

### 文件系统 MCP

```json
// .claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

**使用场景**：安全地访问特定目录下的文件，限制 Claude 的文件系统访问范围。

### 数据库 MCP

```json
// .claude/settings.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

**使用场景**：让 Claude 直接查询数据库，生成报表或分析数据模式。

### API 集成 MCP

```json
// .claude/settings.json
{
  "mcpServers": {
    "api-server": {
      "command": "node",
      "args": [".claude/mcp-servers/api-server.js"],
      "env": {
        "API_BASE_URL": "https://api.example.com",
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

**自定义 MCP Server 示例** (api-server.js)：
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'custom-api-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'fetch_user',
    description: '获取用户信息',
    inputSchema: {
      type: 'object',
      properties: { userId: { type: 'string' } },
      required: ['userId']
    }
  }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP 最佳实践

| 场景 | 推荐配置 |
|------|----------|
| 本地开发 | 使用 filesystem MCP 限制访问范围 |
| 数据分析 | 使用 postgres/sqlite MCP 只读模式 |
| API 调用 | 自定义 MCP Server 封装认证逻辑 |
| 生产环境 | 所有敏感配置使用环境变量 |

## Hooks 实战示例

Hooks 是事件触发的确定性脚本，用于自动化工作流和安全控制。

### PreToolUse Hook - 命令安全验证

**配置** (.claude/settings.json)：
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [".claude/hooks/validate-bash.sh"]
    }]
  }
}
```

**脚本** (.claude/hooks/validate-bash.sh)：
```bash
#!/bin/bash
# 读取 Claude 传入的工具输入
read -r INPUT

# 危险命令列表
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  ":(){ :|:& };:"
  "mkfs"
  "dd if=/dev/zero"
)

COMMAND=$(echo "$INPUT" | jq -r '.command // empty')

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if [[ "$COMMAND" == *"$pattern"* ]]; then
    echo "BLOCK: 危险命令被阻止: $pattern"
    exit 2
  fi
done

# 允许执行
echo "ALLOW"
exit 0
```

### PostToolUse Hook - 自动格式化

**配置**：
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [".claude/hooks/format-file.sh"]
    }]
  }
}
```

**脚本**：
```bash
#!/bin/bash
read -r INPUT

FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // empty')

# 根据文件类型自动格式化
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx)
    npx prettier --write "$FILE_PATH" 2>/dev/null
    ;;
  *.py)
    python -m black "$FILE_PATH" 2>/dev/null
    ;;
  *.go)
    gofmt -w "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
```

### PrePromptSubmit Hook - 敏感信息检测

**配置**：
```json
{
  "hooks": {
    "PrePromptSubmit": [{
      "hooks": [".claude/hooks/check-secrets.sh"]
    }]
  }
}
```

**脚本**：
```bash
#!/bin/bash
read -r INPUT

PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')

# 检测 API 密钥模式
if echo "$PROMPT" | grep -qE '(sk-[a-zA-Z0-9]{20,}|api[_-]?key[_-]?[a-zA-Z0-9]{10,})'; then
  echo "BLOCK: 检测到可能的 API 密钥，请勿在提示中包含敏感信息"
  exit 2
fi

echo "ALLOW"
exit 0
```

### Notification Hook - 任务完成通知

**配置**：
```json
{
  "hooks": {
    "Notification": [{
      "hooks": [".claude/hooks/notify.sh"]
    }]
  }
}
```

**脚本**：
```bash
#!/bin/bash
read -r INPUT

TITLE=$(echo "$INPUT" | jq -r '.title // "Claude Code"')
MESSAGE=$(echo "$INPUT" | jq -r '.message // ""')

# macOS 通知
osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\""

# Linux 通知 (需要 notify-send)
# notify-send "$TITLE" "$MESSAGE"

exit 0
```

### Hooks 配置速查表

| Hook 类型 | 触发时机 | 典型用途 |
|-----------|----------|----------|
| `PreToolUse` | 工具调用前 | 安全验证、权限检查 |
| `PostToolUse` | 工具调用后 | 自动格式化、日志记录 |
| `PrePromptSubmit` | 提示提交前 | 敏感信息检测、提示增强 |
| `Notification` | 通知事件时 | 桌面通知、外部集成 |
| `Stop` | 会话结束时 | 清理工作、状态保存 |

## 参考资源

- [anthropics/skills](https://github.com/anthropics/skills) - 官方文档技能
- [MCP Documentation](https://modelcontextprotocol.io/) - MCP 协议文档
- [Claude Code Hooks](https://docs.anthropic.com/claude-code/hooks) - Hooks 官方文档
- [../skills.md](../../../docs/skills.md) - 技能详解