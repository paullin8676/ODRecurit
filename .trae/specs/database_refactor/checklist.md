# 招聘管理系统数据库重构 - 验证检查列表

## 数据库模型验证
- [x] CandidateProductLine表：已删除client_owner字段
- [x] CandidateProductLine表：已将current_stage字段重命名为interview_stage
- [x] Candidate表：已添加entry_date、entry_remark、leave_date、leave_reason、leave_remark字段
- [x] Interview表：已删除entry_date、entry_remark、leave_date、leave_reason、leave_remark字段
- [x] CandidateProductLine表：存在(candidate_id, product_line_id)唯一约束

## 后端API验证
- [x] 创建面试记录API：正确处理interview_stage字段
- [x] 更新面试记录API：正确同步Candidate表的current_stage
- [x] 创建面试记录API：自动从产品线获取client_owner
- [x] 入职/离职字段：正确保存到Candidate表
- [x] 创建面试记录API：验证唯一性约束并返回错误
- [x] 面推API：正确验证所有业务规则

## 业务规则验证
- [x] 入职/离职阶段：不能面推
- [x] 无可用产品线：不能面推
- [x] 当前在推荐面试阶段：不能面推
- [x] 有通过记录：不能面推
- [x] 所有记录未通过：可以面推
- [x] 无面试记录：可以面推

## 前端界面验证
- [x] 面试编辑界面：只显示当前阶段及之前阶段字段
- [x] 面试编辑界面：之前阶段字段不可编辑
- [x] 面试查看界面：所有字段只读
- [x] 客户负责人：正确显示产品线的client_owner值
- [x] 韧测管理：面推按钮显示符合业务规则

## 数据一致性验证
- [x] 面试记录推进时：Candidate表current_stage同步更新
- [x] 入职操作：正确更新Candidate表的entry_date等字段
- [x] 离职操作：正确更新Candidate表的leave_date等字段