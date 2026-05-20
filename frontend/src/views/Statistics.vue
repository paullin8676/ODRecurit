<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据统计</h2>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #409eff">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.total || 0 }}</div>
            <div class="stat-label">候选人总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67c23a">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.passedExam || 0 }}</div>
            <div class="stat-label">机考通过</div>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #909399">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.testComplete || 0 }}</div>
            <div class="stat-label">韧测完成</div>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #00acc1">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.pendingOnboarding || 0 }}</div>
            <div class="stat-label">待入职</div>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6a23c">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.inOffer || 0 }}</div>
            <div class="stat-label">待发Offer</div>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f56c6c">
            <el-icon :size="32"><Avatar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.entered || 0 }}</div>
            <div class="stat-label">已入职</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">各阶段候选人分布</h3>
          <div ref="stageChartRef" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">顾问候选人统计</h3>
          <div ref="consultantChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">机考申报/完成 - 按试卷名称+状态统计</h3>
          <div ref="examPaperChartRef" style="height: 350px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">韧测申报/完成 - 按当前状态统计</h3>
          <div ref="testStatusChartRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="card-container">
          <h3 class="card-title">推荐面试及之后阶段 - 按业务线统计</h3>
          <div ref="businessLineChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { statisticsApi } from '../api'
import * as echarts from 'echarts'
import { User, CircleCheck, Document, Avatar } from '@element-plus/icons-vue'

const summary = ref({})
const byStage = ref([])

const stageChartRef = ref()
const consultantChartRef = ref()
const businessLineChartRef = ref()
const examPaperChartRef = ref()
const testStatusChartRef = ref()

let stageChart = null
let consultantChart = null
let businessLineChart = null
let examPaperChart = null
let testStatusChart = null

const stageOrder = [
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

const statusColors = {
  pending: '#909399',
  passed: '#67c23a',
  failed: '#f56c6c',
  abandoned: '#e6a23c'
}

const initStageChart = () => {
  if (!stageChartRef.value) return

  stageChart = echarts.init(stageChartRef.value)
  const stageMap = {}
  byStage.value.forEach(item => {
    stageMap[item.currentStage] = parseInt(item.count)
  })
  
  const stageData = stageOrder
    .filter(stage => stageMap[stage] !== undefined)
    .map(stage => ({
      name: stageNames[stage] || stage,
      value: stageMap[stage]
    }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        center: ['65%', '50%'],
        radius: ['40%', '65%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
          position: 'outside',
          distance: 20,
          minShowLabelAngle: 1
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10,
          smooth: true
        },
        data: stageData,
        color: [
          '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
          '#00acc1', '#5c6bc0', '#f9a825', '#689f38', '#2e7d32',
          '#1b5e20', '#c62828', '#7b1fa2', '#0288d1'
        ]
      }
    ]
  }

  stageChart.setOption(option)
}

const initConsultantChart = (consultantStats) => {
  if (!consultantChartRef.value) return

  consultantChart = echarts.init(consultantChartRef.value)

  const names = consultantStats.map(s => s.consultant?.realName || s.consultant?.username || '未知')
  const values = consultantStats.map(s => parseInt(s.total))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '候选人数量',
      minInterval: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: {
          color: '#409eff'
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  consultantChart.setOption(option)
}

const initBusinessLineChart = (data) => {
  if (!businessLineChartRef.value) return
  if (businessLineChart) businessLineChart.dispose()

  businessLineChart = echarts.init(businessLineChartRef.value)

  const names = data.map(d => d.businessLineName || '未分配')
  const values = data.map(d => d.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 25, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '候选人数量',
      minInterval: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [{
      type: 'bar',
      data: values,
      barWidth: '50%',
      label: { show: true, position: 'top' },
      itemStyle: { color: '#5c6bc0' }
    }]
  }

  businessLineChart.setOption(option)
}

const initExamPaperChart = (data) => {
  if (!examPaperChartRef.value) return
  if (examPaperChart) examPaperChart.dispose()

  examPaperChart = echarts.init(examPaperChartRef.value)

  const paperNames = [...new Set(data.map(d => d.paperName))]
  const stageList = [...new Set(data.map(d => stageNames[d.currentStage] || d.currentStage))]
  const statusList = [...new Set(data.map(d => d.examStatus))]

  const series = statusList.map(status => ({
    name: status === 'pending' ? '待处理' : 
          status === 'passed' ? '通过' :
          status === 'failed' ? '不通过' :
          status === 'abandoned' ? '放弃' : status,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: statusColors[status] || '#409eff' },
    data: paperNames.map(paper => {
      const item = data.find(d => d.paperName === paper && d.examStatus === status)
      return item ? item.count : 0
    })
  }))

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: series.map(s => s.name), bottom: 0, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '80px', containLabel: true },
    xAxis: {
      type: 'category',
      data: paperNames,
      axisLabel: { rotate: 15, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '候选人数量',
      minInterval: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series
  }

  examPaperChart.setOption(option)
}

const initTestStatusChart = (data) => {
  if (!testStatusChartRef.value) return
  if (testStatusChart) testStatusChart.dispose()

  testStatusChart = echarts.init(testStatusChartRef.value)

  const stageList = [...new Set(data.map(d => stageNames[d.currentStage] || d.currentStage))]
  const statusList = [...new Set(data.map(d => d.testStatus))]

  const series = statusList.map(status => ({
    name: status === 'pending' ? '待处理' : 
          status === 'passed' ? '通过' :
          status === 'failed' ? '不通过' :
          status === 'abandoned' ? '放弃' : status,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: statusColors[status] || '#409eff' },
    data: stageList.map(stageName => {
      const item = data.find(d => (stageNames[d.currentStage] || d.currentStage) === stageName && d.testStatus === status)
      return item ? item.count : 0
    })
  }))

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: series.map(s => s.name), bottom: 0, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '80px', containLabel: true },
    xAxis: {
      type: 'category',
      data: stageList,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '候选人数量',
      minInterval: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series
  }

  testStatusChart.setOption(option)
}

const fetchData = async () => {
  try {
    const params = {}
    const [summaryRes, stageRes, consultantRes, blRes, examRes, testRes] = await Promise.all([
      statisticsApi.summary(),
      statisticsApi.byStage(params),
      statisticsApi.byConsultant(params),
      statisticsApi.byBusinessLineLateStage(),
      statisticsApi.getExamByPaperStatus(),
      statisticsApi.getTestByStatus()
    ])

    summary.value = summaryRes.summary
    byStage.value = stageRes.statistics || []

    setTimeout(() => {
      initStageChart()
      initConsultantChart(consultantRes.statistics || [])
      initBusinessLineChart(blRes.statistics || [])
      initExamPaperChart(examRes.statistics || [])
      initTestStatusChart(testRes.statistics || [])
    }, 100)
  } catch (error) {
  }
}

const handleResize = () => {
  stageChart?.resize()
  consultantChart?.resize()
  businessLineChart?.resize()
  examPaperChart?.resize()
  testStatusChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stageChart?.dispose()
  consultantChart?.dispose()
  businessLineChart?.dispose()
  examPaperChart?.dispose()
  testStatusChart?.dispose()
})
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
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
