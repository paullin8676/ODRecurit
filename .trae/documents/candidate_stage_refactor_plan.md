# 候选人阶段管理重构方案

## 一、问题分析

### 1.1 当前架构问题

**问题1：阶段字段重复存储**
- `candidate.current_stage` - 候选人当前阶段
- `interview.current_stage` - 面试当前阶段
- `employee.current_stage` - 员工当前阶段

**问题2：同步机制复杂且不可靠**
当前代码中存在多处手动同步逻辑：
- 面试推进时需要调用 `syncCandidateStage()` 同步候选人阶段
- 员工状态变更时需要同步到 candidate 和 interview 表
- 同步顺序错误会导致阶段不一致（如之前修复的先同步后更新状态问题）

**问题3：数据冗余**
`employee` 表中存在与 `candidate` 表重复的字段：
- `name`, `email`, `phone`, `gender`, `id_card`, `last_operator_id`

### 1.2 当前数据流问题

```
Interview.update(current_stage) → syncCandidateStage() → Candidate.update(current_stage)
Employee.update(current_stage) → 同步到 Candidate → 同步到 Interview
```

这种设计导致：
- 代码复杂度高，容易出错
- 事务一致性难以保证
- 维护成本高

---

## 二、重构方案

### 2.1 方案概述

**核心思想**：创建独立的 `CandidateStage` 表，统一管理候选人从录入到离职的全生命周期阶段，所有模块（候选录入、机考、韧测、面试、员工管理）共用这张表的阶段信息。

### 2.2 新架构设计

**新增表：`candidate_stage`**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | INTEGER | 主键 |
| `candidate_id` | INTEGER | 外键关联 candidate.id（唯一约束） |
| `current_stage` | VARCHAR(50) | 当前阶段 |
| `previous_stage` | VARCHAR(50) | 上一阶段（用于审计） |
| `stage_history` | TEXT(JSON) | 阶段变更历史 |
| `updated_by` | INTEGER | 操作人ID |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

**员工表（employee）精简后**：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | INTEGER | 主键 |
| `candidate_id` | INTEGER | 外键关联 candidate.id |
| `business_line_id` | INTEGER | 业务线ID |
| `entry_date` | DATETIME | 入职日期 |
| `entry_remark` | TEXT | 入职备注 |
| `leave_date` | DATETIME | 离职日期 |
| `leave_type` | VARCHAR(20) | 离职类型 |
| `leave_remark` | TEXT | 离职备注 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

**删除字段**：`name`, `email`, `phone`, `gender`, `id_card`, `last_operator_id`, `current_stage`

### 2.3 新数据流设计

```
                    ┌───────────────────────────────────────┐
                    │         CandidateStage (唯一数据源)    │
                    │         candidate_id (唯一约束)         │
                    │         current_stage                  │
                    └─────────────────┬─────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Candidate   │           │    Interview    │           │    Employee     │
│ (基本信息)    │           │ (面试流程)      │           │ (入职后信息)    │
└───────────────┘           └─────────────────┘           └─────────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│     Exam      │           │      Test       │           │   其他模块      │
│   (机考)      │           │   (韧测)        │           │                 │
└───────────────┘           └─────────────────┘           └─────────────────┘
```

所有模块通过 `candidate_id` 关联到 `CandidateStage` 表获取当前阶段。

---

## 三、数据库变更

### 3.1 新增 CandidateStage 表

```sql
CREATE TABLE IF NOT EXISTS candidate_stage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    current_stage VARCHAR(50) DEFAULT 'candidate_entry',
    previous_stage VARCHAR(50),
    stage_history TEXT DEFAULT '[]',
    updated_by INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (updated_by) REFERENCES user(id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_stage_candidate ON candidate_stage(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_current_stage ON candidate_stage(current_stage);
```

### 3.2 修改 Employee 表

```sql
-- 删除冗余字段
ALTER TABLE employee DROP COLUMN name;
ALTER TABLE employee DROP COLUMN email;
ALTER TABLE employee DROP COLUMN phone;
ALTER TABLE employee DROP COLUMN gender;
ALTER TABLE employee DROP COLUMN id_card;
ALTER TABLE employee DROP COLUMN last_operator_id;
ALTER TABLE employee DROP COLUMN current_stage;

-- 添加 updated_by 字段（用于记录操作人）
ALTER TABLE employee ADD COLUMN updated_by INTEGER;
ALTER TABLE employee ADD CONSTRAINT fk_employee_updated_by FOREIGN KEY (updated_by) REFERENCES user(id);
```

