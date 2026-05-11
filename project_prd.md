
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
- **管理阶段**: 仅阶段配置中指定的阶段（不再包含配置阶段之后的阶段）
- **功能**:
  - 候选人信息录入（姓名、性别、手机号、邮箱、身份证号）
  - 候选人列表查看和搜索
  - 候选人详情查看
  - 支持阶段筛选
  - 列表API优化：移除不必要的CandidateProductLine和Interview查询，使用数据库分页

### 2.2 机考管理 (Exam Management)
- **模块标识**: `exam_management`
- **管理阶段**: 所有阶段（从候选录入到离职）
- **功能**:
  - 机考申报（行内编辑）
  - 机考结果录入（行内编辑）
  - 机考记录管理（查看对话框）
  - 推进功能

### 2.3 韧测管理 (Test Management)
- **模块标识**: `test_management`
- **管理阶段**: 所有阶段（从候选录入到离职）
- **功能**:
  - 韧测申报（行内编辑）
  - 韧测结果录入（行内编辑）
  - 面推功能（推荐到面试流程）
  - 推进功能
  - 查看功能（对话框）

### 2.4 面试管理 (Interview Management)
- **模块标识**: `interview_management`
- **管理阶段**: 所有阶段（从候选录入到离职）
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
- **管理阶段**: `pending_onboarding`, `entry`, `leave`
- **功能**:
  - 员工列表查看
  - 员工信息查看（对话框查看）
  - 员工信息编辑（对话框编辑）
  - 姓名字段不可编辑
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

### 2.7 产品线管理 (Product Line Management)
- **功能**:
  - 产品线配置
  - 客户负责人管理

### 2.8 阶段配置管理 (Stage Configuration)
- **功能**:
  - 各模块阶段配置
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
| currentStage | STRING(50) | 当前阶段 |
| lastOperatorId | INTEGER | 最后操作人ID |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.2 Employee（员工表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 姓名，必填 |
| email | STRING(100) | 邮箱 |
| phone | STRING(20) | 手机号 |
| gender | STRING(10) | 性别 |
| idCard | STRING(20) | 身份证号 |
| currentStage | STRING(50) | 当前阶段（pending_onboarding/entry/leave） |
| entryDate | DATE | 入职日期 |
| entryRemark | TEXT | 入职备注 |
| leaveDate | DATE | 离职日期 |
| leaveType | STRING(20) | 离职类型 |
| leaveRemark | TEXT | 离职备注 |
| productLineId | INTEGER | 产品线ID |
| candidateId | INTEGER | 关联的候选人ID |
| lastOperatorId | INTEGER | 最后操作人ID |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.3 CandidateProductLine（候选人产品线关联表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| productLineId | INTEGER | 产品线ID（可空） |
| interviewStage | STRING(50) | 面试阶段 |
| recommendDate | DATE | 推荐日期 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：productLineId 可空，移除了唯一性约束，一个候选人可以有多个产品线记录

#### 3.1.4 Interview（面试记录表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID（NOT NULL，UNIQUE） |
| candidateProductLineId | INTEGER | 候选人产品线关联ID（可空，兼容旧数据） |
| currentStage | STRING(50) | 当前面试阶段 |
| finalStatus | STRING(20) | 最终状态（pending/passed/failed） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：一个候选人只能有一条面试记录（UNIQUE约束）

#### 3.1.5 InterviewRound（面试轮次表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| interviewId | INTEGER | 面试记录ID |
| stageCode | STRING(50) | 阶段代码 |
| stageIndex | INTEGER | 阶段索引 |
| scheduledDate | DATE | 安排日期 |
| interviewer | STRING(100) | 面试官 |
| content | TEXT | 评价内容 |
| passed | BOOLEAN | 是否通过 |
| completedAt | DATE | 完成日期 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.6 Exam（机考表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| examPaperId | INTEGER | 试卷ID |
| isOnlineExam | BOOLEAN | 是否在线考试 |
| examDate | DATE | 机考日期 |
| examCompleteDate | DATE | 机考完成日期 |
| examTotalScore | INTEGER | 机考总分 |
| isCheating | BOOLEAN | 是否作弊 |
| examScore | INTEGER | 机考分数 |
| examPassed | BOOLEAN | 机考是否通过 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.7 Test（韧测表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| issueDate | DATE | 下发日期 |
| worryValue | INTEGER | 忧虑值 |
| optimismValue | INTEGER | 乐观值 |
| consistency | INTEGER | 一致性 |
| emotionScore | INTEGER | 情绪分 |
| currentStatus | STRING(20) | 当前状态（pending-待录分/abandoned-放弃/passed-通过/failed-未通过） |
| testPassed | BOOLEAN | 韧测是否通过（兼容旧数据） |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：已删除韧测类型字段(testTypeId)，韧测类型配置表已移除；currentStatus 默认值为 pending（待录分）

