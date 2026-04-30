
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
租用审批 → Offer → 入职 → 离职
```

---

## 2. 功能模块

### 2.1 候选录入管理 (Candidate Entry)
- **模块标识**: `candidate_entry`
- **管理阶段**: `employee_entry`
- **功能**:
  - 候选人信息录入（姓名、性别、手机号、邮箱、身份证号）
  - 候选人列表查看和搜索
  - 候选人详情查看

### 2.2 机考管理 (Exam Management)
- **模块标识**: `exam_management`
- **管理阶段**: `exam_declare`, `exam_complete`
- **功能**:
  - 机考申报
  - 机考结果录入
  - 机考记录管理

### 2.3 韧测管理 (Test Management)
- **模块标识**: `test_management`
- **管理阶段**: `test_declare`, `test_complete`
- **功能**:
  - 韧测申报
  - 韧测结果录入
  - 面推功能（推荐到面试流程）

### 2.4 面试管理 (Interview Management)
- **模块标识**: `interview_management`
- **管理阶段**: `recommend_interview`, `qualification_interview`, `tech_interview_1`, `tech_interview_2`, `manager_interview`, `approval`, `offer`
- **功能**:
  - 推荐面试录入
  - 资格面试管理
  - 技术面试管理
  - 主管面试管理
  - 租用审批管理
  - Offer管理
  - 推进到入职（需填写入职日期和备注）

### 2.5 员工管理 (Employee Management)
- **模块标识**: `employee_management`
- **管理阶段**: `entry`, `leave`
- **功能**:
  - 员工列表查看
  - 员工信息查看（对话框查看）
  - 员工信息编辑（行内编辑）
  - 当前阶段可编辑（下拉选择入职/离职）
  - 离职处理（自动更新状态）
  - 入职日期、离职日期管理

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
| entryDate | DATE | 入职日期 |
| entryRemark | TEXT | 入职备注 |
| leaveDate | DATE | 离职日期 |
| leaveReason | STRING(50) | 离职原因 |
| leaveRemark | TEXT | 离职备注 |
| lastOperatorId | INTEGER | 最后操作人ID |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.2 CandidateProductLine（候选人产品线关联表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| productLineId | INTEGER | 产品线ID |
| interviewStage | STRING(50) | 面试阶段 |
| recommendDate | DATE | 推荐日期 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.3 Interview（面试记录表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateProductLineId | INTEGER | 候选人产品线关联ID |
| qualificationInterviewDate | DATE | 资面日期 |
| qualificationInterviewer | STRING(100) | 资面顾问 |
| qualificationConclusion | TEXT | 资面结论 |
| qualificationPassed | BOOLEAN | 资面是否通过 |
| techInterview1Date | DATE | 技一日期 |
| techInterview1Interviewer | STRING(100) | 技一面试官 |
| techInterview1Content | TEXT | 技一评价 |
| techInterview1Passed | BOOLEAN | 技一是否通过 |
| techInterview2Date | DATE | 技二日期 |
| techInterview2Interviewer | STRING(100) | 技二面试官 |
| techInterview2Content | TEXT | 技二评价 |
| techInterview2Passed | BOOLEAN | 技二是否通过 |
| managerInterviewDate | DATE | 主面日期 |
| managerInterviewer | STRING(100) | 主考官 |
| managerInterviewContent | TEXT | 主面评价 |
| managerInterviewPassed | BOOLEAN | 主面是否通过 |
| approvalDate | DATE | 审批日期 |
| approver | STRING(100) | 审批人 |
| approvalRemark | TEXT | 审批备注 |
| approvalPassed | BOOLEAN | 审批是否通过 |
| offerDate | DATE | Offer日期 |
| offerApprover | STRING(100) | Offer审批人 |
| offerRemark | TEXT | Offer备注 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.4 Exam（机考表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| examPaperId | INTEGER | 试卷ID |
| status | STRING(20) | 状态 |
| score | INTEGER | 分数 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.5 Test（韧测表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| candidateId | INTEGER | 候选人ID |
| testTypeId | INTEGER | 韧测类型ID |
| status | STRING(20) | 状态 |
| result | TEXT | 结果 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.6 StageConfig（阶段配置表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| module | STRING(50) | 模块标识 |
| stages | TEXT(JSON) | 阶段列表 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.7 User（用户表）

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
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

#### 3.1.8 ProductLine（产品线表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| name | STRING(100) | 产品线名称 |
| clientOwner | STRING(100) | 客户负责人 |
| isActive | BOOLEAN | 是否激活 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

### 3.2 数据关联关系

```
Candidate 1:N Exam
Candidate 1:N Test
Candidate 1:N CandidateProductLine
CandidateProductLine 1:1 Interview
ProductLine 1:N CandidateProductLine
User 1:N Candidate (lastOperator)
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
| `/api/candidates/employees` | GET | 获取员工列表（入职/离职） |
| `/api/candidates/:id` | GET | 获取候选人详情 |
| `/api/candidates` | POST | 创建候选人 |
| `/api/candidates/:id` | PUT | 更新候选人 |
| `/api/candidates/:id` | DELETE | 删除候选人 |
| `/api/candidates/:id/advance` | PUT | 推进阶段 |
| `/api/candidates/:id/rollback` | PUT | 回退阶段 |
| `/api/candidates/:id/can-recommend` | GET | 检查是否可以面推 |
| `/api/candidates/:id/push-interview` | POST | 面推到面试 |
| `/api/candidates/:id/available-product-lines` | GET | 获取可用产品线 |

