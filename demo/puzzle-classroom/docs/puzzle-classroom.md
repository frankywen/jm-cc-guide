# Puzzle Classroom 项目记忆

## 项目概述

puzzle-classroom 是一个在线教育游戏平台，支持老师创建房间，学生加入进行数学游戏（24点游戏和数独）。

## 技术栈

- **后端**: Go + Gin + GORM + SQLite + gorilla/websocket
- **前端**: React + TypeScript + Vite + Zustand + TailwindCSS
- **实时通信**: WebSocket

## 项目结构

```
demo/puzzle-classroom/
├── backend/
│   ├── cmd/server/main.go          # 入口文件
│   ├── internal/
│   │   ├── handlers/               # HTTP handlers
│   │   │   ├── room.go             # 房间和游戏相关API
│   │   │   └── auth.go             # 认证相关API
│   │   ├── services/               # 业务逻辑
│   │   │   ├── game.go             # 游戏相关服务
│   │   │   ├── game_session.go     # 游戏会话管理
│   │   │   └── room.go             # 房间服务
│   │   ├── games/                  # 游戏核心逻辑
│   │   │   ├── game24.go           # 24点游戏逻辑
│   │   │   └── sudoku.go           # 数独游戏逻辑
│   │   ├── ws/                     # WebSocket相关
│   │   │   ├── hub.go              # WebSocket hub
│   │   │   └── client.go           # WebSocket client
│   │   └── models/                 # 数据模型
│   └── data/puzzle.db              # SQLite数据库
└── frontend/
    └── src/
        ├── pages/
        │   ├── TeacherRoom.tsx     # 老师房间页面
        │   ├── StudentRoom.tsx     # 学生房间页面
        │   ├── TeacherDashboard.tsx
        │   └── AdminDashboard.tsx
        ├── services/
        │   ├── api.ts              # API服务
        │   └── websocket.ts        # WebSocket服务
        └── stores/
            └── authStore.ts        # 认证状态管理
```

## 主要功能

### 用户角色
- **teacher**: 老师，可创建房间、开始游戏、查看学生进度
- **student**: 学生，可加入房间、答题
- **admin**: 管理员，可管理所有房间

### 游戏类型
1. **24点游戏 (game24)**:
   - 支持3个难度级别：
     - Easy: 数字1-9，保证有解
     - Medium: 数字1-13，保证有解
     - Hard: 数字1-20，可能无解
   - 支持多种答案格式：数学表达式、分步操作（分号或逗号分隔）

2. **数独 (sudoku)**:
   - 支持6个难度级别：easy, medium, hard, very-hard, insane, inhuman

### WebSocket 消息类型

**老师发送:**
- `join_room`: 加入房间
- `game:start`: 开始游戏
- `game:next`: 下一题
- `game:end`: 结束游戏

**学生发送:**
- `join_room`: 加入房间

**广播消息:**
- `room:created`: 新房间创建（广播给学生）
- `room:updated`: 房间状态更新（广播给学生）
- `room:deleted`: 房间删除（广播给学生）
- `student:left`: 学生离开（广播给房间）
- `progress:update`: 进度更新（广播给房间）
- `game:start`: 游戏开始（广播给学生）
- `game:next`: 下一题（广播给学生）
- `game:end`: 游戏结束（广播给学生）

## 最近完成的功能

### 2026-03-20: 24点游戏难度选择
- 添加了 `GenerateQuestionWithDifficulty()` 函数
- 实现了暴力求解算法验证题目是否有解
- 前端添加了难度选择下拉框
- 添加了单元测试

### 之前修复的问题
1. 数独房间创建后显示为24点游戏 - 通过删除数据库重建解决
2. 学生离开房间后老师列表仍显示 - WebSocket广播student:left
3. 24点游戏得分不增加 - 支持多种答案格式
4. 学生列表重新进入后为空 - WebSocket连接管理优化

## API 端点

### 认证
- `POST /api/register` - 注册
- `POST /api/login` - 登录
- `GET /api/me` - 获取当前用户

### 房间
- `GET /api/rooms` - 获取房间列表
- `POST /api/rooms` - 创建房间
- `GET /api/rooms/:id` - 获取房间详情
- `POST /api/rooms/:id/join` - 加入房间
- `PUT /api/rooms/:id/status` - 更新房间状态
- `DELETE /api/rooms/:id` - 删除房间

### 游戏
- `POST /api/startGame` - 开始游戏
- `POST /api/rooms/:id/answer` - 提交答案
- `POST /api/rooms/:id/skip` - 跳过题目
- `GET /api/gameProgress` - 获取游戏进度
- `POST /api/getNextQuestion` - 获取下一题

### 管理员
- `GET /api/admin/rooms` - 获取所有房间
- `DELETE /api/admin/rooms/:id` - 删除房间
- `PUT /api/admin/rooms/:id` - 更新房间
- `POST /api/admin/rooms/batch-delete` - 批量删除房间

## 运行命令

```bash
# 后端
cd backend
go build -o puzzle-backend.exe ./cmd/server
./puzzle-backend.exe

# 前端
cd frontend
npm run dev

# 测试
cd backend
go test ./internal/games/... -v
```

## 注意事项

1. 数据库文件 `backend/data/puzzle.db` 如果有问题可以删除重建
2. 后端默认端口 8080，前端默认端口 5173
3. WebSocket 连接需要携带 token
4. 前端使用 Zustand 持久化登录状态到 localStorage