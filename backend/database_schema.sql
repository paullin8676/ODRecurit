-- ===========================================
-- 数据库 Schema
-- 版本: 1.8
-- 日期: 2026-05-11
-- ===========================================

-- ===========================================
-- 用户表 User
-- 系统用户（顾问、经理）
-- ===========================================
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'consultant' CHECK(role IN ('consultant', 'manager')),
    real_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    manager_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES user(id)
);

-- ===========================================
-- 业务线表 BusinessLine
-- ===========================================
CREATE TABLE IF NOT EXISTS business_line (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    can_edit TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 说明：已删除 clientOwner（客户负责人）字段

-- ===========================================
-- 候选人表 Candidate
-- ===========================================
CREATE TABLE IF NOT EXISTS candidate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    gender VARCHAR(10),
    id_card VARCHAR(20),
    last_operator_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (last_operator_id) REFERENCES user(id)
);

-- ===========================================
-- 候选人阶段表 CandidateStage
-- 统一管理候选人从录入到离职的全生命周期阶段
-- ===========================================
CREATE TABLE IF NOT EXISTS candidate_stage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    consultant_id INTEGER,
    current_stage VARCHAR(50) DEFAULT 'candidate_entry',
    previous_stage VARCHAR(50),
    stage_history TEXT DEFAULT '[]',
    updated_by INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (consultant_id) REFERENCES user(id),
    FOREIGN KEY (updated_by) REFERENCES user(id)
);

-- ===========================================
-- 员工表 Employee
-- ===========================================
CREATE TABLE IF NOT EXISTS employee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER,
    business_line_id INTEGER,
    entry_date DATETIME,
    entry_remark TEXT,
    leave_date DATETIME,
    leave_type VARCHAR(20),
    leave_remark TEXT,
    updated_by INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_line_id) REFERENCES business_line(id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (updated_by) REFERENCES user(id)
);

-- 说明：
-- 1. 已删除冗余字段：name, email, phone, gender, id_card, last_operator_id, current_stage
-- 2. 员工个人信息通过 candidate_id 关联从 candidate 表获取
-- 3. 当前阶段统一从 candidate_stage 表获取
-- 4. 新增 updated_by 字段记录操作人

-- ===========================================
-- 面试表 Interview
-- ===========================================
CREATE TABLE IF NOT EXISTS interview (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    business_line_id INTEGER,
    current_status VARCHAR(20) NOT NULL DEFAULT 'progressing',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (business_line_id) REFERENCES business_line(id)
);

-- 说明：
-- 1. 一个候选人只能有一条面试记录（UNIQUE约束）
-- 2. 已删除 candidateProductLineId 字段，改为直接关联 businessLineId
-- 3. 已删除 current_stage 字段，统一从 candidate_stage 表获取

-- ===========================================
-- 面试轮次表 interview_round
-- ===========================================
CREATE TABLE IF NOT EXISTS interview_round (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL,
    stage_code VARCHAR(50) NOT NULL,
    stage_index INTEGER NOT NULL,
    scheduled_date DATETIME,
    content TEXT,
    current_status VARCHAR(50),
    feedback_date DATETIME,
    completed_at DATETIME,
    entry_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interview(id),
    UNIQUE(interview_id, stage_code)
);

-- ===========================================
-- 机考试卷表 ExamPaper
-- ===========================================
CREATE TABLE IF NOT EXISTS exam_paper (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    total_score INTEGER,
    pass_line INTEGER NOT NULL DEFAULT 60,
    exam_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 机考表 Exam
-- ===========================================
CREATE TABLE IF NOT EXISTS exam (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    exam_paper_id INTEGER,
    is_online_exam BOOLEAN DEFAULT TRUE,
    exam_date DATETIME,
    exam_total_score INTEGER,
    is_cheating BOOLEAN DEFAULT FALSE,
    exam_score INTEGER,
    current_status TEXT DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (exam_paper_id) REFERENCES exam_paper(id)
);

-- 说明：
-- 1. examPassed 已重命名为 currentStatus（当前状态），值：pending(待录分)/passed(通过)/failed(未通过)
-- 2. 已删除 exam_complete_date 字段


-- ===========================================
-- 韧测表 test
-- ===========================================
CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    issue_date DATETIME,
    worry_value INTEGER,
    optimism_value INTEGER,
    consistency INTEGER,
    emotion_score INTEGER,
    current_status TEXT DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id)
);

-- 说明：
-- 1. 已删除韧测类型字段(testTypeId)，韧测类型表已移除
-- 2. currentStatus 字段值：pending(待录分)/abandoned(放弃)/passed(通过)/failed(未通过)
-- 3. testDate 已重命名为 issueDate（下发日期）

