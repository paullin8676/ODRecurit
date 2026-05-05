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
              v-for="(name, key) in filteredStageNames"
              :key="key"
              :label="name"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="employees" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="productLineName" label="产品线" width="120" />
        <el-table-column label="客户负责人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.productLine?.clientOwner || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="推荐日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'recommend_interview') ? new Date(getRoundDate(row, 'recommend_interview')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="资面日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'qualification_interview') ? new Date(getRoundDate(row, 'qualification_interview')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="资面结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'qualification_interview') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'qualification_interview') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="技一日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'tech_interview_1') ? new Date(getRoundDate(row, 'tech_interview_1')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="技一结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'tech_interview_1') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'tech_interview_1') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="技二日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'tech_interview_2') ? new Date(getRoundDate(row, 'tech_interview_2')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="技二结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'tech_interview_2') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'tech_interview_2') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="主面日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'manager_interview') ? new Date(getRoundDate(row, 'manager_interview')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="主面结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'manager_interview') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'manager_interview') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="审批日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'approval') ? new Date(getRoundDate(row, 'approval')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审批结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'approval') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'approval') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Offer日期" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'offer') ? new Date(getRoundDate(row, 'offer')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Offer审批人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row.roundsMap && row.roundsMap['offer']?.interviewer) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Offer结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundPassed(row, 'offer') === true" style="color: green;">通过</span>
            <span v-else-if="getRoundPassed(row, 'offer') === false" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <template v-if="row.candidateCurrentStage !== 'pending_onboarding' && row.candidateCurrentStage !== 'entry' && row.candidateCurrentStage !== 'leave'">
              <el-button v-if="row.finalStatus === 'pending'" type="primary" link size="small" @click="handleEdit(row)">
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
                  <el-date-picker v-model="interviewForm.rounds['recommend_interview'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('recommend_interview')" />
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
                  <el-date-picker v-model="interviewForm.rounds['qualification_interview'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('qualification_interview')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>资面顾问</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['qualification_interview'].interviewer" :disabled="!canEditCurrentStage('qualification_interview')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="资面结论">
              <el-input v-model="interviewForm.rounds['qualification_interview'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('qualification_interview')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['qualification_interview'].passed" :disabled="!canEditCurrentStage('qualification_interview')">
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
                  <el-date-picker v-model="interviewForm.rounds['tech_interview_1'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('tech_interview_1')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>面试官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['tech_interview_1'].interviewer" :disabled="!canEditCurrentStage('tech_interview_1')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.rounds['tech_interview_1'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('tech_interview_1')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['tech_interview_1'].passed" :disabled="!canEditCurrentStage('tech_interview_1')">
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
                  <el-date-picker v-model="interviewForm.rounds['tech_interview_2'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('tech_interview_2')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>面试官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['tech_interview_2'].interviewer" :disabled="!canEditCurrentStage('tech_interview_2')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.rounds['tech_interview_2'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('tech_interview_2')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['tech_interview_2'].passed" :disabled="!canEditCurrentStage('tech_interview_2')">
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
                  <el-date-picker v-model="interviewForm.rounds['manager_interview'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('manager_interview')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>主考官</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['manager_interview'].interviewer" :disabled="!canEditCurrentStage('manager_interview')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="评价内容">
              <el-input v-model="interviewForm.rounds['manager_interview'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('manager_interview')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['manager_interview'].passed" :disabled="!canEditCurrentStage('manager_interview')">
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
                  <el-date-picker v-model="interviewForm.rounds['approval'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('approval')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>审批人</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['approval'].interviewer" :disabled="!canEditCurrentStage('approval')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="审批备注">
              <el-input v-model="interviewForm.rounds['approval'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('approval')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['approval'].passed" :disabled="!canEditCurrentStage('approval')">
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
                  <el-date-picker v-model="interviewForm.rounds['offer'].scheduledDate" type="date" style="width: 100%" :disabled="!canEditCurrentStage('offer')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <template #label>
                    <span>审批人</span>
                    <span style="color: #F56C6C; margin-left: 4px;">*</span>
                  </template>
                  <el-input v-model="interviewForm.rounds['offer'].interviewer" :disabled="!canEditCurrentStage('offer')" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Offer备注">
              <el-input v-model="interviewForm.rounds['offer'].content" type="textarea" :rows="3" :disabled="!canEditCurrentStage('offer')" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>是否通过</span>
                <span style="color: #F56C6C; margin-left: 4px;">*</span>
              </template>
              <el-radio-group v-model="interviewForm.rounds['offer'].passed" :disabled="!canEditCurrentStage('offer')">
                <el-radio :value="true">通过</el-radio>
                <el-radio :value="false">未通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="isEditMode && canAdvanceInDialog()" type="primary" @click="handleSaveAndAdvance" :loading="submitLoading">
          保存&推进
        </el-button>
        <el-button v-if="isEditMode" type="primary" @click="handleSubmit" :loading="submitLoading">
          保存
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
import { ref, reactive, computed, onMounted } from 'vue'
import { candidateApi, productLineApi, stageConfigApi, interviewApi } from '../api'
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
  pending_onboarding: '待入职',
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
  'pending_onboarding',
  'entry',
  'leave'
]

