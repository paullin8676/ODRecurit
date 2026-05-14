<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">韧测管理</h2>
    </div>

    <div class="card-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable @input="handleSearch" />
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-select v-model="searchForm.currentStage" placeholder="请选择当前阶段" clearable @change="handleSearch" style="width: auto; min-width: 120px">
            <el-option
              v-for="(name, key) in filteredStageNames"
              :key="key"
              :label="name"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="employees" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" show-overflow-tooltip fixed="left">
          <template #default="{ row }">
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="负责顾问" width="120">
          <template #default="{ row }">
            {{ row.consultantName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="下发日期" width="120">
          <template #default="{ row }">
            <span>{{ row.test?.issueDate ? new Date(row.test.issueDate).toLocaleDateString() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="情绪分" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.emotionScore" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <span v-else style="cursor: pointer;" @click="handleEdit(row, $index)">
              {{ row.test?.emotionScore || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="忧虑值" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.worryValue" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <span v-else style="cursor: pointer;" @click="handleEdit(row, $index)">
              {{ row.test?.worryValue || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="乐观值" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.optimismValue" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <span v-else style="cursor: pointer;" @click="handleEdit(row, $index)">
              {{ row.test?.optimismValue || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="一致性" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.consistency" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <span v-else style="cursor: pointer;" @click="handleEdit(row, $index)">
              {{ row.test?.consistency || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.currentStatus" style="width: 100%">
                <el-option label="待录分" value="pending" />
                <el-option label="放弃" value="abandoned" />
                <el-option label="通过" value="passed" />
                <el-option label="未通过" value="failed" />
              </el-select>
            </template>
            <template v-else>
              <span style="cursor: pointer;" @click="handleEdit(row, $index)">{{ getStatusText(row.test?.currentStatus) }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="300">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-button type="primary" size="small" @click="handleSave($index, row)">
                保存
              </el-button>
              <el-button size="small" @click="cancelEdit">
                取消
              </el-button>
            </template>
            <template v-else>
              <el-button type="info" link size="small" @click="handleView(row)">
                查看
              </el-button>
              <template v-if="isCurrentStage(row.currentStage)">
                <el-button type="primary" link size="small" @click="handleEdit(row, $index)">
                  编辑
                </el-button>
                <template v-if="canAdvance(row)">
                  <el-button type="success" link size="small" @click="handleAdvance(row)">
                    推进
                  </el-button>
                </template>
              </template>
              <!-- 只有当前阶段为韧测完成且韧测通过且没有面试记录且有权限时显示面推按钮 -->
              <template v-if="row.currentStage === 'test_complete' && row.canRecommend && row.test?.currentStatus === 'passed' && authStore.hasPermission('btn_candidate_push_interview')">
                <el-button type="success" link size="small" @click="handlePushInterview(row)">
                  面推
                </el-button>
              </template>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <div v-if="selectedEmployee">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form :model="selectedEmployee" label-width="120px" :disabled="true">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名">
                <el-input :value="selectedEmployee.name" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-input :value="selectedEmployee.gender === 'male' ? '男' : selectedEmployee.gender === 'female' ? '女' : '-'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input :value="selectedEmployee.phone" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input :value="selectedEmployee.email" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="身份证号">
                <el-input :value="selectedEmployee.idCard" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="负责顾问">
                <el-input :value="selectedEmployee.consultantName || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 韧测申报阶段字段 -->
        <el-divider content-position="left">韧测信息</el-divider>
        <el-form :model="testForm" label-width="140px" disabled>
          <!-- 韧测申报阶段字段 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="韧测日期">
                <el-date-picker v-model="testForm.issueDate" type="date" style="width: 100%" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 韧测完成阶段及后续阶段显示的字段 -->
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="忧虑值">
                <el-input v-model="testForm.worryValue" style="width: 100%" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="乐观值">
                <el-input v-model="testForm.optimismValue" style="width: 100%" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="一致性">
                <el-input v-model="testForm.consistency" style="width: 100%" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="情绪分">
                <el-input v-model="testForm.emotionScore" style="width: 100%" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="当前状态">
                <el-select v-model="testForm.currentStatus" style="width: 100%" disabled>
                  <el-option label="待录分" value="pending" />
                  <el-option label="放弃" value="abandoned" />
                  <el-option label="通过" value="passed" />
                  <el-option label="未通过" value="failed" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { candidateApi, testApi, stageConfigApi } from '../api'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const STAGES = [
  'candidate_entry',
  'exam_declare',
  'exam_complete',
  'test_declare',
  'test_complete',
  'recommend_interview',
  'qualification_interview',
  'tech_interview_1',
  'tech_interview_2',
  'manager_interview',
  'approval',
  'offer',
  'pending_onboarding',
  'entry',
  'leave'
]

const stageNames = {
  candidate_entry: '候选录入',
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
  pending_onboarding: '待入职',
  entry: '入职',
  leave: '离职'
}

const availableStages = ref([])
const authStore = useAuthStore()

const filteredStageNames = computed(() => {
  const filtered = {}
  Object.keys(stageNames).forEach(key => {
    if (availableStages.value.includes(key)) {
      filtered[key] = stageNames[key]
    }
  })
  return filtered
})

const employees = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('编辑韧测信息')
const submitLoading = ref(false)
const selectedEmployee = ref(null)
const editingRowIndex = ref(-1)
const editingForm = reactive({
  issueDate: null,
  worryValue: null,
  optimismValue: null,
  consistency: null,
  emotionScore: null,
  currentStatus: 'pending'
})

// 面推相关
const pushLoading = ref(false)

const searchForm = reactive({
  name: '',
  currentStage: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const testForm = reactive({
  issueDate: null,
  worryValue: null,
  optimismValue: null,
  consistency: null,
  emotionScore: null,
  currentStatus: 'pending'
})

const fetchEmployees = async () => {
  loading.value = true
  try {
    // Ensure stage config is loaded before filtering
    if (availableStages.value.length === 0) {
      await fetchStageConfig()
    }
    
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      stages: availableStages.value.length > 0 ? availableStages.value : undefined,
      name: searchForm.name,
      currentStage: searchForm.currentStage || undefined
    }
    const data = await testApi.getAll(params)
    
    // Transform data to match expected format
    let transformedEmployees = await Promise.all(data.tests.map(async item => {
      let canRecommendFlag = false
      
      if (isAfterTestComplete({ currentStage: item.currentStage })) {
        try {
          const result = await candidateApi.canRecommend(item.id)
          canRecommendFlag = result.canRecommend
        } catch (error) {
          canRecommendFlag = false
        }
      }
      
      return {
        id: item.id,
        name: item.name,
        gender: item.gender,
        phone: item.phone,
        email: item.email,
        idCard: item.idCard,
        currentStage: item.currentStage || '',
        consultantName: item.consultantName || '-',
        test: item.test,
        canRecommend: canRecommendFlag
      }
    }))
    
    // 直接使用后端返回的数据
    employees.value = transformedEmployees
    pagination.total = data.pagination?.total
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('test_management')
    if (data.config && data.config.stages) {
      availableStages.value = data.config.stages
    } else {
      availableStages.value = Object.keys(stageNames)
    }
  } catch (error) {
    availableStages.value = Object.keys(stageNames)
  }
}



const handleSearch = () => {
  pagination.page = 1
  fetchEmployees()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.currentStage = ''
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchEmployees()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchEmployees()
}

const handleView = async (row) => {
  try {
    const data = await candidateApi.getById(row.id)
    const candidate = { ...data.candidate }
    
    if (data.candidate.consultant) {
      candidate.consultantName = data.candidate.consultant.realName
    } else {
      candidate.consultantName = '-'
    }
    
    selectedEmployee.value = candidate
    
    // Get test data for this candidate
    const testData = await testApi.getByCandidate(row.id)
    if (testData.test) {
      Object.assign(testForm, testData.test)
    } else {
      // Reset form if no test data
      Object.assign(testForm, {
      issueDate: null,
      worryValue: null,
      optimismValue: null,
        consistency: null,
        emotionScore: null,
        currentStatus: 'pending'
      })
    }
    
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取员工信息失败')
  }
}

const handleSubmit = async () => {
  if (!selectedEmployee.value) return
  
  submitLoading.value = true
  try {
    // Save test data using testApi
    const testData = {
      candidateId: selectedEmployee.value.id,
      ...testForm
    }
    
    await testApi.create(testData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  selectedEmployee.value = null
  Object.assign(testForm, {
    issueDate: null,
    worryValue: null,
    optimismValue: null,
    consistency: null,
    testPassed: null
  })
}

const canAdvance = (row) => {
  if (row.currentStage === 'leave') {
    return false
  }

  if (row.currentStage === 'test_complete') {
    return false
  }

  if (!row.test) {
    return false
  }

  const test = row.test
  return test.issueDate !== null && test.issueDate !== undefined &&
         test.worryValue !== null && test.worryValue !== undefined &&
         test.optimismValue !== null && test.optimismValue !== undefined &&
         test.consistency !== null && test.consistency !== undefined &&
         test.emotionScore !== null && test.emotionScore !== undefined &&
         test.currentStatus === 'passed'
}

const isCurrentStage = (currentStage) => {
  // 检查记录是否处于该模块的配置阶段中
  if (!currentStage) return false
  return availableStages.value.includes(currentStage)
}

const isAfterTestComplete = (row) => {
  // 检查是否处于韧测完成及之后阶段
  if (!row || !row.currentStage) return false
  const testCompleteIndex = STAGES.indexOf('test_complete')
  const currentIndex = STAGES.indexOf(row.currentStage)
  return currentIndex >= testCompleteIndex
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待录分',
    'abandoned': '放弃',
    'passed': '通过',
    'failed': '未通过'
  }
  return statusMap[status] || '-'
}

const handleEdit = (row, index) => {
  editingRowIndex.value = index
  Object.assign(editingForm, {
    issueDate: row.test.issueDate,
    worryValue: row.test.worryValue,
    optimismValue: row.test.optimismValue,
    consistency: row.test.consistency,
    emotionScore: row.test.emotionScore,
    currentStatus: row.test.currentStatus || 'pending'
  })
}

const cancelEdit = () => {
  editingRowIndex.value = -1
  Object.assign(editingForm, {
    issueDate: null,
    worryValue: null,
    optimismValue: null,
    consistency: null,
    emotionScore: null,
    currentStatus: 'pending'
  })
}

const handleSave = async (index, row) => {
  try {
    const testData = {
      candidateId: row.id,
      ...editingForm
    }

    await testApi.create(testData)
    ElMessage.success('保存成功')
    editingRowIndex.value = -1
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleAdvance = async (row) => {
  try {
    await candidateApi.advance(row.id, {})
    ElMessage.success('推进成功')
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '推进失败')
  }
}

// 面推相关函数
const handlePushInterview = async (row) => {
  try {
    const result = await candidateApi.canRecommend(row.id)
    
    if (!result.canRecommend) {
      ElMessage.warning(result.reason || '当前不能面推')
      return
    }
    
    pushLoading.value = true
    try {
      await candidateApi.pushInterview(row.id, {})
      ElMessage.success('面推成功')
      fetchEmployees()
    } catch (error) {
      ElMessage.error(error.message || '面推失败')
    } finally {
      pushLoading.value = false
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

onMounted(async () => {
  // 先加载阶段配置
  await fetchStageConfig()
  // 再获取列表数据
  await fetchEmployees()
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
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 16px;
  height: 36px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-container {
  margin-top: -5px;
  padding-top: 20px;
}

.search-form {
  margin-bottom: 20px;
}

:deep(.el-divider__text) {
  color: #409eff;
  font-weight: 600;
}
</style>