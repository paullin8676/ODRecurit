<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">业务线配置</h2>
      <el-button type="primary" @click="handleCreate" v-if="authStore.isManager">
        <el-icon><Plus /></el-icon>
        新增业务线
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="businessLines" v-loading="loading" stripe>
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可编辑用户" width="200">
          <template #default="{ row }">
            <span v-if="row.canEdit && row.canEdit.length > 0">
              {{ getEditUsersDisplay(row.canEdit) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200" v-if="authStore.isManager">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.isActive" type="danger" link size="small" @click="handleDelete(row)">禁用</el-button>
            <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="可编辑用户">
          <el-select
            v-model="form.canEdit"
            multiple
            placeholder="请选择可编辑业务线的用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.realName || user.username"
              :value="user.id"
            />
          </el-select>
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            选中的用户可以在面试阶段编辑候选人的业务线
          </div>
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
import { businessLineApi, userApi } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const businessLines = ref([])
const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增业务线')
const submitLoading = ref(false)
const formRef = ref()
const currentId = ref(null)
const isEdit = ref(false)

const form = reactive({
  name: '',
  description: '',
  canEdit: []
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const fetchBusinessLines = async () => {
  loading.value = true
  try {
    const data = await businessLineApi.getAll()
    businessLines.value = data.businessLines
  } catch (error) {
    ElMessage.error('获取业务线列表失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const data = await userApi.getAll({})
    users.value = data.users || []
  } catch (error) {
    users.value = []
  }
}

const getEditUsersDisplay = (canEdit) => {
  if (!canEdit || !Array.isArray(canEdit)) return '-'
  const editUsers = users.value.filter(u => canEdit.includes(u.id))
  return editUsers.map(u => u.realName || u.username).join('、')
}

const handleCreate = () => {
  dialogTitle.value = '新增业务线'
  isEdit.value = false
  Object.assign(form, {
    name: '',
    description: '',
    canEdit: []
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑业务线'
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    name: row.name,
    description: row.description,
    canEdit: row.canEdit || []
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    const response = await businessLineApi.delete(row.id)
    if (response.deleted) {
      ElMessage.success('删除成功')
    } else if (response.deactivated) {
      ElMessage.success('禁用成功')
    }
    fetchBusinessLines()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (row) => {
  try {
    await businessLineApi.update(row.id, { isActive: true })
    ElMessage.success('启用成功')
    fetchBusinessLines()
  } catch (error) {
    ElMessage.error(error.message || '启用失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const submitData = {
      name: form.name,
      description: form.description,
      canEdit: form.canEdit
    }

    if (isEdit.value) {
      await businessLineApi.update(currentId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await businessLineApi.create(submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchBusinessLines()
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
    description: '',
    canEdit: []
  })
}

onMounted(() => {
  fetchBusinessLines()
  fetchUsers()
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