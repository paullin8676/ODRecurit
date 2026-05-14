<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="handleCreate" v-if="authStore.hasPermission('btn_user_create')">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="roles" label="角色" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              :type="getRoleTagType(role.code)"
              size="small"
            >
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="authStore.hasPermission('btn_user_edit')">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" :disabled="row.id === authStore.user?.id" v-if="authStore.hasPermission('btn_user_delete')">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple style="width: 100%">
            <el-option v-for="role in allRoles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级主管" prop="managerId">
          <el-select v-model="form.managerId" style="width: 100%" placeholder="请选择上级主管">
            <el-option label="无" :value="''" />
            <el-option v-for="manager in managers" :key="manager.id" :label="manager.realName" :value="manager.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive" v-if="isEdit">
          <el-switch v-model="form.isActive" />
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
import { userApi } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '../utils/api'

const authStore = useAuthStore()

const users = ref([])
const managers = ref([])
const allRoles = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const currentId = ref(null)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  realName: '',
  roleIds: [],
  managerId: null,
  email: '',
  phone: '',
  isActive: true
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }],
  roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getRoleTagType = (code) => {
  const types = {
    admin: 'danger',
    director: 'warning',
    manager: 'primary',
    supervisor: 'info',
    consultant: 'success'
  }
  return types[code] || 'default'
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await userApi.getAll()
    users.value = data.users
    managers.value = data.users.filter(user => {
      return user.roles?.some(r => r.level >= 2)
    })
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const data = await api.get('/roles')
    allRoles.value = data
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  }
}

const handleCreate = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  form.roleIds = []
  form.managerId = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  currentId.value = row.id
  
  const roleIds = row.roles?.map(r => r.id) || []
  
  Object.assign(form, {
    username: row.username,
    realName: row.realName,
    roleIds: roleIds,
    managerId: row.managerId || '',
    email: row.email,
    phone: row.phone,
    isActive: row.isActive
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await userApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      const { username, password, roleIds, ...updateData } = form
      await userApi.update(currentId.value, updateData)
      await api.post(`/user-roles/user/${currentId.value}`, { roleIds })
      ElMessage.success('更新成功')
    } else {
      const { roleIds, ...createData } = form
      const data = await userApi.create(createData)
      await api.post(`/user-roles/user/${data.user.id}`, { roleIds })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  formRef.value.resetFields()
  Object.assign(form, {
    username: '',
    password: '',
    realName: '',
    roleIds: [],
    managerId: null,
    email: '',
    phone: '',
    isActive: true
  })
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
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
