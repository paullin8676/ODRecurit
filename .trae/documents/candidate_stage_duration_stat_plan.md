# 候选人阶段停留时间统计功能完整实现计划

## 一、功能背景与目标

实现候选人在各招聘阶段停留时间的精确追踪与统计分析，支持：
1. 候选人各阶段停留时间列表的表格记录展示
2. 周期筛选（按时间范围）
3. 阶段筛选（按特定阶段）
4. 停留百分位统计（P50/P75/P90/AVG）
5. 自动识别流程卡点

---

## 二、后端实现状态与补充

### 2.1 已完成的核心模块

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 数据模型 | `backend/src/models/CandidateStageTimeline.js` | ✅ 完成 | UNIQUE(candidate_id, stage)约束 |
| 服务层 | `backend/src/services/CandidateStageTimelineService.js` | ✅ 完成 | enter/leave/feedbackDate逻辑 |
| 统计API | `backend/src/routes/statistics.js` | ✅ 完成 | stage-duration-records/agg两个接口 |
| 库表结构 | `backend/database_schema.sql` | ✅ 完成 | candidate_stage_timeline表定义 |

### 2.2 数据库表结构确认

```sql
CREATE TABLE candidate_stage_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  stage VARCHAR(50) NOT NULL,
  entered_at DATETIME NOT NULL,
  left_at DATETIME,
  duration_hours FLOAT,
  entered_by INTEGER,
  left_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, stage),
  FOREIGN KEY (candidate_id) REFERENCES candidate(id)
);
CREATE INDEX idx_cst_stage ON candidate_stage_timeline(stage);
CREATE INDEX idx_cst_entered_at ON candidate_stage_timeline(entered_at);
```

### 2.3 业务写入逻辑（关键规则）

**规则1：阶段进入** - `CandidateStageTimelineService.enterStage()`
- 有UNIQUE约束，先查是否存在记录
- 存在则**更新**（阶段回退场景）：`enteredAt=NOW(), leftAt=NULL`
- 不存在则**插入**新记录

**规则2：阶段离开** - `CandidateStageTimelineService.leaveStage()`
- 正常推进：`leftAt=NOW()`，计算 `durationHours`
- **推荐面试阶段特殊保护**：
  - 检查是否已有 `leftAt` 且时间 = HH:MM:SS = 18:00:00
  - 若是 → 不覆盖，保护用户在界面填写的反馈日期

**规则3：推荐面试反馈日期**
- 独立API：`setRecommendInterviewFeedbackDate(candidateId, feedbackDateStr, userId)`
- 强制设置：`YYYY-MM-DD 18:00:00`

### 2.4 统计API参数与响应格式

#### 明细列表API：`GET /api/statistics/stage-duration-records`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | N | 周期筛选：开始日期(YYYY-MM-DD) |
| endDate | string | N | 周期筛选：结束日期(YYYY-MM-DD) |
| stage | string | N | 阶段筛选：如 'recommend_interview' |
| page | int | N | 页码，默认1 |
| pageSize | int | N | 页大小，默认20 |

响应：
```json
{
  "records": [
    {
      "candidateId": 101,
      "candidateName": "张三",
      "stage": "recommend_interview",
      "stageName": "推荐面试",
      "enteredAt": "2026-05-01T09:30:00.000Z",
      "leftAt": "2026-05-05T10:00:00.000Z",
      "durationHours": 96.5,
      "durationDays": "4.02"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 156 }
}
```

#### 聚合统计API：`GET /api/statistics/stage-duration-agg`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | N | 同上面明细API |
| endDate | string | N | 同上面明细API |
| stage | string | N | 同上面明细API |

响应（已包含所有百分位计算值）：
```json
{
  "aggregations": [
    {
      "stage": "recommend_interview",
      "stageName": "推荐面试",
      "avgHours": 72.1,
      "avgDays": 3.0,
      "p50Hours": 48,
      "p75Hours": 96.5,
      "p90Hours": 120,
      "count": 45,
      "isBottleneck": true
    }
  ]
}
```

---

## 三、前端Statistics.vue页面完整设计

### 3.1 筛选区布局（顶部）

```
[ 周期: 开始日期 ~ 结束日期 ]   [ 阶段: 下拉选择 ▼ ]   [ 查询 按钮 ]
  (已在代码)                       (已在代码)             (已在代码)
```

- **周期筛选**：按 entered_at 字段过滤
- **阶段筛选**：下拉选项 = 全部阶段 + 16个枚举阶段
- **联动**：点击"查询"按钮 → 同时刷新 表格记录 + 柱状图数据

### 3.2 展示区：表格记录展示（优先级最高）

表格列定义（el-table 6列）：

| 列名 | 宽度 | 格式化说明 |
|------|------|------------|
| 候选人姓名 | 120px | - |
| 阶段名称 | 130px | stageNames 映射 |
| 进入时间 | 180px | `YYYY-MM-DD HH:MM:SS` |
| 离开时间 | 180px | `仍在此阶段` if leftAt is null，否则同上格式 |
| 停留时长 | 260px | `X.XX天` 标签 + `(XXX小时)` |
| **操作列** | 100px | 「查看时间线」按钮 |

