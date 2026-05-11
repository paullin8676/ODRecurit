-- 迁移脚本：删除 interview_round 表的 interviewer 字段
-- SQLite 不支持直接删除列，需要创建新表并迁移数据

-- 1. 创建新表（不带 interviewer 字段）
CREATE TABLE IF NOT EXISTS interview_round_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL,
    stage_code VARCHAR(50) NOT NULL,
    stage_index INTEGER NOT NULL,
    scheduled_date DATETIME,
    content TEXT,
    current_status VARCHAR(50),
    feedback_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interview(id),
    UNIQUE(interview_id, stage_code)
);

-- 2. 复制数据到新表
INSERT INTO interview_round_new (
    id, interview_id, stage_code, stage_index, 
    scheduled_date, content, current_status, 
    feedback_date, completed_at, created_at, updated_at
)
SELECT 
    id, interview_id, stage_code, stage_index,
    scheduled_date, content, current_status,
    feedback_date, completed_at, created_at, updated_at
FROM interview_round;

-- 3. 删除旧表
DROP TABLE interview_round;

-- 4. 重命名新表
ALTER TABLE interview_round_new RENAME TO interview_round;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_interview_round_interview_id ON interview_round(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_round_stage_code ON interview_round(stage_code);
