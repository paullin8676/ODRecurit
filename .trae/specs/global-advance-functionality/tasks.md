# 全局推进功能 - 实现计划

## [ ] 任务 1: 检查当前推进功能实现
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查当前的推进功能实现
  - 确认阶段顺序和推进逻辑
  - 识别需要修改的文件
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-1.1: 确认 `STAGES` 数组的定义和顺序
  - `programmatic` TR-1.2: 确认当前推进功能的实现逻辑
- **Notes**: 需要检查 `backend/src/routes/candidate.js` 中的推进逻辑

## [ ] 任务 2: 实现全局推进功能的后端逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 确保推进功能可以处理所有阶段
  - 实现阶段顺序的查找和更新
  - 添加离职阶段的处理逻辑
  - 提供适当的错误处理
- **Acceptance Criteria Addressed**: [AC-2, AC-3]
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证推进功能可以处理所有阶段（除了离职阶段）
  - `programmatic` TR-2.2: 验证离职阶段的处理
  - `programmatic` TR-2.3: 验证阶段更新的正确性
- **Notes**: 需要修改 `backend/src/routes/candidate.js` 中的 `advance` 方法

## [ ] 任务 3: 在所有相关页面添加推进功能
- **Priority**: P1
- **Depends On**: 任务 2
- **Description**:
  - 在候选人列表页面添加推进功能
  - 在机考管理页面添加推进功能
  - 在韧测管理页面添加推进功能
  - 在面试管理页面添加推进功能
- **Acceptance Criteria Addressed**: [AC-1, AC-4]
- **Test Requirements**:
  - `human-judgment` TR-3.1: 验证所有页面都有推进按钮
  - `programmatic` TR-3.2: 验证推进按钮在离职阶段被禁用
  - `human-judgment` TR-3.3: 验证推进操作的反馈消息
- **Notes**: 需要修改前端页面组件

## [ ] 任务 4: 测试全局推进功能
- **Priority**: P1
- **Depends On**: 任务 3
- **Description**:
  - 测试从各个阶段推进到下一阶段
  - 测试离职阶段的处理
  - 测试错误处理和边界情况
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-4.1: 测试从所有阶段推进
  - `programmatic` TR-4.2: 测试离职阶段的处理
  - `human-judgment` TR-4.3: 测试推进操作的用户体验
- **Notes**: 需要进行端到端测试