const INTERVIEW_STAGES = [
  'recommend_interview',
  'qualification_interview',
  'tech_interview_1',
  'tech_interview_2',
  'manager_interview',
  'approval',
  'offer',
  'pending_onboarding'
]

const employees = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('查看面试信息')
const submitLoading = ref(false)
const selectedEmployee = ref(null)
const selectedProductLine = ref(null)
const selectedInterview = ref(null)
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

const filteredStageNames = computed(() => {
  const filtered = {}
  Object.keys(stageNames).forEach(key => {
    if (availableStages.value.includes(key)) {
      filtered[key] = stageNames[key]
    }
  })
  return filtered
})

const entryDialogVisible = ref(false)
const entryForm = reactive({
  entryDate: null,
  entryRemark: ''
})
const employeeToAdvance = ref(null)

const initInterviewForm = () => {
  const form = {
    currentStage: 'recommend_interview',
    finalStatus: 'pending',
    rounds: {}
  }
  
  INTERVIEW_STAGES.forEach((stage, index) => {
    form.rounds[stage] = {
      stageCode: stage,
      stageIndex: index,
      scheduledDate: null,
      interviewer: '',
      content: '',
      passed: null,
      completedAt: null
    }
  })
  
  return form
}

const interviewForm = reactive(initInterviewForm())

const fetchStageConfig = async () => {
  try {
    const data = await stageConfigApi.getByModule('interview_management')
    if (data.config && data.config.stages) {
      availableStages.value = data.config.stages
    } else {
      availableStages.value = Object.keys(stageNames)
    }
  } catch (error) {
    availableStages.value = Object.keys(stageNames)
  }
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const params = {
      currentStage: searchForm.currentStage || undefined,
      name: searchForm.name || undefined
    }
    const data = await interviewApi.getAll(params)
    
    const flattenedEmployees = []
    if (data.interviews && data.interviews.length > 0) {
      data.interviews.forEach(interview => {
        const candidate = interview.Candidate
        const productLine = interview.productLine
        const recommendDate = interview.recommendDate
        
        if (candidate && productLine) {
          flattenedEmployees.push({
            ...candidate,
            ...interview,
            productLine: productLine,
            productLineName: productLine.name,
            currentStage: interview.currentStage,
            candidateCurrentStage: candidate.currentStage,
            recommendDate: recommendDate,
            rounds: interview.rounds || [],
            roundsMap: interview.roundsMap || {}
          })
        }
      })
    }
    
    employees.value = flattenedEmployees.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
    pagination.total = flattenedEmployees.length
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchProductLines = async () => {
  try {
    const data = await productLineApi.getAll()
    productLines.value = data.productLines || []
  } catch (error) {
  }
}

const getRoundDate = (row, stageCode) => {
  if (stageCode === 'recommend_interview' && row.recommendDate) {
    return row.recommendDate
  }
  if (row.roundsMap && row.roundsMap[stageCode]) {
    return row.roundsMap[stageCode].scheduledDate
  }
  return null
}

const getRoundPassed = (row, stageCode) => {
  if (row.roundsMap && row.roundsMap[stageCode]) {
    return row.roundsMap[stageCode].passed
  }
  return null
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
    
    selectedEmployee.value = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      idCard: row.idCard,
      currentStage: row.candidateCurrentStage
    }
    selectedProductLine.value = row.productLine
    selectedInterview.value = row
    
    Object.assign(interviewForm, initInterviewForm())
    
    Object.assign(interviewForm, {
      currentStage: row.currentStage,
      finalStatus: row.finalStatus
    })

    if (row.recommendDate) {
      interviewForm.rounds['recommend_interview'].scheduledDate = row.recommendDate
    }

    if (row.rounds && row.rounds.length > 0) {
      row.rounds.forEach(round => {
        if (interviewForm.rounds[round.stageCode]) {
          Object.assign(interviewForm.rounds[round.stageCode], {
            scheduledDate: round.scheduledDate,
            interviewer: round.interviewer,
            content: round.content,
            passed: round.passed,
            completedAt: round.completedAt
          })
        }
      })
    }
    
    if (selectedEmployee.value && selectedProductLine.value) {
      dialogVisible.value = true
    } else {
      ElMessage.error('获取员工信息失败，请确保员工已关联产品线')
    }
  } catch (error) {
    ElMessage.error('获取员工信息失败')
  }
}

