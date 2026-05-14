# 候选人阶段时间线追踪功能实现计划

## 功能需求确认

### 后端数据层
1. UNIQUE(candidateId, stage)：回退重入 UPDATE 模式，不新增记录
2. recommend_interview 反馈日期 18:00 时间约定
3. durationHours 预计算便于聚合统计

### 前端统计页明确需求（用户确认）

**统计页面 = 双区结构**：

```
[ 顶部：筛选器区                    ]
   [ 起始日期 ~ 结束日期 ]     (周期筛选)
   [ 阶段下拉选: 全部/推荐面试/... ] (某阶段筛选)
   [ 百分位下拉选: P50/P75/P90/AVG ] (统计类型选择)
           [ 查询按钮 ]

[ 展示区：表格记录展示（候选人-阶段级明细行）]
  翻页器
  | 候选人姓名 | 阶段名称 | 进入时间 | 离开时间 | 停留天数 | 停留小时 | 操作 |
  | 张三       | 推荐面试 | 2026-5-1 | 2026-5-5 | 4.02天   | 96.5小时 | 详情 |
  | 李四       | 技术面一 | 2026-5-3 | 2026-5-4 | 0.9天    | 21.6小时 | 详情 |
    ... 可翻页
  
[ 聚合统计区（折叠/展开切换）]
  柱状图 + 统计摘要表格 对应上面筛选
  按选定百分位输出卡点排序预警
```

---

## 前端 API 接口清单（前后端约定）

### 1. 分页列表（表格记录展示）
```
GET /api/statistics/stage-duration-records
Params:
  startDate: YYYY-MM-DD（筛选周期起始）
  endDate: YYYY-MM-DD
  stage: 'recommend_interview' | undefined（选某个阶段）
  page: 1
  pageSize: 20

Response:
  records: [
    {
      candidateId,
      candidateName: "张三",
      stage: "recommend_interview",
      stageName: "推荐面试",
      enteredAt: "2026-05-01T09:30:00",
      leftAt: "2026-05-05T18:00:00",
      durationHours: 96.5,
      durationDays: 4.02
    },
    ...
  ],
  pagination: { page, pageSize, total }
```

### 2. 聚合统计（柱状图 + 摘要表）
```
GET /api/statistics/stage-duration-agg
Params:
  startDate, endDate, stage（同上过滤条件）
  percentileType: 'avg'|'p50'|'p75'|'p90'  (停留百分位选择)

Response:
  aggregations: [
    {
      stage: 'recommend_interview',
      stageName: '推荐面试',
      avgHours: 72.1,
      avgDays: 3.0,
      p50Hours: 48,    // 对应前端选的 percentileType
      p75Hours: 96.5,
      p90Hours: 120,
      count: 45,       // 样本数
      isBottleneck: true  // 后端阈值判断是否卡点
    },
    ...排序: percentileType 值 desc 卡点在前
  ]
```

### 3. 单候选人明细（点击详情/详情页用）
```
GET /api/candidates/:id/stage-timeline
Response:
  timeline: [
    { stage, stageName, enteredAt, leftAt, durationDays, durationHours },
    ...按 enteredAt desc/asc 排序
  ]
```

---

## 全文件清单更新版

### 后端文件

1. **新增文件**：
   - `backend/src/models/CandidateStageTimeline.js`
     - UNIQUE(candidateId, stage) 复合约束
     - candidateId, stage, enteredAt, leftAt, durationHours, enteredBy, leftBy

   - `backend/src/services/CandidateStageTimelineService.js`
     - `async enterStage(candidateId, stage, userId, transaction)`
       - UPSERT: if exists then overwrite enteredAt=NOW()
     - `async leaveStage(candidateId, stage, userId, transaction, useDate = null)`
       - useDate：可选推荐面试用户填的反馈日期
       - UPDATE leftAt + compute durationHours
     - `async setRecommendInterviewFeedbackDate(candidateId, feedbackDateStr, userId)`
       - 单独设置 leftAt=YYYY-MM-DD 18:00

