# 员工管理阶段配置匹配规格说明

## Why
员工管理下的5个二级菜单（候选录入、机考管理、韧测管理、面试管理、员工管理）的阶段筛选组件需要根据各自对应的阶段配置来显示可选阶段。

## What Changes
确保每个页面调用正确的模块配置：
- 候选录入页面 (/employees) → candidate_entry 模块
- 机考管理页面 (/exam-stage) → exam_management 模块
- 韧测管理页面 (/test-stage) → test_management 模块
- 面试管理页面 (/interview-stage) → interview_management 模块
- 员工管理页面 (/employee-management) → employee_management 模块

## 实现细节

### 各页面调用的模块配置

| 页面 | 路由 | 模块名称 | 说明 |
|------|------|---------|------|
| Candidates.vue | /employees | candidate_entry | 候选录入 |
| ExamStage.vue | /exam-stage | exam_management | 机考管理 |
| TestStage.vue | /test-stage | test_management | 韧测管理 |
| InterviewStage.vue | /interview-stage | interview_management | 面试管理 |
| Employees.vue | /employee-management | employee_management | 员工管理 |

## 完整阶段列表（14个）
1. employee_entry (候选录入)
2. exam_declare (机考申报)
3. exam_complete (机考完成)
4. test_declare (韧测申报)
5. test_complete (韧测完成)
6. recommend_interview (推荐面试)
7. qualification_interview (资面安排)
8. tech_interview_1 (技术面试一)
9. tech_interview_2 (技术面试二)
10. manager_interview (主管面试)
11. approval (租用审批)
12. offer (Offer)
13. entry (入职)
14. leave (离职)