<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">产品线配置</h2>
      <el-button type="primary" @click="handleCreate" v-if="authStore.isManager">
        <el-icon><Plus /></el-icon>
        新增产品线
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="productLines" v-loading="loading" stripe>
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="clientOwner" label="客户负责人" width="150" />
        <el-table-column prop="consultant" label="负责人员" width="200">
          <template #default="{ row }">
            <template v-if="Array.isArray(row.consultants) && row.consultants.length > 0">
              <el-tag v-for="(consultant, index) in row.consultants" :key="consultant.id" size="small" style="margin-right: 4px; margin-bottom: 4px">
                {{ consultant.realName || consultant.username }}
              </el-tag>
            </template>
            <template v-else>
              -
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="客户负责人" prop="clientOwner">
          <el-input v-model="form.clientOwner" />
        </el-form-item>
        <el-form-item label="负责人员" prop="consultantIds">
          <el-select v-model="form.consultantIds" multiple placeholder="请选择负责人员" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.realName || user.username"
              :value="user.id"
            />
          </el-select>
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
import { productLineApi, userApi } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const productLines = ref([])
const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增产品线')
const submitLoading = ref(false)
const formRef = ref()
const currentId = ref(null)
const isEdit = ref(false)

const form = reactive({
  name: '',
  clientOwner: '',
  consultantIds: [],
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const fetchProductLines = async () => {
  loading.value = true
  try {
    const data = await productLineApi.getAll()
    productLines.value = data.productLines
  } catch (error) {
    ElMessage.error('获取产品线列表失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const data = await userApi.getAll()
    users.value = data.users
  } catch (error) {
  }
}

const handleCreate = () => {
  dialogTitle.value = '新增产品线'
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑产品线'
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    name: row.name,
    clientOwner: row.clientOwner,
    consultantIds: row.consultants ? row.consultants.map(c => c.id) : [],
    description: row.description
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    const response = await productLineApi.delete(row.id)
    if (response.deleted) {
      ElMessage.success('删除成功')
    } else if (response.deactivated) {
      ElMessage.success('禁用成功')
    }
    fetchProductLines()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleEnable = async (row) => {
  try {
    await productLineApi.update(row.id, { isActive: true })
    ElMessage.success('启用成功')
    fetchProductLines()
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
      await productLineApi.update(currentId.value, form)
      ElMessage.success('更新成功')
    } else {
      await productLineApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchProductLines()
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
    clientOwner: '',
    consultantIds: [],
    description: ''
  })
}

onMounted(() => {
  fetchProductLines()
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
