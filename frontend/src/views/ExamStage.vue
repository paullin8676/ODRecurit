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
        <el-table-column label="试卷名称" width="180">
          <template #default="{ row }">
            {{ row.exam?.examPaper?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120">
          <template #default="{ row }">
            {{ row.exam?.examDate ? new Date(row.exam.examDate).toLocaleDateString() : (row.exam?.examPaper?.examDate ? new Date(row.exam.examPaper.examDate).toLocaleDateString() : '-') }}
          </template>
        </el-table-column>
        <el-table-column label="机考总分" width="100">
          <template #default="{ row }">
            {{ row.exam?.examTotalScore || row.exam?.examPaper?.totalScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="通过线" width="100">
          <template #default="{ row }">
            {{ row.exam?.passLine || row.exam?.examPaper?.passLine || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="完成日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.examCompleteDate" type="date" style="width: 100%" />
            </template>
            <template v-else>
              <span @click="handleEdit(row, $index)" style="cursor: pointer;">
                {{ row.exam?.examCompleteDate ? new Date(row.exam.examCompleteDate).toLocaleDateString() : '-' }}
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="实际得分" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input
                v-model="editingForm.examScore"
                style="width: 100%"
                @change="handleExamScoreChange"
                @keyup.enter="handleSave($index, row)"
                @keyup.esc="cancelEdit"
              />
            </template>
            <template v-else>
              <span @click="handleEdit(row, $index)" style="cursor: pointer;">
                {{ row.exam?.examScore === 0 ? 0 : (row.exam?.examScore || '-') }}
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="是否机考" width="100">
          <template #default="{ row, $index }">
            <span>
              {{ (editingRowIndex === $index ? editingForm.isOnlineExam : row.exam?.isOnlineExam) ? '是' : '否' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="是否作弊" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-switch v-model="editingForm.isCheating" />
            </template>
            <template v-else>
              <span @click="handleEdit(row, $index)" style="cursor: pointer;">
                {{ row.exam?.isCheating ? '是' : '否' }}
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.currentStatus" :disabled="true" style="width: 100%">
                <el-option value="pending" label="待录分" />
                <el-option value="passed" label="通过" />
                <el-option value="failed" label="未通过" />
              </el-select>
            </template>
            <template v-else>
              <span v-if="row.exam?.currentStatus === 'passed'">通过</span>
              <span v-else-if="row.exam?.currentStatus === 'failed'">未通过</span>
              <span v-else-if="row.exam?.currentStatus === 'pending'">待录分</span>
              <span v-else>-</span>
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
                <el-button v-if="canRollback(row)" type="danger" link size="small" @click="handleRollback(row)">
                  回退
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
              <el-form-item label="考试日期">
                <el-input :value="selectedEmployee.exam?.examDate ? new Date(selectedEmployee.exam?.examDate).toLocaleDateString() : (selectedEmployee.exam?.examPaper?.examDate ? new Date(selectedEmployee.exam?.examPaper?.examDate).toLocaleDateString() : '-')" :disabled="true" />
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
                <el-input :value="selectedEmployee.exam?.examTotalScore || selectedEmployee.exam?.examPaper?.totalScore || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="通过线">
                <el-input :value="selectedEmployee.exam?.passLine || selectedEmployee.exam?.examPaper?.passLine || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="实际得分">
                <el-input :value="selectedEmployee.exam?.examScore || '-'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="是否作弊">
                <el-input :value="selectedEmployee.exam?.isCheating ? '是' : '否'" :disabled="true" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="当前状态">
                <template v-if="selectedEmployee.exam?.currentStatus === 'passed'">
                  <el-input value="通过" :disabled="true" />
                </template>
                <template v-else-if="selectedEmployee.exam?.currentStatus === 'failed'">
                  <el-input value="未通过" :disabled="true" />
                </template>
                <template v-else-if="selectedEmployee.exam?.currentStatus === 'pending'">
                  <el-input value="待录分" :disabled="true" />
                </template>
                <template v-else>
                  <el-input value="-" :disabled="true" />
                </template>
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
  isOnlineExam: false,
  examDate: null,
  examCompleteDate: null,
  examTotalScore: 0,
  passLine: 0,
  isCheating: false,
  examScore: null,
  currentStatus: 'pending'
})

const fetchEmployees = async () => {
  loading.value = true
  try {
    if (availableStages.value.length === 0) {
      await fetchStageConfig()
    }

    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      stages: availableStages.value.length > 0 ? availableStages.value : undefined,
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

    employees.value = transformedEmployees
    pagination.total = data.pagination?.total
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
    isOnlineExam: row.exam.isOnlineExam || false,
    examDate: row.exam.examDate,
    examCompleteDate: row.exam.examCompleteDate,
    examTotalScore: row.exam.examTotalScore || row.exam.examPaper?.totalScore || 0,
    passLine: row.exam.examPaper?.passLine || 0,
    isCheating: row.exam.isCheating || false,
    examScore: row.exam.examScore,
    currentStatus: row.exam.currentStatus || 'pending'
  })
}

const cancelEdit = () => {
  editingRowIndex.value = -1
  examScoreError.value = false
  Object.assign(editingForm, {
    examPaperId: null,
    isOnlineExam: false,
    examDate: null,
    examCompleteDate: null,
    examTotalScore: 0,
    passLine: 0,
    isCheating: false,
    examScore: null,
    currentStatus: 'pending'
  })
}

const handleSave = async (index, row) => {
  if (examScoreError.value) {
    return
  }
  
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
    editingForm.passLine = selectedPaper.passLine
    editingForm.examDate = selectedPaper.examDate
  }
}

const handleExamScoreChange = () => {
  const score = editingForm.examScore
  const totalScore = editingForm.examTotalScore
  
  if (score !== null && score !== '' && score !== undefined) {
    const numScore = parseInt(score, 10)
    
    if (!isNaN(numScore)) {
      if (numScore < 0) {
        examScoreError.value = true
        ElMessage.error('实际得分不能为负数')
        editingForm.examScore = ''
        return
      }
      
      if (totalScore >= 0 && numScore > totalScore) {
        examScoreError.value = true
        ElMessage.error('实际得分不能大于机考总分')
        editingForm.examScore = ''
        return
      }
      
      examScoreError.value = false
      editingForm.isOnlineExam = true
      if (numScore >= editingForm.passLine) {
        editingForm.currentStatus = 'passed'
      } else {
        editingForm.currentStatus = 'failed'
      }
    }
  } else {
    examScoreError.value = false
    editingForm.isOnlineExam = false
    editingForm.currentStatus = 'pending'
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

  if (totalScore >= 0 && numScore > totalScore) {
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
    selectedEmployee.value = null

    const data = await candidateApi.getById(row.id)
    if (!data.candidate) {
      ElMessage.error('获取员工信息失败')
      return
    }

    const candidateWithExam = { ...data.candidate }

    const examData = await examApi.getByCandidate(row.id)
    if (examData.exam) {
      candidateWithExam.exam = {
        ...examData.exam,
        examPaper: examData.exam.ExamPaper
      }
    }

    selectedEmployee.value = candidateWithExam

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
  if (!row.exam) {
    return false
  }

  const exam = row.exam
  return exam.currentStatus === 'passed' && exam.isCheating === false
}

const isCurrentStage = (row) => {
  return availableStages.value.includes(row.currentStage)
}

const canRollback = (row) => {
  return row.currentStage !== 'candidate_entry' && row.currentStage !== 'leave'
}

const handleRollback = async (row) => {
  try {
    if (row.exam) {
      await examApi.delete(row.exam.id)
    }
    
    await candidateApi.update(row.id, { 
      name: row.name, 
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      idCard: row.idCard,
      currentStage: 'candidate_entry' 
    })
    
    ElMessage.success('回退成功，已将候选人阶段切换为候选录入')
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '回退失败')
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

onMounted(async () => {
  await Promise.all([fetchStageConfig(), fetchOptions()])
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
