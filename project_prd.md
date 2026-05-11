
# 招聘管理系统 PRD 文档

## 1. 项目概述

### 1.1 项目背景
本系统是一个企业招聘管理系统，用于管理候选人从入职申请到正式入职的完整流程，包括候选录入、机考、韧测、面试等各个阶段的管理。

### 1.2 系统架构
- **前端**: Vue.js 3 + Element Plus + Vite
- **后端**: Node.js + Express + Sequelize
- **数据库**: SQLite

### 1.3 核心业务流程

```
候选录入 → 机考申报 → 机考完成 → 韧测申报 → 韧测完成 → 
推荐面试 → 资面安排 → 技术面试(一) → 技术面试(二) → 主管面试 → 
租用审批 → Offer → 待入职 → 入职 → 离职
```

---

## 2. 功能模块

### 2.1 候选录入管理 (Candidate Entry)
- **模块标识**: `candidate_entry`
- **管理阶段**: `["candidate_entry"]`（仅候选录入）
- **功能**:
  - 候选人信息录入（姓名、性别、手机号、邮箱、身份证号）
  - 候选人列表查看和搜索
  - 候选人详情查看
  - 支持阶段筛选
  - 列表API优化：使用数据库分页

### 2.2 机考管理 (Exam Management)
- **模块标识**: `exam_management`
- **管理阶段**: `["exam_declare", "exam_complete"]`
- **功能**:
  - 机考申报（行内编辑）
  - 机考结果录入（行内编辑）
  - 机考记录管理（查看对话框）
  - 推进功能

### 2.3 韧测管理 (Test Management)
- **模块标识**: `test_management`
- **管理阶段**: `["test_declare", "test_complete"]`
- **功能**:
  - 韧测申报（行内编辑）
  - 韧测结果录入（行内编辑）
  - 面推功能（推荐到面试流程）
  - 推进功能
  - 查看功能（对话框）

### 2.4 面试管理 (Interview Management)
- **模块标识**: `interview_management`
- **管理阶段**: `["recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding"]`
- **功能**:
  - 推荐面试录入
  - 资格面试管理
  - 技术面试管理
  - 主管面试管理
  - 租用审批管理
  - Offer管理
  - 推进到待入职（offer阶段推进，编辑offer通过后候选人阶段保持offer，点击推进才变更为pending_onboarding）
  - 员工自动创建（当offer阶段推进到pending_onboarding时，自动在Employee表创建记录）
  - 入职日期在员工管理界面填写，面试管理界面不显示入职日期列
  - 候选人通过/不通过筛选：
    - 通过筛选：所有面试轮次都未标记为不通过（包括未完成的轮次）
    - 不通过筛选：任一面试轮次标记为不通过

### 2.5 员工管理 (Employee Management)
- **模块标识**: `employee_management`
- **管理阶段**: `["pending_onboarding", "entry", "leave"]`
- **功能**:
  - 员工列表查看
  - 员工信息查看（对话框查看）
  - 员工信息编辑（对话框编辑）
  - 姓名字段不可编辑（从Candidate表关联获取）
  - 入职日期：仅在当前阶段为入职时显示，必填
  - 离职日期：仅在当前阶段为离职时显示，必填
  - 离职类型：仅在当前阶段为离职时显示，必填
  - 离职备注：仅在当前阶段为离职时显示，选填
  - 产品线信息显示
  - 与Candidate表关联，保留候选人来源记录

### 2.6 用户管理 (User Management)
- **功能**:
  - 用户列表管理
  - 用户角色分配（manager、consultant）
  - 密码管理

### 2.7 业务线管理 (Business Line Management)
- **功能**:
  - 业务线配置
  - canEdit字段管理（控制哪些用户可以在面试阶段编辑业务线）

### 2.8 阶段配置管理 (Stage Configuration)
- **功能**:
  - 各模块独立配置阶段
  - 阶段流转控制

---

## 3. 数据库设计

### 3.1 核心数据表

#### 3.1.1 Candidate（候选人表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 姓名，必填 |
| email | STRING(100) | 邮箱 |
| phone | STRING(20) | 手机号 |
| gender | STRING(10) | 性别 |
| idCard | STRING(20) | 身份证号 |
| lastOperatorId | INTEGER | 最后操作人ID |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：仅存储基本信息，阶段信息由CandidateStage统一管理

