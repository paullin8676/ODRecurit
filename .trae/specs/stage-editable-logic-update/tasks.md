# 阶段可编辑逻辑更新 - 实现计划

## [x] Task 1: 更新机考管理模块的阶段可编辑逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改 `ExamStage.vue` 文件中的 `isCurrentStage` 函数，使其检查当前阶段是否在配置的所有阶段中，而不是只检查是否是第一个阶段。
  - 具体修改：将 `return availableStages.value.length > 0 && row.currentStage === availableStages.value[0]` 改为 `return availableStages.value.includes(row.currentStage)`。
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 机考管理模块配置了多个阶段时，用户可以对处于配置阶段中的记录进行编辑、推进和查看操作，对处于其他阶段的记录只能进行查看操作。
- **Notes**: 无

## [x] Task 2: 更新韧测管理模块的阶段可编辑逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改 `TestStage.vue` 文件中的 `isCurrentStage` 函数，使其检查当前阶段是否在配置的所有阶段中，而不是只检查是否是第一个阶段。
  - 具体修改：将 `return availableStages.value.length > 0 && row.currentStage === availableStages.value[0]` 改为 `return availableStages.value.includes(row.currentStage)`。
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 韧测管理模块配置了多个阶段时，用户可以对处于配置阶段中的记录进行编辑、推进和查看操作，对处于其他阶段的记录只能进行查看操作。
- **Notes**: 无

## [x] Task 3: 验证面试管理模块的阶段可编辑逻辑
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 验证 `InterviewStage.vue` 文件中的 `isCurrentStage` 函数是否已经正确实现，确保其检查当前阶段是否在配置的所有阶段中。
  - 确认面试管理模块的阶段可编辑逻辑与修改后的机考管理和韧测管理模块的逻辑保持一致。
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 面试管理模块配置了多个阶段时，用户可以对处于配置阶段中的记录进行编辑、推进和查看操作，对处于其他阶段的记录只能进行查看操作。
- **Notes**: 面试管理模块的 `isCurrentStage` 函数已经实现了正确的逻辑，不需要修改。