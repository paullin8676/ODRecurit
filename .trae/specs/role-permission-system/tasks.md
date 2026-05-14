# 角色和权限控制系统 - 实现计划

## [ ] Task 1: 创建角色表 (Role)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建Role模型，包含字段：id, name, code, level, dataScope, description
  - dataScope取值：'self'（自己数据）、'subordinate'（下级数据）、'global'（全局数据）
  - level取值：1-5（1=顾问，5=管理员）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 系统初始化时自动创建5种预设角色
  - `programmatic` TR-1.2: 角色数据正确存储到数据库
- **Notes**: 预设角色：consultant(level=1, scope=self), supervisor(level=2, scope=subordinate), manager(level=3, scope=subordinate), director(level=4, scope=subordinate), admin(level=5, scope=global)

## [ ] Task 2: 创建用户-角色关联表 (UserRole)
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建UserRole模型，关联用户和角色（多对多）
  - 字段：userId, roleId
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 一个用户可以关联多个角色
  - `programmatic` TR-2.2: 删除用户时级联删除关联记录
- **Notes**: 需要处理现有用户的角色迁移

## [ ] Task 3: 创建权限点表 (Permission)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建Permission模型，存储权限点
  - 字段：id, code, name, type(menu/button), parentId, path, icon
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-3.1: 权限点可以按类型分类（菜单/按钮）
  - `programmatic` TR-3.2: 支持树形结构（菜单层级）
- **Notes**: 需要初始化默认权限点数据

## [ ] Task 4: 创建角色-权限关联表 (RolePermission)
- **Priority**: P0
- **Depends On**: Task 1, Task 3
- **Description**: 
  - 创建RolePermission模型，关联角色和权限（多对多）
  - 字段：roleId, permissionId
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 一个角色可以关联多个权限点
  - `programmatic` TR-4.2: 删除角色时级联删除关联记录
- **Notes**: 需要为预设角色分配默认权限

## [ ] Task 5: 修改User模型，移除role字段
- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**: 
  - 从User模型中移除role字段
  - 添加与Role的多对多关联
  - 保持向后兼容性，迁移现有用户角色数据
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-5.1: 现有用户自动映射到新角色系统
  - `programmatic` TR-5.2: User.role字段不再存在
- **Notes**: migration脚本需要将现有的User.role值转换为UserRole关联

## [ ] Task 6: 创建权限服务 (PermissionService)
- **Priority**: P0
- **Depends On**: Task 1-4
- **Description**: 
  - 创建权限服务，提供权限检查方法
  - 方法：getUserPermissions(userId), hasPermission(userId, permissionCode), getUserRoleDataScope(userId), getUserSubordinates(userId)
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-5, AC-8
- **Test Requirements**:
  - `programmatic` TR-6.1: 正确返回用户的所有权限点
  - `programmatic` TR-6.2: 正确判断用户是否拥有某个权限
  - `programmatic` TR-6.3: 正确获取用户的数据权限范围
  - `programmatic` TR-6.4: 正确获取用户的所有下级用户（递归）
- **Notes**: getUserSubordinates需要递归查询managerId层级

## [ ] Task 7: 创建数据权限中间件
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 创建dataPermission中间件，自动为查询添加数据权限过滤
  - 根据用户角色的数据权限范围，在req对象上设置可访问的consultantIds列表
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-5, AC-8
- **Test Requirements**:
  - `programmatic` TR-7.1: 顾问用户只能看到自己的数据
  - `programmatic` TR-7.2: 主管用户能看到自己和下属的数据
  - `programmatic` TR-7.3: 管理员能看到所有数据
- **Notes**: 需要在各列表查询API中使用该中间件

## [ ] Task 8: 更新认证中间件，注入用户权限信息
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 修改authenticate中间件，在req.user中注入权限信息
  - 包含：roles（角色列表）、permissions（权限点列表）、dataScope（数据权限范围）、subordinateIds（下属用户ID列表）
- **Acceptance Criteria Addressed**: AC-2, AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-8.1: req.user包含完整的权限信息
  - `programmatic` TR-8.2: 权限信息在请求生命周期内可用
- **Notes**: 可以考虑缓存权限信息以提高性能

## [ ] Task 9: 创建角色和权限管理API
- **Priority**: P1
- **Depends On**: Task 1-4
- **Description**: 
  - 创建角色管理CRUD API
  - 创建权限管理CRUD API
  - 创建用户角色分配API
  - 创建角色权限分配API
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-9.1: 角色CRUD功能正常
  - `programmatic` TR-9.2: 权限CRUD功能正常
  - `programmatic` TR-9.3: 用户角色分配功能正常
  - `programmatic` TR-9.4: 角色权限分配功能正常
- **Notes**: 仅管理员可以访问这些API

## [ ] Task 10: 更新前端路由和导航菜单权限控制
- **Priority**: P0
- **Depends On**: Task 8
- **Description**: 
  - 在路由meta中添加权限要求
  - 创建前端权限检查工具函数
  - 修改Layout.vue，根据权限动态渲染菜单
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgment` TR-10.1: 顾问用户看不到用户管理菜单
  - `human-judgment` TR-10.2: 管理员能看到所有菜单
- **Notes**: 需要在前端store中保存用户权限信息

## [ ] Task 11: 更新前端列表操作按钮权限控制
- **Priority**: P1
- **Depends On**: Task 10
- **Description**: 
  - 在各列表组件中添加按钮权限控制
  - 根据用户权限动态显示/隐藏操作按钮
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgment` TR-11.1: 顾问用户看不到删除按钮
  - `human-judgment` TR-11.2: 管理员能看到所有按钮
