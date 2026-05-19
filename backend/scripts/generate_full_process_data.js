const { Candidate, CandidateStage, Exam, Test, Interview, InterviewRound, Employee } = require('../src/models');
const StageService = require('../src/services/stageService');

const STAGES = [
  'candidate_entry',
  'exam_declare',
  'exam_complete',
  'test_declare',
  'test_complete',
  'recommend_interview',
  'qualification_interview',
  'tech_interview_1',
  'tech_interview_2',
  'manager_interview',
  'approval',
  'offer',
  'pending_onboarding',
  'entry'
];

const STAGE_NAMES = {
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
  'entry': '入职'
};

async function generateTestData() {
  try {
    console.log('开始生成全流程测试数据...\n');
    
    const businessLineId = 1;
    const operatorId = 1;
    const consultantId = 3;
    
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i];
      const stageName = STAGE_NAMES[stage];
      const candidateName = `候_${String(i + 1).padStart(2, '0')}_${stageName}`;
      
      console.log(`创建候选人: ${candidateName} (目标阶段: ${stage})`);
      
      const idCard = `1101011990${String(i + 1).padStart(2, '0')}01120${i}`;
      const phone = `138001382${String(i).padStart(2, '0')}`;
      const email = `candidate2${i + 1}@test.com`;
      
      const candidate = await Candidate.create({
        name: candidateName,
        email,
        phone,
        gender: i % 2 === 0 ? '男' : '女',
        idCard,
        lastOperatorId: operatorId
      });
      
      await StageService.initStage(candidate.id, 'candidate_entry', operatorId, consultantId);
      
      const targetIndex = STAGES.indexOf(stage);
      for (let j = 1; j <= targetIndex; j++) {
        const nextStage = STAGES[j];
        
        if (nextStage === 'exam_declare') {
          await Exam.findOrCreate({
            where: { candidateId: candidate.id },
            defaults: {
              issueDate: new Date(),
              currentStatus: 'pending'
            }
          });
        }
        
        if (nextStage === 'test_declare') {
          await Test.findOrCreate({
            where: { candidateId: candidate.id },
            defaults: {
              issueDate: new Date(),
              currentStatus: 'pending'
            }
          });
        }
        
        if (nextStage === 'recommend_interview') {
          const interview = await Interview.create({
            candidateId: candidate.id,
            businessLineId,
            currentStatus: 'progressing'
          });
          
          await InterviewRound.create({
            interviewId: interview.id,
            stageCode: 'recommend_interview',
            stageIndex: STAGES.indexOf('recommend_interview'),
            scheduledDate: new Date(),
            currentStatus: 'completed'
          });
        }
        
        await StageService.updateStage(candidate.id, nextStage, operatorId);
        
        if (nextStage === 'pending_onboarding') {
          await Employee.findOrCreate({
            where: { candidateId: candidate.id },
            defaults: {
              businessLineId,
              entryDate: new Date(),
              updatedBy: operatorId
            }
          });
        }
      }
      
      console.log(`  ✓ ${candidateName} 已设置到 ${stageName} 阶段`);
    }
    
    console.log('\n========================================');
    console.log('✓ 全流程测试数据生成完成！');
    console.log('========================================');
    console.log('\n各阶段数据统计:');
    
    for (const stage of STAGES) {
      const count = await CandidateStage.count({ where: { currentStage: stage } });
      console.log(`  ${STAGE_NAMES[stage]}: ${count} 人`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('生成测试数据失败:', error);
    process.exit(1);
  }
}

generateTestData();