#### 3.1.8 ExamPaper（机考试卷表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 试卷名称 |
| description | TEXT | 描述 |
| totalScore | INTEGER | 总分 |
| isActive | BOOLEAN | 是否激活 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.9 StageConfig（阶段配置表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| module | STRING(255) | 模块标识 |
| stages | TEXT(JSON) | 阶段列表 |
| stage_names | TEXT(JSON) | 阶段名称映射 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.13 User（用户表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| username | STRING(50) | 用户名 |
| password | STRING(255) | 密码（加密） |
| role | STRING(20) | 角色 |
| realName | STRING(100) | 真实姓名 |
| email | STRING(100) | 邮箱 |
| phone | STRING(20) | 手机号 |
| managerId | INTEGER | 上级ID |
| isActive | BOOLEAN | 是否激活 |
| lastLoginAt | DATE | 最后登录时间 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

#### 3.1.14 BusinessLine（业务线表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 业务线名称 |
| description | TEXT | 描述 |
| isActive | BOOLEAN | 是否激活 |
| canEdit | TEXT(JSON) | 可编辑用户ID列表 |
| created_at | DATE | 创建时间 |
| updated_at | DATE | 更新时间 |

**说明**：原 ProductLine 表已改名为 BusinessLine，新增 canEdit 字段用于控制哪些用户可以在面试阶段编辑业务线

#### 3.1.15 已删除表
- **ProductLineUser**：产品线用户关联表已删除
- **CandidateProductLine**：候选人产品线关联表已删除

### 3.2 数据关联关系

```
User 1:N Candidate (lastOperator)
User 1:N Employee (lastOperator)
User 1:N User (subordinates/manager)

Candidate 1:1 Exam
Candidate 1:1 Test
Candidate 1:1 Employee (when stage reaches pending_onboarding)
Candidate 1:1 Interview (一个候选人只能有一条面试记录)

Interview 1:N InterviewRound
Interview N:1 BusinessLine (productLineId)

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
| `/api/candidates/:id` | GET | 获取候选人详情 |
| `/api/candidates` | POST | 创建候选人 |
| `/api/candidates/:id` | PUT | 更新候选人 |
| `/api/candidates/:id` | DELETE | 删除候选人 |
| `/api/candidates/:id/advance` | PUT | 推进阶段 |
| `/api/candidates/:id/rollback` | PUT | 回退阶段 |
| `/api/candidates/:id/can-recommend` | GET | 检查是否可以面推 |
| `/api/candidates/:id/push-interview` | POST | 面推到面试 |
| `/api/candidates/:id/available-product-lines` | GET | 获取可用产品线 |

### 4.3 员工接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/employees` | GET | 获取员工列表 |
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
| `/api/interviews` | GET | 获取面试列表<br>参数：<br>- name: 候选人姓名（模糊搜索）<br>- currentStage: 当前阶段<br>- passStatus: 通过状态筛选（pass/fail）<br>- stages: 阶段数组（优先级高于配置）<br>- page: 页码<br>- pageSize: 每页数量 |
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

### 4.9 产品线接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/product-lines` | GET | 获取产品线列表 |
| `/api/product-lines/:id` | GET | 获取产品线详情 |
| `/api/product-lines` | POST | 创建产品线 |
| `/api/product-lines/:id` | PUT | 更新产品线 |
| `/api/product-lines/:id` | DELETE | 删除产品线 |

### 4.10 其他接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/exam-papers` | GET/POST/PUT/DELETE | 试卷管理 |
| `/api/exam-pass-lines` | GET/POST/PUT/DELETE | 合格线管理 |
| `/api/statistics` | GET | 统计数据 |

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

1. **不能面推的情况**:
   - 候选人已入职或离职
   - 候选人处于以下面试阶段：推荐面试、资面安排、技术面试一二、主管面试、租用审批、offer
   - 没有可用产品线
   - 存在进行中的面试记录（推荐面试或通过阶段）
   - 有面试记录且最新阶段是通过的

2. **可以面推的情况**:
   - 没有面试记录（第一次面推）
   - 所有面试记录都未通过，且有可用产品线

### 5.3 员工自动创建逻辑

#### 5.3.1 候选人推进到待入职（candidate.js advance接口）
当候选人从产品线推进阶段推进到 `pending_onboarding` 阶段时：
1. 后端自动为该候选人的**所有产品线**创建Employee记录（不再依赖Interview.finalStatus）
2. 如果不存在，则创建新的Employee记录
3. Employee记录包含：
   - 候选人的基本信息（name, email, phone, gender, idCard）
   - currentStage 初始化为 'pending_onboarding'
   - productLineId 设置为当前推进的产品线ID
   - candidateId 设置为候选人ID
   - lastOperatorId 设置为当前操作人
4. 同时更新CandidateProductLine和Interview表的阶段字段

#### 5.3.2 Offer阶段推进（interview.js advance接口）
当面试从offer阶段推进到 `pending_onboarding` 时：
1. 设置Interview.finalStatus为'passed'
2. 自动创建Employee记录
3. 候选人阶段通过syncCandidateStage同步更新为pending_onboarding
4. 入职日期在员工管理界面填写，不在此处录入

### 5.4 员工管理编辑规则

1. **不可编辑字段**: 姓名（从候选人同步，不可修改）
2. **入职日期**:
   - 仅当 currentStage === 'entry' 时显示
   - 必填字段
3. **离职日期、类型、备注**:
   - 仅当 currentStage === 'leave' 时显示
   - 离职日期和类型必填
   - 离职备注选填
4. **阶段切换影响**:
   - 修改currentStage时，动态显示/隐藏相关字段
   - 表单验证规则动态变化

### 5.5 阶段字段关系说明

系统中有三个阶段字段，分别位于不同表中：

| 字段 | 表名 | 说明 |
|------|------|------|
| currentStage | Candidate | 候选人的全局当前阶段 |
| currentStage | Employee | 员工的当前阶段 |
| interviewStage | CandidateProductLine | 候选人在某个具体产品线的面试阶段 |
| currentStage | Interview | 面试记录的当前阶段 |

**更新规则**:
1. 候选人推进阶段时，同步更新 Candidate.currentStage、CandidateProductLine.interviewStage、Interview.currentStage
2. Employee.currentStage 与候选人阶段在创建时同步，后续独立管理
3. 员工管理页面只修改 Employee.currentStage，不影响 Candidate.currentStage

### 5.6 数据库字段命名规范

**数据库表字段**:
- 使用 snake_case（小写下划线）命名
- 例如：`current_stage`, `product_line_id`, `created_at`

**Sequelize模型属性**:
- 使用 camelCase（小驼峰）命名
- 配置 underscored: true 自动映射
- 例如：`currentStage`, `productLineId`, `createdAt`

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
| 产品线管理 | `/product-lines` | 产品线配置 |
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
- 编辑按钮显示条件：候选人阶段不是pending_onboarding/entry/leave且面试finalStatus为pending
- 推进按钮显示条件：候选人阶段不是pending_onboarding/entry/leave且满足各阶段推进条件
- 与TestStage.vue和Employees.vue保持一致的布局结构
- 候选人通过/不通过筛选：
  - 筛选选项：全部、通过、不通过
  - 不通过：任一面试轮次标记为不通过（passed=false）
  - 通过：所有面试轮次都未标记为不通过（包括未完成的轮次，passed=null或true）

#### 6.2.2 员工管理页面 (Employees.vue)
- 对话框编辑员工信息
- 姓名字段禁用，不可编辑
- 入职日期：仅在入职阶段显示，必填
- 离职日期、类型、备注：仅在离职阶段显示
- 产品线信息显示
- 与TestStage.vue保持一致的布局结构

#### 6.2.3 韧测管理页面 (TestStage.vue)
- 韧测记录列表
- 行内编辑
- 查看对话框
- 推进按钮
- 面推按钮（按规则显示/隐藏）

---

## 7. 系统配置

