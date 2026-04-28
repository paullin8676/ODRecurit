# 阶段配置功能规格说明

## Why
系统需要提供一个灵活的阶段配置管理功能，允许管理员配置各个管理模块（候选录入、机考管理、韧测管理、面试管理、员工管理）可用的阶段范围，从而实现更精细化的流程控制。

## What Changes
- 新增阶段配置表（StageConfig）
- 新增阶段配置管理API接口
- 左侧导航栏新增"阶段配置"一级菜单
- 二级菜单包含：候选录入、机考管理、韧测管理、面试管理、员工管理
- 各管理模块的筛选组件只能选择到配置的阶段

## Impact
- 受影响的规格：
  - 候选人流程管理
  - 界面导航
  - 数据筛选
- 受影响的代码：
  - 后端数据库模型
  - 后端API路由
  - 前端导航组件
  - 前端筛选组件

## ADDED Requirements

### Requirement: 阶段配置表
系统应提供阶段配置表来存储各模块的可用阶段。

#### Scenario: 创建阶段配置
- **WHEN** 管理员配置某模块的可用阶段时
- **THEN** 系统应保存模块名称和对应的阶段列表

#### Scenario: 查询阶段配置
- **WHEN** 用户访问某管理模块时
- **THEN** 系统应根据配置的阶段过滤可选阶段

### Requirement: 阶段配置管理菜单
系统应在导航栏提供阶段配置入口。

#### Scenario: 访问阶段配置
- **WHEN** 用户点击"阶段配置"菜单
- **THEN** 显示所有模块的配置状态

#### Scenario: 配置可用阶段
- **WHEN** 管理员勾选某模块的可用阶段
- **THEN** 系统应保存配置并生效

### Requirement: 管理模块阶段筛选
各管理模块应根据配置限制可选阶段。

#### Scenario: 候选录入模块阶段筛选
- **WHEN** 用户在候选录入模块选择阶段时
- **THEN** 只显示配置为可用的阶段

#### Scenario: 机考管理模块阶段筛选
- **WHEN** 用户在机考管理模块选择阶段时
- **THEN** 只显示配置为可用的阶段

#### Scenario: 韧测管理模块阶段筛选
- **WHEN** 用户在韧测管理模块选择阶段时
- **THEN** 只显示配置为可用的阶段

#### Scenario: 面试管理模块阶段筛选
- **WHEN** 用户在面试管理模块选择阶段时
- **THEN** 只显示配置为可用的阶段

#### Scenario: 员工管理模块阶段筛选
- **WHEN** 用户在员工管理模块选择阶段时
- **THEN** 只显示配置为可用的阶段

## MODIFIED Requirements

### Requirement: 导航菜单结构
- **修改前**: 无阶段配置菜单
- **修改后**: 新增"阶段配置"一级菜单及二级菜单

## REMOVED Requirements
无

## 数据模型设计

### StageConfig 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| module | STRING | 模块名称 |
| stages | JSON | 可用阶段列表 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

## 阶段列表（所有可用阶段）
1. 候选录入 (employee_entry)
2. 机考申报 (exam_declare)
3. 机考完成 (exam_complete)
4. 韧测申报 (test_declare)
5. 韧测完成 (test_complete)
6. 推荐面试 (recommend_interview)
7. 资面安排 (qualification_interview)
8. 技术面试(一) (tech_interview_1)
9. 技术面试(二) (tech_interview_2)
10. 主管面试 (manager_interview)
11. 租用审批 (approval)
12. Offer (offer)
13. 入职 (entry)
14. 离职 (leave)