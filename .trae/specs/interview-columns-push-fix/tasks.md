# 面试管理列调整及韧测面推按钮修复 - 实现计划

## [x] Task 1: 调整面试管理表格列顺序
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 InterviewStage.vue 的表格列顺序
  - 调整为：产品线、客户负责人、推荐日期、资面日期、资面结果、技一日期、技一结果、技二日期、技二结果、主面日期、主面结果、审批日期、审批结果、Offer日期、Offer审批人、入职日期
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement`: 验证面试管理表格列顺序是否正确

## [x] Task 2: 修复韧测管理面推按钮显示逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查 TestStage.vue 的 canPushInterview 函数逻辑
  - 确保当候选人有任意面试阶段不通过时显示面推按钮
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgement`: 验证资面不通过的候选人在韧测管理界面显示面推按钮

## [x] Task 3: 测试验证
- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**:
  - 验证面试管理列顺序调整正确
  - 验证韧测管理面推按钮在面试不通过时显示
- **Acceptance Criteria Addressed**: AC-1, AC-2