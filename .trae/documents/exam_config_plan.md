# 机考配置改造计划

## 需求分析

根据用户需求，需要完成以下改造：

1. **删除机考通过线系统配置**：移除独立的 ExamPassLine 管理页面和相关路由
2. **试卷配置改名为机考配置**：将 ExamPaperManagement 页面标题和菜单名称改为"机考配置"
3. **增加两个新字段**：在机考配置中增加 `passLine`（通过线）和 `examDate`（机考日期）字段

## 影响范围分析

### 后端修改
- `backend/src/models/ExamPaper.js` - 添加 passLine 和 examDate 字段
- `backend/src/routes/examPaper.js` - 更新创建和更新逻辑
- `backend/src/models/ExamPassLine.js` - 保留（数据迁移需要）
- `backend/src/routes/examPassLine.js` - 保留（数据迁移需要）

### 前端修改
- `frontend/src/views/ExamPaperManagement.vue` - 改标题、加字段
- `frontend/src/views/Layout.vue` - 修改菜单名称
- `frontend/src/router/index.js` - 删除机考通过线路由
- `frontend/src/views/ExamPassLineManagement.vue` - 删除文件
- `frontend/src/api/index.js` - 删除 examPassLineApi（可选，保留兼容）

### 数据迁移
- 需要将 ExamPassLine 表中的 passLine 数据迁移到 ExamPaper 表

## 实施步骤

### 步骤 1：修改后端 ExamPaper 模型

在 `ExamPaper` 模型中添加两个新字段：
- `passLine`: INTEGER, 默认 60
- `examDate`: DATE, 可选

### 步骤 2：更新后端路由

更新 `examPaper.js` 路由，支持新字段的创建和更新。

### 步骤 3：创建数据迁移脚本

创建脚本将 ExamPassLine 中的通过线数据迁移到 ExamPaper 表。

### 步骤 4：修改前端 ExamPaperManagement.vue

- 修改页面标题为"机考配置"
- 在表单中添加通过线和机考日期字段
- 更新表格显示新字段

### 步骤 5：修改前端 Layout.vue

将菜单中"试卷配置"改为"机考配置"

### 步骤 6：删除机考通过线路由和页面

- 删除 router/index.js 中的机考通过线路由
- 删除 Layout.vue 中的机考通过线菜单
- 删除 ExamPassLineManagement.vue 文件

### 步骤 7：测试验证

启动前后端服务，验证功能正常。

## 风险评估

| 风险 | 描述 | 应对措施 |
|------|------|----------|
| 数据丢失 | 删除 ExamPassLine 页面可能导致数据无法访问 | 保留后端模型和路由，仅删除前端页面 |
| 字段兼容性 | 新字段为必填可能影响旧数据 | 设置合理默认值，允许为空 |
| 数据库同步 | 字段添加需要数据库同步 | 依赖 Sequelize 自动同步 |

## 文件修改清单

| 文件路径 | 修改类型 | 说明 |
|----------|----------|------|
| `backend/src/models/ExamPaper.js` | 修改 | 添加 passLine 和 examDate 字段 |
| `backend/src/routes/examPaper.js` | 修改 | 支持新字段的 CRUD |
| `frontend/src/views/ExamPaperManagement.vue` | 修改 | 改标题，添加新字段 |
| `frontend/src/views/Layout.vue` | 修改 | 菜单名称修改 |
| `frontend/src/router/index.js` | 修改 | 删除机考通过线路由 |
| `frontend/src/views/ExamPassLineManagement.vue` | 删除 | 删除页面文件 |