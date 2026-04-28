<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据统计</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
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
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67c23a">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.passedTest || 0 }}</div>
            <div class="stat-label">韧测通过</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
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
      <el-col :span="6">
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
          <h3 class="card-title">流程效率统计 (平均天数)</h3>
          <el-table :data="efficiencyData" style="width: 100%">
            <el-table-column prop="stage" label="阶段" />
            <el-table-column prop="avgDays" label="平均天数" width="120">
              <template #default="{ row }">
                <span style="color: #409eff; font-weight: 600">{{ row.avgDays }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="样本数" width="100" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="card-container">
          <h3 class="card-title">顾问候选人统计</h3>
          <div ref="consultantChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { statisticsApi } from '../api'
import * as echarts from 'echarts'
import { User, CircleCheck, Document, Avatar } from '@element-plus/icons-vue'

const dateRange = ref([])
const summary = ref({})
const byStage = ref([])
const efficiencyData = ref([])
const stageChartRef = ref()
const consultantChartRef = ref()

let stageChart = null
let consultantChart = null

const stageNames = {
  employee_entry: '候选录入',
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

const handleDateChange = () => {
  fetchData()
}

const initStageChart = () => {
  if (!stageChartRef.value) return

  stageChart = echarts.init(stageChartRef.value)
  const stageData = byStage.value.map(item => ({
    name: stageNames[item.currentStage] || item.currentStage,
    value: parseInt(item.count)
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
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
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
      name: '候选人数量'
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

const fetchData = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }

    const [summaryRes, stageRes, efficiencyRes, consultantRes] = await Promise.all([
      statisticsApi.summary(),
      statisticsApi.byStage(params),
      statisticsApi.processEfficiency(params),
      statisticsApi.byConsultant(params)
    ])

    summary.value = summaryRes.summary
    byStage.value = stageRes.statistics || []

    const effStats = efficiencyRes.statistics
    efficiencyData.value = [
      { stage: '候选录入→机考申报', ...effStats.employeeToExam },
      { stage: '机考申报→机考完成', ...effStats.examDeclareToComplete },
      { stage: '推荐面试→资面安排', ...effStats.recommendToQualification },
      { stage: '前置阶段整体', ...effStats.preStageTotal },
      { stage: '面试阶段整体', ...effStats.interviewStageTotal }
    ]

    setTimeout(() => {
      initStageChart()
      initConsultantChart(consultantRes.statistics || [])
    }, 100)
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  }
}

const handleResize = () => {
  stageChart?.resize()
  consultantChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stageChart?.dispose()
  consultantChart?.dispose()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 10px;
}

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