### 4.3 机考接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/exams` | GET | 获取机考列表 |
| `/api/exams/candidate/:candidateId` | GET | 获取候选人机考记录 |
| `/api/exams` | POST | 创建机考记录 |
| `/api/exams/:id` | PUT | 更新机考记录 |
| `/api/exams/:id` | DELETE | 删除机考记录 |

### 4.4 韧测接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/tests` | GET | 获取韧测列表 |
| `/api/tests/candidate/:candidateId` | GET | 获取候选人韧测记录 |
| `/api/tests` | POST | 创建韧测记录 |
| `/api/tests/:id` | PUT | 更新韧测记录 |
| `/api/tests/:id` | DELETE | 删除韧测记录 |

### 4.5 面试接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/interviews` | GET | 获取面试列表 |
| `/api/interviews/candidate/:candidateId` | GET | 获取候选人面试记录 |
| `/api/interviews/:id` | GET | 获取面试详情 |
| `/api/interviews` | POST | 创建面试记录 |
| `/api/interviews/:id` | PUT | 更新面试记录 |
| `/api/interviews/:id` | DELETE | 删除面试记录 |

### 4.6 阶段配置接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stage-configs` | GET | 获取所有阶段配置 |
| `/api/stage-configs/:module` | GET | 获取指定模块配置 |
| `/api/stage-configs` | POST | 创建阶段配置 |
| `/api/stage-configs/:module` | PUT | 更新阶段配置 |
| `/api/stage-configs/:module` | DELETE | 删除阶段配置 |

### 4.7 用户接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users/:id` | GET | 获取用户详情 |
| `/api/users` | POST | 创建用户 |
| `/api/users/:id` | PUT | 更新用户 |
| `/api/users/:id` | DELETE | 删除用户 |

### 4.8 产品线接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/product-lines` | GET | 获取产品线列表 |
| `/api/product-lines/:id` | GET | 获取产品线详情 |
| `/api/product-lines` | POST | 创建产品线 |
| `/api/product-lines/:id` | PUT | 更新产品线 |
| `/api/product-lines/:id` | DELETE | 删除产品线 |

---

## 5. 核心业务逻辑

### 5.1 阶段流转规则

| 当前阶段 | 下一阶段 | 推进条件 |
|----------|----------|----------|
| employee_entry | exam_declare | 自动 |
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
| offer | entry | 填写入职信息 |
| entry | leave | 填写离职信息 |

