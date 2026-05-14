<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">停留明细</h2>
      <div class="header-actions">
        <el-input
          v-model="candidateNameFilter"
          placeholder="输入候选人姓名搜索"
          clearable
          style="width: 200px"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
        <el-select v-model="filterStage" placeholder="选择阶段" clearable style="width: 150px">
          <el-option label="全部阶段" value="" />
          <el-option v-for="(name, code) in stageNames" :key="code" :label="name" :value="code" />
        </el-select>
      </div>
    </div>

    <div class="card-container">
      <el-table :data="durationRecords" style="width: 100%" stripe v-loading="recordsLoading">
        <el-table-column prop="candidateName" label="候选人姓名" width="120" />
        <el-table-column prop="consultantName" label="负责顾问" width="120">
          <template #default="{ row }">
            <span style="color: #606266">{{ row.consultantName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stageName" label="阶段名称" width="130" />
        <el-table-column prop="enteredAt" label="进入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.enteredAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="leftAt" label="离开时间" width="180">
          <template #default="{ row }">
            {{ row.leftAt ? formatDate(row.leftAt) : '仍在此阶段' }}
          </template>
        </el-table-column>
        <el-table-column label="停留时长" width="260">
          <template #default="{ row }">
            <span v-if="row.durationDays !== null">
              <el-tag>{{ row.durationDays }} 天</el-tag>
              <span style="margin-left: 8px; color: #909399">({{ row.durationHours }} 小时)</span>
            </span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchDurationRecords"
        @current-change="fetchDurationRecords"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { statisticsApi } from '../api'

const route = useRoute()
const router = useRouter()

const dateRange = ref([])
const filterStage = ref('')
const candidateNameFilter = ref('')
const durationRecords = ref([])
const recordsLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
let debounceTimer = null

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

const formatDate = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toISOString().slice(0, 10) + ' ' + dt.toTimeString().slice(0, 8)
}

const fetchDurationRecords = async () => {
  recordsLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString().slice(0, 10)
      params.endDate = dateRange.value[1].toISOString().slice(0, 10)
    }
    if (filterStage.value) {
      params.stage = filterStage.value
    }
    if (candidateNameFilter.value?.trim()) {
      params.name = candidateNameFilter.value.trim()
    }
    const rsp = await statisticsApi.getStageDurationRecords(params)
    durationRecords.value = rsp.records || []
    total.value = rsp.pagination?.total || 0
  } catch (e) {
  } finally {
    recordsLoading.value = false
  }
}

const debouncedFetch = () => {
  currentPage.value = 1
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const query = { ...route.query }
    delete query.name
    if (candidateNameFilter.value?.trim()) {
      query.name = candidateNameFilter.value.trim()
    }
    router.replace({ query })
    fetchDurationRecords()
  }, 300)
}

watch([candidateNameFilter, dateRange, filterStage], () => {
  debouncedFetch()
})

onMounted(() => {
  if (route.query.name) {
    candidateNameFilter.value = route.query.name
  }
  fetchDurationRecords()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

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
</style>
