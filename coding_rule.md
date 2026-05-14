基于您的技术栈和项目需求，我为您整理了一份详细的**代码规范文档**，适用于 Vue 3 + Element Plus + Vite 前端和 Node.js + Express + Sequelize + SQLite 后端。该规范旨在统一多人（或多智能体）协作时的代码风格，减少维护成本。

---

# 招聘管理系统代码规范

> 版本：1.0  
> 生效日期：2026-05-03  
> 适用范围：OD-Recruit 项目所有前端、后端代码

---

## 一、基本原则

1. **可读性优先**：代码应自解释，复杂逻辑必须添加注释。
2. **一致性高于个人偏好**：所有提交必须遵守本规范。
3. **安全第一**：避免硬编码敏感信息，防止 SQL 注入、XSS 等常见漏洞。
4. **数据库命名统一**：**所有表字段采用蛇形命名（snake_case）**，模型通过 `underscored: true` 自动映射为驼峰。

---

## 二、命名规范

### 1. 后端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件夹 | 小写 + 短横线 | `src/controllers/`, `src/models/`, `src/routes/` |
| 文件名 | 小写 + 短横线 | `candidate.js`, `interview-stage.vue`（前端）<br>后端模型文件：`candidate.js` |
| 变量/常量 | camelCase | `const candidateList = []`<br>常量（仅限真正不变）：`const MAX_RETRY = 3` |
| 函数 | camelCase，动词开头 | `getCandidateById()`, `createExamRecord()` |
| 类 | PascalCase | `class CandidateService {}` |
| 路由路径 | 小写 + 短横线，RESTful | `GET /api/candidates`<br>`POST /api/candidates/:id/advance` |
| 环境变量 | 大写 + 下划线 | `PORT=3000`, `JWT_SECRET=xxx` |
| SQLite 表名 | 小写 + 下划线，单数形式 | `candidate`, `exam_paper`, `product_line` |
| 表字段 | 小写 + 下划线 | `current_stage`, `created_at`, `exam_complete_date` |
| 模型属性 | 驼峰（由 Sequelize 自动转换） | 定义时用 `currentStage: DataTypes.STRING`，数据库存 `current_stage` |

### 2. 前端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `CandidateList.vue`, `InterviewStage.vue` |
| 组合式函数 | camelCase，use 前缀 | `useCandidateApi()`, `useTablePagination()` |
| 普通函数/变量 | camelCase | `fetchCandidates()`, `currentPage` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL`, `DEFAULT_PAGE_SIZE` |
| CSS 类名 | 短横线（BEM 可选） | `.candidate-card`, `.interview-form__submit-btn` |
| 路由 name | camelCase | `name: 'candidateDetail'` |

---

## 三、目录结构规范

### 后端（`backend/`）

```
backend/
├── src/
│   ├── config/               # 配置文件
│   │   ├── database.js       # Sequelize 连接配置
│   │   └── auth.js           # JWT 配置
│   ├── models/               # Sequelize 模型定义（每个表一个文件）
│   │   ├── index.js          # 模型加载与关联
│   │   ├── Candidate.js
│   │   ├── Interview.js
│   │   └── ...
│   ├── controllers/          # 业务逻辑层（每个模块一个文件）
│   │   ├── candidateController.js
│   │   ├── interviewController.js
│   │   └── ...
│   ├── routes/               # 路由定义（与控制器对应）
│   │   ├── candidateRoutes.js
│   │   └── ...
│   ├── middleware/           # 中间件（认证、错误处理等）
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── utils/                # 工具函数
│   │   ├── validator.js
│   │   └── logger.js
│   └── app.js                # Express 入口
├── tests/                    # 单元测试/集成测试
├── database.sqlite           # SQLite 数据库文件（不提交到 git）
├── generateTestData.js       # 测试数据脚本
└── package.json
```

### 前端（`frontend/`）

```
frontend/
├── public/
├── src/
│   ├── api/                  # API 请求封装（按模块）
│   │   ├── index.js          # axios 实例，拦截器
│   │   ├── candidate.js
│   │   ├── interview.js
│   │   └── ...
│   ├── assets/               # 静态资源
│   ├── components/           # 公共组件
│   │   ├── Pagination.vue
│   │   └── StageTag.vue
│   ├── composables/          # 组合式函数（复用逻辑）
│   │   ├── usePagination.js
│   │   └── useForm.js
│   ├── router/               # Vue Router
│   │   └── index.js
│   ├── stores/               # Pinia 状态管理（如需）
│   ├── utils/                # 工具函数
│   │   ├── formatDate.js
│   │   └── validator.js
│   ├── views/                # 页面级组件
│   │   ├── Candidates.vue
│   │   ├── InterviewStage.vue
│   │   └── ...
│   ├── App.vue
│   └── main.js
├── .env.development          # 环境变量
└── package.json
```

---

## 四、代码格式规范

### 通用
- **缩进**：2 个空格（禁止使用 Tab）
- **行尾分号**：必须使用 `;`
- **字符串**：统一使用单引号 `''`（避免转义时使用双引号）
- **行最大长度**：100 字符（可适当放宽，但尽量保持可读）
- **文件末尾**：保留一个空行

### JavaScript / Node.js
- 使用 `const` 和 `let`，禁止 `var`
- 优先使用箭头函数
- 使用 `===` 和 `!==`，避免 `==`
- 异步操作优先使用 `async/await`，避免回调地狱
- 每个函数添加 JSDoc 注释（至少说明参数和返回值）

```javascript
/**
 * 根据 ID 获取候选人详情
 * @param {number} id - 候选人ID
 * @returns {Promise<Object>} 候选人对象
 */
