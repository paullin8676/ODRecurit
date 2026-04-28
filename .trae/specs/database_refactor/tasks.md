# 招聘管理系统数据库重构 - 实现计划

## [x] Task 1: 修改CandidateProductLine模型
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 删除client_owner字段
  - 将current_stage字段重命名为interview_stage
- **Acceptance Criteria Addressed**: AC-5, AC-7
- **Test Requirements**:
  - `programmatic` TR-1.1: 数据库表结构变更后，CandidateProductLine表不再有client_owner字段
  - `programmatic` TR-1.2: 数据库表结构变更后，current_stage字段变为interview_stage

## [x] Task 2: 修改Candidate模型
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 添加entry_date、entry_remark、leave_date、leave_reason、leave_remark字段
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-2.1: Candidate表包含entry_date、entry_remark、leave_date、leave_reason、leave_remark字段
  - `programmatic` TR-2.2: 新增字段允许为NULL

## [x] Task 3: 修改Interview模型
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 删除entry_date、entry_remark、leave_date、leave_reason、leave_remark字段
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-3.1: Interview表不再有entry_date、entry_remark、leave_date、leave_reason、leave_remark字段

## [x] Task 4: 修改后端API - 面试记录CRUD
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3
- **Description**: 
  - 更新candidate.js路由，适配新的数据模型
  - 移除对client_owner的处理（从产品线获取）
  - 调整interview_stage字段名
  - 入职/离职字段操作改为操作Candidate表
- **Acceptance Criteria Addressed**: AC-1, AC-5, AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: 创建面试记录时自动关联产品线的client_owner
  - `programmatic` TR-4.2: 更新面试记录时，Candidate表的current_stage与interview_stage同步
  - `programmatic` TR-4.3: 入职/离职字段正确保存到Candidate表

## [x] Task 5: 实现面试记录唯一性约束
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 确保同一候选人在同一产品线只有一条面试记录
  - 通过数据库唯一约束+代码验证实现
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-5.1: 尝试创建重复记录时返回错误
  - `programmatic` TR-5.2: 错误信息清晰说明"该候选人已在该产品线有面试记录"

## [x] Task 6: 实现面推业务规则
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 实现面推规则的后端验证逻辑
  - 入职/离职阶段不能面推
  - 无可用产品线不能面推
  - 当前在推荐面试阶段不能面推
  - 有通过记录不能面推
  - 所有记录未通过可以面推
  - 无面试记录可以面推
- **Acceptance Criteria Addressed**: AC-8, AC-9, AC-10, AC-11, AC-12, AC-13
- **Test Requirements**:
  - `programmatic` TR-6.1: 入职/离职阶段调用面推API返回错误
  - `programmatic` TR-6.2: 无可用产品线时调用面推API返回错误
  - `programmatic` TR-6.3: 有进行中面试记录时调用面推API返回错误
  - `programmatic` TR-6.4: 所有记录未通过时可以成功面推
  - `programmatic` TR-6.5: 无面试记录时可以成功面推

## [x] Task 7: 修改面试管理前端 - 查看/编辑界面
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - 修改编辑界面：只显示当前阶段及之前阶段的字段
  - 之前阶段字段设为不可编辑
  - 修改查看界面：所有字段只读
  - 客户负责人从产品线获取显示
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-5
- **Test Requirements**:
  - `human-judgment` TR-7.1: 编辑界面只显示当前阶段及之前阶段字段
  - `human-judgment` TR-7.2: 之前阶段字段显示为禁用状态
  - `human-judgment` TR-7.3: 查看界面所有字段只读
  - `human-judgment` TR-7.4: 客户负责人显示正确（来自产品线）

## [ ] Task 8: 修改韧测管理前端 - 面推按钮控制
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 根据面推规则控制面推按钮的显示
  - 提供API判断是否可以面推
- **Acceptance Criteria Addressed**: AC-8, AC-9, AC-10, AC-11, AC-12, AC-13
- **Test Requirements**:
  - `human-judgment` TR-8.1: 入职/离职阶段不显示面推按钮
  - `human-judgment` TR-8.2: 有进行中面试时不显示面推按钮
  - `human-judgment` TR-8.3: 所有记录未通过时显示面推按钮
  - `human-judgment` TR-8.4: 无面试记录时显示面推按钮

## [ ] Task 9: 测试和验证
- **Priority**: P1
- **Depends On**: 所有任务
- **Description**: 
  - 测试所有API接口
  - 验证业务规则
  - 测试前端界面功能
- **Acceptance Criteria Addressed**: 所有
- **Test Requirements**:
  - `programmatic` TR-9.1: 所有API接口返回正确状态码
  - `human-judgment` TR-9.2: 前端界面功能正常
  - `human-judgment` TR-9.3: 面推按钮显示符合业务规则