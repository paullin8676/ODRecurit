# 模块数据获取逻辑调整 - 实现计划

## [x] 任务 1: 分析阶段配置和阶段顺序
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 确认阶段顺序在 STAGES 数组中的定义
  - 分析各模块的阶段配置
  - 确定如何定义"现阶段"
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: 确认 STAGES 数组的定义和顺序
  - `programmatic` TR-1.2: 确认各模块的阶段配置
- **Notes**: 需要检查 backend/src/routes/candidate.js 中的 STAGES 数组定义

## [x] 任务 2: 调整候选录入模块数据获取逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 Candidates.vue 的数据获取逻辑，使其获取候选录入及后续所有阶段的数据
  - 实现现阶段记录可编辑和推进，非现阶段记录只能查看的权限控制
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证候选录入模块获取候选录入及后续所有阶段的数据
  - `human-judgment` TR-2.2: 验证现阶段记录可编辑和推进，非现阶段记录只能查看
- **Notes**: 需要修改前端的数据过滤逻辑

## [x] 任务 3: 调整机考管理模块数据获取逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 ExamStage.vue 的数据获取逻辑，使其获取机考相关阶段及后续所有阶段的数据
  - 实现现阶段记录可编辑和推进，非现阶段记录只能查看的权限控制
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-3.1: 验证机考管理模块获取机考相关阶段及后续所有阶段的数据
  - `human-judgment` TR-3.2: 验证现阶段记录可编辑和推进，非现阶段记录只能查看
- **Notes**: 需要修改前端的数据过滤逻辑

## [x] 任务 4: 调整韧测管理模块数据获取逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 TestStage.vue 的数据获取逻辑，使其获取韧测相关阶段及后续所有阶段的数据
  - 实现现阶段记录可编辑和推进，非现阶段记录只能查看的权限控制
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-4.1: 验证韧测管理模块获取韧测相关阶段及后续所有阶段的数据
  - `human-judgment` TR-4.2: 验证现阶段记录可编辑和推进，非现阶段记录只能查看
- **Notes**: 需要修改前端的数据过滤逻辑

## [x] 任务 5: 调整面试管理模块数据获取逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 InterviewStage.vue 的数据获取逻辑，使其获取面试相关阶段及后续所有阶段的数据
  - 实现现阶段记录可编辑和推进，非现阶段记录只能查看的权限控制
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-5.1: 验证面试管理模块获取面试相关阶段及后续所有阶段的数据
  - `human-judgment` TR-5.2: 验证现阶段记录可编辑和推进，非现阶段记录只能查看
- **Notes**: 需要修改前端的数据过滤逻辑

## [x] 任务 6: 调整员工管理模块数据获取逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 Employees.vue 的数据获取逻辑，使其获取员工相关阶段及后续所有阶段的数据
  - 实现现阶段记录可编辑和推进，非现阶段记录只能查看的权限控制
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-6.1: 验证员工管理模块获取员工相关阶段及后续所有阶段的数据
  - `human-judgment` TR-6.2: 验证现阶段记录可编辑和推进，非现阶段记录只能查看
- **Notes**: 需要修改前端的数据过滤逻辑

## [x] 任务 7: 测试所有模块的功能
- **Priority**: P1
- **Depends On**: 任务 2, 任务 3, 任务 4, 任务 5, 任务 6
- **Description**:
  - 测试所有模块的数据获取逻辑
  - 测试所有模块的操作权限控制
  - 验证筛选条件初始化值是否正确
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-7.1: 测试所有模块的数据获取逻辑
  - `human-judgment` TR-7.2: 测试所有模块的操作权限控制
  - `human-judgment` TR-7.3: 验证筛选条件初始化值是否正确
- **Notes**: 需要进行端到端测试