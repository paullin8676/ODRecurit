<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">员工列表</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增员工
      </el-button>
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
        <el-table-column prop="email" label="邮箱" width="180">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.email" placeholder="请输入邮箱" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.email || '-' }}
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
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-select v-model="editingForm.currentStage" placeholder="请选择阶段" style="width: 100%" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit">
                <el-option label="入职" value="entry" />
                <el-option label="离职" value="leave" />
              </el-select>
            </template>
            <template v-else>
              {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="产品线" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.productLines && row.productLines.length > 0">
              <el-tag v-for="pl in row.productLines" :key="pl.id" type="info" class="product-line-tag">
                {{ pl.name }}
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
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.entryDate" type="date" style="width: 100%" placeholder="入职日期" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ formatDate(row.entryDate) }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="离职日期" width="120">
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-date-picker v-model="editingForm.leaveDate" type="date" style="width: 100%" placeholder="离职日期" @change="handleLeaveDateChange" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ formatDate(row.leaveDate) }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="离职原因" width="120" show-overflow-tooltip>
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.leaveReason" placeholder="离职原因" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.leaveReason || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="离职备注" width="150" show-overflow-tooltip>
          <template #default="{ row, $index }">
            <template v-if="editingRowIndex === $index">
              <el-input v-model="editingForm.leaveRemark" placeholder="离职备注" @keyup.enter="handleSave($index, row)" @keyup.esc="cancelEdit" />
            </template>
            <template v-else>
              {{ row.leaveRemark || '-' }}
            </template>
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
              <el-button type="info" link size="small" @click="handleView(row)">
                查看
              </el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row, $index)">
                编辑
              </el-button>
              <el-button v-if="canAdvance(row)" type="success" link size="small" @click="handleAdvance(row)">
                推进
              </el-button>
              <el-button v-if="canRollback(row)" type="warning" link size="small" @click="handleRollback(row)">
                回退
              </el-button>
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
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
          <el-input :value="stageNames[viewForm.currentStage] || '-'" disabled />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-input :value="viewForm.entryDate ? formatDate(viewForm.entryDate) : '-'" disabled />
        </el-form-item>
        <el-form-item label="离职日期">
          <el-input :value="viewForm.leaveDate ? formatDate(viewForm.leaveDate) : '-'" disabled />
        </el-form-item>
        <el-form-item label="离职原因">
          <el-input :value="viewForm.leaveReason || '-'" disabled />
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
import { candidateApi, stageConfigApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const stageNames = ref({
  employee_entry: '员工录入',
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
})

const availableStages = ref([])

const filteredStageNames = computed(() => {
  if (availableStages.value.length === 0) {
    return stageNames.value
  }
  const filtered = {}
  availableStages.value.forEach(stage => {
    if (stageNames.value[stage]) {
      filtered[stage] = stageNames.value[stage]
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
const editingRowIndex = ref(-1)
const viewDialogVisible = ref(false)

const viewForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  currentStage: '',
  entryDate: null,
  leaveDate: null,
  leaveReason: '',
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
  idCard: ''
})

const editingForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  currentStage: '',
  entryDate: null,
  leaveDate: null,
  leaveReason: '',
  leaveRemark: ''
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
    {
      pattern: /(^\d{15}$)|(^\d{17}([0-9]|X|x)$)/,
      message: '请输入正确的身份证号码',
      trigger: 'blur'
    }
  ]
}

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('employee_management')
    if (data.config && data.config.stages) {
      availableStages.value = data.config.stages
    }
  } catch (error) {
    console.error('Failed to fetch stage config:', error)
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
      currentStage: searchForm.currentStage
    }
    const data = await candidateApi.getEmployees(params)
    
    employees.value = data.candidates
    pagination.total = data.total || data.candidates.length
  } catch (error) {
    console.error('Failed to fetch employees:', error)
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

const handleCreate = () => {
  dialogTitle.value = '新增员工'
  isEdit.value = false
  dialogVisible.value = true
}

const phoneInputRef = ref(null)

const handleView = (row) => {
  Object.assign(viewForm, {
    name: row.name || '',
    gender: row.gender || '',
    phone: row.phone || '',
    email: row.email || '',
    idCard: row.idCard || '',
    currentStage: row.currentStage || '',
    entryDate: row.entryDate || null,
    leaveDate: row.leaveDate || null,
    leaveReason: row.leaveReason || '',
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
    entryDate: null,
    leaveDate: null,
    leaveReason: '',
    leaveRemark: '',
    lastOperator: ''
  })
}

const handleEdit = (row, index) => {
  editingRowIndex.value = index
  Object.assign(editingForm, {
    name: row.name,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    idCard: row.idCard,
    currentStage: row.currentStage || 'entry',
    entryDate: row.entryDate ? new Date(row.entryDate) : null,
    leaveDate: row.leaveDate ? new Date(row.leaveDate) : null,
    leaveReason: row.leaveReason || '',
    leaveRemark: row.leaveRemark || ''
  })
  // Next tick to ensure the input element is rendered
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
    entryDate: null,
    leaveDate: null,
    leaveReason: '',
    leaveRemark: ''
  })
}

