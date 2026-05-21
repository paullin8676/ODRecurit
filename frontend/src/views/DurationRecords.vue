<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">停留明细</h2>
      <div class="header-actions">
        <el-input
          v-model="candidateNameFilter"
          placeholder="姓名：空格/逗号分隔多个"
          clearable
          style="width: 220px"
        />
        <div class="filter-item">
          <el-icon class="filter-icon"><Timer /></el-icon>
          <el-date-picker
            v-model="enterDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="进入始"
            end-placeholder="进入止"
            size="small"
            style="width: 205px"
            @change="debouncedFetch"
          />
        </div>
        <div class="filter-item">
          <el-icon class="filter-icon"><SwitchButton /></el-icon>
          <el-date-picker
            v-model="leaveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="离开始"
            end-placeholder="离开止"
            size="small"
            style="width: 205px"
            @change="debouncedFetch"
          />
        </div>
        <el-select v-model="filterStages" multiple placeholder="选择阶段（可多选）" clearable style="width: 220px">
          <el-option v-for="(name, code) in stageNames" :key="code" :label="name" :value="code" />
        </el-select>
      </div>
    </div>

    <div class="card-container">
      <el-table :data="durationRecords" style="width: 100%" stripe v-loading="recordsLoading" @sort-change="handleSortChange">
        <el-table-column prop="candidateName" label="候选人姓名" width="120" sortable />
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
        <el-table-column label="停留时长" width="260" sortable prop="durationHours">
          <template #default="{ row }">
            <span v-if="row.durationDays !== null">
              <el-tag>{{ toFixed2(row.durationDays) }} 天</el-tag>
              <span style="margin-left: 8px; color: #909399">({{ toFixed2(row.durationHours) }} 小时)</span>
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
import { Timer, SwitchButton } from '@element-plus/icons-vue'
import { statisticsApi } from '../api'

const route = useRoute()
const router = useRouter()

const enterDateRange = ref([])
const leaveDateRange = ref([])
const filterStages = ref([])
const candidateNameFilter = ref('')
const durationRecords = ref([])
const recordsLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sortField = ref('')
const sortOrder = ref('')
let debounceTimer = null

const handleSortChange = ({ prop, order }) => {
  sortField.value = prop || ''
  sortOrder.value = order || ''
  fetchDurationRecords()
}

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

const pad = (n) => n.toString().padStart(2, '0')

const toFixed2 = (val) => {
  const v = parseFloat(val)
  return isNaN(v) ? 0 : (Math.round(v * 100) / 100).toFixed(2)
}

const shortDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}`
}

const toLocalDateString = (d) => {
  if (!d) return d
  const dt = new Date(d)
  const Y = dt.getFullYear()
  const M = pad(dt.getMonth() + 1)
  const D = pad(dt.getDate())
  return `${Y}-${M}-${D}`
}

const formatDate = (d) => {
  if (!d) return '-'
  let dt
  if (d instanceof Date) {
    dt = d
  } else {
    let str = String(d)
    if (!str.includes('+') && !str.endsWith('Z') && !str.includes('T')) {
      str += ' +00:00'
    }
    dt = new Date(str)
  }
  const Y = dt.getFullYear()
  const M = pad(dt.getMonth() + 1)
  const D = pad(dt.getDate())
  const H = pad(dt.getHours())
  const m = pad(dt.getMinutes())
  const s = pad(dt.getSeconds())
  return `${Y}-${M}-${D} ${H}:${m}:${s}`
}

const fetchDurationRecords = async () => {
  recordsLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (enterDateRange.value && enterDateRange.value.length === 2) {
      params.startDate = toLocalDateString(enterDateRange.value[0])
      params.endDate = toLocalDateString(enterDateRange.value[1])
    }
    if (leaveDateRange.value && leaveDateRange.value.length === 2) {
      params.leaveStartDate = toLocalDateString(leaveDateRange.value[0])
      params.leaveEndDate = toLocalDateString(leaveDateRange.value[1])
    }
    let stagesToFilter = filterStages.value?.length ? filterStages.value : []
    if (!stagesToFilter.length && route.query?.stage) {
      stagesToFilter = [route.query.stage]
    }
    if (stagesToFilter.length) {
      params.stages = stagesToFilter.join(',')
    }
    if (candidateNameFilter.value?.trim()) {
      params.name = candidateNameFilter.value.trim()
    }
    if (sortField.value && sortOrder.value) {
      params.sortField = sortField.value
      params.sortOrder = sortOrder.value
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

watch([candidateNameFilter, enterDateRange, leaveDateRange, filterStages], () => {
  debouncedFetch()
}, { deep: true })

onMounted(() => {
  if (route.query.name) {
    candidateNameFilter.value = route.query.name
  }
  if (route.query.stage) {
    filterStages.value = [route.query.stage]
  }
  fetchDurationRecords()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-icon {
  color: #909399;
  margin-bottom: 2px;
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
