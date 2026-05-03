# 招聘管理系统代码规范（精简版）

> 技术栈：Vue 3 + Element Plus + Vite（前端）/ Node.js + Express + Sequelize + SQLite（后端）

---

## 一、核心原则
- **数据库所有表字段使用蛇形命名（snake_case）**，Sequelize 模型配置 `underscored: true` 映射为驼峰属性。
- 代码自解释，复杂逻辑必须注释。
- 统一风格优于个人偏好，所有提交必须符合本规范。

---

## 二、命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 数据库表/字段 | 小写+下划线 | `candidate`, `current_stage` |
| 模型属性（后端） | 驼峰，field 映射 | `currentStage: { field: 'current_stage' }` |
| 变量/函数 | camelCase | `candidateList`，`getCandidateById` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| 类（后端） | PascalCase | `CandidateService` |
| 路由路径 | 小写+短横线，RESTful | `/api/candidates/:id/advance` |
| Vue 组件 | PascalCase | `CandidateList.vue` |
| 组合式函数 | camelCase + use前缀 | `usePagination` |
| CSS 类名 | 短横线 | `.candidate-card` |

---

## 三、目录结构（关键要点）

```
backend/
├── src/
│   ├── config/        # 数据库、JWT配置
│   ├── models/        # 每个表一个文件，index.js 加载关联
│   ├── controllers/   # 业务逻辑
│   ├── routes/        # 路由定义
│   ├── middleware/    # 认证、错误处理
│   └── utils/         # 工具函数
└── generateTestData.js

frontend/
├── src/
│   ├── api/           # 按模块封装请求
│   ├── composables/   # 复用逻辑
│   ├── views/         # 页面组件（PascalCase）
│   └── utils/         # 格式化、校验等
```

---

## 四、代码格式
- 缩进：2 个空格；行尾分号必须；字符串用单引号。
- 使用 `const` / `let`，禁止 `var`；优先 `async/await`。
- 每个导出函数需 JSDoc 注释（参数、返回值）。

---

## 五、数据库与模型规范（重点）

**表字段示例**：
```sql
CREATE TABLE candidate (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  current_stage VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Sequelize 模型必须**：
```javascript
sequelize.define('Candidate', {
  currentStage: { type: DataTypes.STRING, field: 'current_stage' }
}, {
  tableName: 'candidate',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
```
- 所有模型统一在 `models/index.js` 加载并调用 `associate` 设置关联。

---

## 六、API 设计
- 遵循 RESTful：GET（列表/详情）、POST（创建）、PUT（全量更新）、DELETE。
- 统一响应格式：`{ success: true, data: ... }` 或 `{ success: false, error: { code, message } }`。
- 分页参数：`page`（从1开始）、`pageSize`（默认10，最大100），响应返回 `total`。
- 状态码：200/201/400/401/403/404/500。

---

## 七、错误与安全
- 后端使用自定义 `AppError` 类，统一错误中间件捕获。
- 前端 API 调用必须 `.catch()` 或 try/catch，使用 Element Plus 提示错误。
- 密码用 bcryptjs（盐轮次10）；JWT 密钥环境变量，过期≤7天。
- 禁止拼接 SQL，使用 Sequelize 参数化。
- 敏感信息（`.env`）加入 `.gitignore`。

---

## 八、Git 提交规范
- 格式：`<type>(<scope>): <subject>`
  - type：`feat`/`fix`/`docs`/`refactor`/`chore`
  - scope：模块名（如 `candidate`）
- 示例：`feat(interview): add pagination`
- 分支：`main` / `develop` / `feature/xxx` / `bugfix/xxx`

---

## 九、工具与检查清单
- 推荐使用 ESLint + Prettier 自动格式化。
- 提交前自查：
  - [ ] 数据库字段蛇形命名，模型映射正确？
  - [ ] 有无错误处理？
  - [ ] 移除 `console.log`？
  - [ ] 提交信息符合规范？

---

**本规范自发布起生效，所有智能体与开发者必须遵守。**