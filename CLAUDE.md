# CLAUDE.md

## 项目概述

TodoList — 基于 TypeScript 全栈的移动端待办事项管理应用，采用 Monorepo 架构，所有应用代码位于 `web/` 目录下。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Vue 3 + Vite + Vant 4（移动端 UI） |
| 后端 | NestJS + Drizzle ORM |
| 数据库 | PostgreSQL 15+ |
| 包管理 | pnpm + Turborepo |
| 语言 | TypeScript（严格模式） |
| 部署 | Docker + Docker Compose |

## 项目结构

```
TodoList/
├── web/                            # 应用代码（Monorepo）
│   ├── client/                     #   前端 —— Vue 3 + Vite + Vant
│   │   ├── src/
│   │   │   ├── api/                #     API 请求封装（axios）
│   │   │   ├── components/         #     公共组件
│   │   │   ├── composables/        #     组合式函数
│   │   │   ├── router/             #     路由配置
│   │   │   ├── stores/             #     Pinia 状态管理
│   │   │   ├── styles/             #     全局样式 & 主题
│   │   │   ├── types/              #     前端类型定义
│   │   │   ├── utils/              #     工具函数
│   │   │   ├── views/              #     页面组件
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── server/                     #   后端 —— NestJS + Drizzle
│   │   ├── src/
│   │   │   ├── common/             #     公共模块（过滤器、拦截器、装饰器）
│   │   │   │   ├── filters/
│   │   │   │   ├── interceptors/
│   │   │   │   └── decorators/
│   │   │   ├── config/             #     配置模块（环境变量、数据库连接）
│   │   │   ├── database/           #     数据库层
│   │   │   │   ├── schema/         #       Drizzle schema 定义
│   │   │   │   └── migrations/     #       Drizzle 迁移文件
│   │   │   ├── modules/            #     业务模块
│   │   │   │   ├── auth/
│   │   │   │   ├── user/
│   │   │   │   ├── task/
│   │   │   │   ├── list/
│   │   │   │   ├── tag/
│   │   │   │   ├── sub-task/
│   │   │   │   ├── reminder/
│   │   │   │   └── statistics/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── shared/                     #   共享类型（前后端复用）
│   │   ├── types/
│   │   │   ├── task.ts
│   │   │   ├── list.ts
│   │   │   ├── tag.ts
│   │   │   └── user.ts
│   │   └── package.json
│   │
│   ├── turbo.json                  #   Turborepo 配置
│   ├── package.json                #   workspace 根配置
│   ├── pnpm-workspace.yaml
│   ├── tsconfig.base.json          #   公共 TS 配置
│   ├── .env.example
│   └── .gitignore
│
├── scripts/                        # 脚本 & 部署
│   ├── init.sql
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── docker-compose.yml
│
├── doc/                            # 文档
│   └── TodoList.md
├── build.ps1                       # 一键构建部署脚本
│
└── CLAUDE.md
```

## 开发命令

所有命令在 `web/` 目录下执行：

```bash
cd web

# 安装依赖
pnpm install

# 启动开发环境（Turbo 并行编排）
pnpm dev           # 并行启动前后端（turbo dev）
turbo dev:server   # 仅启动 NestJS（localhost:3000）
turbo dev:client   # 仅启动 Vite（localhost:5173）

# 数据库
turbo db:generate  # 生成 Drizzle 迁移文件
turbo db:migrate   # 执行迁移
turbo db:studio    # 打开 Drizzle Studio

# 构建
turbo build        # 并行构建 client + server

# 代码检查
turbo lint         # 全量 lint
turbo typecheck    # 全量类型检查

# Docker（在项目根目录执行）
docker compose -f scripts/docker-compose.yml up -d
```

## 编码规范

- 所有变量、函数、文件名使用有意义的英文命名，禁止拼音
- 文件名：Vue 组件用 PascalCase，模块/工具用 kebab-case
- 类型注解：禁止 `any`，使用 `unknown` + 类型守卫
- API 路由统一前缀 `/api/v1/`
- 数据库操作统一走 Drizzle，特殊情况可以手写 SQL
- 前后端共享类型定义放在 `web/shared/types/`，两边通过 workspace 引用
- Vue文件中script代码块在上

## 关键约定

1. **前端不要绕过 Pinia**：所有 API 调用在 store action 中完成，组件不直接调 axios
2. **后端模块即功能单元**：每个 `modules/` 下的目录自含 controller + service + module + dto
3. **DTO 即文档**：使用 `class-validator` 装饰器标注校验规则，同时作为 API 文档
4. **Drizzle schema 即数据源**：数据库表结构以 `web/server/src/database/schema/` 为准
5. **版本兼容**：Node.js ≥ 20，pnpm ≥ 9，PostgreSQL ≥ 15
