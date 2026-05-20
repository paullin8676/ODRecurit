# OD-Recruit 招聘管理系统 - 技术实现文档
> 版本: 3.3  
> 日期: 2026-05-20  
> 定位: **技术视角** - 代码实现/数据库设计/API规范/数据流（面向开发人员）  
> 真实数据库文件: `backend/database.sqlite` (NOT dev.sqlite3)

---

## 1. 技术栈

### 1.0 时区统一原则（UTC存储 + 8小时偏移对齐中国时区）
**问题根因：** SQLite+Sequelize 日期以**UTC字符串**存储（如`2026-05-14 11:00:00`或带`+00:00`），直接`DATE()`比较会用UTC日历判定，与中国时区业务日历差8小时边界。

**后端统计统一修正模板：**
```sql
-- 1) 日期归属比较：先偏移到中国时区日历，再做Y-M-D比较
DATE(datetime(field, '+8 hours')) = '2026-05-14'

-- 2) 历史日结束时间戳：中国时区当日23:59 → 转回UTC时间戳再julianday差
datetime(datetime(d.date, '+1 day', '-1 second'), '-8 hours')
   → 例：统计5/14结束时间 → UTC 15:59:59 = 中国 23:59:59

-- 3) "今日"判定：也用中国日历
date(datetime('now', '+8 hours'))
```

**前端显示统一修正模板：** `DurationRecords.vue formatDate()`
```javascript
// 数据库无时区标记强制按UTC解析，再转浏览器本地时区
let str = String(dateFromBackend)
if (!str.includes('+')) str += ' +00:00'
const dt = new Date(str)  // 自动转中国时区显示
```