2. **修改文件**：
   - `backend/src/models/index.js`
     - 模型注册 + Candidate.hasMany(CandidateStageTimeline)
   
   - `backend/src/services/stageService.js`
     - `initStage()`: TimelineService.enterStage(candidateEntry)
     - `updateStage()`:
       - 关闭当前: TimelineService.leaveStage(currentStage, userId)
         - IF currentStage == recommend AND leftAt IS NOT NULL: 不要 NOW 覆盖用户原填的日期
       - 进入新: TimelineService.enterStage(newStage, userId)

   - `backend/src/routes/interview.js` 或对应业务路由：
     - `PUT /api/interview-rounds/:id/feedback-date`
       - 调用: `TimelineService.setRecommendInterviewFeedbackDate(candidateId, date, userId)`
     - 需先通过 InterviewRound -> Interview -> candidateId 找到候选人

   - `backend/src/routes/statistics.js`：新增 2 个查询
     - `GET /statistics/stage-duration-records` 分页列表（WHERE enteredAt BETWEEN ... AND IF stage=?）
     - `GET /statistics/stage-duration-agg` 聚合

   - `backend/src/routes/candidate.js`
     - `GET /candidates/:id/stage-timeline`

---

### 前端文件

1. **`frontend/src/api/index.js`** 接口定义：
```javascript
  getStageDurationRecords(params) {
    return api.get('/statistics/stage-duration-records', { params })
  },
  getStageDurationAgg(params) {
    return api.get('/statistics/stage-duration-agg', { params })
  },
  getCandidateStageTimeline(candidateId) {
    return api.get(`/candidates/${candidateId}/stage-timeline`)
  }
```

2. **`frontend/src/views/Statistics.vue` 改造**：
   - 筛选项扩展：
     - 已有日期范围选择器
     - 新增 阶段下拉选（el-select，选项含"全部阶段" + 16个阶段）
     - 新增 百分位类型（聚合统计时用）
   
   - 表格新增：
     - el-table 翻页: 候选人姓名 + 阶段名 + 双时间段 + 停留(天/小时) + 操作(详情/快速过滤)
   
   - echarts 柱图（复用已有第二张/新增实例）：
     - x轴 阶段 y轴 停留时间
     - 柱颜色: bottleneck=true 标红/高亮

   - 联动：上面筛选项变化 同时刷新下面列表+聚合图表

---

## 数据库 Schema 定义

文件：`backend/database_schema.sql`

```sql
CREATE TABLE IF NOT EXISTS candidate_stage_timeline (
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
  FOREIGN KEY (candidate_id) REFERENCES candidate(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES user(id),
  FOREIGN KEY (left_by) REFERENCES user(id)
);

-- 索引: 加速筛选与聚合
CREATE INDEX IF NOT EXISTS idx_cst_stage ON candidate_stage_timeline(stage);
CREATE INDEX IF NOT EXISTS idx_cst_entered_at ON candidate_stage_timeline(entered_at);
```

---

## 执行分步确认

**Step 1 - 数据模型与约束**
  - 新建 CandidateStageTimeline 模型文件
  - 更新 database_schema.sql

**Step 2 - TimelineService 写入逻辑**
  - enterStage: INSERT OR UPDATE
  - leaveStage: IF leftAt IS NOT NULL AND is recommend_stage = true THEN 跳过写 now 保护用户填日期
  - FeedbackDate 独立写入

**Step 3 - 双 API 查询实现**
  - records 分页带 WHERE enteredAt [startDate, endDate)
  - agg SQL: GROUP BY stage
    - sqlite PERCENTILE_CONT/直接拉内存算百分位

**Step 4 - 前端接入**
  - 筛选项扩展
  - 表格明细翻页 + 柱图展示
  - 红色高亮卡点预警 + ⚠️ 标签

**Step 5 - 文档补全**
  - recruit_rule.md / project_prd.md 说明更新
