<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">权限管理</h2>
      <el-button type="primary" @click="showCreateDialog = true" v-if="authStore.hasPermission('btn_permission_create')">
        <el-icon><Plus /></el-icon>
        新增权限
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="permissions" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="权限代码" />
        <el-table-column prop="name" label="权限名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'menu' ? 'info' : 'warning'" size="small">
              {{ scope.row.type === 'menu' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="icon" label="图标" />
        <el-table-column label="操作" fixed="right" width="180" v-if="authStore.hasPermission('btn_permission_edit') || authStore.hasPermission('btn_permission_delete')">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="editPermission(scope.row)" v-if="authStore.hasPermission('btn_permission_edit')">编辑</el-button>
            <el-button type="danger" link size="small" @click="deletePermission(scope.row)" v-if="authStore.hasPermission('btn_permission_delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" :title="editPermissionData ? '编辑权限' : '新增权限'" width="400px">
      <el-form ref="permissionFormRef" :model="permissionForm" :rules="permissionRules" label-width="100px">
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="permissionForm.code" :disabled="!!editPermissionData" />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="permissionForm.type">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="permissionForm.path" placeholder="菜单类型填写路由路径" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="permissionForm.icon" placeholder="Element Plus图标名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input v-model="permissionForm.sortOrder" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermission">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const permissions = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const permissionFormRef = ref()
const editPermissionData = ref(null)

const permissionForm = reactive({
  code: '',
  name: '',
  type: 'menu',
  path: '',
  icon: '',
  sortOrder: 0
})

const permissionRules = {
  code: [{ required: true, message: '请输入权限代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const loadPermissions = async () => {
  loading.value = true
  try {
    const data = await api.get('/permissions')
    permissions.value = data
  } catch (error) {
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  permissionForm.code = ''
  permissionForm.name = ''
  permissionForm.type = 'menu'
  permissionForm.path = ''
  permissionForm.icon = ''
  permissionForm.sortOrder = 0
  editPermissionData.value = null
}

const editPermission = (permission) => {
  editPermissionData.value = permission
  permissionForm.code = permission.code
  permissionForm.name = permission.name
  permissionForm.type = permission.type
  permissionForm.path = permission.path || ''
  permissionForm.icon = permission.icon || ''
  permissionForm.sortOrder = permission.sortOrder || 0
  showCreateDialog.value = true
}

const deletePermission = async (permission) => {
  try {
    await ElMessageBox.confirm(`确定删除权限 "${permission.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/permissions/${permission.id}`)
    ElMessage.success('删除成功')
    await loadPermissions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const savePermission = async () => {
  const valid = await permissionFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (editPermissionData.value) {
      await api.put(`/permissions/${editPermissionData.value.id}`, permissionForm)
      ElMessage.success('修改成功')
    } else {
      await api.post('/permissions', permissionForm)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    await loadPermissions()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  loadPermissions()
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
