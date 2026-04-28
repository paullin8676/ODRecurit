# 数据库表结构重构规格说明书

## Why
当前数据库设计中，考试相关字段、韧测相关字段和面试相关字段都存储在 CandidateProductLine 关联表中，导致数据冗余和结构不清晰。需要将这些字段拆分到各自的独立表中，以实现：
- 数据结构更清晰
- 考试管理和韧测管理可以独立查询
- 面试记录支持多产品线关联
- 员工列表只获取候选人基本信息

## What Changes

### 1. 新表结构设计

#### 1.1 候选人表 (Candidate) - 保持不变
存储候选人的基本信息，每个候选人只有一条记录。

#### 1.2 机考表 (Exam) - 新建
一个候选人只有一条或者0条机考记录。
- `candidateId`: 候选人ID（外键）
- `examPaperId`: 试卷ID（外键）
- `isOnlineExam`: 是否机考
- `examDate`: 考试日期
- `examCompleteDate`: 完成日期
- `examTotalScore`: 总分
- `examScore`: 实际得分
- `isCheating`: 是否作弊
- `examPassed`: 是否通过
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### 1.3 韧测表 (Test) - 新建
一个候选人只有一条或者0条韧测记录。
- `candidateId`: 候选人ID（外键）
- `testTypeId`: 韧测类型ID（外键）
- `testDate`: 测试日期
- `testCompleteDate`: 完成日期
- `testTotalScore`: 总分
- `worryValue`: 忧虑值
- `optimismValue`: 乐观值
- `consistency`: 一致性
- `testPassed`: 是否通过
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### 1.4 面试表 (Interview) - 新建
一个候选人可以有多条不重复产品线的面试记录。
- `candidateId`: 候选人ID（外键）
- `productLineId`: 产品线ID（外键）
- `recommendDate`: 推荐日期
- `qualificationInterviewDate`: 资面日期
- `qualificationInterviewer`: 资面顾问
- `qualificationConclusion`: 资面结论
- `qualificationPassed`: 资面是否通过
- `techInterview1Date`: 技术面试(一)日期
- `techInterview1Interviewer`: 技术面试(一)面试官
- `techInterview1Content`: 技术面试(一)评价内容
- `techInterview1Passed`: 技术面试(一)是否通过
- `techInterview2Date`: 技术面试(二)日期
- `techInterview2Interviewer`: 技术面试(二)面试官
- `techInterview2Content`: 技术面试(二)评价内容
- `techInterview2Passed`: 技术面试(二)是否通过
- `managerInterviewDate`: 主管面试日期
- `managerInterviewer`: 主考官
- `managerInterviewContent`: 主管面试评价内容
- `managerInterviewPassed`: 主管面试是否通过
- `approvalDate`: 审批日期
- `approver`: 审批人
- `approvalRemark`: 审批备注
- `approvalPassed`: 审批是否通过
- `offerDate`: Offer日期
- `offerApprover`: Offer审批人
- `offerRemark`: Offer备注
- `entryDate`: 入职日期
- `entryRemark`: 入职备注
- `leaveDate`: 离职日期
- `leaveReason`: 离职原因
- `leaveRemark`: 离职备注
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### 1.5 候选人产品线关联表 (CandidateProductLine) - 简化
仅保留候选人与产品线的基本关联信息，不再包含考试、韧测、面试字段。
- `candidateId`: 候选人ID（外键）
- `productLineId`: 产品线ID（外键）
- `consultantId`: 顾问ID（外键）
- `clientOwner`: 客户负责人
- `currentStage`: 当前阶段
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 2. 关联关系变更

#### 2.1 现有关系调整
- **移除**: CandidateProductLine 与 ExamPaper 的关联
- **移除**: CandidateProductLine 与 TestType 的关联
- **移除**: CandidateProductLine 中的所有考试、韧测、面试相关字段

#### 2.2 新增关系
- **Candidate -> Exam**: 一对多（一个候选人0或1条机考记录）
- **Candidate -> Test**: 一对多（一个候选人0或1条韧测记录）
- **Candidate -> Interview**: 一对多（一个候选人可多条面试记录）
- **Interview -> ProductLine**: 多对一（面试表关联产品线）
- **CandidateProductLine 保持**: 候选人与产品线的基本关联（用于跟踪候选人对产品线的意向）

### 3. 功能变更

#### 3.1 员工列表
- **变更前**: 从 CandidateProductLine 展开获取数据
- **变更后**: 只从 Candidate 表获取记录
- 每个候选人只显示一条记录
- 当前阶段取自 Candidate 表的 currentStage 字段

#### 3.2 机考管理
- **变更前**: 从 CandidateProductLine 查询考试字段
- **变更后**: 从 Exam 表独立查询
- 每个候选人只有0或1条机考记录
- 支持新增、编辑、删除机考记录

#### 3.3 韧测管理
- **变更前**: 从 CandidateProductLine 查询韧测字段
- **变更后**: 从 Test 表独立查询
- 每个候选人只有0或1条韧测记录
- 支持新增、编辑、删除韧测记录