> ✅ **当前实现状态**：已在 Statistics.vue 143-165 完成表格 + 翻页器

### 3.3 展示区：聚合统计可视化（按停留百分位）

#### 柱状图（停留时间）

- **X轴**：阶段名称
- **Y轴**：停留天数（可在前端切换 AVG/P50/P75/P90）
- **柱子颜色**：`isBottleneck=true` 时标红 (#f56c6c)，否则蓝 (#409eff)

#### 卡点预警

```javascript
const bottleneckStage = computed(() => {
  const btns = aggregations.value.filter(x => x.isBottleneck).map(x => x.stageName)
  return btns.length > 0 ? btns.join(', ') : '无明显卡点'
})
```

**卡点判断逻辑（后端）**：
```javascript
isBottleneck = 当前阶段平均值 >= 全局平均值 * 1.5
```

---

## 四、前端补充完善与交互

### 4.1 百分位切换增强

**说明**：后端 agg API 已返回 `avgHours/p50Hours/p75Hours/p90Hours` 全量，**前端可在本地动态切换展示维度**，无需重新请求接口。

### 4.2 已完成的前后端联调清单

| 项 | 值 |
|----|----|
| 前端 API 层 | `statisticsApi.getStageDurationRecords(params)` ✅ |
| 前端 API 层 | `statisticsApi.getStageDurationAgg(params)` ✅ |
| 表格分页 | `recordsLoading` 加载态 + el-pagination ✅ |
| 日期格式化 | `formatDate()` YYYY-MM-DD HH:MM:SS ✅ |
| 图表 | echarts durationChartRef 实例 ✅ |
| 响应式 | handleResize 窗口重绘 ✅ |

---

## 五、测试验证策略

### 5.1 基础验证步骤

```
Step 1: 表结构验证
  - SQL: PRAGMA table_info(candidate_stage_timeline)
  - 确认 UNIQUE(candidate_id, stage) 生效

Step 2: 写入路径验证
  - 候选人A 新建: candidate_entry 阶段应有 enteredAt=NOW()
  - 候选人A 推进 exam_declare:
    * candidate_entry leftAt 被写回
    * exam_declare enteredAt=NOW()
  - 阶段回退（如 exam_complete → candidate_entry）
    * candidate_entry 行 UPDATE enteredAt=NOW(), leftAt=null
    * ✔️ 不会出现重复(candidate_id,stage)行

Step 3: 推荐面试反馈日期验证
  - 界面填反馈日期 2026-05-20，提交
  - DB 验证 leftAt = '2026-05-20T18:00:00.000Z'
  - 推进下一阶段时 ✔️ 不要覆盖这个 18:00 时间

Step 4: 统计页
  - 筛选 5月1日-5月31日，阶段=推荐面试
  - 点查询，表格行数据符合 WHERE 条件
  - 柱状图柱子大于全局平均*150% 显示红色
```

### 5.2 数据样本参考

用于验证百分位计算的数据样本：
| 候选人 | 阶段 | 停留小时 |
|--------|------|----------|
| C1 | recommend_interview | 24h |
| C2 | recommend_interview | 48h |
| C3 | recommend_interview | 72h |
| C4 | recommend_interview | 96h |
| C5 | recommend_interview | 120h |

```
avg = (24+48+72+96+120)/5 = 72h
p50 = 第 ceil(0.5*5) = 第3个 → 72h
p75 = 第 ceil(0.75*5) = 第4个 → 96h
p90 = 第 ceil(0.9*5) = 第5个 → 120h
```

---

## 六、项目入口与文档同步

### 6.1 入口与依赖

- **页面路由**：前端 `/statistics` 菜单 → Statistics.vue
- **后端模型注册**：`backend/src/models/index.js` 要 `require('./CandidateStageTimeline')` 并与 Candidate 建立关联
- **关联关系**：`Candidate.hasMany(CandidateStageTimeline)` / `CandidateStageTimeline.belongsTo(Candidate)`

### 6.2 文档清单同步更新

| 文档 | 更新点 |
|------|--------|
| `database_schema.sql` | candidate_stage_timeline 表定义与索引 ✅ |
| `recruit_rule.md` | 阶段停留时间卡点定义规则 |
| `project_prd.md` | 统计分析功能说明 |
| `requirement.md` | 列全功能点验收项 |
| `DEPLOYMENT_GUIDE.md` | 版本迭代SQL迁移指引 |

---

## 七、执行计划摘要

| 任务项 | 优先级 | 状态 |
|--------|--------|------|
| 1.  CandidateStageTimeline 模型 + DB schema | HIGH | ✅ DONE |
| 2.  TimelineService 核心写入逻辑(enter/leave/保护日期) | HIGH | ✅ DONE |
| 3.  stageService 阶段变更回调接入 timeline | HIGH | ✅ DONE |
| 4.  推荐面试反馈日期独立路由 API | HIGH | ✅ DONE |
| 5.  /statistics 双 API (records 翻页/agg 分组含百分位) | HIGH | ✅ DONE |
| 6.  前端 Statistics.vue 筛选 + 表格 + 柱图 + 红色预警 | HIGH | ✅ DONE |
| 7.  **验证与回归测试（本步当前重点）** | - | ⏳ IN PROGRESS |
