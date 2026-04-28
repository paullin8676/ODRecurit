# 韧测管理和面试管理问题修复 - 验证检查清单

## 问题1: 韧测管理面推后记录保留

### 前端验证
- [x] 面推后候选人记录仍然显示在韧测管理界面 (修改 TestStage.vue 过滤逻辑)
- [ ] 面推对话框可以选择未推荐过的产品线
- [ ] 面推后可以再次点击面推按钮推荐到其他产品线
- [ ] 不同产品线的面推记录相互独立

### 数据验证
- [ ] 每条面推记录正确关联到对应的产品线
- [ ] 面试管理界面显示所有面推记录（包括不同产品线的）

## 问题2: 面试管理查看/编辑显示产品线和客户负责人

### 后端验证
- [x] interview.js GET /interviews 返回 productLineId 和 clientOwner 字段
- [x] interview.js GET /interviews/candidate/:id 返回 productLineId 和 clientOwner 字段
- [x] interview.js POST /interviews 返回 productLineId 和 clientOwner 字段

### 前端验证
- [x] InterviewStage.vue handleView 正确使用 interview.clientOwner 字段
- [ ] 点击查看按钮后弹框正确显示产品线字段
- [ ] 点击查看按钮后弹框正确显示客户负责人字段
- [ ] 弹框中产品线和客户负责人与表格记录一致
- [ ] 点击编辑按钮后弹框正确显示产品线字段
- [ ] 点击编辑按钮后弹框正确显示客户负责人字段
- [ ] 编辑后产品线和客户负责人可以正确保存
- [ ] 编辑时产品线和客户负责人字段可正常修改

## 回归测试
- [ ] 韧测管理的推进功能正常
- [ ] 面试管理的其他字段查看/编辑功能正常
- [ ] 面推功能与现有系统兼容
