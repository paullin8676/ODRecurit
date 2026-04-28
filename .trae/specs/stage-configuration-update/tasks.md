# 阶段配置功能修改 - 任务清单

## 任务列表

- [ ] 任务1: 修改员工管理菜单
  - 修改 Layout.vue 中员工管理的二级菜单
  - 二级菜单改为：候选录入、机考管理、韧测管理、面试管理、员工管理
  - 路由对应：/employees, /exam-stage, /test-stage, /interview-stage, /employee-management

- [ ] 任务2: 修改阶段配置菜单
  - 修改 Layout.vue 中阶段配置的二级菜单
  - 二级菜单改为14个阶段名称
  - 路由格式：/stage-config?stage={stage_key}

- [ ] 任务3: 修改路由配置
  - 修改 router/index.js
  - 添加 /employee-management 路由（可选，如果需要独立页面）
  - 修改 /stage-config 路由支持 query 参数

- [ ] 任务4: 修改阶段配置页面
  - 修改 StageConfig.vue
  - 支持根据 query 参数 stage 显示对应阶段的配置
  - 如果没有 stage 参数，显示阶段列表
  - 修复空白问题

- [ ] 任务5: 测试验证
  - 启动服务
  - 验证菜单显示
  - 验证阶段配置功能

# 任务依赖
- 任务1、2、3 可以并行执行
- 任务4 依赖于任务3
- 任务5 依赖于任务1、2、3、4