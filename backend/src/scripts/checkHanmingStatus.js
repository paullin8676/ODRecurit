const { sequelize, Candidate, CandidateProductLine, Interview } = require('../models');

async function checkHanmingStatus() {
  try {
    console.log('=== 韩明当前面试状态 ===\n');

    // 查找韩明
    const candidate = await Candidate.findOne({
      where: {
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%韩明%')
      }
    });

    if (!candidate) {
      console.log('❌ 未找到韩明的记录');
      return;
    }

    console.log(`候选人: ${candidate.name}`);
    console.log(`候选人ID: ${candidate.id}`);
    console.log(`候选人当前阶段: ${candidate.currentStage}`);
    console.log(`阶段名称: ${getStageName(candidate.currentStage)}`);

    // 获取所有关联的产品线和面试记录
    const associations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id },
      include: [{ model: Interview }]
    });

    console.log(`\n=== 面试记录 (共 ${associations.length} 条) ===`);

    associations.forEach((assoc, index) => {
      console.log(`\n面试 ${index + 1}:`);
      console.log(`  产品线关联ID: ${assoc.id}`);
      console.log(`  产品线ID: ${assoc.productLineId}`);
      console.log(`  面试阶段: ${assoc.interviewStage}`);
      console.log(`  阶段名称: ${getStageName(assoc.interviewStage)}`);

      if (assoc.Interview) {
        console.log(`  面试记录ID: ${assoc.Interview.id}`);
        console.log(`  面试当前阶段: ${assoc.Interview.currentStage}`);
        console.log(`  面试最终状态: ${assoc.Interview.finalStatus}`);
        console.log(`  状态说明: ${getStatusDescription(assoc.Interview.finalStatus)}`);
      } else {
        console.log(`  面试记录: 无`);
      }
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

function getStageName(stage) {
  const stageNames = {
    'candidate_entry': '候选录入',
    'exam_declare': '机考申报',
    'exam_complete': '机考完成',
    'test_declare': '韧测申报',
    'test_complete': '韧测完成',
    'recommend_interview': '推荐面试',
    'qualification_interview': '资面安排',
    'tech_interview_1': '技术面试(一)',
    'tech_interview_2': '技术面试(二)',
    'manager_interview': '主管面试',
    'approval': '租用审批',
    'offer': 'Offer',
    'pending_onboarding': '待入职',
    'entry': '入职',
    'leave': '离职'
  };
  return stageNames[stage] || stage || '-';
}

function getStatusDescription(status) {
  const descriptions = {
    'pending': '待处理',
    'passed': '通过',
    'failed': '未通过'
  };
  return descriptions[status] || status || '-';
}

checkHanmingStatus();