const handleLeaveDateChange = (date) => {
  if (date) {
    editingForm.leaveDate = date
  }
}

const handleSave = async (index, row) => {
  // Validate the form data
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
    // When editing, we need to preserve the existing product lines
    // First, get the current employee information
    const data = await candidateApi.getById(row.id)
    const employee = data.candidate
    
    // Create update data with basic info and existing product lines
    const updateData = {
      name: editingForm.name,
      gender: editingForm.gender,
      phone: editingForm.phone,
      email: editingForm.email,
      idCard: editingForm.idCard,
      currentStage: editingForm.currentStage,
      entryDate: editingForm.entryDate,
      entryRemark: '',
      leaveDate: editingForm.leaveDate,
      leaveReason: editingForm.leaveReason,
      leaveRemark: editingForm.leaveRemark,
      productLines: employee.productLines.map(pl => ({
        id: pl.through.id,
        productLineId: pl.id,
        interviewStage: pl.through.interviewStage || pl.through.currentStage,
        recommendDate: pl.through.recommendDate
      }))
    }
    
    await candidateApi.update(row.id, updateData)
    ElMessage.success('更新成功')
    editingRowIndex.value = -1
    fetchEmployees()
  } catch (error) {
    // 错误已经在 axios 响应拦截器中处理，不需要重复显示
  }
}

const handleDelete = async (row) => {
  try {
    await candidateApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const canAdvance = (row) => {
  // 只有当员工处于员工录入阶段时可以推进到下一阶段
  return row.currentStage === 'employee_entry'
}

const canRollback = (row) => {
  // 只有当员工处于机考申报阶段时可以回退到员工录入阶段
  return row.currentStage === 'exam_declare'
}

const handleAdvance = async (row) => {
  try {
    // 推进到下一阶段不需要关联产品线，只有在面试阶段才需要
    await candidateApi.advance(row.id, { productLineId: row.productLine?.id })
    ElMessage.success('推进成功')
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '推进失败')
  }
}

const handleRollback = async (row) => {
  try {
    // 回退到上一阶段不需要关联产品线，只有在面试阶段才需要
    await candidateApi.rollback(row.id, { productLineId: row.productLine?.id })
    ElMessage.success('回退成功')
    fetchEmployees()
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
      // When editing, we need to preserve the existing product lines
      // First, get the current employee information
      const data = await candidateApi.getById(currentId.value)
      const employee = data.candidate
      
      // Create update data with basic info and existing product lines
      const updateData = {
        ...form,
        productLines: employee.productLines.map(pl => ({
          id: pl.through.id,
          productLineId: pl.id,
          interviewStage: pl.through.interviewStage || pl.through.currentStage,
          recommendDate: pl.through.recommendDate
        }))
      }
      
      await candidateApi.update(currentId.value, updateData)
      ElMessage.success('更新成功')
    } else {
      await candidateApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    // 错误已经在 axios 响应拦截器中处理，不需要重复显示
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
    idCard: ''
  })
}

onMounted(() => {
  fetchStageConfig()
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
  margin-top: 0;
  padding-top: 0;
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