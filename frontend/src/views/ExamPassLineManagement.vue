<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">机考通过线配置</h2>
      <el-button type="primary" @click="handleCreate" v-if="authStore.isManager">
        <el-icon><Plus /></el-icon>
        新增通过线
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="examPassLines" v-loading="loading" stripe>
        <el-table-column prop="ExamPaper.name" label="试卷名称" width="200" />
        <el-table-column prop="passLine" label="通过线" width="120">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">{{ row.passLine }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isCurrent" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isCurrent ? 'success' : 'info'" size="small">
              {{ row.isCurrent ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150" v-if="authStore.isManager">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.isCurrent" type="danger" link size="small" @click="handleDelete(row)">禁用</el-button>
            <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="试卷" prop="examPaperId">
          <el-select v-model="form.examPaperId" placeholder="请选择试卷" style="width: 100%">
            <el-option
              v-for="paper in examPapers"
              :key="paper.id"
              :label="paper.name"
              :value="paper.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通过线" prop="passLine">
          <el-input-number v-model="form.passLine" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { examPassLineApi, examPaperApi } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const examPassLines = ref([])
const examPapers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增通过线')
const submitLoading = ref(false)
const formRef = ref()
const currentId = ref(null)
const isEdit = ref(false)

const form = reactive({
  examPaperId: null,
  passLine: 60
})

const rules = {
  examPaperId: [{ required: true, message: '请选择试卷', trigger: 'change' }],
  passLine: [{ required: true, message: '请输入通过线', trigger: 'blur' }]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchExamPassLines = async () => {
  loading.value = true
  try {
    const data = await examPassLineApi.getAll()
    examPassLines.value = data.examPassLines
  } catch (error) {
    ElMessage.error('获取机考通过线列表失败')
  } finally {
    loading.value = false
  }
}

const fetchExamPapers = async () => {
  try {
    const data = await examPaperApi.getAll()
    examPapers.value = data.examPapers.filter(p => p.isActive)
  } catch (error) {
  }
}

const handleCreate = () => {
  dialogTitle.value = '新增通过线'
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑通过线'
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    examPaperId: row.examPaperId,
    passLine: row.passLine
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    // 设置为禁用状态
    await examPassLineApi.update(row.id, { isCurrent: false })
    ElMessage.success('禁用成功')
    fetchExamPassLines()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (row) => {
  try {
    // 设置为启用状态
    await examPassLineApi.update(row.id, { isCurrent: true })
    ElMessage.success('启用成功')
    fetchExamPassLines()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await examPassLineApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await examPassLineApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchExamPassLines()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  formRef.value.resetFields()
  Object.assign(form, {
    examPaperId: null,
    passLine: 60
  })
}

onMounted(() => {
  fetchExamPassLines()
  fetchExamPapers()
})
</script>

<style scoped>
.page-container {
  margin-top: 0;
  padding-top: 0;
}

.page-header {
  margin-top: 0;
  padding-top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
