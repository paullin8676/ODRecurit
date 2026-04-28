# 阶段配置精确匹配需求规格说明

## Why
每个模块在阶段配置中定义的阶段不同，页面加载时需要根据该模块配置的阶段来显示筛选条件选项。

## What Changes

### 模块配置示例
- **候选录入模块** (candidate_entry): 只配置了1个阶段 ["employee_entry"]
- **机考管理模块** (exam_management): 配置了14个阶段
- **韧测管理模块** (test_management): 配置了14个阶段
- **面试管理模块** (interview_management): 配置了14个阶段
- **员工管理模块** (employee_management): 配置了14个阶段

### 功能要求
- 员工管理下的"候选录入"模块页面加载时
- 当前阶段筛选下拉框应该只显示1个选项：候选录入
- 这与候选录入模块在阶段配置中的定义一致

### 实现逻辑
1. 页面加载时调用 `stageConfigApi.getByModule('candidate_entry')` 获取该模块的配置
2. 根据返回的 stages 数组过滤 stageNames，显示对应的阶段选项
3. 如果该模块只配置了1个阶段，则下拉框只显示1个选项

## 当前配置状态
| 模块 | 配置的阶段数量 | 阶段列表 |
|------|--------------|---------|
| candidate_entry | 1 | ["employee_entry"] |
| exam_management | 14 | 全部14个阶段 |
| test_management | 14 | 全部14个阶段 |
| interview_management | 14 | 全部14个阶段 |
| employee_management | 14 | 全部14个阶段 |