### 5.2 面推规则

1. **不能面推的情况**:
   - 候选人已入职或离职
   - 候选人处于推荐面试、offer阶段
   - 没有可用产品线
   - 存在进行中的面试记录（推荐面试或通过阶段）
   - 有面试记录且最新阶段是通过的

2. **可以面推的情况**:
   - 没有面试记录（第一次面推）
   - 所有面试记录都未通过，且有可用产品线

### 5.3 编辑权限控制

- 当前模块配置阶段的记录可编辑
- 后续阶段的记录不可编辑，只能查看
- 当前阶段之前的字段不可编辑

### 5.4 入职推进特殊处理

当从offer阶段推进到入职阶段时：
1. 弹出对话框填写入职日期和备注
2. 更新Candidate表的entryDate和entryRemark字段
3. 更新Candidate表的currentStage为'entry'
4. 更新该候选人所有CandidateProductLine记录的interviewStage为'entry'（确保其他面试记录不可编辑）

### 5.5 离职处理

- 填写离职日期后，自动将currentStage改为'leave'
- 删除离职日期后，自动将currentStage改回'entry'
- **优先级**: 如果前端明确提供了currentStage，则以提供的为准，不再根据leaveDate自动设置

### 5.6 阶段字段关系说明

系统中有两个阶段字段，分别位于不同表中：

| 字段 | 表名 | 说明 |
|------|------|------|
| currentStage | Candidate | 候选人的全局当前阶段 |
| interviewStage | CandidateProductLine | 候选人在某个具体产品线的面试阶段 |

**更新规则**:
1. 前端编辑员工信息时，修改的是 Candidate.currentStage
2. 后端更新候选人信息时，优先使用前端提供的 currentStage
3. 后端不再根据产品线的 interviewStage 自动覆盖 Candidate.currentStage
4. 只有前端没有提供 currentStage 时，后端才会根据 leaveDate 自动判断
5. 面试管理页面中，编辑按钮的显示逻辑依赖 candidate.currentStage（不为entry/leave时显示）

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
| 韧测类型 | `/test-types` | 韧测类型配置 |
| 阶段配置 | `/stage-config` | 阶段配置管理 |
| 统计报表 | `/statistics` | 数据统计 |

### 6.2 页面功能

#### 6.2.1 面试管理页面 (InterviewStage.vue)
- 按阶段筛选候选人
- 查看和编辑面试记录
- 推进阶段（offer阶段需弹框填入职信息）
- 阶段字段按配置显示
- 已完成阶段字段不可编辑

#### 6.2.2 员工管理页面 (Employees.vue)
- 行内编辑员工信息
- 入职日期、离职日期管理
- 自动状态更新（填写离职日期→离职状态）
- 无删除功能

#### 6.2.3 韧测管理页面 (TestStage.vue)
- 韧测记录列表
- 面推按钮（按规则显示/隐藏）

---

## 7. 系统配置

### 7.1 默认阶段配置

```json
{
  "candidate_entry": ["employee_entry"],
  "exam_management": ["exam_declare", "exam_complete"],
  "test_management": ["test_declare", "test_complete"],
  "interview_management": ["recommend_interview", "qualification_interview", "tech_interview_1", "tech_interview_2", "manager_interview", "approval", "offer"],
  "employee_management": ["entry", "leave"]
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
面试流程 → Interview表字段更新
            ↓
入职 → Candidate表(entryDate, currentStage='entry')
            ↓
离职 → Candidate表(leaveDate, currentStage='leave')
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
| 1.1 | 2026-04-30 | 更新内容：<br>1. 员工管理页面新增查看对话框功能<br>2. 员工管理页面当前阶段可编辑（下拉选择入职/离职）<br>3. 修复后端更新候选人阶段的逻辑，不再根据产品线interviewStage自动覆盖Candidate.currentStage<br>4. 明确currentStage和interviewStage的关系和更新规则 |
| 1.0 | 2026-04 | 初始版本 |
