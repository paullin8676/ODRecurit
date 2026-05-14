<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">角色管理</h2>
      <el-button type="primary" @click="showCreateDialog = true" v-if="authStore.hasPermission('btn_role_create')">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="roles" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色代码" />
        <el-table-column prop="level" label="角色层级" />
        <el-table-column prop="dataScope" label="数据权限" width="120">
          <template #default="scope">
            <el-tag :type="getScopeTagType(scope.row.dataScope)">
              {{ getScopeLabel(scope.row.dataScope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" fixed="right" width="200" v-if="authStore.hasPermission('btn_role_edit') || authStore.hasPermission('btn_role_delete') || authStore.hasPermission('btn_permission_assign')">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="editRole(scope.row)" v-if="authStore.hasPermission('btn_role_edit')">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteRole(scope.row)" v-if="authStore.hasPermission('btn_role_delete')">删除</el-button>
            <el-button type="primary" link size="small" @click="assignPermissions(scope.row)" v-if="authStore.hasPermission('btn_permission_assign')">分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" :title="editRoleData ? '编辑角色' : '新增角色'" width="400px">
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="roleForm.code" :disabled="!!editRoleData" />
        </el-form-item>
        <el-form-item label="角色层级" prop="level">
          <el-select v-model="roleForm.level">
            <el-option label="1 - 顾问" :value="1" />
            <el-option label="2 - 主管" :value="2" />
            <el-option label="3 - 经理" :value="3" />
            <el-option label="4 - 总监" :value="4" />
            <el-option label="5 - 管理员" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据权限" prop="dataScope">
          <el-select v-model="roleForm.dataScope">
            <el-option label="自己数据" value="self" />
            <el-option label="下级数据" value="subordinate" />
            <el-option label="全局数据" value="global" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPermissionDialog" title="分配权限" width="600px">
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :checked-keys="checkedPermissionIds"
        :props="{ label: 'name', children: 'children' }"
        @check="handlePermissionCheck"
      />
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const roles = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showPermissionDialog = ref(false)
const roleFormRef = ref()
const permissionTreeRef = ref()
const editRoleData = ref(null)
const currentRole = ref(null)
const permissionTree = ref([])
const checkedPermissionIds = ref([])

const roleForm = reactive({
  name: '',
  code: '',
  level: 1,
  dataScope: 'self',
  description: ''
})

const roleRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色代码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择角色层级', trigger: 'change' }],
  dataScope: [{ required: true, message: '请选择数据权限', trigger: 'change' }]
}

const getScopeTagType = (scope) => {
  const types = {
    self: 'info',
    subordinate: 'warning',
    global: 'success'
  }
  return types[scope] || 'info'
}

const getScopeLabel = (scope) => {
  const labels = {
    self: '自己数据',
    subordinate: '下级数据',
    global: '全局数据'
  }
  return labels[scope] || scope
}

const loadRoles = async () => {
  loading.value = true
  try {
    const data = await api.get('/roles')
    roles.value = data
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  roleForm.name = ''
  roleForm.code = ''
  roleForm.level = 1
  roleForm.dataScope = 'self'
  roleForm.description = ''
  editRoleData.value = null
}

const editRole = (role) => {
  editRoleData.value = role
  roleForm.name = role.name
  roleForm.code = role.code
  roleForm.level = role.level
  roleForm.dataScope = role.dataScope
  roleForm.description = role.description
  showCreateDialog.value = true
}

const deleteRole = async (role) => {
  if (role.code === 'admin' || role.code === 'consultant') {
    ElMessage.warning('系统预设角色不能删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定删除角色 "${role.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/roles/${role.id}`)
    ElMessage.success('删除成功')
    await loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const saveRole = async () => {
  const valid = await roleFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (editRoleData.value) {
      await api.put(`/roles/${editRoleData.value.id}`, roleForm)
      ElMessage.success('修改成功')
    } else {
      await api.post('/roles', roleForm)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    await loadRoles()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const assignPermissions = async (role) => {
  currentRole.value = role
  
  const [permissions, rolePermissions] = await Promise.all([
    api.get('/permissions'),
    api.get(`/role-permissions/role/${role.id}`)
  ])
  const rolePermissionIds = rolePermissions.map(p => p.id)
  
  permissionTree.value = buildTree(permissions)
  checkedPermissionIds.value = rolePermissionIds.map(id => Number(id))
  
  showPermissionDialog.value = true
  
  await nextTick()
  await nextTick()
  await nextTick()
  
  if (permissionTreeRef.value) {
    permissionTreeRef.value.setCheckedKeys([])
    await nextTick()
    permissionTreeRef.value.setCheckedKeys(checkedPermissionIds.value)
  }
}

const handlePermissionCheck = (data, node) => {
  checkedPermissionIds.value = [...node.checkedKeys].filter(id => id !== 'buttons')
}

const buildTree = (permissions) => {
  const menuPermissions = permissions.filter(p => p.type === 'menu')
  const buttonPermissions = permissions.filter(p => p.type === 'button')
  
  const menuTree = menuPermissions.map(p => ({
    id: Number(p.id),
    name: p.name,
    code: p.code,
    type: p.type,
    children: []
  }))
  
  const buttonChildren = buttonPermissions.map(p => ({
    id: Number(p.id),
    name: p.name,
    code: p.code,
    type: p.type,
    children: []
  }))
  
  const buttonNode = {
    id: 'buttons',
    name: '按钮权限',
    children: buttonChildren
  }
  
  return [...menuTree, buttonNode]
}

const savePermissions = async () => {
  try {
    const keys = permissionTreeRef.value.getCheckedKeys(false)
    const checkedIds = keys.filter(id => id !== 'buttons')
    await api.post(`/role-permissions/role/${currentRole.value.id}`, {
      permissionIds: checkedIds
    })
    ElMessage.success('权限分配成功')
    showPermissionDialog.value = false
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}



onMounted(() => {
  loadRoles()
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
