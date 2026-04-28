# 面试管理列调整及韧测面推按钮修复 - 产品需求文档

## Overview
- **Summary**: 修复两个问题：1）调整面试管理界面的列顺序和显示名称；2）修复韧测管理页面面推按钮在资面不通过时不显示的问题。
- **Purpose**: 优化面试管理界面的用户体验，确保韧测管理面推功能正常工作。
- **Target Users**: 系统管理员、招聘专员

## Goals
- 调整面试管理表格列顺序，使信息展示更符合业务逻辑
- 修复韧测管理面推按钮在面试不通过时不显示的问题

## Non-Goals (Out of Scope)
- 修改面试管理的其他功能逻辑
- 修改其他模块的界面布局

## Background & Context
- 面试管理界面需要按照业务流程顺序展示各个面试阶段的信息
- 韧测管理的面推按钮应该在候选人有面试不通过记录时显示，但当前存在bug

## Functional Requirements
- **FR-1**: 面试管理表格列顺序调整为：产品线、客户负责人、推荐日期、资面日期、资面结果、技一日期、技一结果、技二日期、技二结果、主面日期、主面结果、审批日期、审批结果、Offer日期、Offer审批人、入职日期
- **FR-2**: 韧测管理面推按钮在候选人有任意面试阶段不通过时显示

## Constraints
- **Technical**: 基于现有的 Element Plus 组件和 Vue 框架

## Acceptance Criteria

### AC-1: 面试管理列顺序调整
- **Given**: 用户进入面试管理界面
- **When**: 查看表格列顺序
- **Then**: 列顺序为：产品线、客户负责人、推荐日期、资面日期、资面结果、技一日期、技一结果、技二日期、技二结果、主面日期、主面结果、审批日期、审批结果、Offer日期、Offer审批人、入职日期
- **Verification**: `human-judgment`

### AC-2: 韧测管理面推按钮显示
- **Given**: 候选人张三处于资面不通过状态
- **When**: 用户进入韧测管理界面查看该候选人
- **Then**: 该候选人显示面推按钮
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要调整其他模块的列顺序？

## Impact
- **Affected specs**: 面试管理、韧测管理
- **Affected code**: InterviewStage.vue, TestStage.vue