### 7.1 默认阶段配置

```json
{
  "candidate_entry": ["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"],
  "exam_management": ["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"],
  "test_management": ["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"],
  "interview_management": ["candidate_entry", "exam_declare", "exam_complete", "test_declare", "test_complete", "recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer", "pending_onboarding", "entry", "leave"],
  "employee_management": ["pending_onboarding", "entry", "leave"]
}
```

### 7.2 默认用户

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | manager | 系统管理员 |
| Amin | admin123 | manager | 经理 |
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

**候选人数据流转**:
```
候选录入 → Candidate表
            ↓
机考申报 → Exam表
            ↓
韧测申报 → Test表
            ↓
面推 → CandidateProductLine表 + Interview表
            ↓
面试流程 → Interview表 + InterviewRound表
            ↓
待入职 → Candidate表(currentStage='pending_onboarding') + Employee表(自动创建)
            ↓
入职 → Employee表(entryDate, currentStage='entry')
            ↓
离职 → Employee表(leaveDate, leaveType, leaveRemark, currentStage='leave')
```

---

## 10. 安全考虑

1. **JWT认证**: 所有API接口需要Token认证
2. **密码加密**: 使用bcryptjs加密存储
3. **输入验证**: 前端和后端双重验证
4. **SQL注入防护**: 使用Sequelize ORM
5. **权限控制**: 基于角色的访问控制

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.13 | 2026-05-11 | 更新内容：<br>1. 修复统计报表模块报错问题：`by-consultant` 和 `summary` 接口将 `consultantId` 字段从 `Candidate` 表改为从 `CandidateStage` 表查询<br>2. 更新project_prd.md、database_schema.sql、recruit_rule.md文档 |
| 1.12 | 2026-05-09 | 更新内容：<br>1. 员工管理所有阶段变化都会同步到面试表<br>2. 员工和面试关联统一使用 candidateId<br>3. 面试管理列表新增入职日期和离职日期列，从 Employee 表获取<br>4. 修复编辑 Offer 阶段时显示接受状态和入职日期<br>5. 修复员工管理编辑保存时入职日期丢失问题<br>6. 更新project_prd.md、database_schema.sql、recruit_rule.md文档 |
| 1.11 | 2026-05-07 | 更新内容：<br>1. Interview表新增candidateId字段（NOT NULL + UNIQUE），实现"一个候选人只能有一次面试机会"<br>2. CandidateProductLine表productLineId改为可空，移除唯一性约束<br>3. 删除韧测类型表(TestType)及相关代码<br>4. 删除ProductLine表的clientOwner字段<br>5. 更新project_prd.md、database_schema.sql、recruit_rule.md文档 |
| 1.10 | 2026-05-05 | 更新内容：<br>1. 面试管理模块新增候选人通过/不通过筛选功能<br>2. 前端添加passStatus筛选下拉框（全部、通过、不通过）<br>3. 后端GET /api/interviews接口支持passStatus参数<br>4. 筛选规则：不通过=任一面试轮次passed=false，通过=所有面试轮次都未标记为不通过<br>5. 更新project_prd.md和recruit_rule.md文档 |
| 1.9 | 2026-05-05 | 更新内容：<br>1. 优化面试管理模块：与其他模块保持一致的列表获取逻辑和API优化<br>2. interviewApi.getAll增加stages数组参数处理<br>3. 面试管理前端支持传递availableStages给后端<br>4. 面试管理后端支持stages参数，优先使用前端传来的阶段配置<br>5. 面试管理后端使用findAndCountAll数据库分页<br>6. 修复面试管理数据加载时序：确保availableStages在fetchEmployees前加载完成 |
| 1.8 | 2026-05-05 | 更新内容：<br>1. 优化员工管理模块：与其他模块保持一致的列表获取逻辑和API优化<br>2. employeeApi.getAll增加stages数组参数处理<br>3. 员工管理前端支持传递availableStages给后端<br>4. 员工管理后端支持stages参数，优先使用前端传来的阶段配置<br>5. 修复员工管理数据加载时序：确保availableStages在fetchEmployees前加载完成 |
| 1.7 | 2026-05-05 | 更新内容：<br>1. 优化面试管理syncCandidateStage函数逻辑：当finalStatus为passed时，候选人阶段保持与interview.currentStage一致，而非强制设为pending_onboarding<br>2. 修改PUT接口逻辑：编辑保存时，仅当轮次未通过时设置finalStatus为failed，不再因为offer阶段通过就设置为passed<br>3. 修复前端canEditCurrentStage函数：删除finalStatus检查，即使finalStatus为passed，只要是当前阶段就可以编辑<br>4. 优化机考和韧测模块：与候选录入模块保持一致的列表获取逻辑和API优化<br>5. 推进接口保持不变：只有从offer推进到pending_onboarding时才设置finalStatus为passed |
| 1.6 | 2026-05-05 | 更新内容：<br>1. 候选录入模块列表获取逻辑修改：从"配置阶段+之后阶段"改为"仅配置的阶段"<br>2. 优化候选录入列表API：移除不必要的CandidateProductLine和Interview查询，避免N+1问题<br>3. 改用数据库分页（findAndCountAll），提升性能<br>4. 简化阶段筛选逻辑：仅使用候选人的currentStage<br>5. 修复前端数据加载时序：确保availableStages在fetchCandidates前加载完成<br>6. 同步优化机考和韧测模块，保持一致的逻辑 |
| 1.5 | 2026-05-04 | 更新内容：<br>1. 候选人表新增consultantId字段，用于标识负责该候选人招聘全流程的顾问<br>2. 主管和顾问都可以作为consultant_id<br>3. 新增候选人时默认选择当前登录用户作为负责顾问<br>4. 统计报表by-consultant接口支持主管和顾问统计（剔除admin用户）<br>5. 面试管理分页功能修复<br>6. 统计数据接口修复（添加Interview和InterviewRound模型引入）<br>7. 控制台统计卡片更新：新增韧测完成、待入职统计<br>8. 饼图标签配置优化，显示小扇形标签和连接线 |
| 1.4 | 2026-05-04 | 更新内容：<br>1. can-recommend API移除候选人当前阶段限制（blockedStages），改为检查面试记录状态<br>2. hasPassedRecord改为hasPassedOrPendingRecord，存在通过或pending状态的面试记录都不能面推<br>3. 员工阶段变更为entry或leave时，同步更新对应候选人的currentStage<br>4. 面试管理对话框新增"保存&推进"按钮功能<br>5. canAdvanceInDialog函数用于对话框内推进条件判断<br>6. 推荐面试日期显示逻辑优化（getRoundDate增加recommend_interview阶段处理）<br>7. 面试管理表格简化（移除性别和邮箱列） |
| 1.3 | 2026-05-04 | 更新内容：<br>1. 统一后端分页响应格式（pagination对象）<br>2. 候选人列表和各阶段列表直接使用后端分页数据<br>3. 面试管理：编辑offer时不改变候选人阶段，只有点击推进才同步<br>4. can-recommend API增加面试阶段限制（blockedStages包含所有面试阶段）<br>5. 候选人推进到待入职时创建所有产品线的员工记录<br>6. offer阶段推进时创建员工记录<br>7. 优化面试管理按钮显示逻辑（编辑按钮依赖finalStatus为pending，推进按钮依赖候选人阶段和canAdvance函数）<br>8. pending_onboarding状态不显示推进和编辑按钮<br>9. 入职日期在员工管理界面填写，面试管理界面删除入职日期列 |
| 1.2 | 2026-05-04 | 更新内容：<br>1. 新增Employee表，分离Candidate和Employee数据<br>2. 员工管理页面改为对话框编辑，姓名不可编辑<br>3. 入职日期和离职相关字段条件显示与必填验证<br>4. 统一所有模块的页面布局<br>5. 完善阶段流转规则（新增pending_onboarding阶段）<br>6. 实现员工自动创建逻辑<br>7. 规范数据库字段命名为snake_case<br>8. 更新数据库Schema文档<br>9. 员工管理删除推进功能，产品线信息显示<br>10. 修复面试推进阶段同步问题 |
| 1.1 | 2026-04-30 | 更新内容：<br>1. 员工管理页面新增查看对话框功能<br>2. 员工管理页面当前阶段可编辑（下拉选择入职/离职）<br>3. 修复后端更新候选人阶段的逻辑<br>4. 明确currentStage和interviewStage的关系和更新规则 |
| 1.0 | 2026-04 | 初始版本 |

