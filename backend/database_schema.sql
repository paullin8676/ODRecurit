-- ===========================================
-- 数据库 Schema
-- 版本: 2.4
-- 日期: 2026-05-22
-- ===========================================

-- 更新说明:
-- v2.4 更新内容:
-- 1. 备份功能: 新增 backup_records 表存储手动/定时备份记录
-- 2. 权限新增: menu_backup, btn_backup_create, btn_backup_delete, btn_backup_restore, btn_backup_config
-- 历史更新:
-- v2.3 更新内容:
-- 1. 双数据库兼容: SQLite 语法 + MariaDB 兼容说明 (sql_mode=ANSI, AUTO_INCREMENT代替AUTOINCREMENT)
-- 2. 覆盖索引同步: CandidateStageTimeline 8个索引完整定义 (idx_cst_candidate_include等)
-- 3. 迁移脚本: migrations/ 目录配套提供
--    - MARIADB_MIGRATION_GUIDE.md 完整迁移指南
--    - migrate_sqlite_to_mariadb.js 数据迁移脚本
--    - add_cst_covering_indexes.js 性能优化脚本
-- - v2.2: 确认 candidate_stage_timeline 表结构与模型定义同步
-- - v2.1: 用户表(User)已移除role字段，改为通过UserRole关联表实现多对多角色关系
-- - v2.1: 添加机考试卷相关权限: btn_exam_paper_create, btn_exam_paper_edit, btn_exam_paper_delete
-- - v2.1: 更新菜单名称: 业务线管理 -> 业务配置, 试卷管理 -> 机考配置

-- ===========================================
-- MariaDB 兼容性提示:
-- ===========================================
-- 1. SQLite AUTOINCREMENT -> MariaDB AUTO_INCREMENT
-- 2. SQLite TEXT -> MariaDB TEXT / LONGTEXT (大字段)
-- 3. SQLite CHECK 约束 -> MariaDB 原生支持 (10.2+)
-- 4. 字符串字面量: 标准 ANSI 单引号
-- 5. migrations/docker-compose.mariadb.yml 可一键启动服务
-- ===========================================

-- ===========================================
-- 用户表 User
-- 系统用户（顾问、经理）
-- ===========================================
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
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
-- 仅存储候选人基本信息，阶段信息统一由 CandidateStage 管理
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
-- 包含 consultantId、currentStage、stageHistory 等
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
-- 仅存储员工特有信息，个人信息通过 candidate_id 从 candidate 表获取
-- 阶段信息统一从 candidate_stage 表获取
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

-- ===========================================
-- 面试表 Interview
-- 一个候选人只能有一条面试记录（UNIQUE约束）
-- 阶段信息统一从 candidate_stage 表获取
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
-- 角色表 Role
-- 系统角色定义（顾问、主管、经理、总监、管理员）
-- ===========================================
CREATE TABLE IF NOT EXISTS role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    data_scope VARCHAR(20) NOT NULL DEFAULT 'self' CHECK(data_scope IN ('self', 'subordinate', 'global')),
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 权限点表 Permission
-- 菜单和按钮权限定义
-- ===========================================
CREATE TABLE IF NOT EXISTS permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'menu' CHECK(type IN ('menu', 'button')),
    parent_id INTEGER,
    path VARCHAR(255),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES permission(id)
);

-- ===========================================
-- 用户角色关联表 UserRole
-- 用户与角色的多对多关系
-- ===========================================
CREATE TABLE IF NOT EXISTS user_role (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
);

-- ===========================================
-- 角色权限关联表 RolePermission
-- 角色与权限的多对多关系
-- ===========================================
CREATE TABLE IF NOT EXISTS role_permission (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);

