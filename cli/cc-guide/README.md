# cc-guide CLI

Claude Code 协作指南命令行工具。

## 安装

```bash
npm install -g cc-guide
```

## 命令

### cc-guide init

初始化项目配置。

```bash
cc-guide init           # 智能检测并初始化
cc-guide init --force   # 强制覆盖现有文件
```

**行为**：
- 新项目：创建完整目录结构
- 已有项目（无 CLAUDE.md）：创建 CLAUDE.md，询问是否安装扩展
- 已有项目（有 CLAUDE.md）：预览合并内容，确认后增量添加

### cc-guide add <package>

添加扩展包。

```bash
cc-guide add development   # 添加开发扩展
cc-guide add workflows     # 添加工作流扩展
cc-guide add beginner-cn   # 添加中文入门扩展
```

### cc-guide list

列出可用包。

```bash
cc-guide list
```

### cc-guide doctor

诊断配置问题。

```bash
cc-guide doctor
```

### cc-guide update

更新到最新版本。

```bash
cc-guide update
```

## 开发

```bash
cd cli/cc-guide
npm install
npm link  # 本地链接测试
```

## 许可证

MIT