### 3.3 修改 Candidate 表（可选）

```sql
-- 可选：保留 current_stage 作为冗余字段，用于兼容旧代码
-- 或者删除：ALTER TABLE candidate DROP COLUMN current_stage;
```

### 3.4 修改 Interview 表（可选）

```sql
-- 可选：保留 current_stage 作为面试流程内部阶段
-- 面试模块可以继续使用自己的 current_stage 表示面试流程进度
-- 而 CandidateStage.current_stage 表示全局阶段
```

---

## 四、代码变更

### 4.1 新增模型文件

**`backend/src/models/CandidateStage.js`**

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateStage = sequelize.define('CandidateStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'candidate',
      key: 'id'
    }
  },
  currentStage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'candidate_entry'
  },
  previousStage: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  stageHistory: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'id'
    }
  }
}, {
  tableName: 'candidate_stage',
  timestamps: true,
  underscored: true
});

module.exports = CandidateStage;
```

### 4.2 修改 Employee 模型

**`backend/src/models/Employee.js`** - 删除冗余字段

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'candidate',
      key: 'id'
    }
  },
  businessLineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'business_line',
      key: 'id'
    }
  },
  entryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  entryRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  leaveDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  leaveType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '主动离职(1) 或 被动离职(2)'
  },
  leaveRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'id'
    }
  }
}, {
  tableName: 'employee',
  timestamps: true,
  underscored: true
});

module.exports = Employee;
```

### 4.3 修改 models/index.js

```javascript
const CandidateStage = require('./CandidateStage');

// 关联关系
Candidate.hasOne(CandidateStage, { foreignKey: 'candidateId' });
CandidateStage.belongsTo(Candidate, { foreignKey: 'candidateId' });

User.hasMany(CandidateStage, { foreignKey: 'updatedBy' });
CandidateStage.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

module.exports = {
  // ... 其他模型
  CandidateStage
};
```

### 4.4 新增阶段服务

**`backend/src/services/stageService.js`**

```javascript
const { CandidateStage, Candidate } = require('../models');

class StageService {
  // 获取候选人当前阶段
  static async getStage(candidateId) {
    const stage = await CandidateStage.findOne({
      where: { candidateId }
    });
    return stage;
  }

  // 更新候选人阶段
  static async updateStage(candidateId, newStage, updatedBy = null) {
    const stage = await CandidateStage.findOne({
      where: { candidateId }
    });

    if (!stage) {
      // 如果不存在，创建新记录
      return await CandidateStage.create({
        candidateId,
        currentStage: newStage,
        updatedBy
      });
    }

    // 记录变更历史
    const history = JSON.parse(stage.stageHistory || '[]');
    history.push({
      stage: stage.currentStage,
      changedAt: new Date().toISOString(),
      changedBy: updatedBy
    });

    return await stage.update({
      currentStage: newStage,
      previousStage: stage.currentStage,
      stageHistory: JSON.stringify(history),
      updatedBy
    });
  }

  // 初始化候选人阶段（在创建候选人时调用）
  static async initStage(candidateId, initialStage = 'candidate_entry', updatedBy = null) {
    return await CandidateStage.findOrCreate({
      where: { candidateId },
      defaults: {
        currentStage: initialStage,
        updatedBy
      }
    });
  }

  // 获取阶段变更历史
  static async getStageHistory(candidateId) {
    const stage = await CandidateStage.findOne({
      where: { candidateId }
    });
    if (!stage) return [];
    return JSON.parse(stage.stageHistory || '[]');
  }
}

module.exports = StageService;
```

### 4.5 修改各模块路由

**候选录入模块** - `candidate.js`：
- 创建候选人时调用 `StageService.initStage()`
- 删除候选人时级联删除 CandidateStage

**机考模块** - `exam.js`：
- 更新机考状态时，根据结果调用 `StageService.updateStage()`

**韧测模块** - `test.js`：
- 更新韧测状态时，根据结果调用 `StageService.updateStage()`

