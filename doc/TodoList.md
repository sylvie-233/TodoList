# TodoList


## 核心模块

TodoList：
1. 待办清单模块
    - 全部待办、今日待办、计划、已完成、回收站视图
    - 列表分页、虚拟滚动、分组展示（分类 / 优先级 / 日期）
    - 拖拽排序、批量多选操作
    - 筛选器：优先级、截止日期、标签、状态
2. 待办条目操作模块
    - 创建待办：标题、描述、截止时间、提醒、优先级、标签、归属清单
    - 编辑待办：修改所有属性
    - 状态切换：未完成 ↔ 已完成
    - 复制待办、移动清单、归档、软删除（移入回收站）
    - 批量操作：批量完成、批量删除、批量修改标签 / 优先级
3. 子任务模块（任务拆解）
    - 添加多条子任务
    - 子任务完成状态独立管理
    - 子任务排序、新增、编辑、删除
4. 提醒与日历视图模块
    - 单次提醒、重复提醒（每日 / 每周 / 每月自定义周期）
    - 日历视图：按日期展示任务
    - 弹窗通知、系统推送、消息红点
5. 标签管理模块
    - 标签新增、编辑、删除、颜色自定义
    - 待办绑定 / 解绑标签
    - 按标签筛选任务
6. 清单（分组）模块
    - 自定义清单（工作、生活、学习）
    - 清单排序、重命名、删除、清单共享
    - 清单下统计数据
7. 搜索模块
    - 全文搜索（标题、描述）
    - 高级组合搜索（日期、标签、优先级、状态）
    - 搜索历史
8. 统计看板模块
    - 完成率、每日任务数量、逾期任务统计
    - 近 7/30 天趋势图表
    - 逾期任务汇总
9. 回收站模块
    - 软删除任务列表
    - 恢复待办、永久删除
10. 用户模块
    - 用户登录、注册







## server
```yaml
server:
    src/:
        common: # 公共目录
            decorators: # 装饰器
                currrent-usser.decorator.ts: # 当前用户
                public.decorator.ts: 
            filters: # 异常过滤器
                http-exception.filter.ts: # HTTP异常过滤器
            interceptors: # 拦截器
                logging.interceptor.ts: # 日志拦截器
                transform.interceptor.ts: # 响应转换拦截器
        config: # 配置目录
            app.config.ts: # 主应用配置
            database.config.ts: # 数据库配置
            logger.config.ts: # 日志配置
        database: # 数据库目录
            schema: # 数据库映射文件
                enums.ts: # 枚举
                index.ts:
                lists.ts: # 清单
                reminders.ts: # 提醒
                search-history.ts: # 搜索历史
                sub-tasks.ts: # 子任务
                tags.ts: # 标签
                task-images.ts: # 任务图片
                task-tags.ts: # 任务标签中间表
                tasks.ts: # 任务
                users.ts: # 用户
            database.module.ts: # 数据库模块文件
        modules:
            auth: # 认证模块
            health: # 健康检测模块
            list: # 清单模块
            reminder:
            search: # 搜索模块
            statistics: # 统计模块
            sub-task:
            tag:
            task:
            upload:
            user:
        app.module.ts: # 主模块配置文件
        main.ts: # 入口文件
    .env:
    drizzle.config.ts: # drizzle数据库迁移撇脂
    nest-cli.json: # nestjs构建配置
    package.json:
    tsconfig.json:
```