#### 3.1.2 CandidateStage（候选人阶段表 - 核心表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID，UNIQUE，必填 |
| consultantId | INTEGER | 负责顾问ID |
| currentStage | STRING(50) | 当前阶段 |
| previousStage | STRING(50) | 上一阶段 |
| stageHistory | TEXT | 阶段变更历史（JSON数组） |
| updatedBy | INTEGER | 最后更新人ID |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：
- 单一数据源：所有阶段信息从本表查询
- 一个候选人只有一条阶段记录（UNIQUE约束）

#### 3.1.3 Employee（员工表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 关联的候选人ID |
| businessLineId | INTEGER | 业务线ID |
| entryDate | DATE | 入职日期 |
| entryRemark | TEXT | 入职备注 |
| leaveDate | DATE | 离职日期 |
| leaveType | STRING(20) | 离职类型 |
| leaveRemark | TEXT | 离职备注 |
| updatedBy | INTEGER | 最后更新人ID |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：
- 仅存储员工特有信息（入职/离职相关）
- 个人信息从Candidate表关联获取
- 阶段信息从CandidateStage表关联获取

#### 3.1.4 Interview（面试记录表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID，NOT NULL，UNIQUE |
| businessLineId | INTEGER | 业务线ID（可空） |
| currentStatus | STRING(20) | 当前状态（progressing/passed/failed） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：
- 一个候选人只能有一条面试记录（UNIQUE约束）
- 阶段信息从CandidateStage表关联获取

#### 3.1.5 InterviewRound（面试轮次表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| interviewId | INTEGER | 面试记录ID |
| stageCode | STRING(50) | 阶段代码 |
| stageIndex | INTEGER | 阶段索引 |
| scheduledDate | DATE | 安排日期 |
| content | TEXT | 评价内容 |
| currentStatus | VARCHAR(50) | 当前状态 |
| feedbackDate | DATE | 反馈日期 |
| completedAt | DATE | 完成日期 |
| entryDate | DATE | 入职日期 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.6 Exam（机考表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID，UNIQUE |
| examPaperId | INTEGER | 试卷ID |
| isOnlineExam | BOOLEAN | 是否在线考试 |
| examDate | DATE | 机考日期 |
| examTotalScore | INTEGER | 机考总分 |
| isCheating | BOOLEAN | 是否作弊 |
| examScore | INTEGER | 机考分数 |
| currentStatus | TEXT | 当前状态（pending/passed/failed） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.7 Test（韧测表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID，UNIQUE |
| issueDate | DATE | 下发日期 |
| worryValue | INTEGER | 忧虑值 |
| optimismValue | INTEGER | 乐观值 |
| consistency | INTEGER | 一致性 |
| emotionScore | INTEGER | 情绪分 |
| currentStatus | TEXT | 当前状态（pending/abandoned/passed/failed） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：已删除韧测类型字段(testTypeId)，韧测类型配置表已移除

#### 3.1.8 ExamPaper（机考试卷表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 试卷名称 |
| description | TEXT | 描述 |
| totalScore | INTEGER | 总分 |
| passLine | INTEGER | 及格线 |
| examDate | DATE | 考试日期 |
| isActive | BOOLEAN | 是否激活 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.9 StageConfig（阶段配置表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| module | STRING(255) | 模块标识，UNIQUE |
| stages | TEXT | 阶段列表（JSON数组） |
| stageNames | TEXT | 阶段名称映射（JSON对象） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.10 User（用户表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| username | STRING(50) | 用户名，UNIQUE |
| password | STRING(255) | 密码（加密） |
| role | STRING(20) | 角色（consultant/manager） |
| realName | STRING(100) | 真实姓名 |
| email | STRING(100) | 邮箱 |
| phone | STRING(20) | 手机号 |
| managerId | INTEGER | 上级ID |
| isActive | BOOLEAN | 是否激活 |
| lastLoginAt | DATE | 最后登录时间 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.11 BusinessLine（业务线表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 业务线名称，UNIQUE |
| description | TEXT | 描述 |
| isActive | BOOLEAN | 是否激活 |
| canEdit | TEXT | 可编辑用户ID列表（JSON数组） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：原 ProductLine 表已改名为 BusinessLine

#### 3.1.12 已删除表
- **ProductLineUser**：产品线用户关联表已删除
- **CandidateProductLine**：候选人产品线关联表已删除
- **TestType**：韧测类型表已删除

### 3.2 数据关联关系

