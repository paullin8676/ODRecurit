# 数据库表结构重构任务列表

## 任务概述
将 CandidateProductLine 表中的考试相关字段、韧测相关字段和面试相关字段拆分到各自的独立表中。

## 任务列表

- [ ] 任务 1: 创建后端 Exam 模型（机考表）
  - [ ] 创建 Exam.js 模型文件
  - [ ] 定义 Exam 模型字段：candidateId, examPaperId, isOnlineExam, examDate, examCompleteDate, examTotalScore, examScore, isCheating, examPassed
  - [ ] 定义 Exam 模型关联：Candidate（一对多）

- [ ] 任务 2: 创建后端 Test 模型（韧测表）
  - [ ] 创建 Test.js 模型文件
  - [ ] 定义 Test 模型字段：candidateId, testTypeId, testDate, testCompleteDate, testTotalScore, worryValue, optimismValue, consistency, testPassed
  - [ ] 定义 Test 模型关联：Candidate（一对多）

- [ ] 任务 3: 创建后端 Interview 模型（面试表）
  - [ ] 创建 Interview.js 模型文件
  - [ ] 定义 Interview 模型字段：candidateId, productLineId, recommendDate, qualificationInterview*, techInterview1*, techInterview2*, managerInterview*, approval*, offer*, entry*, leave* 等
  - [ ] 定义 Interview 模型关联：Candidate（一对多），ProductLine（多对一）

- [ ] 任务 4: 简化 CandidateProductLine 模型
  - [ ] 修改 CandidateProductLine.js 文件
  - [ ] 移除考试、韧测、面试相关字段
  - [ ] 保留基本关联字段：candidateId, productLineId, consultantId, clientOwner, currentStage

- [ ] 任务 5: 更新 models/index.js 关联关系
  - [ ] 更新模型导入
  - [ ] 更新模型关联关系
  - [ ] 更新初始化数据库逻辑

- [ ] 任务 6: 创建后端路由文件
  - [ ] 创建 exam.js 路由（机考相关 API）
  - [ ] 创建 test.js 路由（韧测相关 API）
  - [ ] 创建 interview.js 路由（面试相关 API）
  - [ ] 更新 app.js 注册新路由

- [ ] 任务 7: 更新前端 API 文件
  - [ ] 更新 frontend/src/api/index.js
  - [ ] 添加 examApi 相关调用
  - [ ] 添加 testApi 相关调用
  - [ ] 添加 interviewApi 相关调用

- [ ] 任务 8: 更新前端 ExamStage.vue 页面
  - [ ] 修改页面使用新的 examApi
  - [ ] 调整数据获取和提交逻辑
  - [ ] 调整样式（保持原有 margin-top: -5px）

- [ ] 任务 9: 创建前端 TestStage.vue 页面（韧测管理）
  - [ ] 参考 ExamStage.vue 创建 TestStage.vue
  - [ ] 使用 testApi 获取数据
  - [ ] 添加韧测相关表单和表格
  - [ ] 添加路由配置

- [ ] 任务 10: 更新前端 InterviewStage.vue 页面
  - [ ] 修改页面使用新的 interviewApi
  - [ ] 调整数据获取和提交逻辑
  - [ ] 支持多产品线筛选

- [ ] 任务 11: 更新前端 Employees.vue 页面
  - [ ] 简化数据获取逻辑，只从 Candidate 表获取
  - [ ] 移除 productLines 展开逻辑
  - [ ] 调整当前阶段显示逻辑

- [ ] 任务 12: 更新路由配置
  - [ ] 更新 frontend/src/router/index.js
  - [ ] 添加 TestStage 路由

- [ ] 任务 13: 数据迁移脚本
  - [ ] 创建数据库迁移脚本
  - [ ] 将 CandidateProductLine 中的考试数据迁移到 Exam 表
  - [ ] 将 CandidateProductLine 中的韧测数据迁移到 Test 表
  - [ ] 将 CandidateProductLine 中的面试数据迁移到 Interview 表

- [ ] 任务 14: 测试验证
  - [ ] 测试员工列表功能
  - [ ] 测试机考管理功能
  - [ ] 测试韧测管理功能
  - [ ] 测试面试管理功能
  - [ ] 测试数据完整性

## 任务依赖关系
- 任务 1-3 可以在并行执行
- 任务 4 依赖于任务 1-3
- 任务 5 依赖于任务 4
- 任务 6 依赖于任务 1-5
- 任务 7 依赖于任务 6
- 任务 8-11 依赖于任务 7
- 任务 12 依赖于任务 8-11
- 任务 13 可以在测试前独立执行
- 任务 14 依赖于所有其他任务