# ============================================================
# TodoList — 项目构建与运行脚本
# 用法: .\build.ps1 [command] [options]
# 命令:
#   clean       - 清理构建目录
#   build       - 编译前后端（turbo build）
#   up          - 启动全部服务（PostgreSQL + 前后端）
#   down        - 停止全部服务
#   dev         - 启动 PostgreSQL + 本地开发模式
#   db          - 数据库操作（init / migrate / studio）
#   lint        - 代码检查（lint + typecheck）
#   logs        - 查看服务日志
#   install     - 安装依赖
# ============================================================

param(
    [Parameter(Position = 0)]
    [ValidateSet('clean', 'build', 'up', 'down', 'dev', 'db', 'lint', 'logs', 'install')]
    [string]$Command = '',

    [Parameter()]
    [switch]$Help,

    [Parameter()]
    [switch]$SkipTests,

    [Parameter()]
    [int]$TailLines = 100,

    [Parameter()]
    [string]$Service = '',

    [Parameter()]
    [string]$DbAction = ''
)

# 项目路径
$ProjectRoot = $PSScriptRoot
$WebDir      = Join-Path $ProjectRoot "web"
$ScriptsDir  = Join-Path $ProjectRoot "scripts"
$ServerDir   = Join-Path $WebDir "server"

function Write-Step { param([string]$M) Write-Host "`n>>> $M" -ForegroundColor Cyan }
function Write-Success  { param([string]$M) Write-Host "  OK  $M" -ForegroundColor Green }
function Write-Warn     { param([string]$M) Write-Host "  !   $M" -ForegroundColor Yellow }
function Write-ErrorExit { param([string]$M) Write-Host "  ERR $M" -ForegroundColor Red; exit 1 }

function Show-Help {
    Write-Host @"

TodoList 构建脚本

用法: ./build.ps1 <command> [options]

Commands:
  clean       清理构建产物
  build       编译前后端（turbo build）
  up          启动全部服务（PostgreSQL + 前后端）
  down        停止全部服务
  dev         启动 PostgreSQL + 本地开发提示
  db          数据库操作（init / migrate / studio）
  lint        代码检查（lint + typecheck）
  logs        查看服务日志（-Service client|server|db）
  install     安装全部依赖（pnpm install）

Options:
  -Help          显示本帮助
  -TailLines     日志显示行数（默认 100，仅 logs 命令）
  -Service       指定日志来源（仅 logs 命令）: client / server / db
  -DbAction      数据库操作类型（仅 db 命令）: init / migrate / studio

示例:
  ./build.ps1 dev                  # 开发模式
  ./build.ps1 build                # 编译前后端
  ./build.ps1 up                   # 启动全部服务
  ./build.ps1 db -DbAction init    # 初始化数据库
  ./build.ps1 db -DbAction studio  # 启动 Drizzle Studio
  ./build.ps1 logs -Service server # 查看后端日志
  ./build.ps1 logs -Service client # 查看前端日志
"@
    exit 0
}

if ($Help -or $Command -eq '') { Show-Help }

# ==================== 清理 ====================
function Invoke-Clean {
    Write-Step "清理构建产物"

    # 前端
    $clientDist = Join-Path $WebDir "client\dist"
    if (Test-Path $clientDist) {
        Remove-Item -Recurse $clientDist -Force
        Write-Success "已清理 client/dist"
    }

    # 后端
    $serverDist = Join-Path $ServerDir "dist"
    if (Test-Path $serverDist) {
        Remove-Item -Recurse $serverDist -Force
        Write-Success "已清理 server/dist"
    }

    # node_modules（可选）
    $nodeModules = Join-Path $WebDir "node_modules"
    if (Test-Path $nodeModules) {
        Write-Warn "node_modules 未清理（如需清理请手动执行: rm -r web/node_modules）"
    }

    # Turbo 缓存
    $turboCache = Join-Path $WebDir ".turbo"
    if (Test-Path $turboCache) {
        Remove-Item -Recurse $turboCache -Force
        Write-Success "已清理 .turbo 缓存"
    }

    Write-Success "清理完成"
}

# ==================== 安装依赖 ====================
function Invoke-Install {
    Write-Step "安装依赖"
    Push-Location $WebDir
    try {
        pnpm install
        if ($LASTEXITCODE -ne 0) { throw "pnpm install 失败" }
    } finally {
        Pop-Location
    }
    Write-Success "依赖安装完成"
}

# ==================== 代码检查 ====================
function Invoke-Lint {
    Write-Step "代码检查"
    Push-Location $WebDir
    try {
        pnpm turbo lint
        if ($LASTEXITCODE -ne 0) { throw "lint 检查失败" }

        pnpm turbo typecheck
        if ($LASTEXITCODE -ne 0) { throw "类型检查失败" }

        Write-Success "检查全部通过"
    } finally {
        Pop-Location
    }
}

# ==================== 编译 ====================
function Invoke-Build {
    Write-Step "编译前后端"
    Push-Location $WebDir
    try {
        pnpm turbo build
        if ($LASTEXITCODE -ne 0) { throw "构建失败" }
    } finally {
        Pop-Location
    }
    Write-Success "编译完成"
}

