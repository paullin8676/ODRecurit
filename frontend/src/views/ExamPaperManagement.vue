<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">试卷配置</h2>
      <el-button type="primary" @click="handleCreate" v-if="authStore.isManager">
        <el-icon><Plus /></el-icon>
        新增试卷
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="examPapers" v-loading="loading" stripe>
        <el-table-column prop="name" label="试卷名称" width="200" />
        <el-table-column prop="totalScore" label="总分" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150" v-if="authStore.isManager">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.isActive" type="danger" link size="small" @click="handleDelete(row)">禁用</el-button>
            <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="试卷名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="form.totalScore" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { examPaperApi } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const examPapers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增试卷')
const submitLoading = ref(false)
const formRef = ref()
const currentId = ref(null)
const isEdit = ref(false)

const form = reactive({
  name: '',
  totalScore: 100,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }]
}

const fetchExamPapers = async () => {
  loading.value = true
  try {
    const data = await examPaperApi.getAll()
    examPapers.value = data.examPapers
  } catch (error) {
    ElMessage.error('获取试卷列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  dialogTitle.value = '新增试卷'
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑试卷'
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    name: row.name,
    totalScore: row.totalScore,
    description: row.description
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    const response = await examPaperApi.delete(row.id)
    if (response.deleted) {
      ElMessage.success('删除成功')
    } else if (response.deactivated) {
      ElMessage.success('禁用成功')
    }
    fetchExamPapers()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (row) => {
  try {
    await examPaperApi.update(row.id, { isActive: true })
    ElMessage.success('启用成功')
    fetchExamPapers()
  } catch (error) {
    ElMessage.error(error.message || '启用失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await examPaperApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await examPaperApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchExamPapers()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  formRef.value.resetFields()
  Object.assign(form, {
    name: '',
    totalScore: 100,
    description: ''
  })
}

onMounted(() => {
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