- **Notes**: 需要创建统一的权限判断组件或指令

## [ ] Task 12: 创建权限管理界面
- **Priority**: P1
- **Depends On**: Task 9, Task 10
- **Description**: 
  - 创建角色管理页面（RoleManagement.vue）：查看角色列表、编辑角色信息、配置角色数据权限范围
  - 创建权限配置页面（PermissionManagement.vue）：查看权限点列表、支持树形展示菜单权限
  - 创建角色权限分配页面（RolePermission.vue）：为角色分配权限点的可视化界面
  - 创建用户角色分配页面（UserRole.vue）：为用户分配角色的界面
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4, AC-5
- **Test Requirements**:
  - `human-judgment` TR-12.1: 可以查看和编辑角色信息
  - `human-judgment` TR-12.2: 可以查看权限点树形结构
  - `human-judgment` TR-12.3: 可以为角色勾选权限点
  - `human-judgment` TR-12.4: 可以为用户分配多个角色
- **Notes**: 仅管理员可以访问这些页面

## [ ] Task 13: 更新数据库schema文档
- **Priority**: P2
- **Depends On**: Task 1-4
- **Description**: 
  - 更新database_schema.sql，添加新表定义
  - 更新项目文档中相关内容
- **Acceptance Criteria Addressed**: None
- **Test Requirements**:
  - `human-judgment` TR-13.1: 文档与实际数据库结构一致
- **Notes**: 保持文档同步

## [ ] Task 14: 测试和验证
- **Priority**: P0
- **Depends On**: 所有任务
- **Description**: 
  - 单元测试：权限服务、数据权限过滤
  - 集成测试：API权限控制、数据过滤效果
  - 手动测试：菜单和按钮权限显示
  - 手动测试：权限管理界面功能验证
- **Acceptance Criteria Addressed**: All
- **Test Requirements**:
  - `programmatic` TR-14.1: 所有API权限检查通过
  - `programmatic` TR-14.2: 数据权限过滤正确
  - `human-judgment` TR-14.3: 菜单和按钮权限显示正确
  - `human-judgment` TR-14.4: 权限管理界面功能正常
- **Notes**: 需要覆盖所有角色场景

## 角色层级和数据权限范围对照表

| 角色 | 代码 | 层级(Level) | 数据权限范围(DataScope) | 说明 |
|------|------|-------------|------------------------|------|
| 顾问 | consultant | 1 | self | 只能看到自己录入的候选人 |
| 主管 | supervisor | 2 | subordinate | 能看到自己和下属顾问的数据 |
| 经理 | manager | 3 | subordinate | 能看到自己和下属主管、顾问的数据 |
| 总监 | director | 4 | subordinate | 能看到自己和下属经理、主管、顾问的数据 |
| 管理员 | admin | 5 | global | 能看到所有数据 |

## 权限点分类

### 菜单权限
- menu_dashboard: 仪表盘
- menu_candidates: 候选录入
- menu_exam: 机考管理
- menu_test: 韧测管理
- menu_interview: 面试管理
- menu_employee: 员工管理
- menu_users: 用户管理
- menu_business_lines: 业务线管理
- menu_exam_papers: 试卷管理
- menu_stage_config: 阶段配置
- menu_statistics: 统计报表
- menu_role_management: 角色管理
- menu_permission_management: 权限管理
- menu_role_permission: 角色权限配置
- menu_user_role: 用户角色分配

### 按钮权限
- btn_candidate_create: 创建候选人
- btn_candidate_edit: 编辑候选人
- btn_candidate_delete: 删除候选人
- btn_candidate_advance: 推进阶段
- btn_candidate_push_interview: 面推
- btn_user_create: 创建用户
- btn_user_edit: 编辑用户
- btn_user_delete: 删除用户
- btn_business_line_create: 创建业务线
- btn_business_line_edit: 编辑业务线
- btn_business_line_delete: 删除业务线

## 预设角色权限分配

### 顾问 (consultant)
- 菜单: dashboard, candidates, exam, test, interview, employee, statistics
- 按钮: candidate_create, candidate_edit, candidate_advance, candidate_push_interview

### 主管 (supervisor)
- 菜单: dashboard, candidates, exam, test, interview, employee, statistics
- 按钮: candidate_create, candidate_edit, candidate_delete, candidate_advance, candidate_push_interview

### 经理 (manager)
- 菜单: dashboard, candidates, exam, test, interview, employee, users, business_lines, exam_papers, stage_config, statistics
- 按钮: candidate_create, candidate_edit, candidate_delete, candidate_advance, candidate_push_interview, user_create, user_edit, business_line_create, business_line_edit

### 总监 (director)
- 菜单: dashboard, candidates, exam, test, interview, employee, users, business_lines, exam_papers, stage_config, statistics
- 按钮: candidate_create, candidate_edit, candidate_delete, candidate_advance, candidate_push_interview, user_create, user_edit, user_delete, business_line_create, business_line_edit, business_line_delete

### 管理员 (admin)
- 菜单: 所有
- 按钮: 所有
