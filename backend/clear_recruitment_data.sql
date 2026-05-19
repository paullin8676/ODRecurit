-- ===========================================
-- 清空招聘过程从候选录入到入职的所有数据和停留明细数据
-- ===========================================

-- 注意：删除顺序很重要，需要考虑外键约束

-- 1. 删除面试轮次表数据
DELETE FROM interview_round;

-- 2. 删除面试表数据
DELETE FROM interview;

-- 3. 删除机考表数据
DELETE FROM exam;

-- 4. 删除韧测表数据
DELETE FROM test;

-- 5. 删除员工表数据
DELETE FROM employee;

-- 6. 删除候选人阶段时间线表（停留明细数据）
DELETE FROM candidate_stage_timeline;

-- 7. 删除候选人阶段表数据
DELETE FROM candidate_stage;

-- 8. 删除候选人表数据
DELETE FROM candidate;

-- ===========================================
-- 完成
-- ===========================================
