
# 删除 CandidateProductLine 表重构计划

## 一、研究总结

当前系统使用 CandidateProductLine 表作为中间表关联 Candidate、ProductLine 和 Interview，结构如下：

- **Candidate** ← 1:1 → **CandidateProductLine** ← 1:1 → **Interview**
- **CandidateProductLine** ← N:1 → **ProductLine**

用户需求是：
1. 删除 CandidateProductLine 表
2. Interview 表中移除 candidateProductLineId 外键
3. Interview 表添加 productLineId 外键
4. 前端面试编辑界面：添加单独的产品线选择区域，位于基本信息之下、推荐面试之上，任何时候都可以选择产品线

## 二、文件清单

### 后端（Backend）

| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `backend/src/models/Interview.js` | 修改 | 移除 candidateProductLineId，添加 productLineId |
| `backend/src/models/CandidateProductLine.js` | 删除 | 删除整个文件 |
| `backend/src/models/index.js` | 修改 | 移除 CandidateProductLine 相关关联 |
| `backend/src/routes/interview.js` | 修改 | 重构所有 CandidateProductLine 相关逻辑 |
| `backend/src/routes/candidate.js` | 修改 | 移除 CandidateProductLine 相关逻辑 |
| `backend/src/routes/exam.js` | 修改 | 移除 CandidateProductLine 引用 |
| `backend/src/routes/statistics.js` | 修改 | 移除 CandidateProductLine 引用 |
| `backend/src/routes/employee.js` | 修改 | 移除 CandidateProductLine 引用 |
| `backend/database_schema.sql` | 修改 | 更新数据库结构 |

### 前端（Frontend）

| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `frontend/src/views/InterviewStage.vue` | 修改 | 添加产品线选择区域，移除 CandidateProductLine 相关逻辑 |

### 文档（Documentation）

| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `project_prd.md` | 修改 | 更新数据库表结构和关系 |
| `recruit_rule.md` | 修改 | 更新业务逻辑说明 |

## 三、实施步骤

### 阶段一：数据库迁移（Database Migration）

1. **迁移数据**：将 CandidateProductLine 的数据迁移到 Interview 表
   - candidateId 保持不变
   - productLineId 从 CandidateProductLine.productLineId 迁移到 Interview.productLineId
   - recommendDate 从 CandidateProductLine.recommendDate 迁移到 InterviewRound(recommend_interview).scheduledDate

2. **更新表结构**
   - 删除 CandidateProductLine 表
   - Interview 表：
     - 移除 `candidateProductLineId` 列
     - 添加 `productLineId` 列（允许空）
     - 添加 `recommendDate` 列（允许空）
     - 添加外键约束：`productLineId` → ProductLine.id

### 阶段二：后端模型重构

1. **删除模型**：删除 `backend/src/models/CandidateProductLine.js`

2. **更新 Interview 模型**
   - 移除 `candidateProductLineId` 字段
   - 添加 `productLineId` 字段
   - 添加 `recommendDate` 字段
   - 修改关联关系

3. **更新 models/index.js**
   - 移除 CandidateProductLine 相关 import
   - 重构关联关系：
     - Candidate.hasOne(Interview)
     - Interview.belongsTo(Candidate)
     - Interview.belongsTo(ProductLine)
     - ProductLine.hasMany(Interview)

### 阶段三：后端路由重构

1. **interview.js**
   - 重构 transformInterview 函数
   - 更新 GET /：include 从 CandidateProductLine 改为直接 include ProductLine
   - 更新 POST /：移除 CandidateProductLine 相关逻辑，直接处理 productLineId
   - 更新 PUT /:id：类似 POST
   - 更新 GET /:id：类似 GET /
   - 更新 PUT /:id/advance：移除 CandidateProductLine 更新逻辑
   - 更新 PUT /:id/rollback：类似 advance

2. **candidate.js**
   - 移除所有 CandidateProductLine 相关查询和操作
   - 更新 GET /:id：productLines 返回逻辑
   - 更新 POST /：移除 CandidateProductLine 创建逻辑
   - 更新 PUT /:id：移除 CandidateProductLine 更新逻辑
   - 更新 DELETE /:id：移除 CandidateProductLine 删除逻辑
   - 更新 PUT /:id/advance：移除 CandidateProductLine 更新逻辑
   - 更新 PUT /:id/rollback：移除 CandidateProductLine 更新逻辑

3. **其他路由**
   - exam.js：移除 CandidateProductLine 引用
   - statistics.js：移除 CandidateProductLine 查询，改为直接从 Interview 获取
   - employee.js：移除 CandidateProductLine 引用

### 阶段四：前端界面重构

1. **InterviewStage.vue**
   - 保持 API 兼容性：后端仍返回 `productLines` 数组格式（如果有产品线则返回单个元素，否则空数组）
   - 添加"产品线选择"区块：
     - 位置：基本信息下方、推荐面试上方
     - 组件：下拉选择框（el-select）
     - 任何阶段都可以编辑（不设限制）
   - 修改数据提交逻辑：productLineId 作为独立字段，不再从 productLines 数组中取值
   - 修改界面显示：产品线名称直接显示，不再通过 selectedProductLine 索引

### 阶段五：文档更新

1. **database_schema.sql**
   - 删除 CandidateProductLine 表定义
   - 更新 Interview 表结构
   - 更新关系图

2. **project_prd.md**
   - 移除 CandidateProductLine 表说明
   - 更新 Interview 表字段说明
   - 更新关系说明

3. **recruit_rule.md**
   - 更新数据流向图
   - 更新业务规则说明

## 四、关键注意事项

1. **数据迁移策略**：保留现有数据，先迁移再删除
2. **API 兼容性**：保持前端 API 调用格式尽量不变
3. **推荐日期处理**：原 CandidateProductLine.recommendDate 迁移到 InterviewRound 的 recommend_interview 阶段的 scheduledDate
4. **产品线可编辑性**：前端任何阶段都可以修改产品线，无限制

## 五、风险处理

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| 数据迁移丢失 | 高 | 先备份数据库，测试迁移脚本 |
| API 不兼容导致前端报错 | 高 | 保持返回数据结构尽量一致 |
| 功能逻辑遗漏 | 中 | 全面测试所有涉及产品线和面试的功能 |