-- ===========================================
-- 阶段配置表 StageConfig
-- ===========================================
CREATE TABLE IF NOT EXISTS stage_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module VARCHAR(255) NOT NULL UNIQUE,
    stages TEXT NOT NULL DEFAULT '[]',
    stage_names TEXT DEFAULT '{}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_candidate_last_operator ON candidate(last_operator_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_candidate ON candidate_stage(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_current_stage ON candidate_stage(current_stage);
CREATE INDEX IF NOT EXISTS idx_employee_business_line ON employee(business_line_id);
CREATE INDEX IF NOT EXISTS idx_employee_candidate ON employee(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidate ON exam(candidate_id);
CREATE INDEX IF NOT EXISTS idx_test_candidate ON test(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_business_line ON interview(business_line_id);
CREATE INDEX IF NOT EXISTS idx_interview_current_status ON interview(current_status);
CREATE INDEX IF NOT EXISTS idx_interview_round_interview ON interview_round(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_round_stage_code ON interview_round(stage_code);
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);
CREATE INDEX IF NOT EXISTS idx_business_line_is_active ON business_line(is_active);
CREATE INDEX IF NOT EXISTS idx_stage_config_module ON stage_config(module);

-- ===========================================
-- 初始化数据（默认配置）
-- ===========================================

-- 默认阶段配置
INSERT OR IGNORE INTO stage_config (module, stages, stage_names, created_at, updated_at) VALUES
    ('candidate_entry', '["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"]', '{"candidate_entry":"候选录入","exam_declare":"机考申报","exam_complete":"机考完成","test_declare":"韧测申报","test_complete":"韧测完成","recommend_interview":"推荐面试","qualification_interview":"资面安排","tech_interview_1":"技术面试(一)","tech_interview_2":"技术面试(二)","manager_interview":"主管面试","approval":"租用审批","offer":"Offer","pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('exam_management', '["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"]', '{"candidate_entry":"候选录入","exam_declare":"机考申报","exam_complete":"机考完成","test_declare":"韧测申报","test_complete":"韧测完成","recommend_interview":"推荐面试","qualification_interview":"资面安排","tech_interview_1":"技术面试(一)","tech_interview_2":"技术面试(二)","manager_interview":"主管面试","approval":"租用审批","offer":"Offer","pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('test_management', '["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"]', '{"candidate_entry":"候选录入","exam_declare":"机考申报","exam_complete":"机考完成","test_declare":"韧测申报","test_complete":"韧测完成","recommend_interview":"推荐面试","qualification_interview":"资面安排","tech_interview_1":"技术面试(一)","tech_interview_2":"技术面试(二)","manager_interview":"主管面试","approval":"租用审批","offer":"Offer","pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('interview_management', '["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"]', '{"candidate_entry":"候选录入","exam_declare":"机考申报","exam_complete":"机考完成","test_declare":"韧测申报","test_complete":"韧测完成","recommend_interview":"推荐面试","qualification_interview":"资面安排","tech_interview_1":"技术面试(一)","tech_interview_2":"技术面试(二)","manager_interview":"主管面试","approval":"租用审批","offer":"Offer","pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('employee_management', '["pending_onboarding", "entry", "leave"]', '{"pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===========================================
-- 阶段说明
-- ===========================================
-- candidate_entry - 候选录入
-- exam_declare - 机考申报
-- exam_complete - 机考完成
-- test_declare - 韧测申报
-- test_complete - 韧测完成
-- recommend_interview - 推荐面试
-- qualification_interview - 资面安排
-- tech_interview_1 - 技术面试(一)
-- tech_interview_2 - 技术面试(二)
-- manager_interview - 主管面试
-- approval - 租用审批
-- offer - Offer
-- pending_onboarding - 待入职
-- entry - 入职
-- leave - 离职

-- ===========================================
-- 完整的阶段流程
-- ===========================================
-- 候选录入 → 机考申报 → 机考完成 → 韧测申报 → 韧测完成 → 推荐面试 → 资面安排 → 技术面试(一) → 技术面试(二) → 主管面试 → 租用审批 → Offer → 待入职 → 入职 → 离职

-- ===========================================
-- 关系图
-- ===========================================
-- User <---+---> (one-to-many) Candidate (last operator)
--          |
--          +---> (one-to-many) CandidateStage (updated by)
--          |
--          +---> (one-to-many) Employee (updated by)
--          |
--          +---> (one-to-many) User (subordinates/manager)
--
-- BusinessLine <---+---> (one-to-many) Interview
--                 |
--                 +---> (one-to-many) Employee
--
-- Candidate <---+---> (one-to-one) CandidateStage
--               |
--               +---> (one-to-one) Interview
--               |
--               +---> (one-to-one) Exam
--               |
--               +---> (one-to-one) Test
--               |
--               +---> (one-to-one) Employee (when stage reaches pending_onboarding)
--
-- Interview <---+---> (one-to-many) InterviewRound
--
-- ExamPaper <---+---> (one-to-many) Exam
-- ===========================================