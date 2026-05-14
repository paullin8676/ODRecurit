# OD-Recruit 招聘管理系统 - 技术实现文档
> 版本: 3.0  
> 日期: 2026-05-14  
> 定位: **技术视角** - 代码实现/数据库设计/API规范/数据流（面向开发人员）  
> 真实数据库文件: `backend/database.sqlite` (NOT dev.sqlite3)

---

## 1. 技术栈

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

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 3.0 | 2026-05-14 | 文档明确定位：**技术视角**<br>完整梳理：目录结构/表清单（18张含RBAC）/数据流图/API参数返回值/部署端口<br>recruit_rule.md重复文档已删除 |
