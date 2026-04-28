const { sequelize, Exam, Test, Interview, ExamStage, InterviewStage, CandidateProductLine, Candidate } = require('../models');

const checkTables = async () => {
  try {
    console.log('检查相关表的记录数量...');
    
    // 检查候选人表
    const candidateCount = await Candidate.count();
    console.log(`候选人表记录数: ${candidateCount}`);
    
    // 检查面试表
    const interviewCount = await Interview.count();
    console.log(`面试表记录数: ${interviewCount}`);
    
    // 检查面试与候选人的关联表
    const interviewStageCount = await InterviewStage.count();
    console.log(`面试与候选人的关联表记录数: ${interviewStageCount}`);
    
    // 检查韧测表
    const testCount = await Test.count();
    console.log(`韧测表记录数: ${testCount}`);
    
    // 检查考试表
    const examCount = await Exam.count();
    console.log(`考试表记录数: ${examCount}`);
    
    // 检查考试与候选人的关联表
    const examStageCount = await ExamStage.count();
    console.log(`考试与候选人的关联表记录数: ${examStageCount}`);
    
    // 检查候选人和产品线的关联表
    const candidateProductLineCount = await CandidateProductLine.count();
    console.log(`候选人和产品线的关联表记录数: ${candidateProductLineCount}`);
    
    console.log('检查完成！');
  } catch (error) {
    console.error('检查表时出错:', error);
  } finally {
    await sequelize.close();
  }
};

checkTables();
