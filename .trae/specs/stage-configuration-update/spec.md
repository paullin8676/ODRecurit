# 阶段配置功能修改规格说明

## Why
当前阶段配置页面不可用，需要修复。同时需要根据用户要求重新设计导航菜单结构。

## What Changes
- 员工管理的二级菜单改为：候选录入、机考管理、韧测管理、面试管理、员工管理（按模块名称命名）
- 阶段配置的二级菜单改为每个模块可配置的阶段名称（14个阶段名称）
- 修复阶段配置页面的空白问题

## Impact
- 受影响的代码：
  - 前端导航组件（Layout.vue）
  - 阶段配置页面（StageConfig.vue）
  - 前端路由（router/index.js）

## 导航菜单结构

### 员工管理（二级菜单按模块名称）
- 候选录入 (/employees)
- 机考管理 (/exam-stage)
- 韧测管理 (/test-stage)
- 面试管理 (/interview-stage)
- 员工管理 (/employee-management)

### 阶段配置（二级菜单为阶段名称）
- 候选录入 (/stage-config?stage=candidate_entry)
- 机考申报 (/stage-config?stage=exam_declare)
- 机考完成 (/stage-config?stage=exam_complete)
- 韧测申报 (/stage-config?stage=test_declare)
- 韧测完成 (/stage-config?stage=test_complete)
- 推荐面试 (/stage-config?stage=recommend_interview)
- 资面安排 (/stage-config?stage=qualification_interview)
- 技术面试(一) (/stage-config?stage=tech_interview_1)
- 技术面试(二) (/stage-config?stage=tech_interview_2)
- 主管面试 (/stage-config?stage=manager_interview)
- 租用审批 (/stage-config?stage=approval)
- Offer (/stage-config?stage=offer)
- 入职 (/stage-config?stage=entry)
- 离职 (/stage-config?stage=leave)

## 模块定义（常量，可调整）
- candidate_entry: 候选录入
- exam_management: 机考管理
- test_management: 韧测管理
- interview_management: 面试管理
- employee_management: 员工管理

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

## 页面设计

### 阶段配置页面
- 根据 URL 参数 `stage` 显示对应阶段的配置
- 如果没有 `stage` 参数，显示阶段列表供选择
- 每个阶段配置显示哪些模块可以使用该阶段

## 数据模型设计

### StageConfig 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| module | STRING | 模块名称 |
| stages | JSON | 可用阶段列表 |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |