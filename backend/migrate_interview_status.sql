-- 迁移脚本：修改 interview 表的 current_status 默认值，并更新现有数据
-- SQLite 不支持直接修改列的默认值，需要创建新表并迁移数据

-- 1. 创建新表（修改默认值）
CREATE TABLE IF NOT EXISTS interview_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    business_line_id INTEGER,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'recommend_interview',
    current_status VARCHAR(20) NOT NULL DEFAULT 'progressing',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (business_line_id) REFERENCES business_line(id)
);

-- 2. 复制数据到新表
INSERT INTO interview_new (
    id, candidate_id, business_line_id, 
    current_stage, current_status, 
    created_at, updated_at
)
SELECT 
    id, candidate_id, business_line_id,
    current_stage, 
    CASE 
        WHEN current_status = 'pending' THEN 'progressing'
        ELSE current_status 
    END as current_status,
    created_at, updated_at
FROM interview;

-- 3. 删除旧表
DROP TABLE interview;

-- 4. 重命名新表
ALTER TABLE interview_new RENAME TO interview;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_interview_candidate_id ON interview(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_business_line_id ON interview(business_line_id);
CREATE INDEX IF NOT EXISTS idx_interview_current_stage ON interview(current_stage);
CREATE INDEX IF NOT EXISTS idx_interview_current_status ON interview(current_status);
