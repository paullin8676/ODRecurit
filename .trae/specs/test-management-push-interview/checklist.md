# 韧测管理面推功能 - 验证检查清单

## 前端验证
- [x] 韧测完成及之后阶段的候选人显示面推按钮
- [x] 韧测完成及之后阶段的候选人隐藏推进按钮
- [x] 点击面推按钮后对话框正常弹出
- [x] 对话框中显示未被推荐过的产品线列表
- [x] 选择产品线后产品负责人自动填充
- [x] 推荐日期默认为当前日期
- [x] 点击确定按钮后成功创建面试推荐记录
- [x] 操作失败时显示错误提示
- [x] 成功后刷新页面数据

## 后端验证
- [x] GET /candidates/:id/available-product-lines 返回正确的产品线列表
- [x] GET /candidates/:id/available-product-lines 不包含已推荐的产品线
- [x] POST /candidates/:id/push-interview 创建CandidateProductLine记录
- [x] POST /candidates/:id/push-interview 创建Interview记录
- [x] POST /candidates/:id/push-interview 更新候选人阶段为recommend_interview
- [x] 事务回滚功能正常（当任一操作失败时）
- [x] 重复推荐同一产品线时返回错误

## 数据一致性验证
- [x] CandidateProductLine表中正确记录候选人和产品线的关联
- [x] Interview表中正确关联到CandidateProductLine
- [x] 候选人阶段正确更新为推荐面试
- [x] 推荐日期正确存储

## 边界条件验证
- [ ] 候选人没有未推荐的产品线时，面推按钮禁用或提示
- [x] 产品线不存在时返回错误
- [x] 候选人不存在时返回错误