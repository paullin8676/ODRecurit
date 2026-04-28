# 阶段配置菜单调整规格说明

## Why
需要调整阶段配置菜单的位置和名称，使其更符合系统配置的结构。

## What Changes
- 将阶段配置从独立的一级菜单移动到系统配置下作为二级菜单
- 将阶段配置的菜单名称从"候选录入"改为"阶段配置"

## Impact
- 受影响的代码：
  - 前端导航组件（Layout.vue）

## 导航菜单结构

### 系统配置（调整后）
- 用户管理 (/settings/users)
- 产品线管理 (/settings/product-lines)
- 试卷管理 (/settings/exam-papers)
- 韧测类型管理 (/settings/test-types)
- 考试及格线管理 (/settings/exam-pass-lines)
- 阶段配置 (/stage-config)

### 员工管理（保持不变）
- 候选录入 (/employees)
- 机考管理 (/exam-stage)
- 韧测管理 (/test-stage)
- 面试管理 (/interview-stage)
- 员工管理 (/employee-management)