```
User 1:N Candidate (lastOperator)
User 1:N CandidateStage (consultant)
User 1:N CandidateStage (updatedBy)
User 1:N Employee (updatedBy)
User 1:N User (subordinates/manager)

Candidate 1:1 CandidateStage
Candidate 1:1 Exam
Candidate 1:1 Test
Candidate 1:1 Interview
Candidate 1:1 Employee (when stage reaches pending_onboarding)

Interview 1:N InterviewRound
Interview N:1 BusinessLine

BusinessLine 1:N Employee

ExamPaper 1:N Exam
```

---

## 4. API 接口设计

### 4.1 认证接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/change-password` | POST | 修改密码 |

### 4.2 候选人接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/candidates` | GET | 获取候选人列表 |
| `/api/candidates/:id` | GET | 获取候选人详情（包含CandidateStage） |
| `/api/candidates` | POST | 创建候选人（同时创建CandidateStage） |
| `/api/candidates/:id` | PUT | 更新候选人 |
| `/api/candidates/:id` | DELETE | 删除候选人 |
| `/api/candidates/:id/advance` | PUT | 推进阶段（更新CandidateStage） |
| `/api/candidates/:id/rollback` | PUT | 回滚阶段 |
| `/api/candidates/:id/can-recommend` | GET | 检查是否可以面推 |
| `/api/candidates/:id/push-interview` | POST | 面推到面试 |
| `/api/candidates/:id/available-business-lines` | GET | 获取可用业务线 |

### 4.3 员工接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/employees` | GET | 获取员工列表（关联Candidate和CandidateStage） |
| `/api/employees/:id` | GET | 获取员工详情 |
| `/api/employees/:id` | PUT | 更新员工信息 |
| `/api/employees/:id` | DELETE | 删除员工 |

### 4.4 机考接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/exams` | GET | 获取机考列表 |
| `/api/exams/candidate/:candidateId` | GET | 获取候选人机考记录 |
| `/api/exams` | POST | 创建机考记录 |
| `/api/exams/:id` | PUT | 更新机考记录 |
| `/api/exams/:id` | DELETE | 删除机考记录 |

### 4.5 韧测接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/tests` | GET | 获取韧测列表 |
| `/api/tests/candidate/:candidateId` | GET | 获取候选人韧测记录 |
| `/api/tests` | POST | 创建韧测记录 |
| `/api/tests/:id` | PUT | 更新韧测记录 |
| `/api/tests/:id` | DELETE | 删除韧测记录 |

### 4.6 面试接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/interviews` | GET | 获取面试列表<br>参数：<br>- name: 候选人姓名（模糊搜索）<br>- currentStage: 当前阶段（从CandidateStage查询）<br>- passStatus: 通过状态筛选（pass/fail）<br>- stages: 阶段数组（优先级高于配置）<br>- page: 页码<br>- pageSize: 每页数量 |
| `/api/interviews/:id` | GET | 获取面试详情 |
| `/api/interviews` | POST | 创建面试记录 |
| `/api/interviews/:id` | PUT | 更新面试记录 |
| `/api/interviews/:id` | DELETE | 删除面试记录 |
| `/api/interviews/:id/advance` | PUT | 推进阶段 |

### 4.7 阶段配置接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stage-configs` | GET | 获取所有阶段配置 |
| `/api/stage-configs/:module` | GET | 获取指定模块配置 |
| `/api/stage-configs` | POST | 创建阶段配置 |
| `/api/stage-configs/:module` | PUT | 更新阶段配置 |
| `/api/stage-configs/:module` | DELETE | 删除阶段配置 |

### 4.8 用户接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users/:id` | GET | 获取用户详情 |
| `/api/users` | POST | 创建用户 |
| `/api/users/:id` | PUT | 更新用户 |
| `/api/users/:id` | DELETE | 删除用户 |

### 4.9 业务线接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/business-lines` | GET | 获取业务线列表 |
| `/api/business-lines/:id` | GET | 获取业务线详情 |
| `/api/business-lines` | POST | 创建业务线 |
| `/api/business-lines/:id` | PUT | 更新业务线 |
| `/api/business-lines/:id` | DELETE | 删除业务线 |

### 4.10 统计接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/statistics/by-consultant` | GET | 按顾问统计（从CandidateStage查询consultantId） |
| `/api/statistics/by-stage` | GET | 按阶段统计（从CandidateStage查询） |
| `/api/statistics/process-efficiency` | GET | 流程效率统计 |
| `/api/statistics/summary` | GET | 汇总统计（从CandidateStage查询） |

### 4.11 其他接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/exam-papers` | GET/POST/PUT/DELETE | 试卷管理 |

**说明**：已删除韧测类型管理接口(`/api/test-types`)

---

## 5. 核心业务逻辑

### 5.1 阶段流转规则

| 当前阶段 | 下一阶段 | 推进条件 |
|----------|----------|----------|
| candidate_entry | exam_declare | 自动 |
| exam_declare | exam_complete | 机考完成 |
| exam_complete | test_declare | 自动 |
| test_declare | test_complete | 韧测完成 |
| test_complete | recommend_interview | 面推操作 |
| recommend_interview | qualification_interview | 自动 |
| qualification_interview | tech_interview_1 | 资面通过 |
| tech_interview_1 | tech_interview_2 | 技一通过 |
| tech_interview_2 | manager_interview | 技二通过 |
| manager_interview | approval | 主面通过 |
| approval | offer | 审批通过 |
| offer | pending_onboarding | Offer通过且点击推进 |
| pending_onboarding | entry | 入职日期在员工管理界面填写 |
| entry | leave | 填写离职日期、类型、备注 |

### 5.2 面推规则

1. **不能面推的情况**：
   - 候选人已入职或离职
   - 候选人处于面试阶段
   - 没有可用业务线
   - 存在进行中的面试记录
   - 有面试记录且最新阶段是通过的

2. **可以面推的情况**：
   - 没有面试记录（第一次面推）
   - 所有面试记录都未通过，且有可用业务线

### 5.3 员工自动创建逻辑

#### 5.3.1 候选人推进到待入职
当候选人从offer阶段推进到 `pending_onboarding` 阶段时：
1. 自动创建Employee记录
2. Employee记录包含：
   - candidateId 设置为候选人ID
   - businessLineId 设置为面试记录的业务线ID
3. 同时更新CandidateStage.currentStage

#### 5.3.2 Offer阶段推进
当面试从offer阶段推进到 `pending_onboarding` 时：
1. 设置Interview.currentStatus为'passed'
2. 自动创建Employee记录
3. 候选人阶段通过CandidateStage同步更新为pending_onboarding
4. 入职日期在员工管理界面填写，不在此处录入

### 5.4 员工管理编辑规则

1. **不可编辑字段**：姓名（从Candidate表关联获取）
2. **入职日期**：
   - 仅当 currentStage === 'entry' 时显示
   - 必填字段
3. **离职日期、类型、备注**：
   - 仅当 currentStage === 'leave' 时显示
   - 离职日期和类型必填
   - 离职备注选填
4. **阶段切换影响**：
   - 修改currentStage时，动态显示/隐藏相关字段
   - 表单验证规则动态变化

### 5.5 单一数据源原则

系统中所有阶段信息有且只有一个数据源：

| 字段 | 表名 | 说明 |
|------|------|------|
| currentStage | CandidateStage | **唯一数据源** |

**更新规则**：
1. 任何模块需要阶段信息时，从CandidateStage查询
2. 推进阶段时，仅更新CandidateStage表
3. Candidate、Employee、Interview表不再存储阶段字段
4. 统计查询全部从CandidateStage表获取数据

### 5.6 数据库字段命名规范

**数据库表字段**：
- 使用 snake_case（小写下划线）命名
- 例如：`current_stage`, `business_line_id`, `created_at`

**Sequelize模型属性**：
- 使用 camelCase（小驼峰）命名
- 配置 underscored: true 自动映射
- 例如：`currentStage`, `businessLineId`, `createdAt`

---

## 6. 前端页面结构

### 6.1 页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录页 | `/login` | 用户登录 |
| 首页 | `/dashboard` | 数据统计概览 |
| 候选录入 | `/candidates` | 候选人列表和管理 |
| 候选人详情 | `/candidates/:id` | 候选人详细信息 |
| 机考管理 | `/exams` | 机考记录管理 |
| 韧测管理 | `/tests` | 韧测记录管理 |
| 面试管理 | `/interviews` | 面试记录管理 |
| 员工管理 | `/employees` | 员工列表和管理 |
| 用户管理 | `/users` | 用户列表和管理 |
| 业务线管理 | `/business-lines` | 业务线配置 |
| 机考题库 | `/exam-papers` | 试卷管理 |
| 阶段配置 | `/stage-config` | 阶段配置管理 |
| 统计报表 | `/statistics` | 数据统计 |

**说明**：已删除韧测类型配置页面(`/test-types`)

### 6.2 页面功能

