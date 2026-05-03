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
        <el-table-column prop="name" label="姓名" width="100" show-overflow-tooltip>
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
        <el-table-column label="韧测类型" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.testTypeId" placeholder="请选择类型" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit">
                <el-option
                  v-for="type in testTypes"
                  :key="type.id"
                  :label="type.name"
                  :value="type.id"
                />
              </el-select>
            </template>
            <template v-else>
              {{ row.test?.testType?.name || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="韧测日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.testDate" type="date" style="width: 100%" />
            </template>
            <template v-else>
              {{ row.test?.testDate ? new Date(row.test.testDate).toLocaleDateString() : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="完成日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.testCompleteDate" type="date" style="width: 100%" />
            </template>
            <template v-else>
              {{ row.test?.testCompleteDate ? new Date(row.test.testCompleteDate).toLocaleDateString() : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="忧虑值" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.worryValue" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.test?.worryValue || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="乐观值" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.optimismValue" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.test?.optimismValue || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="一致性" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.consistency" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.test?.consistency || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否通过" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-switch v-model="editingForm.testPassed" />
            </template>
            <template v-else>
              {{ row.test?.testPassed === true ? '通过' : row.test?.testPassed === false ? '未通过' : '-' }}
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
              <template v-if="isCurrentStage(row)">
                <el-button type="primary" link size="small" @click="handleEdit(row, $index)">
                  编辑
                </el-button>
                <template v-if="canAdvance(row)" type="success" link size="small" @click="handleAdvance(row)">
                  <el-button type="success" link size="small" @click="handleAdvance(row)">
                    推进
                  </el-button>
                </template>
              </template>
              <!-- 韧测完成及之后阶段且韧测通过显示面推按钮 -->
              <template v-if="isAfterTestComplete(row) && row.canRecommend && row.test?.testPassed === true">
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
          </el-row>
        </el-form>

        <!-- 韧测申报阶段字段 -->
        <el-divider content-position="left">韧测信息</el-divider>
        <el-form :model="testForm" label-width="140px" :disabled="!isCurrentStage(selectedEmployee.currentStage)">
          <!-- 韧测申报阶段字段 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="韧测类型">
                <el-select v-model="testForm.testTypeId" placeholder="请选择类型" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)">
                  <el-option
                    v-for="type in testTypes"
                    :key="type.id"
                    :label="type.name"
                    :value="type.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="韧测日期">
                <el-date-picker v-model="testForm.testDate" type="date" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 韧测完成阶段及后续阶段显示的字段 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="完成日期">
                <el-date-picker v-model="testForm.testCompleteDate" type="date" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="忧虑值">
                <el-input v-model="testForm.worryValue" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="乐观值">
                <el-input v-model="testForm.optimismValue" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="一致性">
                <el-input v-model="testForm.consistency" style="width: 100%" :disabled="!isCurrentStage(selectedEmployee.currentStage)" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="是否通过">
                <el-radio-group v-model="testForm.testPassed" :disabled="!isCurrentStage(selectedEmployee.currentStage)">
                  <el-radio :label="true">通过</el-radio>
                  <el-radio :label="false">未通过</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 面推对话框 -->
    <el-dialog
      v-model="pushDialogVisible"
      title="面推"
      width="500px"
      @close="handlePushDialogClose"
    >
      <div v-if="pushCandidate">
        <el-form :model="pushForm" label-width="120px">
          <el-form-item label="候选人">
            <el-input :value="pushCandidate.name" :disabled="true" />
          </el-form-item>
          <el-form-item label="产品线" required>
            <el-select v-model="pushForm.productLineId" placeholder="请选择产品线" style="width: 100%" @change="handleProductLineChange">
              <el-option
                v-for="pl in availableProductLines"
                :key="pl.id"
                :label="pl.name"
                :value="pl.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="产品负责人">
            <el-input v-model="pushForm.clientOwner" :disabled="true" />
          </el-form-item>
          <el-form-item label="推荐日期" required>
            <el-date-picker v-model="pushForm.recommendDate" type="date" style="width: 100%" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePushConfirm" :loading="pushLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { candidateApi, testTypeApi, testApi, stageConfigApi } from '../api'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

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
const testTypes = ref([])
const editingRowIndex = ref(-1)
const editingForm = reactive({
  testTypeId: null,
  testDate: null,
  testCompleteDate: null,
  worryValue: null,
  optimismValue: null,
  consistency: null,
  testPassed: null
})

// 面推对话框相关
const pushDialogVisible = ref(false)
const pushCandidate = ref(null)
const pushLoading = ref(false)
const availableProductLines = ref([])
const pushForm = reactive({
  productLineId: null,
  clientOwner: '',
  recommendDate: new Date()
})

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
  testTypeId: null,
  testDate: null,
  testCompleteDate: null,
  worryValue: null,
  optimismValue: null,
  consistency: null,
  testPassed: null
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
        test: item.test,
        canRecommend: canRecommendFlag
      }
    }))
    
    // Filter employees based on stage configuration and all subsequent stages
    if (availableStages.value.length > 0) {
      // Get all stages that are in the configured stages or subsequent to them
      const allRelevantStages = new Set()
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
      
      // For each configured stage, add it and all subsequent stages
      availableStages.value.forEach(stage => {
        const stageIndex = STAGES.indexOf(stage)
        if (stageIndex !== -1) {
          for (let i = stageIndex; i < STAGES.length; i++) {
            allRelevantStages.add(STAGES[i])
          }
        }
      })
      
      // Filter employees to include only those in relevant stages
      transformedEmployees = transformedEmployees.filter(employee => {
        return allRelevantStages.has(employee.currentStage)
      })
    }
    
    employees.value = transformedEmployees
    pagination.total = transformedEmployees.length
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

const fetchOptions = async () => {
  try {
    const types = await testTypeApi.getAll()
    testTypes.value = types.testTypes || []
  } catch (error) {
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
    selectedEmployee.value = data.candidate
    
    // Get test data for this candidate
    const testData = await testApi.getByCandidate(row.id)
    if (testData.test) {
      Object.assign(testForm, testData.test)
    } else {
      // Reset form if no test data
      Object.assign(testForm, {
        testTypeId: null,
        testDate: null,
        testCompleteDate: null,
        worryValue: null,
        optimismValue: null,
        consistency: null,
        testPassed: null
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
    testTypeId: null,
    testDate: null,
    testCompleteDate: null,
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
  return test.testTypeId !== null && test.testTypeId !== undefined &&
         test.testDate !== null && test.testDate !== undefined &&
         test.testCompleteDate !== null && test.testCompleteDate !== undefined &&
         test.worryValue !== null && test.worryValue !== undefined &&
         test.optimismValue !== null && test.optimismValue !== undefined &&
         test.consistency !== null && test.consistency !== undefined &&
         typeof test.testPassed === 'boolean' &&
         test.testPassed === true
}

const isCurrentStage = (row) => {
  // 检查记录是否处于该模块的配置阶段中
  return availableStages.value.includes(row.currentStage)
}

const isAfterTestComplete = (row) => {
  // 检查是否处于韧测完成及之后阶段
  const testCompleteIndex = STAGES.indexOf('test_complete')
  const currentIndex = STAGES.indexOf(row.currentStage)
  return currentIndex >= testCompleteIndex
}

const handleEdit = (row, index) => {
  editingRowIndex.value = index
  Object.assign(editingForm, {
    testTypeId: row.test.testTypeId,
    testDate: row.test.testDate,
    testCompleteDate: row.test.testCompleteDate,
    worryValue: row.test.worryValue,
    optimismValue: row.test.optimismValue,
    consistency: row.test.consistency,
    testPassed: row.test.testPassed
  })
}

const cancelEdit = () => {
  editingRowIndex.value = -1
  Object.assign(editingForm, {
    testTypeId: null,
    testDate: null,
    testCompleteDate: null,
    worryValue: null,
    optimismValue: null,
    consistency: null,
    testPassed: null
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
    
    pushCandidate.value = row
    availableProductLines.value = result.availableProductLines || []
    
    if (availableProductLines.value.length === 0) {
      ElMessage.warning('没有可用的产品线')
      return
    }
    
    Object.assign(pushForm, {
      productLineId: null,
      clientOwner: '',
      recommendDate: new Date()
    })
    
    pushDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

const handleProductLineChange = (productLineId) => {
  const selected = availableProductLines.value.find(pl => pl.id === productLineId)
  if (selected) {
    pushForm.clientOwner = selected.clientOwner || ''
  } else {
    pushForm.clientOwner = ''
  }
}

const handlePushConfirm = async () => {
  if (!pushCandidate.value || !pushForm.productLineId) {
    ElMessage.error('请选择产品线')
    return
  }
  
  pushLoading.value = true
  try {
    const data = {
      productLineId: pushForm.productLineId,
      recommendDate: pushForm.recommendDate
    }
    
    await candidateApi.pushInterview(pushCandidate.value.id, data)
    ElMessage.success('面推成功')
    pushDialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '面推失败')
  } finally {
    pushLoading.value = false
  }
}

const handlePushDialogClose = () => {
  pushCandidate.value = null
  availableProductLines.value = []
  Object.assign(pushForm, {
    productLineId: null,
    clientOwner: '',
    recommendDate: new Date()
  })
}

onMounted(() => {
  fetchEmployees()
  fetchOptions()
  fetchStageConfig()
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