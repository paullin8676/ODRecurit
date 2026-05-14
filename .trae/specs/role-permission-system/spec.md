# 角色和权限控制系统 - 产品需求文档

## Overview
- **Summary**: 设计并实现一套完整的角色和权限控制系统，支持数据权限、菜单权限和操作按钮权限的细粒度配置。系统将角色、用户、权限分离为独立的配置表，并支持多级角色层级穿透查看数据。
- **Purpose**: 解决当前系统权限控制简单、角色硬编码的问题，实现灵活可配置的权限管理体系。
- **Target Users**: 系统管理员、各级管理人员、招聘顾问

## Goals
- 实现角色、用户、权限的分离管理
- 支持五种角色：顾问、主管、经理、总监、管理员
- 实现三种数据权限：可见自己数据、可见下级数据、可见全局数据
- 支持左侧导航菜单的角色级权限控制
- 支持列表操作按钮的角色级权限控制
- 实现上级穿透查看下级数据的功能

## Non-Goals (Out of Scope)
- 不实现字段级数据权限控制
- 不实现基于时间的动态权限
- 不实现第三方OAuth集成

## Background & Context
- 当前系统只有两种角色（consultant、manager），硬编码在User表中
- 当前权限控制仅通过authorize中间件进行简单的角色检查
- 用户层级关系已通过managerId字段实现
- 数据归属通过CandidateStage.consultantId字段确定

## Functional Requirements
- **FR-1**: 支持五种角色定义：顾问(consultant)、主管(supervisor)、经理(manager)、总监(director)、管理员(admin)
- **FR-2**: 角色表存储角色名称、层级、数据权限范围
- **FR-3**: 用户-角色关联表支持多角色分配
- **FR-4**: 权限表存储权限点（菜单、按钮）
- **FR-5**: 角色-权限关联表配置角色拥有的权限
- **FR-6**: 数据权限支持三种模式：自己数据、下级数据、全局数据
- **FR-7**: 列表查询时自动根据用户角色过滤数据
- **FR-8**: 左侧导航根据角色权限动态显示/隐藏菜单

## Non-Functional Requirements
- **NFR-1**: 权限检查性能开销 < 10ms
- **NFR-2**: 支持1000+用户的层级查询
- **NFR-3**: 权限变更实时生效（无需重启）
- **NFR-4**: 权限数据持久化存储

## Constraints
- **Technical**: Node.js + Express + Sequelize + SQLite
- **Business**: 需要保持向后兼容性，现有用户自动映射到新角色
- **Dependencies**: 依赖现有的User表和CandidateStage表

## Assumptions
- 用户层级关系是树形结构，最多5层（顾问→主管→经理→总监→管理员）
- 数据归属以CandidateStage.consultantId为准
- 管理员拥有所有权限，不受数据权限限制

## Acceptance Criteria

### AC-1: 角色表设计
- **Given**: 系统初始化完成
- **When**: 查询角色列表
- **Then**: 返回5种预设角色（顾问、主管、经理、总监、管理员），每种角色包含名称、层级、数据权限范围
- **Verification**: `programmatic`

### AC-2: 用户角色分配
- **Given**: 存在用户和角色数据
- **When**: 为用户分配角色
- **Then**: 用户可以拥有多个角色，角色权限取并集
- **Verification**: `programmatic`

### AC-3: 数据权限过滤（自己数据）
- **Given**: 顾问用户登录，有10条候选人记录，其中3条属于该顾问
- **When**: 查询候选人列表
- **Then**: 只返回3条属于该顾问的记录
- **Verification**: `programmatic`

### AC-4: 数据权限过滤（下级数据）
- **Given**: 主管用户登录，有3个下属顾问，每个顾问有5条记录
- **When**: 查询候选人列表
- **Then**: 返回主管自己的数据 + 所有下属顾问的数据（共15-18条）
- **Verification**: `programmatic`

### AC-5: 数据权限过滤（全局数据）
- **Given**: 管理员登录
- **When**: 查询候选人列表
- **Then**: 返回所有候选人记录，不受数据归属限制
- **Verification**: `programmatic`

### AC-6: 菜单权限控制
- **Given**: 顾问用户登录，用户管理菜单仅对manager及以上角色开放
- **When**: 查看左侧导航
- **Then**: 用户管理菜单不显示
- **Verification**: `human-judgment`

### AC-7: 按钮权限控制
- **Given**: 顾问用户登录，删除按钮仅对manager及以上角色开放
- **When**: 查看候选人列表
- **Then**: 删除按钮不可见或禁用
- **Verification**: `human-judgment`

### AC-8: 角色层级穿透
- **Given**: 总监用户登录，下属有经理→主管→顾问层级
- **When**: 查询候选人列表
- **Then**: 可以查看所有下级（经理、主管、顾问）的数据
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要支持临时权限（如代理授权）？
- [ ] 是否需要记录权限变更日志？
- [ ] 是否需要支持权限模板？
