<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="isCollapsed ? '64px' : '220px'" class="aside">
        <div class="logo">
          <div class="logo-content">
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
          <el-menu-item index="/">
            <el-icon><Odometer /></el-icon>
            <template #title>控制台</template>
          </el-menu-item>

          <el-sub-menu index="candidates" v-if="authStore.isManager">
            <template #title>
              <el-icon><User /></el-icon>
              <span>招聘管理</span>
            </template>
            <el-menu-item index="/candidates">候选录入</el-menu-item>
            <el-menu-item index="/exam-stage">机考管理</el-menu-item>
            <el-menu-item index="/test-stage">韧测管理</el-menu-item>
            <el-menu-item index="/interview-stage">面试管理</el-menu-item>
            <el-menu-item index="/employee-management">员工管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="statistics" v-if="authStore.isManager">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </template>
            <el-menu-item index="/statistics">统计报表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="settings" v-if="authStore.isManager">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/settings/users">用户管理</el-menu-item>
            <el-menu-item index="/settings/product-lines">产品线配置</el-menu-item>
            <el-menu-item index="/settings/exam-papers">试卷配置</el-menu-item>
            <el-menu-item index="/settings/test-types">韧测类型</el-menu-item>
            <el-menu-item index="/settings/exam-pass-lines">机考通过线</el-menu-item>
            <el-menu-item index="/stage-config">阶段配置</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="user" class="user-menu-item">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span v-if="!isCollapsed">{{ authStore.user?.realName || authStore.user?.username }}</span>
            </template>
            <el-menu-item index="user-info" @click="handleUserInfoClick">
              <el-icon><User /></el-icon>
              <template #title>用户信息</template>
            </el-menu-item>
            <el-menu-item index="change-password" @click="handleChangePasswordClick">
              <el-icon><Key /></el-icon>
              <template #title>修改密码</template>
            </el-menu-item>
            <el-menu-item index="logout" @click="handleLogoutClick">
              <el-icon><SwitchButton /></el-icon>
              <template #title>退出登录</template>
            </el-menu-item>
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
      <el-form :model="authStore.user" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="authStore.user.username" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="authStore.user.realName" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="authStore.user.role" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="authStore.user.email" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="authStore.user.phone" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { Fold, User, UserFilled, DataAnalysis, Setting, ArrowDown, Odometer, ArrowLeft, ArrowRight, SwitchButton, Key } from '@element-plus/icons-vue'

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

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  background-color: #ffffff;
  padding: 0 16px;
  border-bottom: 1px solid #d9ecff;
}

.logo-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  min-width: 0;
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
  width: 32px;
  height: 32px;
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
</style>
