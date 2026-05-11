const { Candidate, Exam, Test, Interview, InterviewRound, ProductLine } = require('../src/models');

async function createTestData() {
  try {
    const productLine = await ProductLine.create({ name: '产品A', description: '测试产品线' });
    console.log('产品线创建成功');

    const candidates = [
      { name: '张三', email: 'zhangsan@test.com', phone: '13800138001', gender: '男', idCard: '110101199001011234', consultantId: 3 },
      { name: '李四', email: 'lisi@test.com', phone: '13800138002', gender: '女', idCard: '110101199001011235', consultantId: 3 },
      { name: '王五', email: 'wangwu@test.com', phone: '13800138003', gender: '男', idCard: '110101199001011236', consultantId: 4 },
    ];
    
    for (const candidateData of candidates) {
      const candidate = await Candidate.create(candidateData);
      console.log('候选人创建:', candidate.name);
      
      await Exam.create({ candidateId: candidate.id, currentStatus: 'pending' });
      await Test.create({ candidateId: candidate.id, currentStatus: 'pending' });
      
      const interview = await Interview.create({ 
        candidateId: candidate.id, 
        productLineId: productLine.id,
        currentStage: 'recommend_interview',
        currentStatus: 'pending'
      });
      
      await InterviewRound.create({
        interviewId: interview.id,
        stageCode: 'recommend_interview',
        stageIndex: 0,
        scheduledDate: new Date(),
        currentStatus: 'pending_filter'
      });
    }
    
    console.log('测试数据创建完成！');
    process.exit(0);
  } catch (error) {
    console.error('创建测试数据失败:', error);
    process.exit(1);
  }
}

createTestData();