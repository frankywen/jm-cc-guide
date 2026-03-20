# 项目记忆

## 项目列表

### demo/puzzle-classroom
在线教育游戏平台，支持24点游戏和数独。详见 [puzzle-classroom.md](./puzzle-classroom.md)

**技术栈**: Go + React + TypeScript + WebSocket + SQLite

**最近更新**: 2026-03-20
- 添加24点游戏难度选择功能（easy/medium/hard）

## 常用命令

| 项目 | 后端启动 | 前端启动 | 测试 |
|------|----------|----------|------|
| puzzle-classroom | `cd backend && go run ./cmd/server` | `cd frontend && npm run dev` | `go test ./internal/games/... -v` |