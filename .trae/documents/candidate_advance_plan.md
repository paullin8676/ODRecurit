# 候选人推进到机考申报阶段功能改造计划

## 需求分析

当候选人处于"候选录入"（candidate_entry）阶段时，点击推进按钮需要：
1. 弹出对话框让用户选择考试试卷
2. 点击确定后：
   - 创建机考记录（关联选中的试卷）
   - 将候选人阶段推进到"机考申报"（exam_declare）阶段

## 修改文件

- `frontend/src/views/Candidates.vue`

## 修改步骤

### 步骤 1：添加试卷选择对话框

在现有的对话框后面添加一个新的对话框：
- 标题：选择考试试卷
- 包含试卷下拉选择框
- 确定和取消按钮

### 步骤 2：添加试卷数据获取

在 onMounted 中添加获取试卷列表的逻辑
添加 examPapers 响应式变量

### 步骤 3：修改 handleAdvance 函数

修改逻辑：
- 如果当前阶段是 candidate_entry：显示试卷选择对话框
- 其他阶段：按原有逻辑直接推进

### 步骤 4：添加选择试卷后的确认函数

handleConfirmAdvance 函数：
- 创建机考记录（调用 examApi.create）
- 推进候选人阶段（调用 candidateApi.advance）

### 步骤 5：添加相关变量

- examPapers: ref([]) - 试卷列表
- examPaperDialogVisible: ref(false) - 对话框显示状态
- selectedExamPaperId: ref(null) - 选中的试卷ID
- advancingCandidate: ref(null) - 当前正在推进的候选人

## 详细设计

### 对话框结构
```vue
<el-dialog
  v-model="examPaperDialogVisible"
  title="选择考试试卷"
  width="400px"
>
  <el-form :model="advanceForm" label-width="100px">
    <el-form-item label="试卷名称" prop="examPaperId">
      <el-select v-model="advanceForm.examPaperId" placeholder="请选择试卷">
        <el-option
          v-for="paper in examPapers"
          :key="paper.id"
          :label="paper.name"
          :value="paper.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="examPaperDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="handleConfirmAdvance">确定</el-button>
  </template>
</el-dialog>
```

### 函数逻辑

**handleAdvance**
```javascript
const handleAdvance = (row) => {
  if (row.currentStage === 'candidate_entry') {
    advancingCandidate.value = row
    examPaperDialogVisible.value = true
  } else {
    // 原有逻辑
    candidateApi.advance(row.id)
  }
}
```

**handleConfirmAdvance**
```javascript
const handleConfirmAdvance = async () => {
  if (!advanceForm.examPaperId) {
    ElMessage.error('请选择试卷')
    return
  }
  
  try {
    // 创建机考记录
    await examApi.create({
      candidateId: advancingCandidate.value.id,
      examPaperId: advanceForm.examPaperId,
      isOnlineExam: false,
      examPassed: 'pending'
    })
    
    // 推进阶段
    await candidateApi.advance(advancingCandidate.value.id)
    
    ElMessage.success('推进成功')
    examPaperDialogVisible.value = false
    advancingCandidate.value = null
    advanceForm.examPaperId = null
    fetchCandidates()
  } catch (error) {
    ElMessage.error(error.message || '推进失败')
  }
}
```

## 注意事项

1. 需要导入 examPaperApi 和 examApi
2. 需要确保试卷列表在组件挂载时获取
3. 需要处理试卷为空的情况（提示用户先配置试卷）
4. 需要重置表单数据
