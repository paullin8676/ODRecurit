const { sequelize, User, ProductLine, Candidate, CandidateProductLine, Exam, Test, Interview, ExamStage } = require('../models/index');

const STAGES = [
  'employee_entry',
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
  'entry',
  'leave'
];

const stageNames = {
  employee_entry: '员工录入',
  exam_declare: '机考申报',
  exam_complete: '机考完成',
  test_declare: '韧测申报',
  test_complete: '韧测完成',
  recommend_interview: '推荐面试',
  qualification_interview: '资面安排',
  tech_interview_1: '技术面试(一)',
  tech_interview_2: '技术面试(二)',
  manager_interview: '主管面试',
  approval: '租用审批',
  offer: 'Offer',
  entry: '入职',
  leave: '离职'
};

async function generateTestData() {
  try {
    console.log('开始生成测试数据...\n');
    
    await sequelize.authenticate();
    console.log('数据库连接成功\n');
    
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      console.log('请先运行系统创建默认用户');
      return;
    }
    
    let productLines = await ProductLine.findAll();
    if (productLines.length === 0) {
      console.log('创建产品线...');
      await ProductLine.create({ name: '汽车事业部', clientOwner: '张三', isActive: true });
      await ProductLine.create({ name: '金融事业部', clientOwner: '李四', isActive: true });
      await ProductLine.create({ name: '医疗事业部', clientOwner: '王五', isActive: true });
      productLines = await ProductLine.findAll();
    }
    console.log(`产品线数量: ${productLines.length}\n`);
    
    const candidates = [];
    const stageGroups = {};
    
    STAGES.forEach(stage => {
      stageGroups[stage] = [];
    });
    
    let candidateIndex = 1;
    const baseDate = new Date('2026-01-01');
    
    for (const stage of STAGES) {
      for (let i = 1; i <= 3; i++) {
        const candidateData = {
          name: `测试${stageNames[stage]}${i}号`,
          email: `test_${stage}_${i}@example.com`,
          phone: `138${String(candidateIndex).padStart(8, '0')}`,
          gender: i % 2 === 0 ? 'male' : 'female',
          idCard: `1101011990${String(candidateIndex).padStart(6, '0')}${i % 2 === 0 ? 'X' : '1'}`,
          currentStage: stage,
          lastOperatorId: admin.id
        };
        
        if (stage === 'entry') {
          const entryDate = new Date(baseDate);
          entryDate.setDate(entryDate.getDate() + candidateIndex * 2);
          candidateData.entryDate = entryDate;
        }
        
        if (stage === 'leave') {
          const entryDate = new Date(baseDate);
          entryDate.setDate(entryDate.getDate() + candidateIndex * 2);
          candidateData.entryDate = entryDate;
          
          const leaveDate = new Date(entryDate);
          leaveDate.setMonth(leaveDate.getMonth() + 3);
          candidateData.leaveDate = leaveDate;
          candidateData.leaveReason = '个人原因';
          candidateData.leaveRemark = '正常离职';
        }
        
        const candidate = await Candidate.create(candidateData);
        candidates.push(candidate);
        stageGroups[stage].push(candidate);
        
        console.log(`创建候选人: ${candidateData.name} (${stageNames[stage]})`);
        candidateIndex++;
      }
    }
    
    console.log(`\n共创建 ${candidates.length} 位候选人\n`);
    
    console.log('开始创建面试相关数据...\n');
    
    const interviewStages = [
      'recommend_interview',
      'qualification_interview',
      'tech_interview_1',
      'tech_interview_2',
      'manager_interview',
      'approval',
      'offer',
      'entry',
      'leave'
    ];
    
    for (const stage of interviewStages) {
      const stageCandidates = stageGroups[stage];
      if (!stageCandidates) continue;
      
      for (const candidate of stageCandidates) {
        const productLine = productLines[Math.floor(Math.random() * productLines.length)];
        
        const cpl = await CandidateProductLine.create({
          candidateId: candidate.id,
          productLineId: productLine.id,
          interviewStage: stage,
          recommendDate: new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        const interviewData = {
          candidateProductLineId: cpl.id
        };
        
        const stageIndex = interviewStages.indexOf(stage);
        
        if (stageIndex >= 1) {
          interviewData.qualificationInterviewDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.qualificationInterviewer = '资面顾问' + Math.floor(Math.random() * 10);
          interviewData.qualificationConclusion = '资格面试结论';
          interviewData.qualificationPassed = true;
        }
        
        if (stageIndex >= 2) {
          interviewData.techInterview1Date = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.techInterview1Interviewer = '技一面试官' + Math.floor(Math.random() * 10);
          interviewData.techInterview1Content = '技术面试(一)评价内容';
          interviewData.techInterview1Passed = true;
        }
        
        if (stageIndex >= 3) {
          interviewData.techInterview2Date = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.techInterview2Interviewer = '技二面试官' + Math.floor(Math.random() * 10);
          interviewData.techInterview2Content = '技术面试(二)评价内容';
          interviewData.techInterview2Passed = true;
        }
        
        if (stageIndex >= 4) {
          interviewData.managerInterviewDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.managerInterviewer = '主管面试官' + Math.floor(Math.random() * 10);
          interviewData.managerInterviewContent = '主管面试评价内容';
          interviewData.managerInterviewPassed = true;
        }
        
        if (stageIndex >= 5) {
          interviewData.approvalDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.approver = '审批人' + Math.floor(Math.random() * 10);
          interviewData.approvalRemark = '审批备注';
          interviewData.approvalPassed = true;
        }
        
        if (stageIndex >= 6) {
          interviewData.offerDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
          interviewData.offerApprover = 'Offer审批人' + Math.floor(Math.random() * 10);
          interviewData.offerRemark = 'Offer备注';
        }
        
        await Interview.create(interviewData);
      }
      
      console.log(`为 ${stageNames[stage]} 阶段的 3 位候选人创建了面试数据`);
    }
    
    console.log('\n测试数据生成完成！');
    console.log('\n各阶段数据统计:');
    STAGES.forEach(stage => {
      console.log(`  ${stageNames[stage]}: ${stageGroups[stage].length} 条`);
    });
    
  } catch (error) {
    console.error('生成测试数据时发生错误:', error);
  }
}

generateTestData().then(() => {
  process.exit(0);
});
