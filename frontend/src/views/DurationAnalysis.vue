<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">停留分析</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="card-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px">
            <div style="display: flex; align-items: center; gap: 10px">
              <h3 class="card-title" style="margin: 0">某时间段内各阶段完成平均天数统计</h3>
              <el-tag type="warning" v-if="aggregations.length > 0">
                卡点预警: {{ bottleneckStage }}
              </el-tag>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <el-button-group>
                <el-button size="small" :type="quickRangeType === 7 ? 'primary' : 'default'" @click="setQuickRange(7)">最近一周</el-button>
                <el-button size="small" :type="quickRangeType === 14 ? 'primary' : 'default'" @click="setQuickRange(14)">最近两周</el-button>
                <el-button size="small" :type="quickRangeType === 30 ? 'primary' : 'default'" @click="setQuickRange(30)">最近一月</el-button>
              </el-button-group>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
              />
            </div>
          </div>
          <div ref="durationChartRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="card-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px">
            <h3 class="card-title" style="margin: 0">每天各完成阶段所需平均天数变化趋势</h3>
            <el-button-group>
              <el-button size="small" :type="stageTrendDays === 7 ? 'primary' : 'default'" @click="fetchStageTrend(7)">最近一周</el-button>
              <el-button size="small" :type="stageTrendDays === 14 ? 'primary' : 'default'" @click="fetchStageTrend(14)">最近两周</el-button>
              <el-button size="small" :type="stageTrendDays === 21 ? 'primary' : 'default'" @click="fetchStageTrend(21)">最近三周</el-button>
              <el-button size="small" :type="stageTrendDays === 30 ? 'primary' : 'default'" @click="fetchStageTrend(30)">最近一月</el-button>
            </el-button-group>
          </div>
          <div ref="stageTrendChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="card-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px">
            <h3 class="card-title" style="margin: 0">每天汇总每个候选人从候选录入到当前阶段，流转到各阶段总耗天数变化趋势</h3>
            <el-button-group>
              <el-button size="small" :type="flowTrendDays === 7 ? 'primary' : 'default'" @click="fetchFlowTrend(7)">最近一周</el-button>
              <el-button size="small" :type="flowTrendDays === 14 ? 'primary' : 'default'" @click="fetchFlowTrend(14)">最近两周</el-button>
              <el-button size="small" :type="flowTrendDays === 21 ? 'primary' : 'default'" @click="fetchFlowTrend(21)">最近三周</el-button>
              <el-button size="small" :type="flowTrendDays === 30 ? 'primary' : 'default'" @click="fetchFlowTrend(30)">最近一月</el-button>
            </el-button-group>
          </div>
          <div ref="flowTrendChartRef" style="height: 300px"></div>
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
              placeholder="姓名：空格/逗号分隔多个"
              clearable
              style="width: 220px"
              size="small"
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
                <el-tag type="danger" v-if="row.totalDays >= 30">{{ toFixed2(row.totalDays) }} 天</el-tag>
                <el-tag type="warning" v-else-if="row.totalDays >= 14">{{ toFixed2(row.totalDays) }} 天</el-tag>
                <el-tag v-else>{{ toFixed2(row.totalDays) }} 天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { statisticsApi } from '../api'
import * as echarts from 'echarts'

const dateRange = ref([])
const quickRangeType = ref(null)
const candidateNameFilter = ref('')
const totalDurationRecords = ref([])
const aggregations = ref([])
const chartData = ref([])

const stageTrendDays = ref(7)
const stageTrendDates = ref([])
const stageTrendSeries = ref([])

const flowTrendDays = ref(7)
const flowTrendDates = ref([])
const flowTrendSeries = ref([])

const filteredTotalDurationRecords = computed(() => {
  const keyword = candidateNameFilter.value?.trim().toLowerCase()
  if (!keyword) return totalDurationRecords.value
  return totalDurationRecords.value.filter(r => String(r.candidateName || '').toLowerCase().includes(keyword))
})

const durationChartRef = ref()
const stageTrendChartRef = ref()
const flowTrendChartRef = ref()

let durationChart = null
let stageTrendChart = null
let flowTrendChart = null

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

const toFixed2 = (val) => {
  const v = parseFloat(val)
  return isNaN(v) ? 0 : (Math.round(v * 100) / 100).toFixed(2)
}

const stageOrder = [
  'candidate_entry', 'exam_declare', 'exam_complete',
  'test_declare', 'test_complete', 'recommend_interview',
  'qualification_interview', 'tech_interview_1', 'tech_interview_2',
  'manager_interview', 'approval', 'offer',
  'pending_onboarding', 'entry', 'leave'
]

const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00d4ff', '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40']

const pad = (n) => n.toString().padStart(2, '0')

const toLocalDateString = (d) => {
  if (!d) return d
  const dt = new Date(d)
  const Y = dt.getFullYear()
  const M = pad(dt.getMonth() + 1)
  const D = pad(dt.getDate())
  return `${Y}-${M}-${D}`
}

