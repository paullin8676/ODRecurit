<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <el-button type="primary" @click="handleSave" :loading="saveLoading">
        保存配置
      </el-button>
    </div>

    <el-alert
      v-if="stageWarning"
      type="warning"
      :closable="false"
      show-icon
      class="stage-warning"
    >
      <template #title>
        以下模块已配置该阶段：{{ stageWarning }}
      </template>
    </el-alert>

    <div class="card-container">
      <el-row :gutter="20">
        <el-col
          v-for="module in filteredModules"
          :key="module.key"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="4"
        >
          <el-card class="module-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ module.name }}</span>
              </div>
            </template>
            <div class="checkbox-grid">
              <div class="checkbox-column">
                <el-checkbox-group v-model="selectedStages[module.key]">
                  <el-checkbox
                    v-for="stage in leftColumnStages"
                    :key="stage.key"
                    :label="stage.key"
                    :value="stage.key"
                    class="stage-checkbox"
                  >
                    {{ stage.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="checkbox-column">
                <el-checkbox-group v-model="selectedStages[module.key]">
                  <el-checkbox
                    v-for="stage in middleColumnStages"
                    :key="stage.key"
                    :label="stage.key"
                    :value="stage.key"
                    class="stage-checkbox"
                  >
                    {{ stage.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="checkbox-column">
                <el-checkbox-group v-model="selectedStages[module.key]">
                  <el-checkbox
                    v-for="stage in rightColumnStages"
                    :key="stage.key"
                    :label="stage.key"
                    :value="stage.key"
                    class="stage-checkbox"
                  >
                    {{ stage.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { stageConfigApi } from '../api'
import { ElMessage } from 'element-plus'

const route = useRoute()

const stages = [
  { key: 'candidate_entry', name: '候选录入' },
  { key: 'exam_declare', name: '机考申报' },
  { key: 'exam_complete', name: '机考完成' },
  { key: 'test_declare', name: '韧测申报' },
  { key: 'test_complete', name: '韧测完成' },
  { key: 'recommend_interview', name: '推荐面试' },
  { key: 'qualification_interview', name: '资面安排' },
  { key: 'tech_interview_1', name: '技术面试(一)' },
  { key: 'tech_interview_2', name: '技术面试(二)' },
  { key: 'manager_interview', name: '主管面试' },
  { key: 'approval', name: '租用审批' },
  { key: 'offer', name: 'Offer' },
  { key: 'pending_onboarding', name: '待入职' },
  { key: 'entry', name: '入职' },
  { key: 'leave', name: '离职' }
]

const leftColumnStages = computed(() => stages.slice(0, 5))
const middleColumnStages = computed(() => stages.slice(5, 10))
const rightColumnStages = computed(() => stages.slice(10))

const modules = [
  { key: 'candidate_entry', name: '候选录入' },
  { key: 'exam_management', name: '机考管理' },
  { key: 'test_management', name: '韧测管理' },
  { key: 'interview_management', name: '面试管理' },
  { key: 'employee_management', name: '员工管理' }
]

const filteredModules = computed(() => {
  const module = route.query.module
  const stage = route.query.stage
  if (module) {
    return modules.filter(m => m.key === module)
  }
  return modules
})

const pageTitle = computed(() => {
  const stage = route.query.stage
  if (stage) {
    const found = stages.find(s => s.key === stage)
    return found ? `阶段配置 - ${found.name}` : '阶段配置'
  }
  return '阶段配置'
})

const stageWarning = computed(() => {
  const stage = route.query.stage
  if (!stage) return null
  const configuredModules = modules.filter(m => selectedStages[m.key]?.includes(stage))
  if (configuredModules.length === 0) return null
  return configuredModules.map(m => m.name).join('、')
})

const selectedStages = reactive({
  candidate_entry: [],
  exam_management: [],
  test_management: [],
  interview_management: [],
  employee_management: []
})

const loading = ref(false)
const saveLoading = ref(false)

const fetchConfig = async () => {
  loading.value = true
  try {
    const data = await stageConfigApi.getAll()
    if (data.configs) {
      data.configs.forEach(config => {
        if (selectedStages.hasOwnProperty(config.module)) {
          selectedStages[config.module] = config.stages || []
        }
      })
    }
  } catch (error) {
    ElMessage.error('获取阶段配置失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const configs = Object.keys(selectedStages).map(module => ({
      module,
      stages: selectedStages[module]
    }))

    for (const config of configs) {
      await stageConfigApi.update(config.module, { stages: config.stages })
    }

    ElMessage.success('保存成功')
    await fetchConfig()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  fetchConfig()
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

.module-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.stage-checkbox {
  display: flex;
  margin-bottom: 8px;
}

.stage-warning {
  margin-bottom: 20px;
}

.checkbox-grid {
  display: flex;
  gap: 16px;
}

.checkbox-column {
  flex: 1;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>