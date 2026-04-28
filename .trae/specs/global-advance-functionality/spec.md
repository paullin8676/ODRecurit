# 全局推进功能 - 产品需求文档

## Overview
- **Summary**: 实现一个全局推进功能，允许在任意阶段推进候选人到下一阶段，直到离职阶段。
- **Purpose**: 提供统一的推进功能，确保候选人在招聘流程中的顺畅流转。
- **Target Users**: 招聘管理人员，包括顾问和管理员。

## Goals
- 实现全局推进功能，在任意阶段都可以推进候选人到下一阶段
- 确保推进功能在所有阶段都可用，除了离职阶段
- 统一推进逻辑，确保数据一致性
- 提供清晰的推进反馈和错误处理

## Non-Goals (Out of Scope)
- 自定义阶段顺序
- 跳过多个阶段的推进
- 回退到之前阶段的功能

## Background & Context
- 系统当前已经实现了基本的推进功能，但只在特定阶段可用
- 阶段顺序已经在 `backend/src/routes/candidate.js` 中定义为固定数组
- 推进功能需要更新候选人表的 `currentStage` 字段

## Functional Requirements
- **FR-1**: 推进功能应该在所有阶段都可用，除了离职阶段
- **FR-2**: 推进时应该将候选人的当前阶段更新为下一阶段
- **FR-3**: 推进功能应该提供清晰的成功/失败反馈
- **FR-4**: 推进功能应该处理边界情况，如已经是最后一个阶段的情况

## Non-Functional Requirements
- **NFR-1**: 推进操作应该是原子性的，确保数据一致性
- **NFR-2**: 推进操作应该有适当的错误处理
- **NFR-3**: 推进功能应该在所有相关页面中保持一致的用户体验

## Constraints
- **Technical**: 阶段顺序是固定的，在 `STAGES` 数组中定义
- **Technical**: 离职阶段是最后一个阶段，不能再推进

## Assumptions
- 阶段顺序在 `STAGES` 数组中是正确的
- 所有候选人记录都有有效的 `currentStage` 值

## Acceptance Criteria

### AC-1: 推进功能可用性
- **Given**: 候选人处于任意阶段（除了离职阶段）
- **When**: 用户点击推进按钮
- **Then**: 系统应该显示推进确认或直接执行推进操作
- **Verification**: `human-judgment`

### AC-2: 阶段更新
- **Given**: 候选人处于阶段 X
- **When**: 用户执行推进操作
- **Then**: 候选人的当前阶段应该更新为阶段 X 的下一个阶段
- **Verification**: `programmatic`

### AC-3: 离职阶段处理
- **Given**: 候选人处于离职阶段
- **When**: 用户尝试推进
- **Then**: 系统应该显示错误信息或禁用推进按钮
- **Verification**: `programmatic`

### AC-4: 推进反馈
- **Given**: 用户执行推进操作
- **When**: 操作成功或失败
- **Then**: 系统应该显示相应的成功或错误消息
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要在推进时创建相关的记录（如考试、测试、面试记录）？
- [ ] 是否需要在推进时更新其他相关字段？