const isCurrentStage = (stage) => {
  return availableStages.value.includes(stage)
}

const shouldShowStage = (stage) => {
  if (!selectedInterview.value) {
    return false
  }
  
  const currentStage = selectedInterview.value.currentStage
  const currentIndex = stageOrder.indexOf(currentStage)
  const targetIndex = stageOrder.indexOf(stage)
  
  return targetIndex <= currentIndex
}

const canEditCurrentStage = (stage) => {
  if (!isEditMode.value) {
    return false
  }

  if (!selectedInterview.value) {
    return false
  }

  const currentStage = selectedInterview.value.currentStage
  const finalStatus = selectedInterview.value.finalStatus

  if (finalStatus === 'pending' && currentStage === 'recommend_interview' && stage === 'recommend_interview') {
    return true
  }

  const currentIndex = stageOrder.indexOf(currentStage)
  const targetIndex = stageOrder.indexOf(stage)

  return targetIndex === currentIndex
}

const canAdvance = (row) => {
  const currentStage = row.currentStage

  switch (currentStage) {
    case 'recommend_interview':
      return getRoundDate(row, 'recommend_interview') !== null
    case 'qualification_interview':
      return getRoundDate(row, 'qualification_interview') && getRoundPassed(row, 'qualification_interview') === true
    case 'tech_interview_1':
      return getRoundDate(row, 'tech_interview_1') && getRoundPassed(row, 'tech_interview_1') === true
    case 'tech_interview_2':
      return getRoundDate(row, 'tech_interview_2') && getRoundPassed(row, 'tech_interview_2') === true
    case 'manager_interview':
      return getRoundDate(row, 'manager_interview') && getRoundPassed(row, 'manager_interview') === true
    case 'approval':
      return getRoundDate(row, 'approval') && getRoundPassed(row, 'approval') === true
    case 'offer':
      return getRoundDate(row, 'offer') && getRoundPassed(row, 'offer') === true
    case 'pending_onboarding':
      return false
    case 'entry':
      return false
    case 'leave':
      return false
    default:
      return false
  }
}

const canAdvanceInDialog = () => {
  if (!selectedInterview.value) {
    return false
  }
  const currentStage = selectedInterview.value.currentStage

  switch (currentStage) {
    case 'recommend_interview':
      return interviewForm.rounds['recommend_interview']?.scheduledDate !== null
    case 'qualification_interview':
      return interviewForm.rounds['qualification_interview']?.scheduledDate && interviewForm.rounds['qualification_interview']?.passed === true
    case 'tech_interview_1':
      return interviewForm.rounds['tech_interview_1']?.scheduledDate && interviewForm.rounds['tech_interview_1']?.passed === true
    case 'tech_interview_2':
      return interviewForm.rounds['tech_interview_2']?.scheduledDate && interviewForm.rounds['tech_interview_2']?.passed === true
    case 'manager_interview':
      return interviewForm.rounds['manager_interview']?.scheduledDate && interviewForm.rounds['manager_interview']?.passed === true
    case 'approval':
      return interviewForm.rounds['approval']?.scheduledDate && interviewForm.rounds['approval']?.passed === true
    case 'offer':
      return interviewForm.rounds['offer']?.scheduledDate && interviewForm.rounds['offer']?.passed === true
    case 'pending_onboarding':
      return false
    case 'entry':
      return false
    case 'leave':
      return false
    default:
      return false
  }
}

const handleAdvance = async (row) => {
  try {
    await interviewApi.advance(row.id)
    ElMessage.success('推进成功')
    fetchEmployees()
  } catch (error) {
    ElMessage.error('推进失败')
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
    ElMessage.error('推进失败')
  }
}

