# 招聘管理系统数据库重构 - 产品需求文档

## Overview
- **Summary**: 重构招聘管理系统的数据库结构，调整候选人、产品线和面试记录之间的关系，实现更清晰的数据模型和业务逻辑。
- **Purpose**: 解决当前数据模型中字段冗余、职责不清的问题，实现更合理的业务流程控制。
- **Target Users**: 招聘管理人员、HR人员

## Goals
- 建立清晰的候选人-产品线-面试记录关系模型
- 实现面试阶段的正确状态管理
- 实现面推功能的业务规则控制
- 清理冗余字段，优化数据结构

## Non-Goals (Out of Scope)
- 不修改用户管理模块
- 不修改机考和韧测模块的核心逻辑
- 不添加新的UI界面

## Background & Context
当前系统存在以下问题：
- CandidateProductLine表中包含client_owner字段，与ProductLine表重复
- Interview表包含入职/离职字段，应该属于Candidate表
- current_stage字段职责不清，同时在多个表中存在
- 面推功能缺少完整的业务规则控制

## Functional Requirements
- **FR-1**: 每个候选人可以参与多条产品线面试，每条产品线只能有一条面试记录
- **FR-2**: 面试记录编辑界面只能显示当前阶段及之前阶段的字段，之前阶段字段不可编辑
- **FR-3**: 查看界面只能查看，不能编辑任何字段
- **FR-4**: 同时只能有一条面试记录在进行中，新增面试记录需符合规则
- **FR-5**: 客户负责人从产品线获取，不从CandidateProductLine表获取
- **FR-6**: 入职/离职相关字段从Interview表迁移到Candidate表
- **FR-7**: CandidateProductLine表的current_stage字段重命名为interview_stage
- **FR-8**: Candidate表的current_stage与最新面试记录的interview_stage保持同步
- **FR-9**: 面推功能实现完整的业务规则控制

## Non-Functional Requirements
- **NFR-1**: 数据迁移过程中保证数据完整性
- **NFR-2**: API接口保持向后兼容
- **NFR-3**: 数据库性能不受影响

## Constraints
- **Technical**: Vue.js 3 + Element Plus, Node.js + Express, SQLite
- **Business**: 需要支持现有业务流程
- **Dependencies**: 依赖现有的用户认证系统

## Assumptions
- 用户已理解当前系统的业务流程
- 数据库重建是可接受的（测试环境）
- 现有数据可以重新录入

## Acceptance Criteria

### AC-1: 候选人-产品线关系约束
- **Given**: 候选人已存在，产品线已存在
- **When**: 尝试为同一候选人在同一产品线创建多条面试记录
- **Then**: 系统拒绝创建并提示错误
- **Verification**: `programmatic`
- **Notes**: 通过数据库唯一约束实现

### AC-2: 面试编辑界面字段控制
- **Given**: 候选人处于"技术面试(一)"阶段
- **When**: 进入面试编辑界面
- **Then**: 只显示"推荐面试"、"资格面试"、"技术面试(一)"阶段的字段，"推荐面试"和"资格面试"字段不可编辑
- **Verification**: `human-judgment`

### AC-3: 查看界面只读
- **Given**: 用户点击查看面试记录
- **When**: 进入查看界面
- **Then**: 所有字段均为只读状态
- **Verification**: `human-judgment`

### AC-4: 同时只能有一条面试进行中
- **Given**: 候选人已有一条进行中的面试记录
- **When**: 尝试新增面推
- **Then**: 系统拒绝并提示"已有面试记录在进行中"
- **Verification**: `programmatic`

### AC-5: 客户负责人从产品线获取
- **Given**: 候选人关联到产品线
- **When**: 查看面试记录
- **Then**: 客户负责人显示为产品线的client_owner值
- **Verification**: `programmatic`

### AC-6: 入职/离职字段迁移
- **Given**: 候选人已入职
- **When**: 查询候选人信息
- **Then**: entry_date、entry_remark、leave_date、leave_reason、leave_remark字段在Candidate表中
- **Verification**: `programmatic`

### AC-7: 阶段同步
- **Given**: 面试记录推进到新阶段
- **When**: 保存面试记录
- **Then**: Candidate表的current_stage与面试记录的interview_stage同步更新
- **Verification**: `programmatic`

### AC-8: 面推规则-入职/离职不能面推
- **Given**: 候选人处于入职或离职阶段
- **When**: 尝试面推
- **Then**: 面推按钮不显示或提示不能面推
- **Verification**: `programmatic`

### AC-9: 面推规则-无可用产品线不能面推
- **Given**: 没有可用的产品线
- **When**: 尝试面推
- **Then**: 面推按钮不显示或提示无可用产品线
- **Verification**: `programmatic`

### AC-10: 面推规则-当前在推荐面试阶段不能面推
- **Given**: 候选人有面试记录处于推荐面试阶段
- **When**: 尝试面推
- **Then**: 面推按钮不显示或提示"请等待当前推荐流程完成"
- **Verification**: `programmatic`

### AC-11: 面推规则-有通过记录不能面推
- **Given**: 候选人有面试记录且最新阶段是通过的
- **When**: 尝试面推
- **Then**: 面推按钮不显示或提示"已有面试在进行中"
- **Verification**: `programmatic`

### AC-12: 面推规则-所有记录未通过可以面推
- **Given**: 候选人有面试记录且所有最新阶段都是未通过的
- **When**: 尝试面推
- **Then**: 显示面推按钮，可以新增面试记录
- **Verification**: `programmatic`

### AC-13: 面推规则-无面试记录可以面推
- **Given**: 候选人没有任何面试记录
- **When**: 尝试面推
- **Then**: 显示面推按钮，可以新增面试记录
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要保留历史面试记录的client_owner数据？
- [ ] 数据迁移是否需要脚本支持？
- [ ] 是否需要通知现有用户系统变更？