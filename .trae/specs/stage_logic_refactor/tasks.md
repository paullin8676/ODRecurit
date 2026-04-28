# 招聘管理模块阶段逻辑重构 - 任务分解与优先级

## [x] Task 1: 分析各模块阶段配置
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 查看后端stage_config表中各模块的阶段配置
  - 确认14个阶段的完整顺序
  - 确定每个模块配置的阶段范围及后续阶段
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: 验证各模块阶段配置存在且完整
  - `human-judgement` TR-1.2: 确认阶段顺序正确（候选录入→离职）
- **Notes**: 需要先确认阶段配置的正确性

## [x] Task 2: 修改候选录入模块取数逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改候选录入模块的API，获取候选录入阶段及后续所有阶段的候选人
  - 实现编辑权限控制：仅候选录入阶段可编辑
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-2.1: API返回候选录入及后续阶段的数据
  - `human-judgement` TR-2.2: 非候选录入阶段记录不可编辑
- **Notes**: 需要修改candidate.js路由

## [x] Task 3: 修改机考管理模块取数逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改机考管理模块的API，获取机考申报、机考完成阶段及后续阶段的候选人
  - 实现编辑权限控制：仅机考阶段可编辑
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-3.1: API返回机考阶段及后续阶段的数据
  - `human-judgement` TR-3.2: 非机考阶段记录不可编辑
- **Notes**: 需要修改exam.js路由

## [x] Task 4: 修改韧测管理模块取数逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改韧测管理模块的API，获取韧测申报、韧测完成阶段及后续阶段的候选人
  - 实现编辑权限控制：仅韧测阶段可编辑
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-4.1: API返回韧测阶段及后续阶段的数据
  - `human-judgement` TR-4.2: 非韧测阶段记录不可编辑
- **Notes**: 需要修改test.js路由

## [x] Task 5: 修改面试管理模块取数逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改面试管理模块的API，获取推荐面试到Offer阶段及后续阶段的候选人
  - 实现编辑权限控制：仅面试阶段可编辑
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-5.1: API返回面试阶段及后续阶段的数据
  - `human-judgement` TR-5.2: 非面试阶段记录不可编辑
- **Notes**: 需要修改candidate.js路由

## [x] Task 6: 修改员工管理模块取数逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改员工管理模块的API，获取入职、离职阶段的候选人
  - 实现编辑权限控制：仅入职阶段可编辑（离职不可编辑）
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-6.1: API返回入职和离职阶段的数据
  - `human-judgement` TR-6.2: 离职阶段记录不可编辑
- **Notes**: 需要修改candidate.js路由

## [x] Task 7: 修改面推逻辑 - 阶段同步
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改面推API，在创建面试记录后更新候选人current_stage为推荐面试阶段
  - 使用事务确保数据一致性
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `programmatic` TR-7.1: 面推成功后候选人current_stage更新为推荐面试
  - `programmatic` TR-7.2: 事务失败时数据回滚
- **Notes**: 需要修改push-interview路由

## [x] Task 8: 修改面试记录更新逻辑 - 阶段同步
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改面试记录更新API，当阶段更新时同步更新候选人current_stage
  - 确保面试记录的最新阶段与候选人阶段保持一致
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `programmatic` TR-8.1: 面试阶段更新后候选人current_stage同步更新
  - `programmatic` TR-8.2: 多条面试记录时取最新阶段
- **Notes**: 需要修改candidate.js路由中的PUT方法