# ==================== 启动服务 ====================
function Invoke-Up {
    Write-Step "启动全部服务（PostgreSQL + 前后端）"
    Push-Location $ScriptsDir
    try {
        docker compose up -d --build
        if ($LASTEXITCODE -ne 0) { throw "服务启动失败" }
    } finally {
        Pop-Location
    }

    Write-Success "服务已启动"
    Write-Host "`n  前端:    http://localhost:5173"
    Write-Host "  后端:    http://localhost:3000"
    Write-Host "  数据库:  localhost:5432`n"
}

# ==================== 停止服务 ====================
function Invoke-Down {
    Write-Step "停止全部服务"
    Push-Location $ScriptsDir
    try {
        docker compose down
        if ($LASTEXITCODE -ne 0) { throw "停止失败" }
    } finally {
        Pop-Location
    }
    Write-Success "全部服务已停止"
}

# ==================== 开发模式 ====================
function Invoke-Dev {
    # 先启动 PostgreSQL
    Write-Step "启动 PostgreSQL"
    Push-Location $ScriptsDir
    try {
        docker compose up -d postgres
        if ($LASTEXITCODE -ne 0) { throw "PostgreSQL 启动失败" }
    } finally {
        Pop-Location
    }
    Write-Success "PostgreSQL 已启动（localhost:5432）"

    # 初始化数据库
    Write-Step "初始化数据库"
    Push-Location $WebDir
    try {
        pnpm --filter server db:migrate
        if ($LASTEXITCODE -ne 0) { Write-Warn "数据库迁移失败，可能已是最新" }
    } finally {
        Pop-Location
    }

    Write-Host "`n  然后在两个终端分别启动："
    Write-Host "  终端1 — 后端:  cd web && pnpm dev:server"
    Write-Host "  终端2 — 前端:  cd web && pnpm dev:client`n"
    Write-Host "  前端:  http://localhost:5173"
    Write-Host "  后端:  http://localhost:3000"
    Write-Host "  数据库: localhost:5432`n"
}

# ==================== 数据库操作 ====================
function Invoke-Db {
    if ($DbAction -eq '') {
        Write-ErrorExit "请指定数据库操作: -DbAction init|migrate|studio"
    }

    switch ($DbAction) {
        'init' {
            Write-Step "初始化数据库（执行 init.sql）"
            $hostEnv = $env:DB_HOST ? $env:DB_HOST : "localhost"
            $dbName  = $env:DB_NAME ? $env:DB_NAME : "todolist"
            $dbUser  = $env:DB_USER ? $env:DB_USER : "postgres"
            $initSql = Join-Path $ScriptsDir "init.sql"

            # 优先用 docker exec，失败则用 psql
            $containerCheck = docker ps --format '{{.Names}}' | Select-String "postgres" | Select-Object -First 1
            if ($containerCheck) {
                Get-Content $initSql | docker exec -i $containerCheck psql -U $dbUser -d $dbName -f -
                if ($LASTEXITCODE -ne 0) { Write-ErrorExit "数据库初始化失败" }
            } else {
                Write-Warn "未找到 PostgreSQL 容器，尝试用本地 psql ..."
                psql -h $hostEnv -U $dbUser -d $dbName -f $initSql
                if ($LASTEXITCODE -ne 0) { Write-ErrorExit "数据库初始化失败" }
            }
            Write-Success "数据库初始化完成"
        }
        'migrate' {
            Write-Step "执行 Drizzle 迁移"
            Push-Location $WebDir
            try {
                pnpm --filter server db:migrate
                if ($LASTEXITCODE -ne 0) { throw "迁移失败" }
            } finally {
                Pop-Location
            }
            Write-Success "迁移完成"
        }
        'studio' {
            Write-Step "启动 Drizzle Studio"
            Push-Location $WebDir
            try {
                pnpm --filter server db:studio
            } finally {
                Pop-Location
            }
        }
        default {
            Write-ErrorExit "未知 DbAction: $DbAction（可用: init / migrate / studio）"
        }
    }
}

# ==================== 日志 ====================
function Invoke-Logs {
    Push-Location $ScriptsDir
    try {
        if ($Service -eq '') {
            # 默认查看全部日志
            docker compose logs -f --tail $TailLines
        } elseif ($Service -in @('server', 'client', 'db', 'postgres')) {
            $svc = if ($Service -eq 'db') { 'postgres' } else { $Service }
            docker compose logs -f --tail $TailLines $svc
        } else {
            Write-ErrorExit "未知服务: $Service（可用: client / server / db）"
        }
    } finally {
        Pop-Location
    }
}

# ==================== 主流程 ====================
switch ($Command) {
    'clean'   { Invoke-Clean }
    'build'   { Invoke-Build }
    'up'      { Invoke-Up }
    'down'    { Invoke-Down }
    'dev'     { Invoke-Dev }
    'db'      { Invoke-Db }
    'lint'    { Invoke-Lint }
    'logs'    { Invoke-Logs }
    'install' { Invoke-Install }
    default   { Write-ErrorExit "未知命令: $Command" }
}