const handleSubmit = async () => {
  if (!selectedEmployee.value || !selectedProductLine.value || !selectedInterview.value) {
    ElMessage.error('请选择员工和产品线')
    return
  }

  const currentStage = selectedInterview.value.currentStage
  if (!validateForm(currentStage)) {
    return
  }

  submitLoading.value = true
  try {
    const roundsArray = Object.values(interviewForm.rounds).filter(round => round)

    const updateData = {
      candidateId: selectedEmployee.value.id,
      productLineId: selectedProductLine.value.id,
      recommendDate: interviewForm.rounds['recommend_interview']?.scheduledDate,
      currentStage: interviewForm.currentStage,
      finalStatus: interviewForm.finalStatus,
      rounds: roundsArray
    }

    if (selectedInterview.value?.id) {
      await interviewApi.update(selectedInterview.value.id, updateData)
    } else {
      await interviewApi.create(updateData)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSaveAndAdvance = async () => {
  if (!selectedEmployee.value || !selectedProductLine.value || !selectedInterview.value) {
    ElMessage.error('请选择员工和产品线')
    return
  }

  const currentStage = selectedInterview.value.currentStage
  if (!validateForm(currentStage)) {
    return
  }

  submitLoading.value = true
  try {
    const roundsArray = Object.values(interviewForm.rounds).filter(round => round)

    const updateData = {
      candidateId: selectedEmployee.value.id,
      productLineId: selectedProductLine.value.id,
      recommendDate: interviewForm.rounds['recommend_interview']?.scheduledDate,
      currentStage: interviewForm.currentStage,
      finalStatus: interviewForm.finalStatus,
      rounds: roundsArray
    }

    if (selectedInterview.value?.id) {
      await interviewApi.update(selectedInterview.value.id, updateData)
    } else {
      await interviewApi.create(updateData)
    }

    await interviewApi.advance(selectedInterview.value.id)
    ElMessage.success('保存并推进成功')
    dialogVisible.value = false
    fetchEmployees()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const validateForm = (currentStage) => {
  const stageIndex = stageOrder.indexOf(currentStage)
  
  if (stageIndex >= stageOrder.indexOf('recommend_interview')) {
    if (!interviewForm.rounds['recommend_interview']?.scheduledDate) {
      ElMessage.error('请填写推荐日期')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('qualification_interview')) {
    if (!interviewForm.rounds['qualification_interview']?.scheduledDate) {
      ElMessage.error('请填写资面日期')
      return false
    }
    if (!interviewForm.rounds['qualification_interview']?.interviewer) {
      ElMessage.error('请填写资面顾问')
      return false
    }
    if (interviewForm.rounds['qualification_interview']?.passed === null) {
      ElMessage.error('请选择资面是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_1')) {
    if (!interviewForm.rounds['tech_interview_1']?.scheduledDate) {
      ElMessage.error('请填写技一日期')
      return false
    }
    if (!interviewForm.rounds['tech_interview_1']?.interviewer) {
      ElMessage.error('请填写技一面试官')
      return false
    }
    if (interviewForm.rounds['tech_interview_1']?.passed === null) {
      ElMessage.error('请选择技一是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_2')) {
    if (!interviewForm.rounds['tech_interview_2']?.scheduledDate) {
      ElMessage.error('请填写技二日期')
      return false
    }
    if (!interviewForm.rounds['tech_interview_2']?.interviewer) {
      ElMessage.error('请填写技二面试官')
      return false
    }
    if (interviewForm.rounds['tech_interview_2']?.passed === null) {
      ElMessage.error('请选择技二是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('manager_interview')) {
    if (!interviewForm.rounds['manager_interview']?.scheduledDate) {
      ElMessage.error('请填写主面日期')
      return false
    }
    if (!interviewForm.rounds['manager_interview']?.interviewer) {
      ElMessage.error('请填写主考官')
      return false
    }
    if (interviewForm.rounds['manager_interview']?.passed === null) {
      ElMessage.error('请选择主面是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('approval')) {
    if (!interviewForm.rounds['approval']?.scheduledDate) {
      ElMessage.error('请填写审批日期')
      return false
    }
    if (!interviewForm.rounds['approval']?.interviewer) {
      ElMessage.error('请填写审批人')
      return false
    }
    if (interviewForm.rounds['approval']?.passed === null) {
      ElMessage.error('请选择审批是否通过')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('offer')) {
    if (!interviewForm.rounds['offer']?.scheduledDate) {
      ElMessage.error('请填写Offer日期')
      return false
    }
    if (!interviewForm.rounds['offer']?.interviewer) {
      ElMessage.error('请填写Offer审批人')
      return false
    }
    if (interviewForm.rounds['offer']?.passed === null) {
      ElMessage.error('请选择Offer是否通过')
      return false
    }
  }
  
  return true
}

const handleDialogClose = () => {
  selectedEmployee.value = null
  selectedProductLine.value = null
  selectedInterview.value = null
  isEditMode.value = false
  Object.assign(interviewForm, initInterviewForm())
}

onMounted(() => {
  fetchStageConfig()
  fetchEmployees()
  fetchProductLines()
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
