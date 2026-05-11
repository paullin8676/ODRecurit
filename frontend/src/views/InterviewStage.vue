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
        <el-form-item label="最终结果">
          <el-select v-model="searchForm.passStatus" placeholder="请选择" clearable @change="handleSearch" style="width: auto; min-width: 100px">
            <el-option label="全部" value="" />
            <el-option label="进行中" value="progressing" />
            <el-option label="通过" value="passed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="employees" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="当前阶段" width="120">
          <template #default="{ row }">
            {{ row.currentStage ? stageNames[row.currentStage] : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="入职日期" width="120">
          <template #default="{ row }">
            {{ row.employeeEntryDate ? new Date(row.employeeEntryDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="离职日期" width="120">
          <template #default="{ row }">
            {{ row.employeeLeaveDate ? new Date(row.employeeLeaveDate).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="businessLineName" label="业务线" width="120" />
        <el-table-column label="最终结果" width="100">
          <template #default="{ row }">
            <span v-if="row.currentStatus === 'passed'" style="color: green;">通过</span>
            <span v-else-if="row.currentStatus === 'failed'" style="color: red;">失败</span>
            <span v-else style="color: blue;">进行中</span>
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
            <span v-if="getRoundStatus(row, 'qualification_interview') === 'passed'" style="color: green;">通过</span>
            <span v-else-if="getRoundStatus(row, 'qualification_interview') === 'failed'" style="color: red;">未通过</span>
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
            <span v-if="getRoundStatus(row, 'tech_interview_1') === 'passed'" style="color: green;">通过</span>
            <span v-else-if="getRoundStatus(row, 'tech_interview_1') === 'failed'" style="color: red;">未通过</span>
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
            <span v-if="getRoundStatus(row, 'tech_interview_2') === 'passed'" style="color: green;">通过</span>
            <span v-else-if="getRoundStatus(row, 'tech_interview_2') === 'failed'" style="color: red;">未通过</span>
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
            <span v-if="getRoundStatus(row, 'manager_interview') === 'passed'" style="color: green;">通过</span>
            <span v-else-if="getRoundStatus(row, 'manager_interview') === 'failed'" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="租用审批" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'approval') ? new Date(getRoundDate(row, 'approval')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审批结果" width="100">
          <template #default="{ row }">
            <span v-if="getRoundStatus(row, 'approval') === 'passed'" style="color: green;">通过</span>
            <span v-else-if="getRoundStatus(row, 'approval') === 'failed'" style="color: red;">未通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Offer沟通" width="120">
          <template #default="{ row }">
            {{ getRoundDate(row, 'offer') ? new Date(getRoundDate(row, 'offer')).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="沟通结果" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.roundsMap?.['offer']?.currentStatus)">
              {{ getStatusText(row.roundsMap?.['offer']?.currentStatus, 'offer') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <template v-if="row.candidateCurrentStage !== 'pending_onboarding' && row.candidateCurrentStage !== 'entry' && row.candidateCurrentStage !== 'leave'">
              <el-button v-if="row.currentStatus !== 'passed'" type="primary" link size="small" @click="handleEdit(row)">
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

        <template v-if="canViewBusinessLine()">
          <el-divider content-position="left">业务线</el-divider>
          <el-form :model="interviewForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="业务线">
                  <el-select 
                    v-model="selectedBusinessLine" 
                    placeholder="请选择业务线" 
                    style="width: 100%"
                    :disabled="!canEditBusinessLine()"
                    @change="handleBusinessLineChange"
                  >
                    <el-option
                      v-for="bl in filteredBusinessLines"
                      :key="bl.id"
                      :label="bl.name"
                      :value="bl"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('recommend_interview')">
          <el-divider content-position="left">推荐面试</el-divider>
          <el-form :model="interviewForm.rounds['recommend_interview']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="推荐日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择推荐日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['recommend_interview'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('recommend_interview')"
                    :picker-options="{ disabledDate: (time) => time.getTime() < Date.now() - 8.64e7 }"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['recommend_interview'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('recommend_interview')"
                  >
                    <el-option label="待筛选" value="pending_filter" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="反馈日期" prop="feedbackDate" :rules="[{ required: true, message: '请选择反馈日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['recommend_interview'].feedbackDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('recommend_interview')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('qualification_interview')">
          <el-divider content-position="left">资格面试</el-divider>
          <el-form :model="interviewForm.rounds['qualification_interview']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="资面日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择资面日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['qualification_interview'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('qualification_interview')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['qualification_interview'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('qualification_interview')"
                  >
                    <el-option label="待面试" value="pending" />
                    <el-option label="放弃" value="abandoned" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="资面备注">
                  <el-input 
                    v-model="interviewForm.rounds['qualification_interview'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入资面备注"
                    :disabled="!canEditCurrentStage('qualification_interview')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('tech_interview_1')">
          <el-divider content-position="left">技术面试(一)</el-divider>
          <el-form :model="interviewForm.rounds['tech_interview_1']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="技面日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择技面日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['tech_interview_1'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('tech_interview_1')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['tech_interview_1'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('tech_interview_1')"
                  >
                    <el-option label="待面试" value="pending" />
                    <el-option label="放弃" value="abandoned" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="评价备注">
                  <el-input 
                    v-model="interviewForm.rounds['tech_interview_1'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入评价备注"
                    :disabled="!canEditCurrentStage('tech_interview_1')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('tech_interview_2')">
          <el-divider content-position="left">技术面试(二)</el-divider>
          <el-form :model="interviewForm.rounds['tech_interview_2']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="技面日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择技面日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['tech_interview_2'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('tech_interview_2')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['tech_interview_2'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('tech_interview_2')"
                  >
                    <el-option label="待面试" value="pending" />
                    <el-option label="放弃" value="abandoned" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="评价备注">
                  <el-input 
                    v-model="interviewForm.rounds['tech_interview_2'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入评价备注"
                    :disabled="!canEditCurrentStage('tech_interview_2')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('manager_interview')">
          <el-divider content-position="left">主管面试</el-divider>
          <el-form :model="interviewForm.rounds['manager_interview']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="综面日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择综面日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['manager_interview'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('manager_interview')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['manager_interview'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('manager_interview')"
                  >
                    <el-option label="待面试" value="pending" />
                    <el-option label="放弃" value="abandoned" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="评价备注">
                  <el-input 
                    v-model="interviewForm.rounds['manager_interview'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入评价备注"
                    :disabled="!canEditCurrentStage('manager_interview')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>

        <template v-if="shouldShowStage('approval')">
          <el-divider content-position="left">租用审批</el-divider>
          <el-form :model="interviewForm.rounds['approval']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="审批日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择审批日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['approval'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('approval')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前状态" prop="currentStatus" :rules="[{ required: true, message: '请选择当前状态', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['approval'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('approval')"
                  >
                    <el-option label="待审批" value="pending" />
                    <el-option label="放弃" value="abandoned" />
                    <el-option label="通过" value="passed" />
                    <el-option label="未通过" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="审批备注">
                  <el-input 
                    v-model="interviewForm.rounds['approval'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入审批备注"
                    :disabled="!canEditCurrentStage('approval')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
        
        <template v-if="shouldShowStage('offer')">
          <el-divider content-position="left">Offer</el-divider>
          <el-form :model="interviewForm.rounds['offer']" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="沟通日期" prop="scheduledDate" :rules="[{ required: true, message: '请选择沟通日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['offer'].scheduledDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('offer')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="沟通结果" prop="currentStatus" :rules="[{ required: true, message: '请选择沟通结果', trigger: 'change' }]">
                  <el-select 
                    v-model="interviewForm.rounds['offer'].currentStatus" 
                    placeholder="请选择状态"
                    style="width: 100%"
                    :disabled="!canEditCurrentStage('offer')"
                  >
                    <el-option label="接受" value="passed" />
                    <el-option label="不接受" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20" v-if="interviewForm.rounds['offer'].currentStatus === 'passed'">
              <el-col :span="12">
                <el-form-item label="入职日期" prop="entryDate" :rules="[{ required: true, message: '请选择入职日期', trigger: 'blur' }]">
                  <el-date-picker 
                    v-model="interviewForm.rounds['offer'].entryDate" 
                    type="date" 
                    style="width: 100%" 
                    :disabled="!canEditCurrentStage('offer')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="Offer备注">
                  <el-input 
                    v-model="interviewForm.rounds['offer'].content" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入Offer备注"
                    :disabled="!canEditCurrentStage('offer')" 
                  />
                </el-form-item>
              </el-col>
            </el-row>
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
import { candidateApi, businessLineApi, stageConfigApi, interviewApi } from '../api'
import { ElMessage } from 'element-plus'

const currentUser = ref(null)
try {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
} catch (e) {
  currentUser.value = null
}

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
const selectedBusinessLine = ref(null)
const selectedInterview = ref(null)
const businessLines = ref([])
const isEditMode = ref(false)

const searchForm = reactive({
  name: '',
  currentStage: '',
  passStatus: ''
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
    currentStatus: 'pending',
    rounds: {}
  }
  
  INTERVIEW_STAGES.forEach((stage, index) => {
    form.rounds[stage] = {
      stageCode: stage,
      stageIndex: index,
      scheduledDate: null,
      content: '',
      currentStatus: null,
      feedbackDate: null,
      completedAt: null,
      entryDate: stage === 'offer' ? null : undefined
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
      page: pagination.page,
      pageSize: pagination.pageSize,
      currentStage: searchForm.currentStage || undefined,
      name: searchForm.name || undefined,
      stages: availableStages.value,
      passStatus: searchForm.passStatus || undefined
    }
    const data = await interviewApi.getAll(params)
    
    const flattenedEmployees = []
    if (data.interviews && data.interviews.length > 0) {
      data.interviews.forEach(interview => {
        const candidate = interview.Candidate
        const businessLine = interview.BusinessLine
        const recommendDate = interview.roundsMap?.['recommend_interview']?.scheduledDate || null;
        
        if (candidate) {
          flattenedEmployees.push({
            ...candidate,
            ...interview,
            businessLine: businessLine,
            businessLineName: businessLine?.name || '-',
            currentStage: interview.currentStage,
            candidateCurrentStage: candidate.currentStage,
            recommendDate: recommendDate,
            rounds: interview.rounds || [],
            roundsMap: interview.roundsMap || {}
          })
        }
      })
    }
    
    employees.value = flattenedEmployees
    pagination.total = data.pagination?.total || flattenedEmployees.length
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchBusinessLines = async () => {
  try {
    const data = await businessLineApi.getAll()
    businessLines.value = data.businessLines || []
  } catch (error) {
  }
}

const getRoundDate = (row, stageCode) => {
  if (row.roundsMap && row.roundsMap[stageCode]) {
    return row.roundsMap[stageCode].scheduledDate
  }
  return null
}

const getRoundStatus = (row, stageCode) => {
  if (row.roundsMap && row.roundsMap[stageCode]) {
    return row.roundsMap[stageCode].currentStatus
  }
  return null
}

const getRoundFeedbackDate = (row, stageCode) => {
  if (row.roundsMap && row.roundsMap[stageCode]) {
    return row.roundsMap[stageCode].feedbackDate
  }
  return null
}

const getStatusType = (status) => {
  if (!status) return 'info'
  const typeMap = {
    'pending': 'warning',
    'pending_filter': 'warning',
    'passed': 'success',
    'failed': 'danger',
    'abandoned': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status, stageCode = null) => {
  if (!status) return '-'
  const textMap = {
    'pending': '待面试',
    'pending_filter': '待筛选',
    'passed': '通过',
    'failed': '未通过',
    'abandoned': '放弃'
  }
  
  // Offer阶段的特殊显示
  if (stageCode === 'offer') {
    if (status === 'passed') return '接受'
    if (status === 'failed') return '不接受'
  }
  
  return textMap[status] || status
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
    selectedBusinessLine.value = row.businessLine || null
    selectedInterview.value = row
    
    Object.assign(interviewForm, initInterviewForm())
    
    Object.assign(interviewForm, {
      currentStage: row.currentStage,
      currentStatus: row.currentStatus
    })

    if (row.roundsMap?.['recommend_interview']?.scheduledDate) {
      interviewForm.rounds['recommend_interview'].scheduledDate = row.roundsMap['recommend_interview'].scheduledDate
    }

    if (row.rounds && row.rounds.length > 0) {
      row.rounds.forEach(round => {
        if (interviewForm.rounds[round.stageCode]) {
          Object.assign(interviewForm.rounds[round.stageCode], {
            scheduledDate: round.scheduledDate,
            content: round.content,
            currentStatus: round.currentStatus,
            feedbackDate: round.feedbackDate,
            completedAt: round.completedAt,
            entryDate: round.entryDate
          })
        }
      })
    }
    
    if (selectedEmployee.value) {
      dialogVisible.value = true
    } else {
      ElMessage.error('获取员工信息失败')
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

  const currentIndex = stageOrder.indexOf(currentStage)
  const targetIndex = stageOrder.indexOf(stage)

  return targetIndex === currentIndex
}

const canViewBusinessLine = () => {
  if (!currentUser.value) {
    return false
  }

  if (currentUser.value.role === 'manager') {
    return true
  }

  const currentUserId = currentUser.value.id

  if (selectedBusinessLine.value && selectedBusinessLine.value.canEdit) {
    const canEditUsers = selectedBusinessLine.value.canEdit
    if (Array.isArray(canEditUsers) && canEditUsers.includes(currentUserId)) {
      return true
    }
  }

  return filteredBusinessLines.value.length > 0 || (selectedBusinessLine.value && selectedBusinessLine.value.id)
}

const canEditBusinessLine = () => {
  if (!isEditMode.value) {
    return false
  }

  if (!currentUser.value) {
    return false
  }

  const currentUserId = currentUser.value.id

  if (currentUser.value.role === 'manager') {
    return true
  }

  if (selectedBusinessLine.value && selectedBusinessLine.value.canEdit) {
    const canEditUsers = selectedBusinessLine.value.canEdit
    if (Array.isArray(canEditUsers) && canEditUsers.includes(currentUserId)) {
      return true
    }
  }

  return filteredBusinessLines.value.length > 0
}

const filteredBusinessLines = computed(() => {
  if (!currentUser.value) {
    return businessLines.value
  }

  if (currentUser.value.role === 'manager') {
    return businessLines.value
  }

  const currentUserId = currentUser.value.id
  return businessLines.value.filter(bl => {
    if (!bl.canEdit || !Array.isArray(bl.canEdit)) {
      return false
    }
    return bl.canEdit.includes(currentUserId)
  })
})

const canAdvance = (row) => {
  const currentStage = row.currentStage
  
  // 如果面试状态为失败，不能推进
  if (row.currentStatus === 'failed') {
    return false
  }
  
  // pending_onboarding/entry/leave 不能在操作列推进
  if (['pending_onboarding', 'entry', 'leave'].includes(currentStage)) {
    return false
  }
  
  const currentRoundStatus = getRoundStatus(row, currentStage)
  
  // 所有阶段都需要：必填项有值 AND currentStatus === 'passed'
  switch (currentStage) {
    case 'recommend_interview':
      // 推荐面试：必须有日期、状态为passed（不再接受pending_filter）
      return getRoundDate(row, currentStage) && currentRoundStatus === 'passed' && getRoundFeedbackDate(row, currentStage)
    case 'qualification_interview':
    case 'tech_interview_1':
    case 'tech_interview_2':
    case 'manager_interview':
    case 'approval':
    case 'offer':
      // 这些阶段：必须有日期 AND currentStatus === 'passed'
      return getRoundDate(row, currentStage) && currentRoundStatus === 'passed'
    default:
      return false
  }
}

const canAdvanceInDialog = () => {
  if (!selectedInterview.value) {
    return false
  }
  
  // 如果面试状态为失败，不能推进
  if (selectedInterview.value.currentStatus === 'failed') {
    return false
  }
  
  const currentStage = selectedInterview.value.currentStage
  
  // pending_onboarding/entry/leave/offer 不能在弹框中推进
  if (['pending_onboarding', 'entry', 'leave', 'offer'].includes(currentStage)) {
    return false
  }
  
  const formRound = interviewForm.rounds[currentStage]
  const formRoundStatus = formRound?.currentStatus
  
  // 所有阶段都需要：必填项有值 AND currentStatus === 'passed'
  switch (currentStage) {
    case 'recommend_interview':
      // 推荐面试：必须有日期、反馈日期、状态为passed
      return formRound?.scheduledDate && formRoundStatus === 'passed' && formRound?.feedbackDate
    case 'qualification_interview':
    case 'tech_interview_1':
    case 'tech_interview_2':
    case 'manager_interview':
    case 'approval':
    case 'offer':
      // 这些阶段：必须有日期 AND currentStatus === 'passed'
      return formRound?.scheduledDate && formRoundStatus === 'passed'
    default:
      return false
  }
}

const handleAdvance = async (row) => {
  try {
    const currentStage = row.currentStage
    const currentStageData = row.roundsMap?.[currentStage] || {}
    
    await interviewApi.advance(row.id, {
      currentStageData: {
        scheduledDate: currentStageData.scheduledDate,
        content: currentStageData.content,
        currentStatus: currentStageData.currentStatus,
        feedbackDate: currentStageData.feedbackDate
      }
    })
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
      businessLineId: row.businessLine.id,
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
  if (!selectedEmployee.value || !selectedInterview.value) {
    ElMessage.error('请选择员工')
    return
  }

  const currentStage = selectedInterview.value.currentStage
  if (!validateForm(currentStage)) {
    return
  }

  submitLoading.value = true
  try {
    const roundsArray = Object.values(interviewForm.rounds)
      .filter(round => round && (round.scheduledDate || round.currentStatus || round.content || round.feedbackDate || round.entryDate))

    const updateData = {
      candidateId: selectedEmployee.value.id,
      businessLineId: selectedBusinessLine.value?.id,
      currentStage: interviewForm.currentStage,
      currentStatus: interviewForm.currentStatus,
      rounds: roundsArray
    }

    const interviewId = selectedInterview.value?.id
    if (interviewId) {
      await interviewApi.update(interviewId, updateData)
    } else {
      await interviewApi.create(updateData)
    }
    
    if (dialogVisible.value) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
    }
    await fetchEmployees()
  } catch (error) {
    if (dialogVisible.value) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleSaveAndAdvance = async () => {
  if (!selectedEmployee.value || !selectedInterview.value) {
    ElMessage.error('请选择员工')
    return
  }

  const currentStage = selectedInterview.value.currentStage
  if (!validateForm(currentStage)) {
    return
  }

  submitLoading.value = true
  try {
    const roundsArray = Object.values(interviewForm.rounds)
      .filter(round => round && (round.scheduledDate || round.currentStatus || round.content || round.feedbackDate || round.entryDate))

    const updateData = {
      candidateId: selectedEmployee.value.id,
      businessLineId: selectedBusinessLine.value?.id,
      currentStage: interviewForm.currentStage,
      currentStatus: interviewForm.currentStatus,
      rounds: roundsArray
    }

    const interviewId = selectedInterview.value?.id
    if (interviewId) {
      await interviewApi.update(interviewId, updateData)
    } else {
      await interviewApi.create(updateData)
    }

    // 保存成功后，重新判断是否可推进（因为表单数据已更新）
    if (!canAdvanceInDialog()) {
      if (dialogVisible.value) {
        ElMessage.info('当前阶段未完成，仅保存数据')
      }
      return
    }

    // 可以推进，执行推进操作
    const currentStageData = interviewForm.rounds[currentStage] || {}
    
    await interviewApi.advance(interviewId, {
      currentStageData: {
        scheduledDate: currentStageData.scheduledDate,
        content: currentStageData.content,
        currentStatus: currentStageData.currentStatus,
        feedbackDate: currentStageData.feedbackDate
      }
    })
    
    if (dialogVisible.value) {
      ElMessage.success('保存并推进成功')
      dialogVisible.value = false
    }
    await fetchEmployees()
  } catch (error) {
    if (dialogVisible.value) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const validateForm = (currentStage) => {
  const stageIndex = stageOrder.indexOf(currentStage)
  const isFailed = selectedInterview.value?.currentStatus === 'failed'
  
  if (isFailed) {
    return validateCurrentStageOnly(currentStage)
  }
  
  if (stageIndex >= stageOrder.indexOf('recommend_interview')) {
    if (!interviewForm.rounds['recommend_interview']?.scheduledDate) {
      ElMessage.error('请填写推荐日期')
      return false
    }
    if (!interviewForm.rounds['recommend_interview']?.currentStatus) {
      ElMessage.error('请选择推荐面试当前状态')
      return false
    }
    if (!interviewForm.rounds['recommend_interview']?.feedbackDate) {
      ElMessage.error('请填写反馈日期')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('qualification_interview')) {
    if (!interviewForm.rounds['qualification_interview']?.scheduledDate) {
      ElMessage.error('请填写资面日期')
      return false
    }
    if (!interviewForm.rounds['qualification_interview']?.currentStatus) {
      ElMessage.error('请选择资面当前状态')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_1')) {
    if (!interviewForm.rounds['tech_interview_1']?.scheduledDate) {
      ElMessage.error('请填写技一日期')
      return false
    }
    if (!interviewForm.rounds['tech_interview_1']?.currentStatus) {
      ElMessage.error('请选择技一当前状态')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('tech_interview_2')) {
    if (!interviewForm.rounds['tech_interview_2']?.scheduledDate) {
      ElMessage.error('请填写技二日期')
      return false
    }
    if (!interviewForm.rounds['tech_interview_2']?.currentStatus) {
      ElMessage.error('请选择技二当前状态')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('manager_interview')) {
    if (!interviewForm.rounds['manager_interview']?.scheduledDate) {
      ElMessage.error('请填写主面日期')
      return false
    }
    if (!interviewForm.rounds['manager_interview']?.currentStatus) {
      ElMessage.error('请选择主面当前状态')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('approval')) {
    if (!interviewForm.rounds['approval']?.scheduledDate) {
      ElMessage.error('请填写审批日期')
      return false
    }
    if (!interviewForm.rounds['approval']?.currentStatus) {
      ElMessage.error('请选择审批当前状态')
      return false
    }
  }
  
  if (stageIndex >= stageOrder.indexOf('offer')) {
    if (!interviewForm.rounds['offer']?.scheduledDate) {
      ElMessage.error('请填写审批日期')
      return false
    }
    if (!interviewForm.rounds['offer']?.currentStatus) {
      ElMessage.error('请选择审批当前状态')
      return false
    }
    if (interviewForm.rounds['offer']?.currentStatus === 'passed' && !interviewForm.rounds['offer']?.entryDate) {
      ElMessage.error('请选择入职日期')
      return false
    }
  }
  
  return true
}

const validateCurrentStageOnly = (currentStage) => {
  switch (currentStage) {
    case 'recommend_interview':
      if (!interviewForm.rounds['recommend_interview']?.scheduledDate) {
        ElMessage.error('请填写推荐日期')
        return false
      }
      if (!interviewForm.rounds['recommend_interview']?.currentStatus) {
        ElMessage.error('请选择推荐面试当前状态')
        return false
      }
      if (!interviewForm.rounds['recommend_interview']?.feedbackDate) {
        ElMessage.error('请填写反馈日期')
        return false
      }
      break
    case 'qualification_interview':
      if (!interviewForm.rounds['qualification_interview']?.scheduledDate) {
        ElMessage.error('请填写资面日期')
        return false
      }
      if (!interviewForm.rounds['qualification_interview']?.currentStatus) {
        ElMessage.error('请选择资面当前状态')
        return false
      }
      break
    case 'tech_interview_1':
      if (!interviewForm.rounds['tech_interview_1']?.scheduledDate) {
        ElMessage.error('请填写技一日期')
        return false
      }
      if (!interviewForm.rounds['tech_interview_1']?.currentStatus) {
        ElMessage.error('请选择技一当前状态')
        return false
      }
      break
    case 'tech_interview_2':
      if (!interviewForm.rounds['tech_interview_2']?.scheduledDate) {
        ElMessage.error('请填写技二日期')
        return false
      }
      if (!interviewForm.rounds['tech_interview_2']?.currentStatus) {
        ElMessage.error('请选择技二当前状态')
        return false
      }
      break
    case 'manager_interview':
      if (!interviewForm.rounds['manager_interview']?.scheduledDate) {
        ElMessage.error('请填写主面日期')
        return false
      }
      if (!interviewForm.rounds['manager_interview']?.currentStatus) {
        ElMessage.error('请选择主面当前状态')
        return false
      }
      break
    case 'approval':
      if (!interviewForm.rounds['approval']?.scheduledDate) {
        ElMessage.error('请填写审批日期')
        return false
      }
      if (!interviewForm.rounds['approval']?.currentStatus) {
        ElMessage.error('请选择审批当前状态')
        return false
      }
      break
    case 'offer':
      if (!interviewForm.rounds['offer']?.scheduledDate) {
        ElMessage.error('请填写审批日期')
        return false
      }
      if (!interviewForm.rounds['offer']?.currentStatus) {
        ElMessage.error('请选择审批当前状态')
        return false
      }
      if (interviewForm.rounds['offer']?.currentStatus === 'passed' && !interviewForm.rounds['offer']?.entryDate) {
        ElMessage.error('请选择入职日期')
        return false
      }
      break
  }
  return true
}

const handleBusinessLineChange = (businessLine) => {
  selectedBusinessLine.value = businessLine
}

const handleDialogClose = () => {
  selectedEmployee.value = null
  selectedBusinessLine.value = null
  selectedInterview.value = null
  isEditMode.value = false
  Object.assign(interviewForm, initInterviewForm())
}

onMounted(async () => {
  await fetchStageConfig()
  fetchEmployees()
  fetchBusinessLines()
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
