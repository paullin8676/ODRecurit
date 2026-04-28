<template>
  <div class="page-container">
    <div class="page-header">
      <el-button @click="router.push('/employees')">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="page-title">员工详情</h2>
    </div>

    <el-tabs v-model="activeTab" class="card-container">
      <el-tab-pane label="基本信息" name="basic">
        <el-form :model="form" label-width="120px" :disabled="!isEditing">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名">
                <el-input v-model="form.name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="form.gender" style="width: 100%">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input v-model="form.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="form.email" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="身份证号">
                <el-input v-model="form.idCard" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div class="action-bar" v-if="isEditing">
      <el-button @click="isEditing = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
    </div>
    <div class="action-bar" v-else>
      <el-button type="primary" @click="isEditing = true">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { candidateApi } from '../api'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  id: [String, Number]
})

const employee = ref({})
const form = reactive({})
const activeTab = ref('basic')
const isEditing = ref(false)
const saveLoading = ref(false)

const fetchEmployee = async () => {
  try {
    const id = props.id || route.params.id
    const data = await candidateApi.getById(id)
    employee.value = data.candidate
    Object.assign(form, data.candidate)
  } catch (error) {
    ElMessage.error('获取员工信息失败')
    router.push('/employees')
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const updateData = {
      ...form
    }
    
    await candidateApi.update(employee.value.id, updateData)
    ElMessage.success('保存成功')
    isEditing.value = false
    fetchEmployee()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  fetchEmployee()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}
</style>