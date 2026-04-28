# 韧测管理和面试管理问题修复 - 实现计划

## [x] Task 1: 分析韧测管理界面数据获取逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查 TestStage.vue 的数据获取逻辑
  - 确认面推后记录为何从界面消失
  - 确定需要修改的代码位置
- **Acceptance Criteria Addressed**: 问题1修复

## [x] Task 2: 修复韧测管理面推后记录保留问题
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 修改 TestStage.vue 的阶段过滤逻辑
  - 确保面推后（阶段为推荐面试但未推进到后续阶段）的记录仍然显示
  - 或修改数据获取 API 返回包含面推后未推进的记录
- **Acceptance Criteria Addressed**: 问题1修复

## [x] Task 3: 分析面试管理查看/编辑数据加载逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查 InterviewStage.vue 的查看/编辑弹框逻辑
  - 确认产品线和客户负责人字段未加载的原因
  - 确定需要修改的代码位置
- **Acceptance Criteria Addressed**: 问题2修复

## [x] Task 4: 修复面试管理查看/编辑产品线和客户负责人显示
- **Priority**: P0
- **Depends On**: Task 3
- **Description**:
  - 修改 InterviewStage.vue 查看/编辑弹框的数据加载逻辑
  - 从 CandidateProductLine 表获取产品线和客户负责人
  - 确保查看和编辑模式都能正确显示和编辑这些字段
- **Acceptance Criteria Addressed**: 问题2修复

## [ ] Task 5: 测试验证 - 韧测管理
- **Priority**: P1
- **Depends On**: Task 2
- **Description**:
  - 测试面推后记录是否保留在韧测管理界面
  - 测试面推功能是否正常
  - 测试是否可以对同一候选人多次面推到不同产品线
- **Acceptance Criteria Addressed**: 问题1验证

## [ ] Task 6: 测试验证 - 面试管理
- **Priority**: P1
- **Depends On**: Task 4
- **Description**:
  - 测试面试管理查看弹框是否显示产品线和客户负责人
  - 测试面试管理编辑弹框是否显示并可编辑产品线和客户负责人
- **Acceptance Criteria Addressed**: 问题2验证