-- ===========================================
-- 索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_candidate_last_operator ON candidate(last_operator_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_candidate ON candidate_stage(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_current_stage ON candidate_stage(current_stage);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_consultant ON candidate_stage(consultant_id);
CREATE INDEX IF NOT EXISTS idx_employee_business_line ON employee(business_line_id);
CREATE INDEX IF NOT EXISTS idx_employee_candidate ON employee(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidate ON exam(candidate_id);
CREATE INDEX IF NOT EXISTS idx_test_candidate ON test(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_business_line ON interview(business_line_id);
CREATE INDEX IF NOT EXISTS idx_interview_current_status ON interview(current_status);
CREATE INDEX IF NOT EXISTS idx_interview_round_interview ON interview_round(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_round_stage_code ON interview_round(stage_code);

CREATE INDEX IF NOT EXISTS idx_business_line_is_active ON business_line(is_active);
CREATE INDEX IF NOT EXISTS idx_stage_config_module ON stage_config(module);
CREATE INDEX IF NOT EXISTS idx_role_code ON role(code);
CREATE INDEX IF NOT EXISTS idx_role_level ON role(level);
CREATE INDEX IF NOT EXISTS idx_permission_code ON permission(code);
CREATE INDEX IF NOT EXISTS idx_permission_type ON permission(type);
CREATE INDEX IF NOT EXISTS idx_permission_parent_id ON permission(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_role(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_role_id ON role_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_permission_id ON role_permission(permission_id);

-- ===========================================
-- 初始化数据（默认配置）
-- ===========================================

-- 默认阶段配置：每个模块只管理自己相关的阶段
INSERT OR IGNORE INTO stage_config (module, stages, stage_names, created_at, updated_at) VALUES
    ('candidate_entry', '["candidate_entry"]', '{"candidate_entry":"候选录入"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('exam_management', '["exam_declare", "exam_complete"]', '{"exam_declare":"机考申报","exam_complete":"机考完成"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('test_management', '["test_declare", "test_complete"]', '{"test_declare":"韧测申报","test_complete":"韧测完成"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('interview_management', '["recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding"]', '{"recommend_interview":"推荐面试","qualification_interview":"资面安排","tech_interview_1":"技术面试(一)","tech_interview_2":"技术面试(二)","manager_interview":"主管面试","approval":"租用审批","offer":"Offer","pending_onboarding":"待入职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('employee_management', '["pending_onboarding", "entry", "leave"]', '{"pending_onboarding":"待入职","entry":"入职","leave":"离职"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===========================================
-- 默认角色初始化
-- ===========================================
INSERT OR IGNORE INTO role (name, code, level, data_scope, description, created_at, updated_at) VALUES
    ('顾问', 'consultant', 1, 'self', '只能看到自己录入的候选人', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('主管', 'supervisor', 2, 'subordinate', '能看到自己和下属顾问的数据', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('经理', 'manager', 3, 'subordinate', '能看到自己和下属主管、顾问的数据', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('总监', 'director', 4, 'subordinate', '能看到所有下级数据', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('管理员', 'admin', 5, 'global', '能看到所有数据，拥有全部权限', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===========================================
-- 默认权限点初始化
-- ===========================================
INSERT OR IGNORE INTO permission (code, name, type, path, icon, sort_order, created_at, updated_at) VALUES
    ('menu_dashboard', '仪表盘', 'menu', '/', 'el-icon-home', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_candidates', '候选录入', 'menu', '/candidates', 'el-icon-user-plus', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_exam', '机考管理', 'menu', '/exam-stage', 'el-icon-edit', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_test', '韧测管理', 'menu', '/test-stage', 'el-icon-bar-chart', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_interview', '面试管理', 'menu', '/interview-stage', 'el-icon-suitcase', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_employee', '员工管理', 'menu', '/employee-management', 'el-icon-users', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_statistics', '统计报表', 'menu', '', 'el-icon-pie-chart', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_statistics_data', '数据统计', 'menu', '/statistics', '', 71, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_statistics_duration', '停留分析', 'menu', '/duration-analysis', '', 72, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_statistics_records', '停留明细', 'menu', '/duration-records', '', 73, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_users', '用户管理', 'menu', '/settings/users', 'el-icon-user', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_business_lines', '业务线管理', 'menu', '/settings/business-lines', 'el-icon-office-building', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_exam_papers', '试卷管理', 'menu', '/settings/exam-papers', 'el-icon-file-text', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_stage_config', '阶段配置', 'menu', '/stage-config', 'el-icon-setting', 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_role_management', '角色管理', 'menu', '/settings/roles', 'el-icon-key', 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menu_permission_management', '权限管理', 'menu', '/settings/permissions', 'el-icon-lock', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_candidate_create', '创建候选人', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_candidate_edit', '编辑候选人', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_candidate_delete', '删除候选人', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_candidate_advance', '推进阶段', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_candidate_push_interview', '面推', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_user_create', '创建用户', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_user_edit', '编辑用户', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_user_delete', '删除用户', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_business_line_create', '创建业务线', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_business_line_edit', '编辑业务线', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_business_line_delete', '删除业务线', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_role_create', '创建角色', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_role_edit', '编辑角色', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_role_delete', '删除角色', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_permission_assign', '分配权限', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_permission_create', '创建权限', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_permission_edit', '编辑权限', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('btn_permission_delete', '删除权限', 'button', NULL, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
-- 核心架构变化说明 (v2.1)
-- ===========================================
-- 1. 新增 CandidateStage 表：统一管理所有候选人的阶段、顾问关联、阶段历史
-- 2. 简化 Candidate 表：移除 currentStage、consultantId，仅保留基本信息
-- 3. 简化 Employee 表：移除冗余的个人信息字段，通过 candidate_id 关联获取
-- 4. 简化 Interview 表：移除 currentStage、finalStatus，仅保留 currentStatus
-- 5. 阶段配置模块化：每个模块只配置自己相关的阶段
-- 6. 统计数据从 CandidateStage 表查询（而非 Candidate 表）
-- 7. 新增角色和权限系统：
--    - Role表：定义系统角色（顾问、主管、经理、总监、管理员）
--    - Permission表：定义权限点（菜单、按钮）
--    - UserRole表：用户与角色的多对多关联
--    - RolePermission表：角色与权限的多对多关联
-- 8. 数据权限分为三种：自己数据(self)、下级数据(subordinate)、全局数据(global)
-- 9. 用户层级穿透：上级可以查看所有下级的数据

-- ===========================================
-- 关系图
-- ===========================================
-- User <---+---> (one-to-many) Candidate (last operator)
--          |
--          +---> (one-to-many) CandidateStage (consultant)
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

-- ===========================================
-- 候选人阶段时间线表 (v2.2)
-- ===========================================
-- 用于精确记录每个候选人在每个阶段的进入/离开时间
-- UNIQUE(candidate_id, stage) 约束保证每个候选人每个阶段只有一条记录
-- 阶段回退时走 UPDATE 而非 INSERT
-- recommend_interview 反馈日期约定：left_at = YYYY-MM-DD 18:00:00
-- ===========================================
CREATE TABLE IF NOT EXISTS candidate_stage_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  stage VARCHAR(50) NOT NULL,
  entered_at DATETIME NOT NULL,
  left_at DATETIME,
  duration_hours FLOAT,
  entered_by INTEGER,
  left_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, stage),
  FOREIGN KEY (candidate_id) REFERENCES candidate(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES user(id),
  FOREIGN KEY (left_by) REFERENCES user(id)
);

-- 索引加速筛选与聚合
CREATE INDEX IF NOT EXISTS idx_cst_stage ON candidate_stage_timeline(stage);
CREATE INDEX IF NOT EXISTS idx_cst_entered_at ON candidate_stage_timeline(entered_at);

-- 覆盖索引: 加速按 stage + entered_at 范围查询和聚合统计
CREATE INDEX IF NOT EXISTS idx_cst_stage_entered ON candidate_stage_timeline(stage, entered_at);
CREATE INDEX IF NOT EXISTS idx_cst_stage_duration ON candidate_stage_timeline(stage, duration_hours);

-- 覆盖索引: 加速日期范围 + 阶段过滤 + duration聚合
CREATE INDEX IF NOT EXISTS idx_cst_entered_left_duration ON candidate_stage_timeline(entered_at, left_at, duration_hours, stage);

-- 覆盖索引: 加速候选人阶段唯一查找和JOIN
CREATE INDEX IF NOT EXISTS idx_cst_candidate_stage ON candidate_stage_timeline(candidate_id, stage);
CREATE INDEX IF NOT EXISTS idx_cst_candidate_include ON candidate_stage_timeline(candidate_id, stage, entered_at, left_at, duration_hours);
-- ===========================================


-- ===========================================
-- 备份记录表 backup_records (v2.4 新增)
-- 系统管理员: 数据备份/恢复功能
-- ===========================================
CREATE TABLE IF NOT EXISTS backup_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  backup_type VARCHAR(32) NOT NULL DEFAULT 'manual',
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  schedule_time VARCHAR(10),
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ===========================================
