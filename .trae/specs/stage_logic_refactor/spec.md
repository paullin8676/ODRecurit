# 招聘管理模块阶段逻辑重构 - 产品需求文档

## Overview
- **Summary**: 重构招聘管理各模块的表格取数逻辑，实现按模块配置阶段及后续阶段获取数据，并实现面试阶段与候选人阶段的自动同步。
- **Purpose**: 解决当前各模块取数逻辑不一致、阶段数据不同步的问题，确保数据展示和编辑权限符合业务流程。
- **Target Users**: 招聘管理人员、HR人员

## Goals
- 实现各模块按配置阶段及后续阶段获取数据
- 实现编辑权限控制（仅当前模块配置阶段可编辑）
- 实现面试阶段与候选人阶段自动同步

## Non-Goals (Out of Scope)
- 修改阶段配置的维护界面
- 修改用户权限系统
- 修改面推的业务规则

## Background & Context
- 系统共有14个阶段：候选录入、机考申报、机考完成、韧测申报、韧测完成、推荐面试、资面安排、技术面试(一)、技术面试(二)、主管面试、租用审批、Offer、入职、离职
- 各模块（候选录入、机考管理、韧测管理、面试管理、员工管理）需要根据配置的阶段范围获取数据
- 当前存在阶段数据不同步的问题

## Functional Requirements
- **FR-1**: 各模块表格获取该模块配置阶段及后续阶段的候选人数据
- **FR-2**: 仅能编辑处于当前模块配置阶段的记录，后续阶段记录只能查看
- **FR-3**: 面推到面试表时，自动更新候选人当前阶段为推荐面试
- **FR-4**: 面试记录阶段更新时，同步更新候选人表的current_stage字段

## Non-Functional Requirements
- **NFR-1**: 阶段同步操作需在事务中完成，确保数据一致性
- **NFR-2**: 取数逻辑需高效，避免性能问题

## Constraints
- **Technical**: Vue.js 3 + Element Plus 前端框架，Node.js + Express + Sequelize 后端
- **Business**: 需保持现有推进逻辑和面推逻辑不变

## Assumptions
- 阶段配置已正确初始化各模块的阶段范围
- 数据库表结构已存在（Candidate、CandidateProductLine、Interview）

## Acceptance Criteria

### AC-1: 模块取数逻辑
- **Given**: 模块配置了特定阶段范围
- **When**: 用户访问模块页面
- **Then**: 表格显示该模块配置阶段及所有后续阶段的候选人
- **Verification**: `programmatic`

### AC-2: 编辑权限控制
- **Given**: 候选人处于后续阶段（非当前模块配置阶段）
- **When**: 用户尝试编辑记录
- **Then**: 编辑按钮不显示或禁用，只能查看
- **Verification**: `human-judgment`

### AC-3: 面推阶段同步
- **Given**: 候选人从韧测完成面推到面试
- **When**: 面推操作成功
- **Then**: 候选人表current_stage更新为推荐面试阶段
- **Verification**: `programmatic`

### AC-4: 面试阶段同步
- **Given**: 面试记录阶段更新为通过或候选阶段
- **When**: 更新操作成功
- **Then**: 候选人表current_stage同步更新
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要考虑事务回滚的情况？
- [ ] 当存在多条面试记录时，如何确定最新阶段？