const setQuickRange = (days) => {
  quickRangeType.value = days
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - (days - 1))
  dateRange.value = [startDate, today]
}

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

  chartData.value = sortedAggregations.map(item => ({
    value: toFixed2(item.avgDays),
    stageCode: item.stage,
    stageName: item.stageName,
    isBottleneck: item.isBottleneck
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params
        const v = p.data?.value !== undefined ? p.data.value : p.value
        return '平均天数: ' + toFixed2(v) + ' 天'
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chartData.value.map(item => item.stageName),
      axisLabel: {
        rotate: 25,
        fontSize: 11,
        color: '#409eff',
        textDecoration: 'underline'
      }
    },
    yAxis: {
      type: 'value',
      name: '平均停留天数'
    },
    series: [
      {
        type: 'bar',
        data: chartData.value.map(item => ({
          value: item.value,
          stageCode: item.stageCode,
          stageName: item.stageName,
          itemStyle: {
            cursor: 'pointer',
            color: item.isBottleneck ? '#f56c6c' : '#409eff'
          }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            const v = params.data?.value !== undefined ? params.data.value : params.value
            return toFixed2(v) + '天'
          }
        }
      }
    ]
  }

  durationChart.setOption(option)
  durationChart.getZr().setCursorStyle('pointer')
  durationChart.off('click')
  durationChart.on('click', (params) => {
    let matchedStageCode = null
    if (params.data && params.data.stageCode) {
      matchedStageCode = params.data.stageCode
    } else if (params.name) {
      const matched = chartData.value.find(d => d.stageName === params.name)
      if (matched) matchedStageCode = matched.stageCode
    }
    if (matchedStageCode) {
      window.location.href = '/duration-records?stage=' + matchedStageCode
    }
  })
}

const initStageTrendChart = () => {
  if (!stageTrendChartRef.value) return
  if (stageTrendChart) stageTrendChart.dispose()

  stageTrendChart = echarts.init(stageTrendChartRef.value)
  const series = stageTrendSeries.value.map((s, i) => ({
    name: s.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2, color: colors[i % colors.length] },
    itemStyle: { color: colors[i % colors.length] },
    data: s.data.map(d => toFixed2(d))
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let html = params[0].axisValue + '<br/>'
        for (const p of params) {
          if (p.value !== undefined && p.value !== null) html += p.marker + p.seriesName + ': ' + toFixed2(p.value) + ' 天<br/>'
        }
        return html
      }
    },
    legend: {
      data: stageTrendSeries.value.map(s => s.name),
      bottom: 0,
      type: 'scroll'
    },
    grid: { left: '3%', right: '4%', bottom: '80px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stageTrendDates.value
    },
    yAxis: {
      type: 'value',
      name: '平均天数'
    },
    series
  }
  stageTrendChart.setOption(option)
}

const initFlowTrendChart = () => {
  if (!flowTrendChartRef.value) return
  if (flowTrendChart) flowTrendChart.dispose()

  flowTrendChart = echarts.init(flowTrendChartRef.value)
  const series = flowTrendSeries.value.map((s, i) => ({
    name: s.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2, color: colors[i % colors.length] },
    itemStyle: { color: colors[i % colors.length] },
    data: s.data.map(d => toFixed2(d))
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let html = params[0].axisValue + '<br/>'
        for (const p of params) {
          if (p.value !== undefined && p.value !== null) html += p.marker + p.seriesName + ': ' + toFixed2(p.value) + ' 天<br/>'
        }
        return html
      }
    },
    legend: {
      data: flowTrendSeries.value.map(s => s.name),
      bottom: 0,
      type: 'scroll'
    },
    grid: { left: '3%', right: '4%', bottom: '80px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: flowTrendDates.value
    },
    yAxis: {
      type: 'value',
      name: '平均天数'
    },
    series
  }
  flowTrendChart.setOption(option)
}

const fetchDurationAgg = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = toLocalDateString(dateRange.value[0])
      params.endDate = toLocalDateString(dateRange.value[1])
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

const fetchStageTrend = async (days = 7) => {
  stageTrendDays.value = days
  try {
    const rsp = await statisticsApi.getStageTrend({ periodDays: days })
    stageTrendDates.value = rsp.dates || []
    stageTrendSeries.value = rsp.series || []
    setTimeout(() => initStageTrendChart(), 50)
  } catch (e) {
  }
}

const fetchFlowTrend = async (days = 7) => {
  flowTrendDays.value = days
  try {
    const rsp = await statisticsApi.getTotalFlowTrend({ periodDays: days })
    flowTrendDates.value = rsp.dates || []
    flowTrendSeries.value = rsp.series || []
    setTimeout(() => initFlowTrendChart(), 50)
  } catch (e) {
  }
}

const handleResize = () => {
  durationChart?.resize()
  stageTrendChart?.resize()
  flowTrendChart?.resize()
}

watch(dateRange, () => {
  fetchDurationAgg()
}, { deep: true })

onMounted(() => {
  setQuickRange(7)
  fetchStageTrend(7)
  fetchFlowTrend(7)
  fetchTotalDurations()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  durationChart?.dispose()
  stageTrendChart?.dispose()
  flowTrendChart?.dispose()
})
</script>

<style scoped>
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
