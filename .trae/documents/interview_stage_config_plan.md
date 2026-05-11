
# 面试阶段可配置化方案

## 现状分析

当前系统已经有 `StageConfig` 表来存储阶段配置，但存在以下问题：

1. **前端 InterviewStage.vue 仍有大量硬编码：
   - 表格列硬编码（资面、技一、技二、主面、审批、Offer）
   - 表单模板硬编码
   - 阶段名称映射硬编码
   - 验证逻辑硬编码

2. **后端推进逻辑硬编码

3. **缺少可视化的阶段配置管理界面

## 解决方案

### 1. 数据库层：扩展 StageConfig 表

添加 `stageConfigs` 字段，存储每个阶段的详细配置：

```javascript
{
  stages: [...],
  stageNames: {...},
  stageConfigs: {
    'recommend_interview': {
      name: '推荐面试',
      type: 'simple',  // simple 或 detailed
      fields: ['scheduledDate'],
      required: ['scheduledDate'],
      advanceCondition: null
    },
    'qualification_interview': {
      name: '资面安排',
      type: 'detailed',
      fields: ['scheduledDate', 'interviewer', 'content', 'passed'],
      required: ['scheduledDate', 'interviewer', 'passed'],
      advanceCondition: 'passed === true'
    },
    ...
  }
}
```

### 2. 后端改造

#### 2.1 扩展 StageConfig 模型和路由

- 修改 `StageConfig` 模型，添加 `stageConfigs` 字段
- 更新路由，支持完整的 CRUD 操作
- 修改 `interview.js`，使用配置驱动的推进逻辑

#### 2.2 推进逻辑改造

将硬编码的 `canAdvance` 逻辑改为配置驱动：

```javascript
// 根据 stageConfigs 中的 advanceCondition 来判断推进条件
```

### 3. 前端改造

#### 3.1 阶段配置管理页面

新增 `StageConfig.vue 页面：

- 阶段列表管理（添加、删除、排序）
- 阶段配置编辑（名称、类型、字段配置、必填字段配置
- 实时预览

#### 3.2 InterviewStage.vue 重构

**表格列：

```vue
&lt;el-table-column
  v-for="stage in interviewStages"
  :key="stage.code"
  :label="stage.name + '日期'"
  width="120"
&gt;
  &lt;template #default="{ row }"&gt;
    {{ getRoundDate(row, stage.code) ? formatDate(getRoundDate(row, stage.code) : '-' }}
  &lt;/template&gt;
&lt;/el-table-column&gt;
```

**表单模板：**

使用动态组件或配置驱动的表单项生成

**验证逻辑：**

根据 stageConfigs 中的 required 字段动态验证

### 4. 实施步骤

**阶段 1：数据结构扩展（优先级：高）
- [ ] 更新 StageConfig 模型和数据库
- [ ] 更新初始化数据
- [ ] 编写数据迁移（如果需要）

**阶段 2：后端改造（优先级：高）
- [ ] 扩展 stageConfig 路由
- [ ] 改造 interview.js 推进逻辑
- [ ] 改造 interview.js 验证逻辑

**阶段 3：前端配置页面（优先级：中）
- [ ] 新增 StageConfig 页面
- [ ] 阶段 CRUD 操作
- [ ] 配置编辑表单

**阶段 4：InterviewStage.vue 重构（优先级：高）
- [ ] 表格列动态生成
- [ ] 表单模板动态生成
- [ ] 验证逻辑动态化

**阶段 5：测试和文档（优先级：中）
- [ ] 完整功能测试
- [ ] 更新文档

### 5. 具体设计

**阶段配置数据结构示例：

```json
{
  "stages": [
    "recommend_interview",
    "qualification_interview",
    "tech_interview_1",
    "tech_interview_2",
    "manager_interview",
    "offer",
    "pending_onboarding"
  ],
  "stageNames": {
    "recommend_interview": "推荐面试",
    "qualification_interview": "资面安排",
    "tech_interview_1": "技术面试(一)",
    "tech_interview_2": "技术面试(二)",
    "manager_interview": "主管面试",
    "offer": "Offer",
    "pending_onboarding": "待入职"
  },
  "stageConfigs": {
    "recommend_interview": {
      "name": "推荐面试",
      "type": "simple",
      "fields": ["scheduledDate"],
      "required": ["scheduledDate"],
      "labels": {
        "scheduledDate": "推荐日期"
      },
      "placeholders": {
        "scheduledDate": "请选择推荐日期"
      },
      "advanceCondition": null
    },
    "qualification_interview": {
      "name": "资面安排",
      "type": "detailed",
      "fields": ["scheduledDate", "interviewer", "content", "passed"],
      "required": ["scheduledDate", "interviewer", "passed"],
      "labels": {
        "scheduledDate": "资面日期",
        "interviewer": "资面顾问",
        "content": "资面备注",
        "passed": "是否通过"
      },
      "placeholders": {
        "scheduledDate": "请选择资面日期",
        "interviewer": "请输入资面顾问",
        "content": "请输入资面备注"
      },
      "advanceCondition": "passed === true"
    }
  }
}
```

### 6. 关键代码修改文件列表

**后端：**
- `backend/src/models/StageConfig.js` - 扩展模型
- `backend/src/routes/stageConfig.js` - 扩展路由
- `backend/src/routes/interview.js` - 配置驱动的推进和验证
- `backend/database_schema.sql` - 更新 schema

**前端：**
- `frontend/src/views/StageConfig.vue` - 新增配置页面
- `frontend/src/views/InterviewStage.vue` - 重构为配置驱动
- `frontend/src/router/index.js` - 添加新路由
- `frontend/src/api/index.js` - 扩展 API
