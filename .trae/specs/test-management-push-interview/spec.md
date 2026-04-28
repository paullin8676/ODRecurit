# 韧测管理面推功能 - 产品需求文档

## Overview
- **Summary**: 在韧测管理界面实现"面推"功能，允许将处于韧测完成及之后阶段的候选人推荐到新的产品线进行面试。
- **Purpose**: 解决候选人只能被推荐到一个产品线面试的限制，允许重复推荐候选人参加不同产品线的面试机会。
- **Target Users**: 系统管理员、招聘专员

## Goals
- 在韧测管理界面，对处于韧测完成及之后阶段的候选人，隐藏推进按钮，显示"面推"按钮
- 实现面推功能，支持选择未推荐过的产品线
- 选择产品线后自动带出产品负责人
- 点击确定后，创建CandidateProductLine和Interview记录，并更新候选人阶段为推荐面试

## Non-Goals (Out of Scope)
- 修改其他页面的功能
- 修改候选人基本信息
- 支持批量面推

## Background & Context
- 当前系统中，一个候选人只能被推荐到一个产品线进行面试
- 用户需要能够将同一个候选人推荐到多个产品线面试
- 韧测管理模块负责管理候选人的韧测阶段及后续阶段

## Functional Requirements
- **FR-1**: 在韧测管理界面，当候选人阶段为韧测完成(test_complete)及之后阶段时，隐藏推进按钮，显示"面推"按钮
- **FR-2**: 点击"面推"按钮，弹出选择产品线的对话框
- **FR-3**: 对话框中显示该候选人未被推荐过的产品线列表
- **FR-4**: 选择产品线后，自动显示该产品线的负责人信息
- **FR-5**: 推荐日期默认为当前日期，可编辑
- **FR-6**: 点击确定按钮后，在CandidateProductLine表中新增一条记录
- **FR-7**: 在Interview表中新增一条关联记录
- **FR-8**: 更新候选人阶段为推荐面试(recommend_interview)

## Non-Functional Requirements
- **NFR-1**: 界面响应时间不超过1秒
- **NFR-2**: 数据操作需在事务中完成，确保数据一致性

## Constraints
- **Technical**: 使用Vue.js前端框架，Express.js后端框架，SQLite数据库
- **Business**: 只能推荐到未被推荐过的产品线
- **Dependencies**: 依赖Candidate、ProductLine、CandidateProductLine、Interview模型

## Assumptions
- 候选人已经完成韧测阶段
- 产品线数据已存在于系统中
- 用户有相应的操作权限

## Acceptance Criteria

### AC-1: 面推按钮显示控制
- **Given**: 候选人阶段为韧测完成(test_complete)及之后阶段
- **When**: 进入韧测管理界面查看该候选人
- **Then**: 推进按钮被隐藏，面推按钮显示
- **Verification**: `human-judgment`

### AC-2: 面推对话框弹出
- **Given**: 点击面推按钮
- **When**: 系统加载可用产品线列表
- **Then**: 弹出对话框，显示未被推荐过的产品线列表
- **Verification**: `human-judgment`

### AC-3: 产品线选择及负责人自动填充
- **Given**: 对话框已弹出
- **When**: 选择一条产品线
- **Then**: 产品负责人字段自动填充为该产品线的负责人
- **Verification**: `human-judgment`

### AC-4: 推荐日期默认值
- **Given**: 对话框已弹出
- **When**: 查看推荐日期字段
- **Then**: 推荐日期默认为当前日期
- **Verification**: `human-judgment`

### AC-5: 创建CandidateProductLine记录
- **Given**: 选择产品线并点击确定
- **When**: 系统处理请求
- **Then**: 在CandidateProductLine表中新增一条记录，包含candidateId、productLineId和recommendDate
- **Verification**: `programmatic`

### AC-6: 创建Interview记录
- **Given**: CandidateProductLine记录创建成功
- **When**: 系统继续处理
- **Then**: 在Interview表中新增一条记录，关联到新创建的CandidateProductLine
- **Verification**: `programmatic`

### AC-7: 更新候选人阶段
- **Given**: Interview记录创建成功
- **When**: 系统完成所有操作
- **Then**: 候选人阶段更新为推荐面试(recommend_interview)
- **Verification**: `programmatic`

### AC-8: 产品线过滤
- **Given**: 候选人已被推荐到某些产品线
- **When**: 打开面推对话框
- **Then**: 对话框中只显示未被推荐过的产品线
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要在推荐面试后发送通知？
- [ ] 是否需要记录推荐人信息？