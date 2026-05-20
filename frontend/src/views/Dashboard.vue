<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">控制台</h2>
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

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">各阶段候选人分布</h3>
          <div ref="stageChartRef" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-container">
          <h3 class="card-title">最近候选人</h3>
          <el-table :data="recentCandidates" style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="currentStage" label="阶段">
              <template #default="{ row }">
                <el-tag :class="'stage-tag stage-' + row.currentStage" size="small">
                  {{ stageNames[row.currentStage] || row.currentStage }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="录入日期">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { statisticsApi, candidateApi } from '../api'
import * as echarts from 'echarts'
import { User, CircleCheck, Document, Avatar } from '@element-plus/icons-vue'

const summary = ref({})
const byStage = ref([])
const recentCandidates = ref([])
const stageChartRef = ref()

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

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const initStageChart = () => {
  if (!stageChartRef.value) return

  const chart = echarts.init(stageChartRef.value)
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
        radius: ['40%', '65%'],
        center: ['65%', '50%'],
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

  chart.setOption(option)
}

const fetchData = async () => {
  try {
    const [summaryRes, stageRes, candidateRes] = await Promise.all([
      statisticsApi.summary(),
      statisticsApi.byStage(),
      candidateApi.getAll({ pageSize: 5, page: 1 })
    ])

    summary.value = summaryRes.summary
    byStage.value = stageRes.statistics || []
    recentCandidates.value = candidateRes.candidates || []

    setTimeout(() => initStageChart(), 100)
  } catch (error) {
  }
}

onMounted(() => {
  fetchData()
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

.charts-row {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}
</style>