#### 3.4 面试阶段
- **变更前**: 从 CandidateProductLine 查询面试字段
- **变更后**: 从 Interview 表独立查询
- 每个候选人可以有多条不重复产品线的面试记录
- 产品线只与面试表做关联
- 支持新增、编辑、删除面试记录
- 支持按产品线筛选面试记录

### 4. 数据迁移策略
- 创建新的表结构（Exam, Test, Interview）
- 从 CandidateProductLine 表迁移数据到新表
- 保留 CandidateProductLine 表的基本关联字段
- 更新后端 API 和前端页面

## Impact

### 受影响的规格
- candidate-interview-system: 需要更新候选人、面试阶段相关的功能规格
- exam-interview-stages: 需要更新考试管理、面试管理相关的功能规格

### 受影响的代码

#### 后端模型文件
- `backend/src/models/Candidate.js` - 保持不变
- `backend/src/models/Exam.js` - 新建（机考表）
- `backend/src/models/Test.js` - 新建（韧测表）
- `backend/src/models/Interview.js` - 新建（面试表）
- `backend/src/models/CandidateProductLine.js` - 简化字段
- `backend/src/models/index.js` - 更新关联关系

#### 后端路由文件
- `backend/src/routes/candidate.js` - 更新候选人相关 API
- `backend/src/routes/exam.js` - 新建（机考相关 API）
- `backend/src/routes/test.js` - 新建（韧测相关 API）
- `backend/src/routes/interview.js` - 新建（面试相关 API）

#### 前端页面文件
- `frontend/src/views/Employees.vue` - 更新员工列表
- `frontend/src/views/ExamStage.vue` - 更新机考管理页面
- `frontend/src/views/InterviewStage.vue` - 更新面试管理页面
- `frontend/src/views/ExamPaperManagement.vue` - 可能需要调整
- `frontend/src/views/TestTypeManagement.vue` - 可能需要调整

#### 前端 API 文件
- `frontend/src/api/index.js` - 更新 API 调用

## ADDED Requirements

### Requirement: 机考记录独立管理
系统 SHALL 提供独立的机考记录管理功能，允许为每个候选人创建、编辑、删除0或1条机考记录。

#### Scenario: 创建机考记录
- **WHEN**: 用户在机考管理页面为候选人创建机考记录
- **THEN**: 系统创建一条机考记录并关联到候选人

#### Scenario: 编辑机考记录
- **WHEN**: 用户编辑已有机考记录
- **THEN**: 系统更新机考记录的相关字段

#### Scenario: 删除机考记录
- **WHEN**: 用户删除已有机考记录
- **THEN**: 系统标记删除该条机考记录

### Requirement: 韧测记录独立管理
系统 SHALL 提供独立的韧测记录管理功能，允许为每个候选人创建、编辑、删除0或1条韧测记录。

#### Scenario: 创建韧测记录
- **WHEN**: 用户在韧测管理页面为候选人创建韧测记录
- **THEN**: 系统创建一条韧测记录并关联到候选人

#### Scenario: 编辑韧测记录
- **WHEN**: 用户编辑已有韧测记录
- **THEN**: 系统更新韧测记录的相关字段

#### Scenario: 删除韧测记录
- **WHEN**: 用户删除已有韧测记录
- **THEN**: 系统标记删除该条韧测记录

### Requirement: 面试记录多产品线管理
系统 SHALL 提供独立的面试记录管理功能，允许为每个候选人创建多条不重复产品线的面试记录。

#### Scenario: 创建面试记录
- **WHEN**: 用户在面试管理页面为候选人创建面试记录并选择产品线
- **THEN**: 系统创建一条面试记录并关联到候选人和产品线

#### Scenario: 多产品线面试
- **WHEN**: 候选人在不同产品线参加多轮面试
- **THEN**: 系统为每个产品线创建独立的面试记录

#### Scenario: 产品线筛选
- **WHEN**: 用户按产品线筛选面试记录
- **THEN**: 系统显示该产品线下的所有面试记录

## MODIFIED Requirements

### Requirement: 员工列表显示
**变更前**: 员工列表从 CandidateProductLine 展开获取数据，一个候选人可能显示多条记录
**变更后**: 员工列表只从 Candidate 表获取记录，一个候选人只显示一条记录

### Requirement: 考试管理功能
**变更前**: 考试管理包含机考和韧测字段，从 CandidateProductLine 表查询
**变更后**: 拆分为机考管理和韧测管理，分别从独立的 Exam 表和 Test 表查询

### Requirement: 面试阶段功能
**变更前**: 面试阶段字段存储在 CandidateProductLine 表
**变更后**: 面试阶段字段存储在独立的 Interview 表，产品线只与面试表做关联

## REMOVED Requirements

### Requirement: CandidateProductLine 表的考试、韧测、面试字段
**Reason**: 这些字段应该存储在各自独立的表中，以实现数据分离和清晰的结构
**Migration**: 将数据迁移到新的 Exam、Test、Interview 表后，移除 CandidateProductLine 表中的相关字段