# 阶段配置修复规格说明

## Why
当前所有模块的阶段配置数据不完整，在测试保存功能时只恢复了 candidate_entry 模块，其他模块的阶段配置被错误地修改了。需要恢复所有模块的完整阶段配置。

## What Changes
- 恢复所有5个模块的阶段配置为完整的14个阶段

## 完整阶段列表
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

## 受影响的模块
- candidate_entry
- exam_management
- test_management
- interview_management
- employee_management