**修正文件清单：**
| 文件 | 修正内容 |
|------|----------|
| [CandidateStageTimelineService.js](file:///Users/paul/Documents/Opencode/OD-Recruit/backend/src/services/CandidateStageTimelineService.js) | 全部DATE边界比较偏移，两处trend结束时间戳转回UTC |
| [DurationRecords.vue](file:///Users/paul/Documents/Opencode/OD-Recruit/frontend/src/views/DurationRecords.vue) | 无时区后缀强制补+00:00再new Date() |

### 1.1 前端栈
| 技术 | 版本/说明 |
|------|-----------|
| Vue.js | 3 |
| Element Plus | UI组件库 |
| Vite | 构建工具 |
| ECharts | 5 - 数据可视化（柱状图/饼图） |
| Pinia | 状态管理（stores/auth, stores/user...） |
| 端口配置 | **5171**, `--host 0.0.0.0` 局域网可见 |
| 热更新端口 | Vite hmr port 5173 |

### 1.2 后端栈
| 技术 | 版本/说明 |
|------|-----------|
| Node.js | 运行时 |
| Express.js | Web 框架 |
| Sequelize | ORM v6 |
| bcryptjs | 密码加密 |
| JWT | Token 认证 (`jsonwebtoken`) |
| SQLite3 | 数据库（数据库文件见顶） |
| 端口 | **3000** |

### 1.3 项目目录结构
```
OD-Recruit/
├── backend/src/
│   ├── app.js                    # 入口
│   ├── models/                   # Sequelize 模型
│   │   ├── Candidate.js
│   │   ├── CandidateStage.js
│   │   ├── CandidateStageTimeline.js   # ✅ 阶段停留时间追踪
│   │   ├── Role.js               # ✅ RBAC 角色
│   │   ├── Permission.js         # ✅ RBAC 权限
│   │   ├── UserRole.js           # ✅ 用户-角色中间表
│   │   ├── UserPermission.js     # ✅ 角色-权限中间表
│   │   ├── Interview.js
│   │   └── ...
│   ├── routes/                   # Express 路由
│   │   ├── statistics.js         # ✅ stage-duration API
│   │   ├── roles.js              # ✅ 角色CRUD
│   │   ├── permissions.js        # ✅ 权限CRUD
│   │   └── ...
│   ├── services/
│   │   ├── CandidateStageTimelineService.js  # ✅ 停留时间核心逻辑
│   │   ├── StageService.js
│   │   └── ...
│   └── middleware/
│       └── authenticate.js       # JWT 校验
└── frontend/src/
    ├── views/
    │   ├── Statistics.vue        # ✅ 阶段停留柱状图+表格
    │   ├── ExamStage.vue         # 回退按钮Bug已修复
    │   ├── RoleManagement.vue    # RBAC角色
    │   ├── PermissionManagement.vue
    │   └── ...
    └── api/
        ├── candidates.js
        └── ...
```

---

## 2. 数据库设计（共18张表）

### 2.1 核心数据表清单

| 表名（SQL） | Sequelize模型名 | 关键字段/约束 | 新增 |
|----------|-------------|---------------|------|
| candidate | Candidate | | |
| **candidate_stage** | CandidateStage | candidateId(UNIQUE), consultantId | |
| **candidate_stage_timeline** | CandidateStageTimeline | **UNIQUE(candidate_id, stage)**<br>entered_at, left_at, duration_hours | ✅ v3.0 |
| exam | Exam | candidateId(UNIQUE) | |
| test | Test | candidateId(UNIQUE) | |
| interview | Interview | candidateId(UNIQUE) | |
| interview_round | InterviewRound | | |
| employee | Employee | candidateId | |
| business_line | BusinessLine | name(UNIQUE), canEdit(JSON) | |
| exam_paper | ExamPaper | | |
| stage_config | StageConfig | module(UNIQUE) | |
| **role** | Role | name(UNIQUE), code(UNIQUE), dataScope:ENUM | ✅ v3.0 |
| **permission** | Permission | code(UNIQUE), type:ENUM(menu/button) | ✅ v3.0 |
| **user_role** | UserRole | userId+roleId 联合唯一 | ✅ v3.0 |
| **role_permission** | RolePermission | roleId+permissionId 联合唯一 | ✅ v3.0 |
| user | User | username(UNIQUE), managerId | |

### 2.2 candidate_stage_timeline 表结构（核心）
```sql
CREATE TABLE candidate_stage_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  stage VARCHAR(50) NOT NULL,
  entered_at DATE NOT NULL,
  left_at DATE NULL,
  duration_hours FLOAT NULL,
  entered_by INTEGER NULL,
  left_by INTEGER NULL,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,
  UNIQUE(candidate_id, stage)    -- 回退不新增，直接更新记录
);
```
**模型代码**: `backend/src/models/CandidateStageTimeline.js`

### 2.3 RBAC 四表结构
**role 表:**
```sql
dataScope ENUM: 'self', 'subordinate', 'global'
```
`self`仅见自己数据, `subordinate`含下属+自己, `global`全部可见。

---

## 3. 核心数据流

### 3.1 单一数据源原则（至关重要）

```
CandidateStage.currentStage = 系统阶段唯一可信来源
    ↓
Candidate/Employee/Interview 表均不存储阶段字段
    ↓
所有模块/统计API 阶段字段统一从 CandidateStage 查询
```

### 3.2 阶段推进数据流

```
[前端点击推进/回退按钮]
        ↓
PUT /api/candidates/:id/advance  OR  /rollback
        ↓
StageService.updateStage()
        ↓
├─ 更新 CandidateStage.currentStage/previousStage
├─ stageHistory JSON 数组追加
└─ CandidateStageTimelineService 回调
        ↓
        ├─ 离开旧阶段：leaveStage → 更新 left_at + duration_hours
        └─ 进入新阶段：enterStage → INSERT OR UPDATE 唯一约束冲突时更新 entered_at=NOW()
```

### 3.3 推荐面试阶段反馈日期数据流

推荐面试不使用自动计算的离开时间，强制用用户填的日期+18:00:
```javascript
// CandidateStageTimelineService.js
async setRecommendInterviewFeedbackDate(candidateId, feedbackDateStr, userId) {
  feedbackDate.setHours(18, 0, 0, 0);  // ← 固定18点
  return record.update({ 
    leftAt: feedbackDate, 
    durationHours: calcHours, 
    leftBy: userId 
  });
}

// 后续推进检测：若 hour:minute:second === 18:00:00 则不覆盖，保留用户值
```

---

## 4. API 接口规范

### 4.1 新增 RBAC 接口
| Method | Path |
|--------|------|
| GET/POST/PUT/DELETE | `/api/roles` |
| GET/POST/PUT/DELETE | `/api/permissions` |

### 4.2 新增统计 API（阶段停留时间）

#### `GET /api/statistics/stage-duration-records`
**Query Params:** `page`, `pageSize`, `startDate`, `endDate`, `stage`

**Response:**
```javascript
{
  data: [
    { candidateName, stage, stageName, enteredAt, leftAt, durationHours, durationDays },
    ...
  ],
  total: Number
}
```

#### `GET /api/statistics/stage-duration-agg`
**Params同前**

**Response:**
```javascript
[
  {
    stage, stageName,
    count, avgHours, medianHours,
    percentile50, percentile75, percentile90, avgDays,
    isBottleneck  // true: avg >= global avg * 150% (卡点)
  },
  ...
]
```

### 4.3 回退按钮接口
```
PUT /api/candidates/:id/rollback
BODY: { businessLineId }
```
**ExamStage.vue Bug修复**: `candidateApi.rollback()` ✓ (之前错写 `candidateApi.update()` 不更新阶段)

---

## 5. 前端核心组件

| 文件 | 说明 |
|------|------|
| `frontend/src/views/Statistics.vue` | 阶段停留柱状图(ECharts) + 明细表格 + 筛选栏 |
| `frontend/src/views/RoleManagement.vue` | 角色分配权限弹窗 |
| `frontend/src/views/PermissionManagement.vue` | 权限树形管理 |
| `frontend/src/stores/auth.js` | 当前用户登录态，roles[]/permissions[] 数组 |

---

## 6. 部署与运行

| 层级 | 目录下执行 | 端口 |
|------|-----------|------|
| 后端 | `cd backend && npm start` | **3000** |
| 前端 | `cd frontend && npm run dev` | **5171** (局域网可见) |

启动前进程占用处理:
```bash
lsof -ti:5171,5173,3000 | xargs kill -9
```

---

## 7. 历史Bug修复记录

| 编号 | 现象 | 根因 | 修复点 |
|------|------|------|--------|
| 1 | ExamStage.vue"回退"按钮点完提示成功，候选人阶段没变化 | candidateApi.update 只更新候选人基本信息，不更新阶段 | ExamStage.vue 改为 candidateApi.rollback |
| 2 | 后端返回 durationHours = 0，前端显示"-"（与仍在此阶段混淆） | js 0是falsy `0 ? day : null`走null分支 | `durationHours !== null` 严格判断 |
| 3 | 开发脚本查询 dev.sqlite3 是空库，与服务器打开的库不一致 | pm2/server 打开路径不同 → cwd下生成不同sqlite文件 | 统一真实数据文件: backend/database.sqlite |
| **4** | **趋势统计多算8小时+前端显示时间不一致** | **UTC存储日期，直接比较用UTC日历/显示直接解析无时区标记** | **统一参见1.0时区原则模板** |
| 5 | auth.js中间件权限判断可绕过 | admin角色未单独判断，多角色权限判断逻辑遗漏 | auth.js authorize admin自动next()绕过后续检查 |

---

## 7.1 新增脚本工具

| 脚本 | 说明 |
|------|------|
| [backup_recruitment_data.js](file:///Users/paul/Documents/Opencode/OD-Recruit/backend/scripts/backup_recruitment_data.js) | 数据库备份脚本，完整备份8张招聘过程表：candidate/candidate_stage/candidate_stage_timeline/exam/test/interview/interview_round/employee<br>自动生成带时间戳备份文件 + latest 备份文件，方便清库前快速备份 |
| [restore_recruitment_data.js](file:///Users/paul/Documents/Opencode/OD-Recruit/backend/scripts/restore_recruitment_data.js) | 数据库恢复脚本，支持事务保护失败自动回滚<br>默认恢复latest备份，也可指定备份文件路径恢复 |
| [generate_full_process_data.js](file:///Users/paul/Documents/Opencode/OD-Recruit/backend/scripts/generate_full_process_data.js) | 全流程测试数据生成脚本，每个阶段创建一个候选人直达该阶段 |
| [clear_recruitment_data.sql](file:///Users/paul/Documents/Opencode/OD-Recruit/backend/clear_recruitment_data.sql) | 按外键依赖顺序清空招聘过程相关表数据的SQL脚本 |

---

## 7.2 统计筛选交互统一

三处趋势图表筛选交互方式完全一致（DurationAnalysis.vue停留分析页）：
| 图表 | 筛选方式 |
|------|----------|
| 某时间段内各阶段完成平均天数统计 | 快捷按钮: 最近一周/两周/一月 + 日期范围选择器 |
| 每天各完成阶段所需平均天数变化趋势 | **与第一个图表统一** - 可快捷按钮也可自定义起止日期 |
| 每天汇总各阶段总耗天数变化趋势 | **与第一个图表统一** - 可快捷按钮也可自定义起止日期 |

后端接口 `getStageTrend` / `getTotalFlowTrend` 同时支持两种传参：`periodDays=N` 或 `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 3.3 | 2026-05-20 | **新增工具脚本章节（7.1/7.2）**<br>数据备份/恢复脚本: backup_recruitment_data/restore_recruitment_data<br>测试数据生成: generate_full_process_data/clear_recruitment_data.sql<br>RBAC权限Bug修复: admin角色自动授权全部接口<br>三处统计筛选统一: 趋势图表起止日期可手动自由选择 |
| 3.2 | 2026-05-17 | 文档版本与代码逻辑同步更新<br>确认 CandidateStageTimelineService 服务中所有API实现与文档描述一致<br>包括 getDurationRecords / getDurationAggregations / getStageTrend / getTotalFlowTrend 等核心方法 |
| 3.1 | 2026-05-16 | **新增1.0时区统一原则章节**<br>UTC存储+8h偏移模板（统计）/ 无时区标记强制补+00:00（显示）/ 两处trend计算结束点修正 |
| 3.0 | 2026-05-14 | 文档明确定位：**技术视角**<br>完整梳理：目录结构/表清单（18张含RBAC）/数据流图/API参数返回值/部署端口<br>recruit_rule.md重复文档已删除 |
