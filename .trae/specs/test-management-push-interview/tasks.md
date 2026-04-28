# 韧测管理面推功能 - 实现计划

## [x] Task 1: 前端 - 修改韧测管理界面按钮显示逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改TestStage.vue文件
  - 隐藏推进按钮（对于韧测完成及之后阶段的候选人）
  - 显示"面推"按钮
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-1.1: 检查韧测完成及之后阶段的候选人是否显示面推按钮，隐藏推进按钮
- **Notes**: 需要参考现有按钮显示逻辑

## [x] Task 2: 前端 - 添加面推对话框组件
- **Priority**: P0
- **Depends On**: Task 1, Task 3
- **Description**: 
  - 在TestStage.vue中添加面推对话框
  - 显示未被推荐过的产品线列表
  - 选择产品线后自动填充产品负责人
  - 推荐日期默认为当前日期
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-4, AC-8
- **Test Requirements**:
  - `human-judgment` TR-2.1: 点击面推按钮后对话框正常弹出
  - `human-judgment` TR-2.2: 产品线列表只显示未被推荐过的产品线
  - `human-judgment` TR-2.3: 选择产品线后产品负责人自动填充
  - `human-judgment` TR-2.4: 推荐日期默认为当前日期
- **Notes**: 需要调用后端API获取未推荐的产品线列表

## [x] Task 3: 后端 - 添加获取未推荐产品线的API端点
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在candidate.js路由文件中添加新端点
  - 查询CandidateProductLine表，获取候选人未被推荐过的产品线
  - 返回产品线列表，包含产品负责人信息
- **Acceptance Criteria Addressed**: AC-3, AC-8
- **Test Requirements**:
  - `programmatic` TR-3.1: GET /candidates/:id/available-product-lines 返回正确的产品线列表
  - `programmatic` TR-3.2: 返回的产品线不包含已推荐的产品线
- **Notes**: 需要使用Sequelize的exclude或notIn查询

## [x] Task 4: 后端 - 添加面推功能的API端点
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 在candidate.js路由文件中添加面推端点
  - 创建CandidateProductLine记录
  - 创建Interview记录（关联到新的CandidateProductLine）
  - 更新候选人阶段为推荐面试
  - 使用事务确保数据一致性
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: POST /candidates/:id/push-interview 创建CandidateProductLine记录
  - `programmatic` TR-4.2: POST /candidates/:id/push-interview 创建Interview记录
  - `programmatic` TR-4.3: POST /candidates/:id/push-interview 更新候选人阶段为recommend_interview
- **Notes**: 需要使用Sequelize的事务功能

## [x] Task 5: 前端 - 添加面推API调用
- **Priority**: P0
- **Depends On**: Task 2, Task 4
- **Description**: 
  - 在api/index.js中添加pushInterview方法
  - 在TestStage.vue中调用面推API
  - 处理成功和失败的回调
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-7
- **Test Requirements**:
  - `human-judgment` TR-5.1: 点击确定后成功创建面试推荐记录
  - `human-judgment` TR-5.2: 操作失败时显示错误提示
- **Notes**: 需要处理API调用的异常情况

## [ ] Task 6: 测试验证
- **Priority**: P1
- **Depends On**: All previous tasks
- **Description**: 
  - 验证所有功能是否正常工作
  - 检查数据一致性
  - 测试边界条件
- **Acceptance Criteria Addressed**: All
- **Test Requirements**:
  - `programmatic` TR-6.1: 测试API端点的正确性
  - `human-judgment` TR-6.2: 验证界面功能正常
- **Notes**: 需要手动测试和自动化测试结合