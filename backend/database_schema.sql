-- ===========================================
-- 候选人招聘管理系统数据库 Schema
-- Database: recruit_db
-- 版本: 1.2
-- 日期: 2026-05-04
-- ===========================================

-- ===========================================
-- 用户表 User
-- 系统用户（顾问、经理）
-- ===========================================
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'consultant' CHECK(role IN ('consultant', 'manager')),
    realName VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    managerId INTEGER,
    isActive BOOLEAN DEFAULT TRUE,
    lastLoginAt DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (managerId) REFERENCES User(id)
);

-- ===========================================
-- 产品线表 ProductLine
-- ===========================================
CREATE TABLE IF NOT EXISTS ProductLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    clientOwner VARCHAR(100),
    description TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 产品线-用户关联表 ProductLineUser
-- ===========================================
CREATE TABLE IF NOT EXISTS ProductLineUser (
    productLineId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (productLineId, userId),
    FOREIGN KEY (productLineId) REFERENCES ProductLine(id),
    FOREIGN KEY (userId) REFERENCES User(id)
);

-- ===========================================
-- 候选人表 Candidate
-- ===========================================
CREATE TABLE IF NOT EXISTS Candidate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    gender VARCHAR(10),
    idCard VARCHAR(20),
    consultantId INTEGER,
    lastOperatorId INTEGER,
    currentStage VARCHAR(50) DEFAULT 'candidate_entry',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultantId) REFERENCES User(id),
    FOREIGN KEY (lastOperatorId) REFERENCES User(id)
);

-- ===========================================
-- 员工表 Employee
-- ===========================================
CREATE TABLE IF NOT EXISTS Employee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    gender VARCHAR(10),
    idCard VARCHAR(20),
    lastOperatorId INTEGER,
    currentStage VARCHAR(50) DEFAULT 'pending_onboarding',
    entryDate DATETIME,
    entryRemark TEXT,
    leaveDate DATETIME,
    leaveType VARCHAR(20),
    leaveRemark TEXT,
    productLineId INTEGER,
    candidateId INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lastOperatorId) REFERENCES User(id),
    FOREIGN KEY (productLineId) REFERENCES ProductLine(id),
    FOREIGN KEY (candidateId) REFERENCES Candidate(id)
);

-- ===========================================
-- 候选人-产品线关联表 CandidateProductLine
-- ===========================================
CREATE TABLE IF NOT EXISTS CandidateProductLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateId INTEGER NOT NULL,
    productLineId INTEGER NOT NULL,
    recommendDate DATETIME,
    interviewStage VARCHAR(50) DEFAULT 'recommend_interview',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidateId) REFERENCES Candidate(id),
    FOREIGN KEY (productLineId) REFERENCES ProductLine(id),
    UNIQUE(candidateId, productLineId)
);

-- ===========================================
-- 面试表 Interview
-- ===========================================
CREATE TABLE IF NOT EXISTS Interview (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateProductLineId INTEGER NOT NULL UNIQUE,
    currentStage VARCHAR(50) NOT NULL DEFAULT 'recommend_interview',
    finalStatus VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidateProductLineId) REFERENCES CandidateProductLine(id)
);

-- ===========================================
-- 面试轮次表 InterviewRound
-- ===========================================
CREATE TABLE IF NOT EXISTS InterviewRound (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interviewId INTEGER NOT NULL,
    stageCode VARCHAR(50) NOT NULL,
    stageIndex INTEGER NOT NULL,
    scheduledDate DATETIME,
    interviewer VARCHAR(100),
    content TEXT,
    passed BOOLEAN,
    completedAt DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interviewId) REFERENCES Interview(id),
    UNIQUE(interviewId, stageCode)
);

-- ===========================================
-- 机考试卷表 ExamPaper
-- ===========================================
CREATE TABLE IF NOT EXISTS ExamPaper (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    totalScore INTEGER,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 机考合格线表 ExamPassLine
-- ===========================================
CREATE TABLE IF NOT EXISTS ExamPassLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    examPaperId INTEGER NOT NULL,
    passLine INTEGER NOT NULL,
    isCurrent BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examPaperId) REFERENCES ExamPaper(id)
);

