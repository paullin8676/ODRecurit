<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="isCollapsed ? '64px' : '180px'" class="aside">
        <div class="logo">
          <div class="logo-content" :class="{ 'logo-collapsed': isCollapsed }">
            <div class="logo-title" v-if="!isCollapsed">招聘系统</div>
            <div class="sidebar-toggle" @click="toggleSidebar">
              <el-icon v-if="!isCollapsed"><ArrowLeft /></el-icon>
              <el-icon v-else><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :router="true"
          background-color="#ecf5ff"
          text-color="#606266"
          active-text-color="#409eff"
        >
          <template v-for="menu in visibleMenus" :key="menu.index">
            <el-menu-item v-if="!menu.children" :index="menu.path">
              <el-icon class="menu-icon"><component :is="menu.icon"></component></el-icon>
              <template #title>{{ menu.title }}</template>
            </el-menu-item>
            <el-sub-menu v-else :index="menu.index">
              <template #title>
                <el-icon class="menu-icon"><component :is="menu.icon"></component></el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <template #default>
                <el-menu-item
                  v-for="child in menu.children"
                  :key="child.path"
                  :index="child.path"
                  class="sub-menu-item"
                >
                  {{ child.title }}
                </el-menu-item>
              </template>
            </el-sub-menu>
          </template>

          <el-sub-menu index="user" class="user-menu-item">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span v-if="!isCollapsed">{{ authStore.user?.realName || authStore.user?.username }}</span>
            </template>
            <template #default>
              <div class="custom-menu-item" @click="handleUserInfoClick">
                <el-icon><User /></el-icon>
                <span>用户信息</span>
              </div>
              <div class="custom-menu-item" @click="handleChangePasswordClick">
                <el-icon><Key /></el-icon>
                <span>修改密码</span>
              </div>
              <div class="custom-menu-item" @click="handleLogoutClick">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </div>
            </template>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-container>
        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userInfoDialogVisible" title="用户信息" width="400px">
      <el-form :model="authStore.user || {}" label-width="100px">
        <el-form-item label="用户名">
          <el-input :value="authStore.user?.username" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input :value="authStore.user?.realName" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-input :value="authStore.user?.roles?.map(r => r.name).join(', ') || '无'" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :value="authStore.user?.email" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="authStore.user?.phone" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { 
  User, UserFilled, Setting, ArrowDown, 
  Odometer, ArrowLeft, ArrowRight, SwitchButton, Key,
  Briefcase, PieChart, CirclePlus, Files
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const activeMenu = computed(() => route.path)

const menuConfig = [
  {
    index: 'dashboard',
    title: '控制台',
    path: '/',
    icon: markRaw(Odometer),
    permission: 'menu_dashboard'
  },
  {
    index: 'candidates',
    title: '招聘管理',
    icon: markRaw(CirclePlus),
    children: [
      { title: '候选录入', path: '/candidates', permission: 'menu_candidates' },
      { title: '机考管理', path: '/exam-stage', permission: 'menu_exam' },
      { title: '韧测管理', path: '/test-stage', permission: 'menu_test' },
      { title: '面试管理', path: '/interview-stage', permission: 'menu_interview' },
      { title: '员工管理', path: '/employee-management', permission: 'menu_employee' }
    ]
  },
  {
    index: 'statistics',
    title: '统计报表',
    icon: markRaw(PieChart),
    children: [
      { title: '数据统计', path: '/statistics', permission: 'menu_statistics_data' },
      { title: '停留分析', path: '/duration-analysis', permission: 'menu_statistics_duration' },
      { title: '停留明细', path: '/duration-records', permission: 'menu_statistics_records' }
    ]
  },
  {
    index: 'settings',
    title: '系统设置',
    icon: markRaw(Setting),
    children: [
      { title: '业务配置', path: '/settings/business-lines', permission: 'menu_business_lines' },
      { title: '机考配置', path: '/settings/exam-papers', permission: 'menu_exam_papers' },
      { title: '阶段配置', path: '/stage-config', permission: 'menu_stage_config' },
      { title: '用户管理', path: '/settings/users', permission: 'menu_users' },
      { title: '角色管理', path: '/settings/roles', permission: 'menu_role_management' },
      { title: '权限管理', path: '/settings/permissions', permission: 'menu_permission_management' },
      { title: '数据备份', path: '/settings/backup', permission: 'menu_backup' }
    ]
  }
]

const visibleMenus = computed(() => {
  return menuConfig.map(menu => {
    if (!menu.children) {
      if (!menu.permission || authStore.hasPermission(menu.permission)) {
        return menu
      }
      return null
    }
    
    const visibleChildren = menu.children.filter(child => {
      return !child.permission || authStore.hasPermission(child.permission)
    })
    
    if (visibleChildren.length > 0) {
      return {
        ...menu,
        children: visibleChildren
      }
    }
    return null
  }).filter(menu => menu !== null)
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleChangePasswordClick = () => {
  passwordDialogVisible.value = true
}

const handleLogoutClick = () => {
  authStore.logout()
  router.push('/login')
}

const userInfoDialogVisible = ref(false)

const handleUserInfoClick = () => {
  userInfoDialogVisible.value = true
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await authStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    passwordFormRef.value.resetFields()
  } catch (error) {
    ElMessage.error(error.message || '修改失败')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #ecf5ff;
  transition: width 0.3s;
  overflow-x: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d9ecff;
}

.custom-menu-item {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: background-color 0.2s;
}

.custom-menu-item:hover {
  background-color: #e6f7ff;
  color: #409eff;
}

.custom-menu-item span {
  margin-left: 10px;
}

.logo-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  padding: 16px 0;
  height: 60px;
  border-bottom: 1px solid #d9ecff;
}

.logo-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.sidebar-toggle {
  position: absolute;
  right: 16px;
}

.logo-content.logo-collapsed {
  justify-content: center;
}

.logo-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  text-align: center;
}

.sidebar-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #909399;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.sidebar-toggle:hover {
  background-color: #ecf5ff;
}

.sidebar-toggle el-icon {
  font-size: 16px;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.user-menu-item {
  margin-top: auto;
  border-top: 1px solid #e4e7ed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  padding: 0;
  border-radius: 0;
  transition: none;
  font-size: 14px;
  width: 100%;
  justify-content: flex-start;
}

.user-info:hover {
  background-color: transparent;
}

.username {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.main {
  background-color: #ffffff;
  padding: 12px 20px;
  overflow-y: auto;
}

.sub-menu-item {
  padding-left: 48px !important;
}

:deep(.el-menu-item) {
  padding-left: 20px !important;
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 48px !important;
  background-color: #d6e4ff !important;
}

:deep(.el-sub-menu__title) {
  background-color: #ecf5ff !important;
}

:deep(.el-menu--collapse .el-menu-item) {
  padding-left: 0 !important;
  text-align: center;
}

.menu-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  line-height: 16px !important;
}

:deep(.el-menu-item .menu-icon) {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px;
}

:deep(.el-sub-menu__title .menu-icon) {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px;
}

:deep(.el-menu-item .menu-icon svg) {
  width: 16px !important;
  height: 16px !important;
}

:deep(.el-sub-menu__title .menu-icon svg) {
  width: 16px !important;
  height: 16px !important;
}
</style>
