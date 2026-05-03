<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">考试管理</h2>
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
        <el-table-column label="试卷名称" width="180">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.examPaperId" placeholder="请选择试卷" style="width: 100%" @change="handleExamPaperChange" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit">
                <el-option
                  v-for="paper in examPapers"
                  :key="paper.id"
                  :label="paper.name"
                  :value="paper.id"
                />
              </el-select>
            </template>
            <template v-else>
              {{ row.exam?.examPaper?.name || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否机考" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-switch v-model="editingForm.isOnlineExam" />
            </template>
            <template v-else>
              {{ row.exam?.isOnlineExam ? '是' : '否' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.examDate" type="date" style="width: 100%" @change="handleExamDateChange" />
            </template>
            <template v-else>
              {{ row.exam?.examDate ? new Date(row.exam.examDate).toLocaleDateString() : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="完成日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.examCompleteDate" type="date" style="width: 100%" />
            </template>
            <template v-else>
              {{ row.exam?.examCompleteDate ? new Date(row.exam.examCompleteDate).toLocaleDateString() : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="机考总分" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.examTotalScore" style="width: 100%" :disabled="true" />
            </template>
            <template v-else>
              {{ row.exam?.examTotalScore || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="实际得分" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input
                v-model="editingForm.examScore"
                style="width: 100%"
                @blur="validateExamScore"
                @keyup.enter="handleSave($index, row)"
                @keyup.esc="cancelEdit"
              />
            </template>
            <template v-else>
              {{ row.exam?.examScore || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否作弊" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-switch v-model="editingForm.isCheating" />
            </template>
            <template v-else>
              {{ row.exam?.isCheating ? '是' : '否' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否通过" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-switch v-model="editingForm.examPassed" />
            </template>
            <template v-else>
              {{ row.exam?.examPassed === true ? '通过' : row.exam?.examPassed === false ? '未通过' : '-' }}
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
                <el-button v-if="canAdvance(row)" type="success" link size="small" @click="handleAdvance(row)">
                  推进
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

        <el-divider content-position="left">机考信息</el-divider>
        <el-form :model="selectedEmployee.exam" label-width="140px" :disabled="true">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="试卷名称">
                <el-input :value="selectedEmployee.exam?.examPaper?.name || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否机考">
                <el-input :value="selectedEmployee.exam?.isOnlineExam ? '是' : '否'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="机考日期">
                <el-input :value="selectedEmployee.exam?.examDate ? new Date(selectedEmployee.exam?.examDate).toLocaleDateString() : '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="完成日期">
                <el-input :value="selectedEmployee.exam?.examCompleteDate ? new Date(selectedEmployee.exam?.examCompleteDate).toLocaleDateString() : '-'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="机考总分">
                <el-input :value="selectedEmployee.exam?.examTotalScore || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="实际得分">
                <el-input :value="selectedEmployee.exam?.examScore || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否作弊">
                <el-input :value="selectedEmployee.exam?.isCheating ? '是' : '否'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="是否通过">
                <el-input :value="selectedEmployee.exam?.examPassed === true ? '通过' : selectedEmployee.exam?.examPassed === false ? '未通过' : '-'" :disabled="true" />
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
import { candidateApi, examPaperApi, examApi, stageConfigApi } from '../api'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

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
const examPapers = ref([])
const editingRowIndex = ref(-1)
const dialogVisible = ref(false)
const dialogTitle = ref('查看考试信息')
const selectedEmployee = ref(null)
const examScoreError = ref(false)

const searchForm = reactive({
  name: '',
  currentStage: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const editingForm = reactive({
  examPaperId: null,
  isOnlineExam: true,
  examDate: null,
  examCompleteDate: null,
  examTotalScore: 0,
  isCheating: false,
  examScore: null,
  examPassed: null
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
      ...searchForm
    }
    const data = await examApi.getAll(params)
    
    let transformedEmployees = data.exams.map(item => ({
      id: item.id,
      name: item.name,
      gender: item.gender,
      phone: item.phone,
      email: item.email,
      idCard: item.idCard,
      currentStage: item.currentStage || '',
      exam: item.exam
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
    
    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    employees.value = transformedEmployees.slice(startIndex, endIndex)
    pagination.total = transformedEmployees.length
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('exam_management')
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
    const papers = await examPaperApi.getAll()
    examPapers.value = papers.examPapers || []
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

const handleEdit = (row, index) => {
  editingRowIndex.value = index
  Object.assign(editingForm, {
    examPaperId: row.exam.examPaperId,
    isOnlineExam: row.exam.isOnlineExam,
    examDate: row.exam.examDate,
    examCompleteDate: row.exam.examCompleteDate,
    examTotalScore: row.exam.examTotalScore,
    isCheating: row.exam.isCheating,
    examScore: row.exam.examScore,
    examPassed: row.exam.examPassed
  })
}

const cancelEdit = () => {
  editingRowIndex.value = -1
  examScoreError.value = false
  Object.assign(editingForm, {
    examPaperId: null,
    isOnlineExam: true,
    examDate: null,
    examCompleteDate: null,
    examTotalScore: 0,
    isCheating: false,
    examScore: null,
    examPassed: null
  })
}

const handleSave = async (index, row) => {
  if (!validateExamScore()) {
    return
  }

  try {
    const examData = {
      candidateId: row.id,
      ...editingForm
    }

    await examApi.create(examData)
    ElMessage.success('保存成功')
    editingRowIndex.value = -1
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleExamPaperChange = (examPaperId) => {
  const selectedPaper = examPapers.value.find(paper => paper.id === examPaperId)
  if (selectedPaper) {
    editingForm.examTotalScore = selectedPaper.totalScore
  }
}

const validateExamScore = () => {
  const score = editingForm.examScore
  const totalScore = editingForm.examTotalScore

  if (score === null || score === '' || score === undefined) {
    examScoreError.value = false
    return true
  }

  const numScore = parseInt(score, 10)

  if (isNaN(numScore) || numScore.toString() !== score.toString()) {
    examScoreError.value = true
    ElMessage.error('实际得分必须是整数')
    return false
  }

  if (numScore < 0) {
    examScoreError.value = true
    ElMessage.error('实际得分不能为负数')
    return false
  }

  if (totalScore && numScore > totalScore) {
    examScoreError.value = true
    ElMessage.error('实际得分不能大于机考总分')
    return false
  }

  editingForm.examScore = numScore
  examScoreError.value = false
  return true
}

const handleExamDateChange = (examDate) => {
  if (examDate) {
    editingForm.examCompleteDate = examDate
  }
}

const handleView = async (row) => {
  try {
    // 先确保 selectedEmployee 不为 null
    selectedEmployee.value = null
    
    const data = await candidateApi.getById(row.id)
    if (!data.candidate) {
      ElMessage.error('获取员工信息失败')
      return
    }
    
    // 创建一个新的对象，避免直接修改响应式对象
    const candidateWithExam = { ...data.candidate }
    
    // Get exam data for this candidate
    const examData = await examApi.getByCandidate(row.id)
    if (examData.exam) {
      candidateWithExam.exam = {
        ...examData.exam,
        examPaper: examData.exam.ExamPaper // 转换 ExamPaper 为 examPaper
      }
    }
    
    // 一次性设置 selectedEmployee，避免中间状态
    selectedEmployee.value = candidateWithExam
    
    // 最后设置 dialogVisible
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取员工信息失败')
  }
}

const handleDialogClose = () => {
  selectedEmployee.value = null
  dialogVisible.value = false
}

const canAdvance = (row) => {
  // 除了离职阶段外，其他阶段都可以推进
  if (row.currentStage === 'leave') {
    return false
  }
  
  // 检查机考记录是否存在
  if (!row.exam) {
    return false
  }
  
  // 检查所有必填字段是否已填写
  const exam = row.exam
  return !!exam.examPaperId && // 试卷名称
         typeof exam.isOnlineExam === 'boolean' && // 是否机考
         !!exam.examDate && // 机考日期
         !!exam.examCompleteDate && // 完成日期
         !!exam.examTotalScore && // 机考总分
         exam.examScore !== null && exam.examScore !== undefined && // 实际得分
         typeof exam.isCheating === 'boolean' && // 是否作弊
         typeof exam.examPassed === 'boolean' && // 是否通过
         exam.examPassed === true // 只有通过才可以推进
}

const isCurrentStage = (row) => {
  // 检查记录是否处于该模块的配置阶段中
  return availableStages.value.includes(row.currentStage)
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

onMounted(async () => {
  await Promise.all([fetchEmployees(), fetchOptions(), fetchStageConfig()])
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