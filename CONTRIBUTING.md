# 贡献指南

感谢你对 jm-cc-guide 项目的关注！本文档将帮助你了解如何为项目做出贡献。

## 行为准则

- 尊重所有贡献者
- 保持建设性的讨论
- 接受建设性的批评

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 在 [Issues](https://github.com/frankywen/jm-cc-guide/issues) 中搜索是否已有相关 issue
2. 如果没有，创建新 issue，包含：
   - 清晰的标题
   - 详细的描述
   - 复现步骤（如果是 bug）
   - 预期行为和实际行为

### 提交代码

1. **Fork 项目**

   ```bash
   git clone https://github.com/your-username/jm-cc-guide.git
   cd jm-cc-guide
   ```

2. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **安装依赖**

   ```bash
   cd cli/cc-guide
   npm install
   ```

4. **进行更改**

   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

5. **运行测试**

   ```bash
   npm test
   ```

6. **提交更改**

   ```bash
   git add .
   git commit -m "type: description"
   ```

   **提交信息格式**：
   - `feat:` 新功能
   - `fix:` 修复 bug
   - `docs:` 文档更新
   - `test:` 测试相关
   - `refactor:` 代码重构
   - `chore:` 其他更改

7. **推送并创建 PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   然后在 GitHub 上创建 Pull Request。

## 开发指南

### 项目结构

```
jm-cc-guide/
├── CLAUDE.md          # 知识库入口
├── .claude/skills/    # 技能包
├── docs/              # 模块化文档
├── cli/cc-guide/      # CLI 工具
└── demo/              # 测试示例
```

### CLI 开发

```bash
cd cli/cc-guide

# 安装依赖
npm install

# 本地链接
npm link

# 运行测试
npm test

# 测试 CLI
cc-guide --help
cc-guide doctor
```

### 添加新扩展包

1. 在 `.claude/skills/extensions/` 创建新目录
2. 添加 `SKILL.md` 文件
3. 在 `cli/cc-guide/src/lib/package-manager.js` 中注册
4. 在 `plugins/` 目录添加 `plugin.json`
5. 更新文档

### 代码风格

- 使用 ES Modules (`import`/`export`)
- 使用 `async`/`await` 处理异步
- 函数添加 JSDoc 注释
- 保持函数简洁，单一职责

### 测试规范

- 为新功能添加测试
- 测试文件放在 `tests/` 目录
- 测试文件命名：`*.test.js`
- 使用 Jest 测试框架

## 文档贡献

文档位于 `docs/` 目录，使用 Markdown 格式。

### 文档结构

| 文件 | 内容 |
|------|------|
| getting-started.md | 快速开始 |
| skills.md | 技能详解 |
| commands.md | 命令详解 |
| workflows.md | 工作流详解 |
| agents.md | 代理详解 |
| best-practices.md | 最佳实践 |
| architecture.md | 架构说明 |

## 发布流程（维护者）

1. 更新版本号
2. 更新 CHANGELOG
3. 创建 Git tag
4. 推送到 GitHub
5. 发布到 npm（如果适用）

## 获取帮助

- 提交 [Issue](https://github.com/frankywen/jm-cc-guide/issues)
- 查看 [文档](./docs/)

## 许可证

通过贡献代码，你同意你的代码将以 MIT 许可证发布。