async function getCandidateById(id) {
  // ...
}
```

### Vue 3 组件（`<script setup>` 语法）
- 组件名使用 PascalCase
- Props 使用 TypeScript 或 JSDoc 定义类型
- 事件命名使用 kebab-case（如 `@update:model-value`）
- 模板中组件使用 PascalCase（如 `<CandidateList />`）

```vue
<script setup>
import { ref } from 'vue';

// Props 定义
const props = defineProps({
  candidateId: {
    type: Number,
    required: true,
  },
});

// Emits 定义
const emit = defineEmits(['update', 'close']);
</script>
```

---

## 五、数据库与模型规范（重点）

### 1. 表字段蛇形命名示例
```sql
CREATE TABLE candidate (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  current_stage VARCHAR(50) DEFAULT 'employee_entry',
  entry_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Sequelize 模型定义
- 必须设置 `underscored: true` 和 `timestamps: true`（自动管理 `created_at`/`updated_at`）
- 属性名使用驼峰，通过 `field` 映射蛇形字段
- 添加索引、验证、关联关系

```javascript
// models/Candidate.js
module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define('Candidate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    currentStage: {
      type: DataTypes.STRING(50),
      field: 'current_stage',
      defaultValue: 'employee_entry',
    },
    entryDate: { type: DataTypes.DATE, field: 'entry_date' },
    // ... 其他字段
  }, {
    tableName: 'candidate',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Candidate.associate = (models) => {
    Candidate.hasMany(models.Exam, { foreignKey: 'candidateId', as: 'exams' });
    Candidate.belongsTo(models.User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
  };

  return Candidate;
};
```

### 3. 模型加载（`models/index.js`）
```javascript
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // 已配置好的实例

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
```

---

## 六、API 设计规范

### RESTful 约定
| 动作 | 方法 | 路由示例 | 说明 |
|------|------|----------|------|
| 列表 | GET | `/api/candidates` | 支持分页、筛选 |
| 详情 | GET | `/api/candidates/:id` | |
| 创建 | POST | `/api/candidates` | 请求体为 JSON |
| 更新 | PUT | `/api/candidates/:id` | 全量更新 |
| 部分更新 | PATCH | `/api/candidates/:id` | 可选，建议使用 PUT |
| 删除 | DELETE | `/api/candidates/:id` | |

### 响应格式统一
```javascript
// 成功
{ success: true, data: { candidates: [], total: 100 } }

// 错误
{ success: false, error: { code: 'VALIDATION_ERROR', message: '姓名不能为空' } }
```

### 状态码规范
- `200`：成功
- `201`：创建成功（POST）
- `400`：客户端请求错误（参数缺失、格式错误）
- `401`：未认证（Token 缺失或无效）
- `403`：无权限
- `404`：资源不存在
- `500`：服务器内部错误

### 分页参数
- `page`：当前页码（从 1 开始）
- `pageSize`：每页条数（默认 10，最大 100）
- 响应中返回 `total` 和当前页数据

---

## 七、前端 API 调用规范

### 统一封装（`api/index.js`）
```javascript
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器：添加 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    // 处理 401 跳登录
    return Promise.reject(error);
  }
);

export default request;
```

### 模块化 API（`api/candidate.js`）
```javascript
import request from './index';

export function getCandidates(params) {
  return request.get('/candidates', { params });
}

export function createCandidate(data) {
  return request.post('/candidates', data);
}
```

---

## 八、Git 提交规范

- **提交信息格式**：`<type>(<scope>): <subject>`
  - `type`: `feat`(新功能), `fix`(修复), `docs`(文档), `style`(代码格式), `refactor`(重构), `test`(测试), `chore`(构建/工具)
  - `scope`: 模块名（如 `candidate`, `interview`, `api`）
  - `subject`: 简短描述（不超过 50 字）

示例：
```
feat(candidate): add name search filter
fix(interview): correct pagination total count
docs(readme): update deployment guide
```

- **分支命名**：
  - `main`：生产环境
  - `develop`：开发集成分支
  - `feature/xxx`：功能分支
  - `bugfix/xxx`：修复分支

---

## 九、注释与文档

### 必须注释的位置
- 每个导出函数（JSDoc）
- 复杂业务逻辑（如阶段流转规则）
- 临时的、不明显的 hack
- TODO / FIXME 标记需附带日期和责任人

### 禁止的注释
- 无意义的注释（`i++ // 自增`）
- 被注释掉的代码（应直接删除，保留版本历史）

---

## 十、错误处理规范

### 后端
- 使用 try/catch 包裹异步 Controller 函数
- 统一错误中间件捕获
- 业务错误使用自定义 `AppError` 类

```javascript
class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// 使用
throw new AppError(400, '姓名不能为空', 'MISSING_NAME');
```

### 前端
- API 调用必须 `.catch()` 或 try/catch 处理错误
- 使用 Element Plus 的 `ElMessage` 显示错误提示

---

## 十一、测试数据与种子文件

- 测试数据脚本统一放在 `backend/generateTestData.js`
- 生产环境禁止运行测试数据脚本
- 测试数据应覆盖边界条件（如空值、长字符串）

---

## 十二、安全规范

1. **密码**：使用 `bcryptjs` 哈希（盐轮次 10）
2. **JWT**：过期时间 ≤ 7 天，密钥使用环境变量
3. **SQL 注入**：使用 Sequelize 参数化查询，禁止字符串拼接 SQL
4. **XSS**：前端使用 `v-text` 或 `{{ }}` 避免 `v-html`，必要时进行转义
5. **文件上传**：限制类型和大小，重命名文件
6. **敏感信息**：`.env` 文件加入 `.gitignore`，示例文件使用 `.env.example`

---

## 十三、工具与自动化

### 推荐使用以下工具强制规范：
- **ESLint** + **Prettier**：统一 JS/Vue 代码风格（提供配置文件）
- **Husky** + **lint-staged**：Git 提交前自动格式化
- **Commitlint**：校验提交信息格式

### 示例配置文件（项目根目录）
- `.eslintrc.js`（后端和前端各一份）
- `.prettierrc`
- `commitlint.config.js`

（具体配置内容可根据团队习惯调整，此处不展开）

---

## 十四、检查清单（提交前自查）

- [ ] 数据库字段是否使用蛇形命名？
- [ ] Sequelize 模型是否配置 `underscored: true`？
- [ ] 是否添加了必要的错误处理？
- [ ] 是否编写了 JSDoc 注释？
- [ ] 是否移除了 `console.log` 调试代码？
- [ ] 是否通过了 ESLint 检查？
- [ ] 提交信息是否符合规范？
- [ ] 是否更新了相关文档（如有）？

---