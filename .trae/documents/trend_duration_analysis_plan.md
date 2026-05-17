# 阶段停留时间变化趋势 实现计划

## 需求概述

在「停留分析」页面，现有"阶段停留时间分析"柱状图下方新增两个趋势折线图：

### 1. 阶段停留时间变化趋势
- **指标**：每个阶段停留时间平均值随日期的变化
- **周期筛选**：最近一周 / 最近两周 / 最近三周 / 最近一个月
- **X轴**：日期

### 2. 流程总时间变化趋势
- **指标**：截止当前阶段总时间的变化
- **周期筛选**：最近一周 / 最近两周 / 最近三周 / 最近一个月
- **X轴**：日期

---

## 现有代码结构分析

### 后端 (backend)
- **统计API**：`backend/src/routes/statistics.js`
  - `/stage-duration-records`：明细数据
  - `/stage-duration-agg`：聚合数据
  - `/candidate-total-durations`：总停留时长
- **时间线服务**：`backend/src/services/CandidateStageTimelineService.js`
  - 数据模型：`candidate_stage_timeline` 表 (`entered_at`/`left_at`/`duration_hours`)

### 前端 (frontend)
- **停留分析页面**：`frontend/src/views/DurationAnalysis.vue`
  - 现有图表：阶段停留时间分析柱状图（ECharts）
  - 快捷按钮：最近一周 / 两周 / 一月

---

## 实施方案

### Step 1: 后端新增趋势API

**文件修改**：
1. `backend/src/services/CandidateStageTimelineService.js`
   ```javascript
   // 新增两个查询方法
   static async getStageTrend({ periodDays }) {
     // 按日期聚合：每天各阶段的平均停留时间
     // SELECT DATE(entered_at) as date, stage, AVG(duration_hours) FROM timeline GROUP BY DATE(entered_at), stage
   }
   static async getTotalFlowTrend({ periodDays }) {
     // 每天候选人从候选录入到当前阶段的总时间
   }
   ```

2. `backend/src/routes/statistics.js`
   ```javascript
   router.get('/stage-trend', ...)
   router.get('/total-flow-trend', ...)
   ```

### Step 2: 前端API扩展

**文件修改**：`frontend/src/api/index.js`
```javascript
// statisticsApi 新增
getStageTrend: (params) => request.get('/statistics/stage-trend', { params }),
getTotalFlowTrend: (params) => request.get('/statistics/total-flow-trend', { params })
```

### Step 3: DurationAnalysis.vue 新增两个趋势图组件

**文件修改**：`frontend/src/views/DurationAnalysis.vue`
- 图表1：阶段停留时间变化趋势
  - 周期按钮组：[最近一周, 最近两周, 最近三周, 最近一月]
  - 多折线图：每条线代表一个阶段
  - X轴：日期
- 图表2：流程总时间变化趋势
  - 同上独立周期筛选
  - 单折线/面积图
  - X轴：日期

---

## 数据结构设计

### stage-trend 响应
```json
{
  "dates": ["2026-05-08", "2026-05-09", "..."],
  "series": [
    { "name": "机考申报", "data": [2.1, 3.5, 4.0, "..."] },
    { "name": "机考完成", "data": [1.2, 2.0, "..."] }
  ]
}
```

### total-flow-trend 响应
```json
{
  "dates": ["2026-05-08", "..."],
  "values": [12.5, 15.0, "..."]
}
```

---

## 修改文件清单

| 文件 | 修改类型 |
|-----|---------|
| `backend/src/services/CandidateStageTimelineService.js` | 新增2个趋势统计方法 |
| `backend/src/routes/statistics.js` | 新增 `/stage-trend` `/total-flow-trend` 路由 |
| `frontend/src/api/index.js` | 新增两个API调用函数 |
| `frontend/src/views/DurationAnalysis.vue` | 新增两张ECharts趋势图 + 独立周期按钮 |

---

## 核心统计逻辑 (2026-05-16 更新)

### 趋势日三条件判断规则

某阶段在「趋势日」有哪些候选人需要被统计：

| 条件 | 判断规则 | 说明 |
|-----|---------|-----|
| **条件1** | `DATE(left_at) = 趋势日` | 候选人正好在当天完成该阶段 |
| **条件2** | `left_at IS NULL AND DATE(entered_at) <= 趋势日` | 候选人已进入该阶段，仍停留未结束 |
| **条件3** | `DATE(entered_at) <= 趋势日 AND 趋势日 < DATE(left_at)` | 趋势日当天候选人正处于该阶段中间 |

SQL 拼接写法：
```sql
AND (
     DATE(t.left_at) = d.date 
     OR 
     (t.left_at IS NULL AND DATE(t.entered_at) <= d.date)
     OR
     (DATE(t.entered_at) <= d.date AND d.date < DATE(t.left_at))
)
```

---

### stage-trend：阶段停留时间变化趋势

| 项目 | 统计说明 |
|-----|---------|
| **统计内容** | 趋势日当天该阶段**自身的停留时间**平均值 |
| **时间起点** | 当前阶段 `entered_at` |
| **时间终点** | 优先 `duration_hours` 字段；若NULL则用CASE估算：<br>- left_at为NULL用 `datetime('now')`<br>- 趋势日介于进入离开之间用 `datetime(trend_date, '+1 day', '-1 second')` |
| **额外过滤** | INNER JOIN candidate 过滤主表已删除候选人 |

---

### total-flow-trend：流程总时间变化趋势

| 项目 | 统计说明 |
|-----|---------|
| **统计内容** | 从**候选录入进入时间**到当前该阶段结束的**累计流程总时间**平均值 |
| **时间起点** | `candidate_entry` 阶段的 `entered_at` |
| **时间终点** | 精确CASE时间逻辑：<br>`CASE`<br>&nbsp;&nbsp;**WHEN** `stage_left_at IS NULL` → `datetime('now')` 截止当前<br>&nbsp;&nbsp;**WHEN** `DATE(stage_left_at) = trend_date` → 实际 `stage_left_at`<br>&nbsp;&nbsp;**WHEN** `DATE(stage_entered_at) <= trend_date AND trend_date < DATE(stage_left_at)` → 趋势日当天 `23:59:59`<br>`END` |
| **时间差函数** | `julianday(CASE结束时间) - julianday(候选录入进入时间)` （单位：天） |

---

### 举例验证（以九甲G01 5月9日为例）

| 阶段 | 进入时间 | 离开时间 | 停留时间 | 流程总时间截止5月9日结束点 | 总天数 |
|-----|---------|---------|---------|--------------------------|-------|
| 候选录入 | 09:00 | 14:00 | 5h | = 14:00 - 09:00 = 5h | 0.21天 |
| 机考申报 | 14:00 | 20:00 | 6h | = 20:00 - 09:00 = 11h | 0.46天 |
| 机考完成 | 20:00 | 次日02:00 | - | = 5月9日23:59:59 - 09:00 ≈ 15h | 0.62天 |

