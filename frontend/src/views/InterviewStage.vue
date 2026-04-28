<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">面试管理</h2>
    </div>

    <div class="card-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable @input="handleSearch" />
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="searchForm.currentStage" placeholder="请选择阶段" clearable @change="handleSearch" style="width: auto; min-width: 120px">
            <el-option
              v-for="(name, key) in stageNames"
              :key="key"
              :label="name"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="employees" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="productLineName" label="产品线" width="120" />
        <el-table-column label="客户负责人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.productLine?.clientOwner || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="推荐日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.recommendDate ? new Date(row.productLine.through.recommendDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="资面日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.qualificationInterviewDate ? new Date(row.productLine.through.qualificationInterviewDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="资面结果" width="100">
          <template #default="{ row }">
            <span v-if="row.productLine?.through?.qualificationPassed === true" style="color: green;">通过</span>
            <span v-else-if="row.productLine?.through?.qualificationPassed === false" style="color: red;">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="技一日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.techInterview1Date ? new Date(row.productLine.through.techInterview1Date).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="技一结果" width="100">
          <template #default="{ row }">
            <span v-if="row.productLine?.through?.techInterview1Passed === true" style="color: green;">通过</span>
            <span v-else-if="row.productLine?.through?.techInterview1Passed === false" style="color: red;">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="技二日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.techInterview2Date ? new Date(row.productLine.through.techInterview2Date).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="技二结果" width="100">
          <template #default="{ row }">
            <span v-if="row.productLine?.through?.techInterview2Passed === true" style="color: green;">通过</span>
            <span v-else-if="row.productLine?.through?.techInterview2Passed === false" style="color: red;">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="主面日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.managerInterviewDate ? new Date(row.productLine.through.managerInterviewDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="主面结果" width="100">
          <template #default="{ row }">
            <span v-if="row.productLine?.through?.managerInterviewPassed === true" style="color: green;">通过</span>
            <span v-else-if="row.productLine?.through?.managerInterviewPassed === false" style="color: red;">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="审批日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.approvalDate ? new Date(row.productLine.through.approvalDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审批结果" width="100">
          <template #default="{ row }">
            <span v-if="row.productLine?.through?.approvalPassed === true" style="color: green;">通过</span>
            <span v-else-if="row.productLine?.through?.approvalPassed === false" style="color: red;">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Offer日期" width="120">
          <template #default="{ row }">
            {{ row.productLine?.through?.offerDate ? new Date(row.productLine.through.offerDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Offer审批人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.productLine?.through?.offerApprover || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="入职日期" width="120">
          <template #default="{ row }">
            {{ row.entryDate ? new Date(row.entryDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <template v-if="isCurrentStage(row.currentStage)">
              <el-button type="primary" link size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button v-if="canAdvance(row)" type="success" link size="small" @click="handleAdvance(row)">
                推进
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
      width="800px"
      @close="handleDialogClose"
    >
      <div v-if="selectedEmployee && selectedProductLine">
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

        <template v-if="shouldShowStage('recommend_interview')">
          <el-divider content-position="left">推荐面试</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>产品线</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input :value="selectedProductLine.name" :disabled="true" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>客户负责人</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input :value="selectedProductLine.clientOwner" :disabled="true" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>推荐日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.recommendDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('recommend_interview')" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('qualification_interview')">
          <el-divider content-position="left">资格面试</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>资面日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.qualificationInterviewDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('qualification_interview')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>资面顾问</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.qualificationInterviewer" :disabled="!canEditCurrentStage('qualification_interview')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="资面结论">
              <el-input v-model="interviewForm.qualificationConclusion" type="textarea" :rows="3" :disabled="!canEditCurrentStage('qualification_interview')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.qualificationPassed" :disabled="!canEditCurrentStage('qualification_interview')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-if="shouldShowStage('tech_interview_1')">
          <el-divider content-position="left">技术面试(一)</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>技面日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.techInterview1Date" type="date" style="width: 100%" :disabled="!canEditCurrentStage('tech_interview_1')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>面试官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.techInterview1Interviewer" :disabled="!canEditCurrentStage('tech_interview_1')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.techInterview1Content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('tech_interview_1')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.techInterview1Passed" :disabled="!canEditCurrentStage('tech_interview_1')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-if="shouldShowStage('tech_interview_2')">
          <el-divider content-position="left">技术面试(二)</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>技面日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.techInterview2Date" type="date" style="width: 100%" :disabled="!canEditCurrentStage('tech_interview_2')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>面试官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.techInterview2Interviewer" :disabled="!canEditCurrentStage('tech_interview_2')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.techInterview2Content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('tech_interview_2')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.techInterview2Passed" :disabled="!canEditCurrentStage('tech_interview_2')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-if="shouldShowStage('manager_interview')">
          <el-divider content-position="left">主管面试</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>综面日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.managerInterviewDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('manager_interview')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>主考官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.managerInterviewer" :disabled="!canEditCurrentStage('manager_interview')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.managerInterviewContent" type="textarea" :rows="3" :disabled="!canEditCurrentStage('manager_interview')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.managerInterviewPassed" :disabled="!canEditCurrentStage('manager_interview')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-if="shouldShowStage('approval')">
          <el-divider content-position="left">审批</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>审批日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.approvalDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('approval')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>审批人</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.approver" :disabled="!canEditCurrentStage('approval')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="审批备注">
              <el-input v-model="interviewForm.approvalRemark" type="textarea" :rows="3" :disabled="!canEditCurrentStage('approval')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.approvalPassed" :disabled="!canEditCurrentStage('approval')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>

        <template v-if="shouldShowStage('offer')">
          <el-divider content-position="left">Offer</el-divider>
          <el-form :model="interviewForm" label-width="160px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>Offer日期</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-date-picker v-model="interviewForm.offerDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('offer')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>审批人</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.offerApprover" :disabled="!canEditCurrentStage('offer')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Offer备注">
              <el-input v-model="interviewForm.offerRemark" type="textarea" :rows="3" :disabled="!canEditCurrentStage('offer')" />
            </el-form-item>
          </el-form>
        </template>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="isEditMode" type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="entryDialogVisible" title="填写入职信息" width="400px" @close="handleEntryDialogClose">
      <el-form :model="entryForm" label-width="100px">
        <el-form-item>
          <template #label>
            <span>入职日期</span>
            <span style="color: #F56C6C; margin-left: 4px;">*</span>
          </template>
          <el-date-picker v-model="entryForm.entryDate" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="entryForm.entryRemark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleEntryDialogClose">取消</el-button>
        <el-button type="primary" @click="handleEntrySubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { candidateApi, productLineApi, stageConfigApi } from '../api'
import { ElMessage } from 'element-plus'

const stageNames = {
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
}

const stageOrder = [
  'employee_entry',
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
  'entry',
  'leave'
]

const employees = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('查看面试信息')
const submitLoading = ref(false)
const selectedEmployee = ref(null)
const selectedProductLine = ref(null)
const productLines = ref([])
const isEditMode = ref(false)

const searchForm = reactive({
  name: '',
  currentStage: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const availableStages = ref([])

const entryDialogVisible = ref(false)
const entryForm = reactive({
  entryDate: null,
  entryRemark: ''
})
const employeeToAdvance = ref(null)

const interviewForm = reactive({
  recommendDate: null,
  qualificationInterviewDate: null,
  qualificationInterviewer: '',
  qualificationConclusion: '',
  qualificationPassed: null,
  techInterview1Date: null,
  techInterview1Interviewer: '',
  techInterview1Content: '',
  techInterview1Passed: null,
  techInterview2Date: null,
  techInterview2Interviewer: '',
  techInterview2Content: '',
  techInterview2Passed: null,
  managerInterviewDate: null,
  managerInterviewer: '',
  managerInterviewContent: '',
  managerInterviewPassed: null,
  approvalDate: null,
  approver: '',
  approvalRemark: '',
  approvalPassed: null,
  offerDate: null,
  offerApprover: '',
  offerRemark: ''
})

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('interview_management')
    if (data.config && data.config.stages) {
      availableStages.value = data.config.stages
    } else {
      availableStages.value = Object.keys(stageNames)
    }
  } catch (error) {
    console.error('Failed to fetch stage config:', error)
    availableStages.value = Object.keys(stageNames)
  }
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const data = await candidateApi.getAll(params)
    
    const flattenedEmployees = []
    data.candidates.forEach(candidate => {
      if (candidate.productLines && candidate.productLines.length > 0) {
        candidate.productLines.forEach(productLine => {
          flattenedEmployees.push({
            ...candidate,
            productLine: productLine,
            productLineName: productLine.name,
            currentStage: productLine.through.interviewStage
          })
        })
      }
    })
    
    employees.value = flattenedEmployees
    pagination.total = data.pagination?.total || flattenedEmployees.length
  } catch (error) {
    console.error('Failed to fetch employees:', error)
  } finally {
    loading.value = false
  }
}

const fetchProductLines = async () => {
  try {
    const data = await productLineApi.getAll()
    productLines.value = data.productLines || []
  } catch (error) {
    console.error('Failed to fetch product lines:', error)
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
  isEditMode.value = false
  dialogTitle.value = '查看面试信息'
  await openDetailDialog(row)
}

const handleEdit = async (row) => {
  isEditMode.value = true
  dialogTitle.value = '编辑面试信息'
  await openDetailDialog(row)
}

const openDetailDialog = async (row) => {
  try {
    if (!row) {
      ElMessage.error('无效的员工数据')
      return
    }
    
    const data = await candidateApi.getById(row.id)
    if (!data || !data.candidate) {
      ElMessage.error('获取员工信息失败')
      return
    }
    
    selectedEmployee.value = data.candidate
    selectedProductLine.value = row.productLine
    
    if (row.productLine && row.productLine.through) {
      const through = row.productLine.through
      Object.assign(interviewForm, {
        recommendDate: through.recommendDate || null,
        qualificationInterviewDate: through.qualificationInterviewDate || null,
        qualificationInterviewer: through.qualificationInterviewer || '',
        qualificationConclusion: through.qualificationConclusion || '',
        qualificationPassed: through.qualificationPassed !== undefined ? through.qualificationPassed : null,
        techInterview1Date: through.techInterview1Date || null,
        techInterview1Interviewer: through.techInterview1Interviewer || '',
        techInterview1Content: through.techInterview1Content || '',
        techInterview1Passed: through.techInterview1Passed !== undefined ? through.techInterview1Passed : null,
        techInterview2Date: through.techInterview2Date || null,
        techInterview2Interviewer: through.techInterview2Interviewer || '',
        techInterview2Content: through.techInterview2Content || '',
        techInterview2Passed: through.techInterview2Passed !== undefined ? through.techInterview2Passed : null,
        managerInterviewDate: through.managerInterviewDate || null,
        managerInterviewer: through.managerInterviewer || '',
        managerInterviewContent: through.managerInterviewContent || '',
        managerInterviewPassed: through.managerInterviewPassed !== undefined ? through.managerInterviewPassed : null,
        approvalDate: through.approvalDate || null,
        approver: through.approver || '',
        approvalRemark: through.approvalRemark || '',
        approvalPassed: through.approvalPassed !== undefined ? through.approvalPassed : null,
        offerDate: through.offerDate || null,
        offerApprover: through.offerApprover || '',
        offerRemark: through.offerRemark || ''
      })
    } else {
      Object.assign(interviewForm, {
        recommendDate: null,
        qualificationInterviewDate: null,
        qualificationInterviewer: '',
        qualificationConclusion: '',
        qualificationPassed: null,
        techInterview1Date: null,
        techInterview1Interviewer: '',
        techInterview1Content: '',
        techInterview1Passed: null,
        techInterview2Date: null,
        techInterview2Interviewer: '',
        techInterview2Content: '',
        techInterview2Passed: null,
        managerInterviewDate: null,
        managerInterviewer: '',
        managerInterviewContent: '',
        managerInterviewPassed: null,
        approvalDate: null,
        approver: '',
        approvalRemark: '',
        approvalPassed: null,
        offerDate: null,
        offerApprover: '',
        offerRemark: ''
      })
    }
    
    if (selectedEmployee.value && selectedProductLine.value) {
      dialogVisible.value = true
    } else {
      ElMessage.error('获取员工信息失败，请确保员工已关联产品线')
    }
  } catch (error) {
    console.error('Error in openDetailDialog:', error)
    ElMessage.error('获取员工信息失败')
  }
}

const isCurrentStage = (stage) => {
  return availableStages.value.includes(stage)
}

const shouldShowStage = (stage) => {
  if (!selectedProductLine.value || !selectedProductLine.value.through) {
    return false
  }
  
  const currentStage = selectedProductLine.value.through.interviewStage
  const currentIndex = stageOrder.indexOf(currentStage)
  const targetIndex = stageOrder.indexOf(stage)
  
  return targetIndex <= currentIndex
}

const canEditCurrentStage = (stage) => {
  if (!isEditMode.value) {
    return false
  }
  
  if (!selectedProductLine.value || !selectedProductLine.value.through) {
    return false
  }
  
  const currentStage = selectedProductLine.value.through.interviewStage
  const currentIndex = stageOrder.indexOf(currentStage)
  const targetIndex = stageOrder.indexOf(stage)
  
  return targetIndex === currentIndex
}

const canAdvance = (row) => {
  const through = row.productLine?.through
  if (!through) return false

  const currentStage = row.currentStage

  switch (currentStage) {
    case 'recommend_interview':
      return true
    case 'qualification_interview':
      return through.qualificationInterviewDate && through.qualificationPassed === true
    case 'tech_interview_1':
      return through.techInterview1Date && through.techInterview1Passed === true
    case 'tech_interview_2':
      return through.techInterview2Date && through.techInterview2Passed === true
    case 'manager_interview':
      return through.managerInterviewDate && through.managerInterviewPassed === true
    case 'approval':
      return through.approvalDate && through.approvalPassed === true
    case 'offer':
      return through.offerDate
    case 'entry':
      return false
    case 'leave':
      return false
    default:
      return false
  }
}

const handleAdvance = async (row) => {
  if (row.currentStage === 'offer') {
    employeeToAdvance.value = row
    entryForm.entryDate = null
    entryForm.entryRemark = ''
    entryDialogVisible.value = true
  } else {
    try {
      await candidateApi.advance(row.id, { productLineId: row.productLine.id })
      ElMessage.success('推进成功')
      fetchEmployees()
    } catch (error) {
      console.error('Error in handleAdvance:', error)
      ElMessage.error('推进失败')
    }
  }
}

const handleEntryDialogClose = () => {
  entryDialogVisible.value = false
  employeeToAdvance.value = null
}

const handleEntrySubmit = async () => {
  if (!entryForm.entryDate) {
    ElMessage.error('请填写入职日期')
    return
  }
  
  try {
    const row = employeeToAdvance.value
    await candidateApi.advance(row.id, { 
      productLineId: row.productLine.id,
      entryDate: entryForm.entryDate,
      entryRemark: entryForm.entryRemark
    })
    ElMessage.success('推进成功')
    entryDialogVisible.value = false
    employeeToAdvance.value = null
    fetchEmployees()
  } catch (error) {
    console.error('Error in handleEntrySubmit:', error)
    ElMessage.error('推进失败')
  }
}

const handleSubmit = async () => {
  if (!selectedEmployee.value || !selectedProductLine.value) {
    ElMessage.error('请选择员工和产品线')
    return
  }
  
  const currentStage = selectedProductLine.value.through?.interviewStage
  if (!validateForm(currentStage)) {
    return
  }
  
  submitLoading.value = true
  try {
    const updateData = {
      name: selectedEmployee.value.name,
      email: selectedEmployee.value.email,
      phone: selectedEmployee.value.phone,
      gender: selectedEmployee.value.gender,
      idCard: selectedEmployee.value.idCard,
      productLines: (selectedEmployee.value.productLines || []).map(pl => {
        if (pl?.id === selectedProductLine.value.id) {
          return {
            id: pl.through?.id,
            productLineId: pl.id,
            interviewStage: pl.through?.interviewStage,
            recommendDate: interviewForm.recommendDate,
            qualificationInterviewDate: interviewForm.qualificationInterviewDate,
            qualificationInterviewer: interviewForm.qualificationInterviewer,
            qualificationConclusion: interviewForm.qualificationConclusion,
            qualificationPassed: interviewForm.qualificationPassed,
            techInterview1Date: interviewForm.techInterview1Date,
            techInterview1Interviewer: interviewForm.techInterview1Interviewer,
            techInterview1Content: interviewForm.techInterview1Content,
            techInterview1Passed: interviewForm.techInterview1Passed,
            techInterview2Date: interviewForm.techInterview2Date,
            techInterview2Interviewer: interviewForm.techInterview2Interviewer,
            techInterview2Content: interviewForm.techInterview2Content,
            techInterview2Passed: interviewForm.techInterview2Passed,
            managerInterviewDate: interviewForm.managerInterviewDate,
            managerInterviewer: interviewForm.managerInterviewer,
            managerInterviewContent: interviewForm.managerInterviewContent,
            managerInterviewPassed: interviewForm.managerInterviewPassed,
            approvalDate: interviewForm.approvalDate,
            approver: interviewForm.approver,
            approvalRemark: interviewForm.approvalRemark,
            approvalPassed: interviewForm.approvalPassed,
            offerDate: interviewForm.offerDate,
            offerApprover: interviewForm.offerApprover,
            offerRemark: interviewForm.offerRemark
          }
        }
        return {
          id: pl.through?.id,
          productLineId: pl.id,
          interviewStage: pl.through?.interviewStage,
          recommendDate: pl.through?.recommendDate
        }
      })
    }
    
    await candidateApi.update(selectedEmployee.value.id, updateData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    console.error('Error in handleSubmit:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const validateForm = (currentStage) => {
  const stageIndex = stageOrder.indexOf(currentStage)
  
  if (stageIndex >= stageOrder.indexOf('recommend_interview')) {
    if (!interviewForm.recommendDate) {
      ElMessage.error('请填写推荐日期')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('qualification_interview')) {
    if (!interviewForm.qualificationInterviewDate) {
      ElMessage.error('请填写资面日期')
      return false
    }
    if (!interviewForm.qualificationInterviewer) {
      ElMessage.error('请填写资面顾问')
      return false
    }
    if (interviewForm.qualificationPassed === null) {
      ElMessage.error('请选择资面是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_1')) {
    if (!interviewForm.techInterview1Date) {
      ElMessage.error('请填写技一日期')
      return false
    }
    if (!interviewForm.techInterview1Interviewer) {
      ElMessage.error('请填写技一面试官')
      return false
    }
    if (interviewForm.techInterview1Passed === null) {
      ElMessage.error('请选择技一是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_2')) {
    if (!interviewForm.techInterview2Date) {
      ElMessage.error('请填写技二日期')
      return false
    }
    if (!interviewForm.techInterview2Interviewer) {
      ElMessage.error('请填写技二面试官')
      return false
    }
    if (interviewForm.techInterview2Passed === null) {
      ElMessage.error('请选择技二是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('manager_interview')) {
    if (!interviewForm.managerInterviewDate) {
      ElMessage.error('请填写主面日期')
      return false
    }
    if (!interviewForm.managerInterviewer) {
      ElMessage.error('请填写主考官')
      return false
    }
    if (interviewForm.managerInterviewPassed === null) {
      ElMessage.error('请选择主面是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('approval')) {
    if (!interviewForm.approvalDate) {
      ElMessage.error('请填写审批日期')
      return false
    }
    if (!interviewForm.approver) {
      ElMessage.error('请填写审批人')
      return false
    }
    if (interviewForm.approvalPassed === null) {
      ElMessage.error('请选择审批是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('offer')) {
    if (!interviewForm.offerDate) {
      ElMessage.error('请填写Offer日期')
      return false
    }
    if (!interviewForm.offerApprover) {
      ElMessage.error('请填写Offer审批人')
      return false
    }
  }
  
  return true
}

const handleDialogClose = () => {
  selectedEmployee.value = null
  selectedProductLine.value = null
  isEditMode.value = false
  Object.assign(interviewForm, {
    recommendDate: null,
    qualificationInterviewDate: null,
    qualificationInterviewer: '',
    qualificationConclusion: '',
    qualificationPassed: null,
    techInterview1Date: null,
    techInterview1Interviewer: '',
    techInterview1Content: '',
    techInterview1Passed: null,
    techInterview2Date: null,
    techInterview2Interviewer: '',
    techInterview2Content: '',
    techInterview2Passed: null,
    managerInterviewDate: null,
    managerInterviewer: '',
    managerInterviewContent: '',
    managerInterviewPassed: null,
    approvalDate: null,
    approver: '',
    approvalRemark: '',
    approvalPassed: null,
    offerDate: null,
    offerApprover: '',
    offerRemark: ''
  })
}

onMounted(() => {
  fetchStageConfig()
  fetchEmployees()
  fetchProductLines()
})
</script>