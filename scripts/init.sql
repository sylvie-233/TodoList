-- ============================================================
-- TodoList 数据库初始化
-- PostgreSQL 15+
-- ============================================================

-- 编码设置
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 枚举类型
-- ============================================================

CREATE TYPE priority_enum AS ENUM (
    'none',     -- 无优先级
    'low',      -- 低优先级
    'medium',   -- 中优先级
    'high',     -- 高优先级
    'urgent'    -- 紧急
);

CREATE TYPE recur_type_enum AS ENUM (
    'none',     -- 不重复（单次提醒）
    'daily',    -- 每日重复
    'weekly',   -- 每周重复
    'monthly',  -- 每月重复
    'custom'    -- 自定义 cron 表达式
);

-- ============================================================
-- 通用函数
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 用户表
-- ============================================================

CREATE TABLE "user" (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  "user"               IS '用户表，存储注册用户基本信息';
COMMENT ON COLUMN "user".id            IS '用户唯一标识（UUID）';
COMMENT ON COLUMN "user".username      IS '用户名，全局唯一';
COMMENT ON COLUMN "user".email         IS '邮箱，用于登录和找回密码';
COMMENT ON COLUMN "user".password_hash IS '密码哈希值（bcrypt 加密）';
COMMENT ON COLUMN "user".avatar_url    IS '头像 URL';
COMMENT ON COLUMN "user".created_at    IS '注册时间';
COMMENT ON COLUMN "user".updated_at    IS '最后更新时间';

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. 清单表（分组）
-- ============================================================

CREATE TABLE list (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name            VARCHAR(50)     NOT NULL,
    color           VARCHAR(7)      DEFAULT '#6366f1',
    icon            VARCHAR(50)     DEFAULT 'list',
    sort_order      INT             NOT NULL DEFAULT 0,
    is_builtin      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, name)
);

COMMENT ON TABLE  list               IS '清单 / 分组表，任务的一级分类容器';
COMMENT ON COLUMN list.id            IS '清单唯一标识（UUID）';
COMMENT ON COLUMN list.user_id       IS '所属用户';
COMMENT ON COLUMN list.name          IS '清单名称（1-50 字符，同用户下唯一）';
COMMENT ON COLUMN list.color         IS '清单颜色标识（HEX 格式，如 #6366f1）';
COMMENT ON COLUMN list.icon          IS '清单图标标识（前端图标库 key）';
COMMENT ON COLUMN list.sort_order    IS '排序序号，支持拖拽调整清单顺序';
COMMENT ON COLUMN list.is_builtin    IS '是否为内置清单（如收集箱），内置清单不可删除';
COMMENT ON COLUMN list.created_at    IS '创建时间';
COMMENT ON COLUMN list.updated_at    IS '最后更新时间';

CREATE INDEX idx_list_user_id ON list(user_id);
CREATE INDEX idx_list_sort    ON list(user_id, sort_order);

CREATE TRIGGER trg_list_updated_at
    BEFORE UPDATE ON list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. 待办任务表
-- ============================================================

CREATE TABLE task (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    list_id         UUID            REFERENCES list(id) ON DELETE SET NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            DEFAULT '',
    priority        priority_enum   NOT NULL DEFAULT 'none',
    is_completed    BOOLEAN         NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    due_date        DATE,
    due_time        TIME,
    sort_order      INT             NOT NULL DEFAULT 0,
    is_pinned       BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_title_not_empty CHECK (char_length(title) > 0)
);

COMMENT ON TABLE  task                IS '待办任务表，核心业务表';
COMMENT ON COLUMN task.id             IS '任务唯一标识（UUID）';
COMMENT ON COLUMN task.user_id        IS '所属用户';
COMMENT ON COLUMN task.list_id        IS '所属清单（NULL 表示未分类，清单删除时自动置 NULL）';
COMMENT ON COLUMN task.title          IS '任务标题（1-200 字符，必填）';
COMMENT ON COLUMN task.description    IS '任务详细描述（纯文本）';
COMMENT ON COLUMN task.priority       IS '优先级：none=无, low=低, medium=中, high=高, urgent=紧急';
COMMENT ON COLUMN task.is_completed   IS '是否已完成（TRUE=已完成, FALSE=未完成）';
COMMENT ON COLUMN task.completed_at   IS '完成时间（勾选完成时自动记录）';
COMMENT ON COLUMN task.due_date       IS '截止日期';
COMMENT ON COLUMN task.due_time       IS '截止时间（仅当 due_date 不为空时有效）';
COMMENT ON COLUMN task.sort_order     IS '排序序号，值越小越靠前，支持拖拽排序';
COMMENT ON COLUMN task.is_pinned      IS '是否置顶（TRUE=置顶，置顶任务排在最前）';
COMMENT ON COLUMN task.deleted_at     IS '软删除时间戳（NULL=正常任务，非 NULL=在回收站中）';
COMMENT ON COLUMN task.created_at     IS '创建时间';
COMMENT ON COLUMN task.updated_at     IS '最后更新时间';

