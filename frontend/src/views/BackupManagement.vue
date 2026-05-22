<template>
  <div class="backup-management">
    <el-card shadow="never" class="config-card">
      <template #header>
        <div class="card-header">
          <span>备份配置</span>
        </div>
      </template>
      <el-form :inline="true" :model="config" class="config-form">
        <el-form-item label="定时时间">
          <el-time-picker
            v-model="scheduleTime"
            format="HH:mm"
            value-format="HH:mm"
            :disabled-hours="() => []"
            placeholder="选择每日备份时间"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="configLoading">
            保存配置
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="createBackup" :loading="backupLoading">
            <el-icon style="vertical-align: middle"><Refresh /></el-icon>
            立即备份
          </el-button>
        </el-form-item>
      </el-form>
      <div class="config-info">
        <el-tag size="small" type="info">保留天数: 7 天</el-tag>
        <el-tag size="small" type="info" class="ml-2">备份目录: backend/backups</el-tag>
        <el-tag size="small" class="ml-2" v-if="nextScheduleTime">下次: {{ nextScheduleTime }}</el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-4">
      <template #header>
        <div class="card-header">
          <span>备份记录</span>
          <el-tag type="info" size="small">最近 20 条</el-tag>
        </div>
      </template>
      
      <el-table :data="backups" border stripe style="width: 100%" v-loading="listLoading">
        <el-table-column prop="id" label="序号" width="70" align="center" />
        <el-table-column prop="created_at" label="日期时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="280" show-overflow-tooltip />
        <el-table-column label="大小" width="100">
          <template #default="{ row }">
            {{ formatSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="backupType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.backupType === 'scheduled' ? '' : 'warning'" size="small">
              {{ row.backupType === 'scheduled' ? '定时' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'danger'" size="small">
              {{ row.status === 'completed' ? '成功' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="restoreBackup(row)"
              :loading="restoreLoading === row.id"
            >恢复</el-button>
            <el-button
              type="danger"
              link
              size="small"
              style="margin-left: 8px"
              @click="deleteBackup(row)"
              :loading="deleteLoading === row.id"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { backupApi } from '@/api'

const backups = ref([])
const listLoading = ref(false)
const configLoading = ref(false)
const backupLoading = ref(false)
const restoreLoading = ref(null)
const deleteLoading = ref(null)

const config = ref({})
const scheduleTime = ref('02:00')

const nextScheduleTime = computed(() => {
  if (!scheduleTime.value) return ''
  const [h, m] = scheduleTime.value.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m || 0, 0, 0)
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target.toLocaleString('zh-CN').substring(0, 17)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  const kb = bytes / 1024
  if (kb < 1024) return kb.toFixed(1) + ' KB'
  return (kb / 1024).toFixed(2) + ' MB'
}

const fetchConfig = async () => {
  try {
    configLoading.value = true
    const res = await backupApi.getConfig()
    config.value = res.data
    if (res.data.scheduleTime) {
      scheduleTime.value = res.data.scheduleTime
    }
  } catch (e) {
    console.error(e)
  } finally {
    configLoading.value = false
  }
}

const fetchBackups = async () => {
  try {
    listLoading.value = true
    const res = await backupApi.getAll({ page: 1, pageSize: 20 })
    backups.value = res.data.backups || []
  } catch (e) {
    console.error(e)
  } finally {
    listLoading.value = false
  }
}

const saveConfig = async () => {
  try {
    configLoading.value = true
    await backupApi.updateConfig({ scheduleTime: scheduleTime.value })
    ElMessage.success('配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    configLoading.value = false
  }
}

const createBackup = async () => {
  try {
    backupLoading.value = true
    const beforeCount = backups.value.length
    await backupApi.createBackup()
    ElMessage.success('备份请求已提交，请刷新查看结果')
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 1500))
      await fetchBackups()
      if (backups.value.length > beforeCount || backups.value[0]?.status === 'completed') break
    }
  } catch (e) {
    ElMessage.error('备份失败')
  } finally {
    backupLoading.value = false
  }
}

const restoreBackup = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 "` + row.fileName + `" 吗？\n\n这将覆盖当前数据库所有数据！`,
      '恢复确认',
      { type: 'warning', confirmButtonText: '确定恢复', cancelButtonText: '取消' }
    )
    restoreLoading.value = row.id
    await backupApi.restoreBackup(row.id)
    ElMessage.success('数据库已恢复')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('恢复失败')
  } finally {
    restoreLoading.value = null
  }
}

const deleteBackup = async (row) => {
  try {
    await ElMessageBox.confirm(`删除备份文件: ${row.fileName}`, '确认删除', { type: 'warning' })
    deleteLoading.value = row.id
    await backupApi.deleteBackup(row.id)
    ElMessage.success('已删除')
    fetchBackups()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  } finally {
    deleteLoading.value = null
  }
}

onMounted(() => {
  fetchConfig()
  fetchBackups()
})
</script>

<style scoped>
.backup-management {
  padding: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.config-form {
  margin-bottom: 12px;
}
.config-info {
  margin-top: 8px;
}
.ml-2 {
  margin-left: 8px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
