# 面试管理表单修复 - 产品需求文档

## 概述
- **摘要**：修复面试管理模块的两个问题：1）表单 label 的 for 属性不匹配问题；2）Offer 阶段推进时入职信息弹框不显示的问题。
- **目的**：解决表单可访问性警告，确保 Offer 阶段推进功能正常工作。
- **目标用户**：系统管理员、招聘专员

## 问题分析

### 问题一：Label 属性不匹配
- **原因**：在使用 Element Plus 的 `el-form-item` 组件时，同时设置了 `label` 属性和 `#label` 插槽模板
- **后果**：Element Plus 会生成两个 label 元素，一个带有 for 属性指向不存在的 id，导致可访问性警告

### 问题二：Offer 阶段推进弹框不显示
- **原因**：`canAdvance` 函数或 `handleAdvance` 函数可能存在问题
- **预期行为**：当候选人处于 Offer 阶段且 Offer 日期已填写时，点击推进应弹出填写入职信息的对话框

## 修复方案

### 修复一：Label 属性修复
- **方案**：使用自定义 `#label` 模板时，移除 `el-form-item` 的 `label` 属性
- **涉及文件**：InterviewStage.vue

### 修复二：Offer 阶段推进弹框
- **检查点**：
  1. 确认 `canAdvance` 函数对 Offer 阶段的判断逻辑正确
  2. 确认 `handleAdvance` 函数在 Offer 阶段是否正确显示弹框
  3. 检查 `entryDialogVisible` 状态是否正确设置
  4. 确认李四男的 Offer 日期是否已正确填写在数据库中
- **涉及文件**：InterviewStage.vue

## 验收标准

### AC-1：Label 属性修复
- **Given**: 用户点击面试管理的编辑按钮
- **When**: 编辑对话框打开
- **Then**: 控制台不再显示 "The label's for attribute doesn't match any element id" 警告
- **Verification**: `human-judgment`

### AC-2：Offer 阶段推进弹框
- **Given**: 候选人李四男处于 Offer 阶段，Offer 日期已填写
- **When**: 用户点击该记录的推进按钮
- **Then**: 弹出"填写入职信息"对话框，包含入职日期和备注字段
- **Verification**: `human-judgment`

### AC-3：入职信息保存
- **Given**: Offer 阶段推进对话框已弹出
- **When**: 用户填写入职日期并点击确定
- **Then**: 候选人阶段更新为入职阶段，入职日期和备注保存到数据库
- **Verification**: `programmatic`

## 影响范围
- **受影响文件**：InterviewStage.vue
- **相关模块**：面试管理
