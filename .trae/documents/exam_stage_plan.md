# 机考管理字段联动逻辑修改计划

## 需求分析

修改"机考管理"页面（ExamStage.vue）的字段联动逻辑：

### 1. 选择试卷名称后自动带出字段
- 自动带出**考试日期**（从试卷配置的 examDate 字段获取）
- 自动带出**机考总分**（已有功能）

### 2. "是否机考"字段改造
- **改为不可编辑**（禁用状态）
- **默认值**为"否"
- **联动逻辑**：
  - 当填了实际得分后自动改为"是"
  - 当实际得分为空值时自动改为"否"

### 3. "是否通过"字段改造
- **改为不可编辑**（禁用状态）
- **增加选项值**：待机考（默认）、通过、未通过
- 从原来的 `el-switch`（布尔值）改为 `el-select`
- **联动逻辑**：
  - 当实际得分 > 0 且 >= 该试卷配置的通过线 → 自动改为"通过"
  - 当实际得分为空值 → 自动改为"待机考"
  - 其他情况 → 自动改为"未通过"

## 修改文件

- `frontend/src/views/ExamStage.vue`

## 修改步骤

### 步骤 1：修改模板 - "是否机考"字段
- 将 `el-switch` 改为 `el-select` 或保持 `el-switch` 但添加联动逻辑
- 添加 `:disabled="true"` 使其不可编辑

### 步骤 2：修改模板 - "是否通过"字段
- 将 `el-switch` 改为 `el-select`
- 添加选项：待机考（值待定）、通过、未通过
- 默认值为"待机考"

### 步骤 3：修改 handleExamPaperChange 函数
- 增加带出 examDate（考试日期）的逻辑

### 步骤 4：修改 editingForm 默认值
- `isOnlineExam` 默认值改为 `false`（否）
- `examPassed` 默认值改为 `'pending'`（待机考）

### 步骤 5：添加实际得分变更处理函数
- `handleExamScoreChange` 函数：
  - 当得分有值时：`isOnlineExam = true`
  - 当得分无值时：`isOnlineExam = false`
  - 根据得分和通过线判断 `examPassed` 的值

### 步骤 6：修改编辑状态初始化 handleEdit
- 确保 `examPassed` 显示正确的文本值

## 字段值定义

| 字段 | 数据类型 | 值选项 |
|------|----------|--------|
| isOnlineExam | boolean | true（是）, false（否） |
| examPassed | string | 'pending'（待机考）, 'passed'（通过）, 'failed'（未通过） |

## 联动逻辑详细说明

### 试卷选择后 (handleExamPaperChange)
```
examTotalScore = selectedPaper.totalScore
examDate = selectedPaper.examDate
```

### 实际得分变更后 (handleExamScoreChange)
```
如果 examScore 有值:
    isOnlineExam = true
    如果 examScore >= 试卷通过线:
        examPassed = 'passed'
    否则:
        examPassed = 'failed'
否则:
    isOnlineExam = false
    examPassed = 'pending'
```

## 查看对话框显示修改

还需要修改"查看"对话框中的显示：
- "是否通过"需要显示"待机考"、"通过"、"未通过"三种状态