**面试模块** - `interview.js`：
- 删除 `syncCandidateStage()` 函数
- 推进面试时调用 `StageService.updateStage()`

**员工管理模块** - `employee.js`：
- 通过 `candidateId` 关联获取候选人信息
- 删除冗余字段的 CRUD 操作

---

## 五、数据迁移

### 5.1 迁移步骤

**步骤1：创建 CandidateStage 表**
```sql
CREATE TABLE IF NOT EXISTS candidate_stage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL UNIQUE,
    current_stage VARCHAR(50) DEFAULT 'candidate_entry',
    previous_stage VARCHAR(50),
    stage_history TEXT DEFAULT '[]',
    updated_by INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(id),
    FOREIGN KEY (updated_by) REFERENCES user(id)
);
```

**步骤2：初始化 CandidateStage 数据**
```sql
INSERT INTO candidate_stage (candidate_id, current_stage, created_at, updated_at)
SELECT id, current_stage, created_at, updated_at FROM candidate;
```

**步骤3：备份 employee 表**
```sql
CREATE TABLE employee_backup AS SELECT * FROM employee;
```

**步骤4：修改 employee 表结构**
```sql
ALTER TABLE employee DROP COLUMN name;
ALTER TABLE employee DROP COLUMN email;
ALTER TABLE employee DROP COLUMN phone;
ALTER TABLE employee DROP COLUMN gender;
ALTER TABLE employee DROP COLUMN id_card;
ALTER TABLE employee DROP COLUMN last_operator_id;
ALTER TABLE employee DROP COLUMN current_stage;
ALTER TABLE employee ADD COLUMN updated_by INTEGER;
```

### 5.2 回滚方案

如果迁移失败，执行以下回滚：

```sql
-- 删除新表
DROP TABLE IF EXISTS candidate_stage;

-- 恢复 employee 表
DROP TABLE IF EXISTS employee;
ALTER TABLE employee_backup RENAME TO employee;
```

---

## 六、风险评估

| 风险类型 | 风险描述 | 影响程度 | 应对措施 |
|----------|----------|----------|----------|
| 数据丢失 | 删除 employee 表字段可能导致数据丢失 | 高 | 迁移前备份，迁移后验证 |
| 代码兼容性 | 现有代码引用已删除字段 | 高 | 全面搜索并更新所有引用 |
| 事务一致性 | 阶段更新需要保证事务 | 中 | 使用数据库事务包裹关键操作 |
| 性能影响 | 新增表查询可能影响性能 | 低 | 添加适当索引 |
| 前端兼容性 | 前端可能期望某些字段存在 | 高 | 通知前端团队同步修改 |

---

## 七、实施计划

### 7.1 第一阶段：准备阶段（1天）
- [ ] 完成代码分析，确认所有需要修改的文件
- [ ] 编写数据库迁移脚本
- [ ] 创建备份策略

### 7.2 第二阶段：数据库变更（半天）
- [ ] 执行数据库备份
- [ ] 创建 CandidateStage 表
- [ ] 初始化 CandidateStage 数据
- [ ] 修改 Employee 表结构

### 7.3 第三阶段：代码修改（2天）
- [ ] 新增 CandidateStage 模型
- [ ] 修改 Employee 模型
- [ ] 新增 StageService
- [ ] 修改各模块路由
- [ ] 更新关联关系配置

### 7.4 第四阶段：测试验证（1天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 数据一致性验证

### 7.5 第五阶段：前端适配（1天）
- [ ] 更新前端 API 调用
- [ ] 更新数据展示逻辑

---

## 八、总结

### 8.1 重构收益

1. **消除数据冗余**：员工表不再存储重复的个人信息
2. **简化同步逻辑**：所有模块共用 CandidateStage 作为单一数据源
3. **提高一致性**：避免同步顺序错误导致的数据不一致
4. **增强可维护性**：阶段管理逻辑集中在 StageService 中
5. **支持审计追溯**：保留阶段变更历史

### 8.2 需要注意的问题

1. 需要与前端团队协调，确保前端适配新的数据结构
2. 需要进行充分的测试，确保数据迁移正确
3. 需要考虑向后兼容性，可能需要提供过渡方案