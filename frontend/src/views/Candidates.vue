<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">候选人列表</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增候选人
      </el-button>
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

      <el-table :data="candidates" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.name" placeholder="请输入姓名" disabled />
            </template>
            <template v-else>
              {{ row.name }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.gender" placeholder="请选择性别" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </template>
            <template v-else>
              {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.phone" placeholder="请输入手机号" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" :ref="editingRowIndex === $index ? 'phoneInputRef' : null" />
            </template>
            <template v-else>
              {{ row.phone || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="负责顾问" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.consultantId" placeholder="请选择顾问" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit">
                <el-option v-for="consultant in consultants" :key="consultant.id" :label="consultant.realName || consultant.username" :value="consultant.id" />
              </el-select>
            </template>
            <template v-else>
              {{ row.consultant?.realName || row.consultant?.username || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="身份证号" width="180">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.idCard" placeholder="请输入身份证号" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.idCard || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip>
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.email" placeholder="请输入邮箱" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.email || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="录入日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="最近操作人" width="120">
          <template #default="{ row }">
            {{ row.lastOperator?.realName || row.lastOperator?.username || '-' }}
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
              <el-button type="primary" link size="small" @click="handleView(row)">
                查看
              </el-button>
              <template v-if="isCurrentStage(row)">
                <el-button type="primary" link size="small" @click="handleEdit(row, $index)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  删除
                </el-button>
                <el-button v-if="canAdvance(row)" type="success" link size="small" @click="handleAdvance(row)">
                  推进
                </el-button>
                <el-button v-if="canRollback(row)" type="warning" link size="small" @click="handleRollback(row)">
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="负责顾问">
          <el-select v-model="form.consultantId" placeholder="请选择顾问">
            <el-option v-for="consultant in consultants" :key="consultant.id" :label="consultant.realName || consultant.username" :value="consultant.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { candidateApi, stageConfigApi, userApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const phoneInputRef = ref(null)

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

const candidates = ref([])
const consultants = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增候选人')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentId = ref(null)
const editingRowIndex = ref(-1)

const editingForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  consultantId: ''
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

const form = reactive({
  name: '',
  gender: 'male',
  phone: '',
  email: '',
  idCard: '',
  consultantId: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号码', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{17}([0-9]|X|x)$)/, message: '请输入正确的身份证号码', trigger: 'blur' }
  ]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('candidate_entry')
    if (data.config && data.config.stages) {
      availableStages.value = data.config.stages
    } else {
      availableStages.value = Object.keys(stageNames)
    }
  } catch (error) {
    availableStages.value = Object.keys(stageNames)
  }
}

const fetchCandidates = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const data = await candidateApi.getAll(params)

    let candidatesList = data.candidates.map(candidate => ({
      ...candidate,
      currentStage: candidate.currentStage
    }))

    if (availableStages.value.length > 0) {
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

      availableStages.value.forEach(stage => {
        const stageIndex = STAGES.indexOf(stage)
        if (stageIndex !== -1) {
          for (let i = stageIndex; i < STAGES.length; i++) {
            allRelevantStages.add(STAGES[i])
          }
        }
      })

      candidatesList = candidatesList.filter(candidate => {
        return allRelevantStages.has(candidate.currentStage)
      })
    }

    candidates.value = candidatesList
    pagination.total = data.pagination?.total || candidatesList.length
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchCandidates()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.currentStage = ''
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchCandidates()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchCandidates()
}

const handleCreate = () => {
  dialogTitle.value = '新增候选人'
  isEdit.value = false
  dialogVisible.value = true
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  if (currentUser) {
    form.consultantId = currentUser.id
  }
}

const handleView = (row) => {
  router.push(`/candidates/${row.id}`)
}

const handleEdit = (row, index) => {
  editingRowIndex.value = index
  Object.assign(editingForm, {
    name: row.name,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    idCard: row.idCard,
    consultantId: row.consultantId || ''
  })
  setTimeout(() => {
    if (phoneInputRef.value) {
      phoneInputRef.value.focus()
    }
  }, 100)
}

const cancelEdit = () => {
  editingRowIndex.value = -1
  Object.assign(editingForm, {
    name: '',
    gender: '',
    phone: '',
    email: '',
    idCard: '',
    consultantId: ''
  })
}

const handleSave = async (index, row) => {
  if (!editingForm.name) {
    ElMessage.error('请输入姓名')
    return
  }

  if (!editingForm.gender) {
    ElMessage.error('请选择性别')
    return
  }

  if (!editingForm.phone) {
    ElMessage.error('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(editingForm.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  if (!editingForm.email) {
    ElMessage.error('请输入邮箱')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingForm.email)) {
    ElMessage.error('请输入正确的邮箱')
    return
  }

  if (!editingForm.idCard) {
    ElMessage.error('请输入身份证号码')
    return
  }

  if (!/(^\d{15}$)|(^\d{17}([0-9]|X|x)$)/.test(editingForm.idCard)) {
    ElMessage.error('请输入正确的身份证号码')
    return
  }

  try {
    const updateData = {
      ...editingForm
    }

    await candidateApi.update(row.id, updateData)
    ElMessage.success('更新成功')
    editingRowIndex.value = -1
    fetchCandidates()
  } catch (error) {
  }
}

const handleDelete = async (row) => {
  try {
    await candidateApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchCandidates()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const canAdvance = (row) => {
  return row.currentStage !== 'leave'
}

const canRollback = (row) => {
  return row.currentStage === 'exam_declare'
}

const isCurrentStage = (row) => {
  return availableStages.value.length > 0 && row.currentStage === availableStages.value[0]
}

const handleAdvance = async (row) => {
  try {
    await candidateApi.advance(row.id, { productLineId: row.productLine?.id })
    ElMessage.success('推进成功')
    fetchCandidates()
  } catch (error) {
    ElMessage.error(error.message || '推进失败')
  }
}

const handleRollback = async (row) => {
  try {
    await candidateApi.rollback(row.id, { productLineId: row.productLine?.id })
    ElMessage.success('回退成功')
    fetchCandidates()
  } catch (error) {
    ElMessage.error(error.message || '回退失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      const updateData = {
        ...form
      }

      await candidateApi.update(currentId.value, updateData)
      ElMessage.success('更新成功')
    } else {
      await candidateApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchCandidates()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  formRef.value.resetFields()
  Object.assign(form, {
    name: '',
    gender: '',
    phone: '',
    email: '',
    idCard: '',
    consultantId: ''
  })
}

const fetchConsultants = async () => {
  try {
    const data = await userApi.getAll({})
    consultants.value = data.users || []
  } catch (error) {
    consultants.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchCandidates(), fetchStageConfig(), fetchConsultants()])
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

.card-container {
  margin-top: 0px;
  padding-top: 20px;
}

.search-form {
  margin-bottom: 20px;
}

:deep(.el-tag.stage-tag) {
  border: none;
}

.product-line-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.stage-info {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.8;
}
</style>
