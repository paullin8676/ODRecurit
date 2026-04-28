# 候选录入阶段筛选动态加载问题修复

## Why
候选录入页面的当前阶段筛选下拉框应该根据 candidate_entry 模块的配置动态显示阶段选项，但目前显示了所有14个阶段。

## What Changes
- 检查前端代码逻辑
- 确保 fetchStageConfig 正确获取配置
- 确保 filteredStageNames 正确过滤阶段

## 验证结果

### API 返回数据正确
```
candidate_entry 模块配置：
{
  "module": "candidate_entry",
  "stages": ["employee_entry"]
}
```

### 代码逻辑正确
1. fetchStageConfig 调用 stageConfigApi.getByModule('candidate_entry')
2. 获取配置后设置 availableStages.value = data.config.stages
3. filteredStageNames 根据 availableStages 过滤 stageNames

## 可能的解决方案
1. 清除浏览器缓存
2. 重启前端服务
3. 检查网络请求是否正确发送