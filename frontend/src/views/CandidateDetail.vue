<template>
  <div class="page-container">
    <div class="page-header">
      <el-button @click="router.push('/candidates')">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="page-title">候选人详情</h2>
    </div>

    <el-tabs v-model="activeTab" class="card-container">
      <el-tab-pane label="基本信息" name="basic">
        <el-form :model="form" label-width="120px" :disabled="true">
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


  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { candidateApi, businessLineApi } from '../api'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Close, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  id: [String, Number]
})

const candidate = ref({})
const form = reactive({})
const activeTab = ref('basic')
const businessLines = ref([])
const selectedBusinessLineIndex = ref(-1)

const stageNames = {
  employee_entry: '候选录入',
  exam_declare: '机考申报',
  exam_complete: '机考完成',
  test_declare: '韧测申报',
  test_complete: '韧测完成',
  recommend_interview: '推荐面试',
  qualification_interview: '资面安排',
  tech_interview_1: '技术面试(一)',
  tech_interview_2: '技术面试(二)',
  manager_interview: '主管面试',
  approval: '租用审批',
  offer: 'Offer',
  entry: '入职',
  leave: '离职'
}



const selectedBusinessLine = computed(() => {
  if (selectedBusinessLineIndex.value >= 0 && candidate.value.businessLines) {
    return candidate.value.businessLines[selectedBusinessLineIndex.value]
  }
  return null
})

const fetchCandidate = async () => {
  try {
    const id = props.id || route.params.id
    const data = await candidateApi.getById(id)
    candidate.value = data.candidate
    Object.assign(form, data.candidate)
    
    // Select the first business line if available
    if (candidate.value.businessLines && candidate.value.businessLines.length > 0) {
      selectedBusinessLineIndex.value = 0
    } else {
      selectedBusinessLineIndex.value = -1
    }
  } catch (error) {
    ElMessage.error('获取候选人信息失败')
    router.push('/candidates')
  }
}

const fetchOptions = async () => {
  try {
    const data = await businessLineApi.getAll()
    businessLines.value = data.businessLines || []
  } catch (error) {
  }
}

const selectBusinessLine = (index) => {
  selectedBusinessLineIndex.value = index
}

onMounted(() => {
  fetchCandidate()
  fetchOptions()
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

.stage-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.product-line-tag {
  margin-right: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 16px;
}

.product-line-tag.active {
  background-color: #409eff;
  color: white;
}

.stage-info {
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.close-icon {
  margin-left: 8px;
  font-size: 12px;
  cursor: pointer;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-divider__text) {
  color: #409eff;
  font-weight: 600;
}

.interview-stages-container {
  margin-top: 20px;
}

.interview-stage-card {
  margin-top: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #ecf5ff;
  color: #409eff;
}

.status-completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-passed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.product-line-filter {
  margin-bottom: 20px;
}

.inline-form-item {
  display: inline-block;
  margin-right: 20px;
  margin-bottom: 0;
}

/* 状态流转可视化样式 */
.stage-flow-container {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stage-flow-container h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.stage-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  flex-wrap: wrap;
}

.stage-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  min-width: 100px;
  margin-bottom: 20px;
}

.stage-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.stage-name {
  font-size: 12px;
  text-align: center;
  color: #606266;
  transition: all 0.3s ease;
}

.stage-connector {
  position: absolute;
  top: 16px;
  left: 70px;
  width: calc(100% - 140px);
  height: 2px;
  background-color: #e4e7ed;
  z-index: -1;
  transition: all 0.3s ease;
}

/* 状态样式 */
.stage-completed .stage-icon {
  background-color: #67c23a;
  color: white;
}

.stage-completed .stage-name {
  color: #67c23a;
  font-weight: 500;
}

.stage-completed .stage-connector {
  background-color: #67c23a;
}

.stage-current .stage-icon {
  background-color: #409eff;
  color: white;
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.stage-current .stage-name {
  color: #409eff;
  font-weight: 600;
  font-size: 13px;
}

.stage-future .stage-icon {
  background-color: #e4e7ed;
  color: #909399;
}

.stage-future .stage-name {
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stage-flow {
    justify-content: flex-start;
  }
  
  .stage-node {
    margin-right: 40px;
  }
  
  .stage-connector {
    width: 40px;
  }
}

@media (max-width: 768px) {
  .stage-flow {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stage-node {
    flex-direction: row;
    margin-bottom: 15px;
    margin-right: 0;
  }
  
  .stage-icon {
    margin-bottom: 0;
    margin-right: 10px;
  }
  
  .stage-connector {
    position: absolute;
    top: 16px;
    left: 42px;
    width: 10px;
    height: 2px;
  }
  
  .stage-node:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 32px;
    left: 16px;
    width: 2px;
    height: 20px;
    background-color: #e4e7ed;
  }
  
  .stage-completed:not(:last-child)::after {
    background-color: #67c23a;
  }
}
</style>
