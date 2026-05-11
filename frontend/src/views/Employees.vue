<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">员工管理</h2>
    </div>

    <div class="card-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable @input="handleSearch" />
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-select v-model="searchForm.currentStage" placeholder="请选择阶段" clearable @change="handleSearch" style="width: auto; min-width: 120px">
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
        <el-table-column prop="name" label="姓名" width="100" fixed="left">
          <template #default="{ row }">
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="身份证号" width="180">
          <template #default="{ row }">
            {{ row.idCard || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? filteredStageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="产品线" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.businessLine && row.businessLine.name">
              <el-tag type="info" class="product-line-tag">
                {{ row.businessLine.name }}
              </el-tag>
            </template>
            <template v-else>
              -
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="录入日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="入职日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.entryDate) }}
          </template>
        </el-table-column>
        <el-table-column label="离职日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.leaveDate) }}
          </template>
        </el-table-column>
        <el-table-column label="离职类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.leaveType || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="离职备注" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.leaveRemark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="最近操作人" width="120">
          <template #default="{ row }">
            {{ row.lastOperator?.realName || row.lastOperator?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" disabled />
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
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="当前阶段" prop="currentStage">
          <el-select v-model="form.currentStage" placeholder="请选择阶段" style="width: 100%">
            <el-option
              v-for="(name, value) in filteredStageNames"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期" prop="entryDate" v-if="form.currentStage === 'entry'">
          <el-date-picker v-model="form.entryDate" type="date" style="width: 100%" placeholder="请选择入职日期" />
        </el-form-item>
        <template v-if="form.currentStage === 'leave'">
          <el-form-item label="离职日期" prop="leaveDate">
            <el-date-picker v-model="form.leaveDate" type="date" style="width: 100%" placeholder="请选择离职日期" />
          </el-form-item>
          <el-form-item label="离职类型" prop="leaveType">
            <el-select v-model="form.leaveType" placeholder="请选择离职类型" style="width: 100%">
              <el-option label="主动离职" value="主动离职" />
              <el-option label="被动离职" value="被动离职" />
            </el-select>
          </el-form-item>
          <el-form-item label="离职备注">
            <el-input v-model="form.leaveRemark" type="textarea" placeholder="请输入离职备注" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="viewDialogVisible"
      title="查看员工信息"
      width="600px"
      @close="handleViewDialogClose"
    >
      <el-form :model="viewForm" label-width="100px" :disabled="true">
        <el-form-item label="姓名">
          <el-input :value="viewForm.name" disabled />
        </el-form-item>
        <el-form-item label="性别">
          <el-input :value="viewForm.gender === 'male' ? '男' : viewForm.gender === 'female' ? '女' : '-'" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="viewForm.phone" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :value="viewForm.email" disabled />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input :value="viewForm.idCard" disabled />
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-input :value="filteredStageNames[viewForm.currentStage] || '-'" disabled />
        </el-form-item>
        <el-form-item label="产品线">
          <el-input :value="viewForm.businessLineName || '-'" disabled />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-input :value="viewForm.entryDate ? formatDate(viewForm.entryDate) : '-'" disabled />
        </el-form-item>
        <el-form-item label="离职日期">
          <el-input :value="viewForm.leaveDate ? formatDate(viewForm.leaveDate) : '-'" disabled />
        </el-form-item>
        <el-form-item label="离职类型">
          <el-input :value="viewForm.leaveType || '-'" disabled />
        </el-form-item>
        <el-form-item label="离职备注">
          <el-input :value="viewForm.leaveRemark || '-'" disabled />
        </el-form-item>
        <el-form-item label="最近操作人">
          <el-input :value="viewForm.lastOperator || '-'" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { employeeApi, stageConfigApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

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

const stageNamesMap = ref(stageNames)

const availableStages = ref([])

const filteredStageNames = computed(() => {
  if (availableStages.value.length === 0) {
    return stageNames
  }
  const filtered = {}
  availableStages.value.forEach(stage => {
    if (stageNames[stage]) {
      filtered[stage] = stageNames[stage]
    }
  })
  return filtered
})

const employees = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentId = ref(null)
const viewDialogVisible = ref(false)

const viewForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  currentStage: '',
  businessLineName: '',
  entryDate: null,
  leaveDate: null,
  leaveType: '',
  leaveRemark: '',
  lastOperator: ''
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
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  currentStage: 'pending_onboarding',
  entryDate: null,
  leaveDate: null,
  leaveType: '',
  leaveRemark: ''
})

const rules = computed(() => ({
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
    {
      pattern: /(^\d{15}$)|(^\d{17}([0-9]|X|x)$)/,
      message: '请输入正确的身份证号码',
      trigger: 'blur'
    }
  ],
  currentStage: [{ required: true, message: '请选择当前阶段', trigger: 'change' }],
  entryDate: form.currentStage === 'entry'
    ? [{ required: true, message: '请选择入职日期', trigger: 'change' }]
    : [],
  leaveDate: form.currentStage === 'leave'
    ? [{ required: true, message: '请选择离职日期', trigger: 'change' }]
    : [],
  leaveType: form.currentStage === 'leave'
    ? [{ required: true, message: '请选择离职类型', trigger: 'change' }]
    : []
}))

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('employee_management')
    if (data.config) {
      if (data.config.stages) {
        availableStages.value = data.config.stages
      }
      if (data.config.stageNames) {
        stageNamesMap.value = data.config.stageNames
      }
    }
  } catch (error) {
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name,
      currentStage: searchForm.currentStage,
      stages: availableStages.value
    }
    const data = await employeeApi.getAll(params)

    employees.value = data.employees
    pagination.total = data.pagination?.total || data.employees.length
  } catch (error) {
  } finally {
    loading.value = false
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

const handleView = (row) => {
  Object.assign(viewForm, {
    name: row.name || '',
    gender: row.gender || '',
    phone: row.phone || '',
    email: row.email || '',
    idCard: row.idCard || '',
    currentStage: row.currentStage || '',
    businessLineName: row.businessLine?.name || '',
    entryDate: row.entryDate || null,
    leaveDate: row.leaveDate || null,
    leaveType: row.leaveType || '',
    leaveRemark: row.leaveRemark || '',
    lastOperator: row.lastOperator?.realName || row.lastOperator?.username || ''
  })
  viewDialogVisible.value = true
}

const handleViewDialogClose = () => {
  viewDialogVisible.value = false
  Object.assign(viewForm, {
    name: '',
    gender: '',
    phone: '',
    email: '',
    idCard: '',
    currentStage: '',
    businessLineName: '',
    entryDate: null,
    leaveDate: null,
    leaveType: '',
    leaveRemark: '',
    lastOperator: ''
  })
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑员工'
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    name: row.name || '',
    gender: row.gender || '',
    phone: row.phone || '',
    email: row.email || '',
    idCard: row.idCard || '',
    currentStage: row.currentStage || 'pending_onboarding',
    entryDate: row.entryDate ? new Date(row.entryDate) : null,
    leaveDate: row.leaveDate ? new Date(row.leaveDate) : null,
    leaveType: row.leaveType || '',
    leaveRemark: row.leaveRemark || ''
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await employeeApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const updateData = {
      name: form.name,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      idCard: form.idCard,
      currentStage: form.currentStage,
      entryDate: form.entryDate,
      entryRemark: '',
      leaveDate: form.currentStage === 'leave' ? form.leaveDate : null,
      leaveType: form.currentStage === 'leave' ? form.leaveType : '',
      leaveRemark: form.currentStage === 'leave' ? form.leaveRemark : ''
    }

    await employeeApi.update(currentId.value, updateData)
    ElMessage.success('更新成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
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
    currentStage: 'pending_onboarding',
    entryDate: null,
    leaveDate: null,
    leaveType: '',
    leaveRemark: ''
  })
}

onMounted(async () => {
  await fetchStageConfig()
  fetchEmployees()
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