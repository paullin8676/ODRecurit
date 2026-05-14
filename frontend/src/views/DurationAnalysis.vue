<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">停留分析</h2>
      <div class="header-actions">
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
        <el-button type="primary" @click="handleFetch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="card-container">
          <h3 class="card-title">
            阶段停留时间分析
            <el-tag type="warning" style="margin-left: 10px" v-if="aggregations.length > 0">
              卡点预警: {{ bottleneckStage }}
            </el-tag>
          </h3>
          <div ref="durationChartRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="card-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3 class="card-title" style="margin: 0">候选人-总停留时长统计（候选录入→今天）</h3>
            <el-input
              v-model="candidateNameFilter"
              placeholder="输入候选人姓名搜索"
              clearable
              style="width: 200px"
            />
          </div>
          <el-table :data="filteredTotalDurationRecords" style="width: 100%" stripe max-height="250">
            <el-table-column prop="candidateName" label="候选人" width="140">
              <template #default="{ row }">
                <router-link :to="'/duration-records?name=' + encodeURIComponent(row.candidateName)" style="text-decoration: none; color: #409eff">
                  {{ row.candidateName }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column prop="currentStageName" label="当前阶段" />
            <el-table-column label="总耗时（天）" width="160">
              <template #default="{ row }">
                <el-tag type="danger" v-if="row.totalDays >= 30">{{ row.totalDays }} 天</el-tag>
                <el-tag type="warning" v-else-if="row.totalDays >= 14">{{ row.totalDays }} 天</el-tag>
                <el-tag v-else>{{ row.totalDays }} 天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { statisticsApi } from '../api'
import * as echarts from 'echarts'
import { Search } from '@element-plus/icons-vue'

const dateRange = ref([])
const filterStage = ref('')
const candidateNameFilter = ref('')
const totalDurationRecords = ref([])
const aggregations = ref([])
const recordsLoading = ref(false)

const filteredTotalDurationRecords = computed(() => {
  const keyword = candidateNameFilter.value?.trim().toLowerCase()
  if (!keyword) return totalDurationRecords.value
  return totalDurationRecords.value.filter(r => String(r.candidateName || '').toLowerCase().includes(keyword))
})

const durationChartRef = ref()
let durationChart = null

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

const bottleneckStage = ref('-')

const formatDate = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toISOString().slice(0, 10) + ' ' + dt.toTimeString().slice(0, 8)
}

const handleFetch = () => {
  fetchDurationAgg()
  fetchTotalDurations()
}

const stageOrder = [
  'candidate_entry', 'exam_declare', 'exam_complete',
  'test_declare', 'test_complete', 'recommend_interview',
  'qualification_interview', 'tech_interview_1', 'tech_interview_2',
  'manager_interview', 'approval', 'offer',
  'pending_onboarding', 'entry', 'leave'
]

const initDurationChart = () => {
  if (!durationChartRef.value) return
  if (durationChart) durationChart.dispose()

  durationChart = echarts.init(durationChartRef.value)
  const sortedAggregations = [...aggregations.value].sort((a, b) => {
    const idxA = stageOrder.indexOf(a.stage)
    const idxB = stageOrder.indexOf(b.stage)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })

  const names = sortedAggregations.map(item => item.stageName)
  const avgVals = sortedAggregations.map(item => item.avgDays)
  const bottleneckIndices = sortedAggregations.reduce((acc, item, idx) => {
    if (item.isBottleneck) acc.push(idx)
    return acc
  }, [])

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c} 天'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 25, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '平均停留天数'
    },
    series: [
      {
        type: 'bar',
        data: avgVals.map((val, idx) => ({
          value: val,
          itemStyle: {
            color: bottleneckIndices.includes(idx) ? '#f56c6c' : '#409eff'
          }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}天'
        }
      }
    ]
  }

  durationChart.setOption(option)
}

const fetchDurationAgg = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString().slice(0, 10)
      params.endDate = dateRange.value[1].toISOString().slice(0, 10)
    }
    if (filterStage.value) {
      params.stage = filterStage.value
    }

    const rsp = await statisticsApi.getStageDurationAgg(params)
    aggregations.value = rsp.aggregations || []
    if (aggregations.value.length > 0) {
      const btns = aggregations.value.filter(x => x.isBottleneck).map(x => x.stageName)
      bottleneckStage.value = btns.join(', ') || '无'
    } else {
      bottleneckStage.value = '-'
    }
    setTimeout(() => initDurationChart(), 50)
  } catch (e) {
  }
}

const fetchTotalDurations = async () => {
  try {
    const rsp = await statisticsApi.getCandidateTotalDurations()
    totalDurationRecords.value = rsp.records || []
  } catch (e) {
  }
}

const handleResize = () => {
  durationChart?.resize()
}

onMounted(() => {
  handleFetch()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  durationChart?.dispose()
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