CREATE INDEX idx_task_user_list     ON task(user_id, list_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_task_user_due      ON task(user_id, due_date)     WHERE deleted_at IS NULL;
CREATE INDEX idx_task_user_priority ON task(user_id, priority)     WHERE deleted_at IS NULL;
CREATE INDEX idx_task_user_status   ON task(user_id, is_completed) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_sort          ON task(list_id, sort_order)   WHERE deleted_at IS NULL;
CREATE INDEX idx_task_deleted       ON task(user_id, deleted_at)   WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_task_title_trgm    ON task USING GIN (title gin_trgm_ops);
CREATE INDEX idx_task_desc_trgm     ON task USING GIN (description gin_trgm_ops);

CREATE TRIGGER trg_task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. 子任务表
-- ============================================================

CREATE TABLE sub_task (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID            NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    text            VARCHAR(500)    NOT NULL,
    is_completed    BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_subtask_text_not_empty CHECK (char_length(text) > 0)
);

COMMENT ON TABLE  sub_task               IS '子任务 / 步骤表，任务下可勾选的执行步骤';
COMMENT ON COLUMN sub_task.id            IS '子任务唯一标识（UUID）';
COMMENT ON COLUMN sub_task.task_id       IS '所属父任务（级联删除：父任务删除时子任务一并删除）';
COMMENT ON COLUMN sub_task.text          IS '子任务描述文本（1-500 字符）';
COMMENT ON COLUMN sub_task.is_completed  IS '是否已完成（TRUE=已完成, FALSE=未完成）';
COMMENT ON COLUMN sub_task.sort_order    IS '排序序号，控制子任务展示顺序';
COMMENT ON COLUMN sub_task.created_at    IS '创建时间';
COMMENT ON COLUMN sub_task.updated_at    IS '最后更新时间';

CREATE INDEX idx_subtask_task ON sub_task(task_id, sort_order);

CREATE TRIGGER trg_sub_task_updated_at
    BEFORE UPDATE ON sub_task
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. 标签表
-- ============================================================

CREATE TABLE tag (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name            VARCHAR(50)     NOT NULL,
    color           VARCHAR(7)      DEFAULT '#a855f7',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, name)
);

COMMENT ON TABLE  tag             IS '标签表，任务灵活分类维度（多对多）';
COMMENT ON COLUMN tag.id          IS '标签唯一标识（UUID）';
COMMENT ON COLUMN tag.user_id     IS '所属用户';
COMMENT ON COLUMN tag.name        IS '标签名称（同用户下唯一）';
COMMENT ON COLUMN tag.color       IS '标签颜色标识（HEX 格式，如 #a855f7）';
COMMENT ON COLUMN tag.created_at  IS '创建时间';
COMMENT ON COLUMN tag.updated_at  IS '最后更新时间';

CREATE INDEX idx_tag_user ON tag(user_id);

CREATE TRIGGER trg_tag_updated_at
    BEFORE UPDATE ON tag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. 任务-标签关联表（多对多）
-- ============================================================

CREATE TABLE task_tag (
    task_id         UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,

    PRIMARY KEY (task_id, tag_id)
);

COMMENT ON TABLE  task_tag          IS '任务与标签的多对多关联表（中间表）';
COMMENT ON COLUMN task_tag.task_id  IS '关联的任务';
COMMENT ON COLUMN task_tag.tag_id   IS '关联的标签';

CREATE INDEX idx_task_tag_task ON task_tag(task_id);
CREATE INDEX idx_task_tag_tag  ON task_tag(tag_id);

-- ============================================================
-- 7. 提醒表
-- ============================================================

CREATE TABLE reminder (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID            NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    remind_at       TIMESTAMPTZ     NOT NULL,
    is_recurring    BOOLEAN         NOT NULL DEFAULT FALSE,
    recur_type      recur_type_enum NOT NULL DEFAULT 'none',
    recur_rule      VARCHAR(100),
    is_triggered    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  reminder                IS '提醒表，存储任务的提醒配置与触发状态';
COMMENT ON COLUMN reminder.id             IS '提醒唯一标识（UUID）';
COMMENT ON COLUMN reminder.task_id        IS '关联的任务（级联删除）';
COMMENT ON COLUMN reminder.remind_at      IS '提醒触发时间（下次触发的时间点）';
COMMENT ON COLUMN reminder.is_recurring   IS '是否重复提醒（TRUE=重复, FALSE=单次）';
COMMENT ON COLUMN reminder.recur_type     IS '重复类型：none=不重复, daily=每天, weekly=每周, monthly=每月, custom=自定义';
COMMENT ON COLUMN reminder.recur_rule     IS '自定义 cron 表达式（仅 recur_type=custom 时有效，如 "0 9 * * 1,3,5"）';
COMMENT ON COLUMN reminder.is_triggered   IS '是否已触发（单次提醒触发后标记为 TRUE，避免重复推送）';
COMMENT ON COLUMN reminder.created_at     IS '创建时间';
COMMENT ON COLUMN reminder.updated_at     IS '最后更新时间（重复提醒触发后会更新 remind_at）';

CREATE INDEX idx_reminder_task    ON reminder(task_id);
CREATE INDEX idx_reminder_trigger ON reminder(remind_at) WHERE is_triggered = FALSE;

COMMENT ON INDEX idx_reminder_trigger IS '部分索引：仅扫描未触发的提醒，供定时任务高效查询';

CREATE TRIGGER trg_reminder_updated_at
    BEFORE UPDATE ON reminder
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. 搜索历史表
-- ============================================================

CREATE TABLE search_history (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    keyword         VARCHAR(200)    NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  search_history             IS '搜索历史表，记录用户的搜索关键词';
COMMENT ON COLUMN search_history.id          IS '记录唯一标识（UUID）';
COMMENT ON COLUMN search_history.user_id     IS '所属用户';
COMMENT ON COLUMN search_history.keyword     IS '搜索关键词';
COMMENT ON COLUMN search_history.created_at  IS '搜索时间';

CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);
