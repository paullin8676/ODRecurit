# 招聘管理各模块阶段筛选检查规格说明

## Why
需要检查招聘管理下各模块页面的阶段筛选组件是否根据对应模块的阶段配置来加载选项值。

## 各模块配置状态

| 页面 | 路由 | 模块名称 | API调用 | 配置阶段数 |
|------|------|---------|---------|-----------|
| 候选录入 | /employees | candidate_entry | getByModule('candidate_entry') | 1 |
| 机考管理 | /exam-stage | exam_management | getByModule('exam_management') | 14 |
| 韧测管理 | /test-stage | test_management | getByModule('test_management') | 14 |
| 面试管理 | /interview-stage | interview_management | getByModule('interview_management') | 14 |
| 员工管理 | /employee-management | employee_management | getByModule('employee_management') | 14 |

## API返回数据验证
```
candidate_entry: 1个阶段 ["employee_entry"]
exam_management: 14个阶段
test_management: 14个阶段
interview_management: 14个阶段
employee_management: 14个阶段
```

## 代码逻辑检查

### Candidates.vue (候选录入)
- fetchStageConfig 调用: `stageConfigApi.getByModule('candidate_entry')` ✅
- availableStages 设置: `availableStages.value = data.config.stages` ✅
- filteredStageNames 过滤逻辑: 正确 ✅

### ExamStage.vue, TestStage.vue, InterviewStage.vue, Employees.vue
- 模块调用正确
- 逻辑与 Candidates.vue 一致

## 可能的解决方案
1. 清除浏览器缓存
2. 强制刷新页面 (Ctrl+Shift+R)
3. 重启前端服务