#### 6.2.1 面试管理页面 (InterviewStage.vue)
- 按阶段筛选候选人
- 查看和编辑面试记录
- 推进阶段
- offer阶段推进到pending_onboarding（编辑offer通过后候选人阶段保持offer，点击推进才变更）
- pending_onboarding阶段不显示推进按钮（入职日期在员工管理界面填写）
- 删除入职日期列显示
- 阶段字段按配置显示
- 已完成阶段字段不可编辑
- 编辑按钮显示条件：候选人阶段不是pending_onboarding/entry/leave
- 推进按钮显示条件：候选人阶段不是pending_onboarding/entry/leave且满足各阶段推进条件
- 与TestStage.vue和Employees.vue保持一致的布局结构
- 候选人通过/不通过筛选：
  - 筛选选项：全部、通过、不通过
  - 不通过：任一面试轮次标记为不通过（passed=false）
  - 通过：所有面试轮次都未标记为不通过（包括未完成的轮次，passed=null或true）

#### 6.2.2 员工管理页面 (Employees.vue)
- 对话框编辑员工信息
- 姓名字段禁用，不可编辑（从Candidate表获取）
- 入职日期：仅在入职阶段显示，必填
- 离职日期、类型、备注：仅在离职阶段显示
- 业务线信息显示
- 与TestStage.vue保持一致的布局结构

#### 6.2.3 韧测管理页面 (TestStage.vue)
- 韧测记录列表
- 行内编辑
- 查看对话框
- 推进按钮
- 面推按钮（按规则显示/隐藏）

---

## 7. 系统配置

### 7.1 默认阶段配置（模块化）

```json
{
  "candidate_entry": ["candidate_entry"],
  "exam_management": ["exam_declare", "exam_complete"],
  "test_management": ["test_declare", "test_complete"],
  "interview_management": ["recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding"],
  "employee_management": ["pending_onboarding", "entry", "leave"]
}
```

### 7.2 默认用户

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | manager | 系统管理员 |
| Crystal | admin123 | manager | 经理 |
| Lisa | admin123 | consultant | 顾问 |
| Lin | admin123 | consultant | 顾问 |

---

## 8. 部署说明

### 8.1 前端部署

```bash
cd frontend
npm install
npm run build
npm run dev  # 开发环境
```

### 8.2 后端部署

```bash
cd backend
npm install
node src/app.js
```

### 8.3 端口配置

- 前端默认端口：5171
- 后端默认端口：3000

---

## 9. 数据流转图

```
用户操作 → API请求 → 路由处理 → 数据库操作 → 返回响应
    ↓
  前端状态更新
```

**候选人数据流转**：
```
候选录入 → Candidate表 + CandidateStage表
                      ↓
                  Exam表
                      ↓
                  Test表
                      ↓
                  Interview表 + InterviewRound表
                      ↓
                  Employee表
                      ↓
                  更新CandidateStage.current_stage
```

---

## 10. 安全考虑

1. **JWT认证**：所有API接口需要Token认证
2. **密码加密**：使用bcryptjs加密存储
3. **输入验证**：前端和后端双重验证
4. **SQL注入防护**：使用Sequelize ORM
5. **权限控制**：基于角色的访问控制

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 2.0 | 2026-05-11 | 核心架构重构：<br>1. 新增CandidateStage表统一管理阶段<br>2. 简化Candidate/Employee/Interview表，移除冗余字段<br>3. 单一数据源原则：所有阶段从CandidateStage查询<br>4. 统计数据源从Candidate表改为CandidateStage表<br>5. 阶段配置模块化：各模块只配置自己相关的阶段<br>6. ProductLine改名为BusinessLine<br>7. 更新所有文档 |
| 1.13 | 2026-05-11 | 更新内容：<br>1. 修复统计报表模块报错问题：`by-consultant` 和 `summary` 接口将 `consultantId` 字段从 `Candidate` 表改为从 `CandidateStage` 表查询<br>2. 更新project_prd.md、database_schema.sql、recruit_rule.md文档 |
| 1.12 | 2026-05-09 | 更新内容：<br>1. 员工管理所有阶段变化都会同步到面试表<br>2. 员工和面试关联统一使用 candidateId<br>3. 面试管理列表新增入职日期和离职日期列，从 Employee 表获取<br>4. 修复编辑 Offer 阶段时显示接受状态和入职日期<br>5. 修复员工管理编辑保存时入职日期丢失问题<br>6. 更新project_prd.md、database_schema.sql、recruit_rule.md文档 |

