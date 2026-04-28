# 数据库表结构重构检查清单

## 后端模型检查

- [ ] Exam 模型文件已创建（backend/src/models/Exam.js）
- [ ] Exam 模型字段定义正确（candidateId, examPaperId, isOnlineExam, examDate, examCompleteDate, examTotalScore, examScore, isCheating, examPassed）
- [ ] Exam 模型与 Candidate 的关联关系正确（一对多）
- [ ] Test 模型文件已创建（backend/src/models/Test.js）
- [ ] Test 模型字段定义正确（candidateId, testTypeId, testDate, testCompleteDate, testTotalScore, worryValue, optimismValue, consistency, testPassed）
- [ ] Test 模型与 Candidate 的关联关系正确（一对多）
- [ ] Interview 模型文件已创建（backend/src/models/Interview.js）
- [ ] Interview 模型字段定义正确（包含所有面试相关字段）
- [ ] Interview 模型与 Candidate 的关联关系正确（一对多）
- [ ] Interview 模型与 ProductLine 的关联关系正确（多对一）
- [ ] CandidateProductLine 模型已简化（只保留基本关联字段）
- [ ] models/index.js 已更新关联关系

## 后端路由检查

- [ ] exam.js 路由文件已创建
- [ ] exam.js 路由包含 CRUD API（创建、读取、更新、删除）
- [ ] test.js 路由文件已创建
- [ ] test.js 路由包含 CRUD API（创建、读取、更新、删除）
- [ ] interview.js 路由文件已创建
- [ ] interview.js 路由包含 CRUD API（创建、读取、更新、删除）
- [ ] interview.js 路由支持按产品线筛选
- [ ] app.js 已注册新路由

## 前端 API 检查

- [ ] api/index.js 已添加 examApi
- [ ] api/index.js 已添加 testApi
- [ ] api/index.js 已添加 interviewApi
- [ ] API 方法实现正确（getAll, getById, create, update, delete）

## 前端页面检查

### Employees.vue
- [ ] 员工列表只从 Candidate 表获取数据
- [ ] 移除了 productLines 展开逻辑
- [ ] 当前阶段显示正确
- [ ] .card-container 样式 margin-top: -5px 已保持

### ExamStage.vue
- [ ] 页面使用新的 examApi
- [ ] 数据获取逻辑正确
- [ ] 表单提交逻辑正确
- [ ] .card-container 样式 margin-top: -5px 已保持

### TestStage.vue
- [ ] 页面文件已创建
- [ ] 路由配置已添加
- [ ] 页面使用 testApi
- [ ] 数据获取逻辑正确
- [ ] 表单提交逻辑正确
- [ ] .card-container 样式 margin-top: -5px 已保持

### InterviewStage.vue
- [ ] 页面使用新的 interviewApi
- [ ] 支持多产品线筛选
- [ ] 数据获取逻辑正确
- [ ] 表单提交逻辑正确
- [ ] .card-container 样式 margin-top: -5px 已保持

## 功能测试检查

- [ ] 员工列表功能正常（只显示候选人基本信息）
- [ ] 机考管理功能正常（创建、编辑、删除机考记录）
- [ ] 韧测管理功能正常（创建、编辑、删除韧测记录）
- [ ] 面试管理功能正常（创建、编辑、删除面试记录，支持多产品线）
- [ ] 阶段推进和回退功能正常
- [ ] 数据关联正确（候选人 -> 机考 -> 韧测 -> 面试）

## 数据迁移检查

- [ ] 数据迁移脚本已创建
- [ ] CandidateProductLine 中的考试数据已迁移到 Exam 表
- [ ] CandidateProductLine 中的韧测数据已迁移到 Test 表
- [ ] CandidateProductLine 中的面试数据已迁移到 Interview 表
- [ ] 迁移后数据完整性验证通过