-- ===========================================
-- 机考表 Exam
-- ===========================================
CREATE TABLE IF NOT EXISTS Exam (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateId INTEGER NOT NULL UNIQUE,
    examPaperId INTEGER,
    isOnlineExam BOOLEAN DEFAULT TRUE,
    examDate DATETIME,
    examCompleteDate DATETIME,
    examTotalScore INTEGER,
    isCheating BOOLEAN DEFAULT FALSE,
    examScore INTEGER,
    examPassed BOOLEAN,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidateId) REFERENCES Candidate(id),
    FOREIGN KEY (examPaperId) REFERENCES ExamPaper(id)
);

-- ===========================================
-- 机考阶段表 ExamStage
-- ===========================================
CREATE TABLE IF NOT EXISTS ExamStage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateId INTEGER NOT NULL,
    examPaperId INTEGER,
    score FLOAT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'passed', 'failed')),
    examDate DATETIME,
    feedback TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidateId) REFERENCES Candidate(id)
);

-- ===========================================
-- 韧测类型表 TestType
-- ===========================================
CREATE TABLE IF NOT EXISTS TestType (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 韧测表 Test
-- ===========================================
CREATE TABLE IF NOT EXISTS Test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateId INTEGER NOT NULL UNIQUE,
    testTypeId INTEGER,
    testDate DATETIME,
    testCompleteDate DATETIME,
    worryValue INTEGER,
    optimismValue INTEGER,
    consistency INTEGER,
    testPassed BOOLEAN,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidateId) REFERENCES Candidate(id),
    FOREIGN KEY (testTypeId) REFERENCES TestType(id)
);

-- ===========================================
-- 阶段配置表 StageConfig
-- ===========================================
CREATE TABLE IF NOT EXISTS StageConfig (
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
CREATE INDEX IF NOT EXISTS idx_candidate_currentStage ON Candidate(currentStage);
CREATE INDEX IF NOT EXISTS idx_candidate_lastOperator ON Candidate(lastOperatorId);
CREATE INDEX IF NOT EXISTS idx_employee_currentStage ON Employee(currentStage);
CREATE INDEX IF NOT EXISTS idx_employee_lastOperator ON Employee(lastOperatorId);
CREATE INDEX IF NOT EXISTS idx_employee_productLine ON Employee(productLineId);
CREATE INDEX IF NOT EXISTS idx_employee_candidate ON Employee(candidateId);
CREATE INDEX IF NOT EXISTS idx_candidateProductLine_candidate ON CandidateProductLine(candidateId);
CREATE INDEX IF NOT EXISTS idx_candidateProductLine_productLine ON CandidateProductLine(productLineId);
CREATE INDEX IF NOT EXISTS idx_exam_candidate ON Exam(candidateId);
CREATE INDEX IF NOT EXISTS idx_test_candidate ON Test(candidateId);
CREATE INDEX IF NOT EXISTS idx_interview_candidateProductLine ON Interview(candidateProductLineId);
CREATE INDEX IF NOT EXISTS idx_interview_currentStage ON Interview(currentStage);
CREATE INDEX IF NOT EXISTS idx_interview_finalStatus ON Interview(finalStatus);
CREATE INDEX IF NOT EXISTS idx_interviewRound_interview ON InterviewRound(interviewId);
CREATE INDEX IF NOT EXISTS idx_interviewRound_stageCode ON InterviewRound(stageCode);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_productLine_isActive ON ProductLine(isActive);
CREATE INDEX IF NOT EXISTS idx_stageConfig_module ON StageConfig(module);

-- ===========================================
-- 初始化数据（默认配置）
-- ===========================================

-- 默认阶段配置
INSERT OR IGNORE INTO StageConfig (module, stages, stage_names, created_at, updated_at) VALUES
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
-- User <---+---> (many-to-many) ProductLine
--          |
--          +---> (one-to-many) Candidate (last operator)
--          |
--          +---> (one-to-many) Employee (last operator)
--          |
--          +---> (one-to-many) User (subordinates/manager)
--
-- ProductLine <---+---> (many-to-many) Candidate
--                 |
--
-- Candidate <---+---> (one-to-many) CandidateProductLine
--               |
--               +---> (one-to-one) Exam
--               |
--               +---> (one-to-one) Test
--               |
--               +---> (one-to-one) Employee (when stage reaches pending_onboarding)
--
-- CandidateProductLine <---+---> (one-to-one) Interview
--                        |
--
-- Interview <---+---> (one-to-many) InterviewRound
--
-- ExamPaper <---+---> (one-to-many) ExamPassLine
--               |
--               +---> (one-to-many) Exam
--
-- TestType <---+---> (one-to-many) Test
-- ===========================================
