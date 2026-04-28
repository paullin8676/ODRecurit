const { Candidate, ExamStage, InterviewStage, ExamPaper, User } = require('./src/models');

// 测试函数
async function testModels() {
  try {
    console.log('=== 开始测试模型 ===');

    // 1. 创建一个候选人
    const candidate = await Candidate.create({
      name: '测试候选人',
      email: 'test@example.com',
      phone: '13800138000',
      gender: '男',
      idCard: '110101199001011234'
    });
    console.log('1. 创建候选人成功:', candidate.toJSON());

    // 2. 创建一个考试试卷（使用唯一名称）
    const examPaperName = `测试试卷-${Date.now()}`;
    const examPaper = await ExamPaper.create({
      name: examPaperName,
      description: '测试用的试卷',
      totalScore: 100
    });
    console.log('2. 创建考试试卷成功:', examPaper.toJSON());

    // 3. 创建一个考试阶段
    const examStage = await ExamStage.create({
      candidateId: candidate.id,
      status: 'completed',
      score: 85.5,
      examDate: new Date(),
      feedback: '表现良好'
    });
    console.log('3. 创建考试阶段成功:', examStage.toJSON());

    // 4. 创建一个面试阶段
    const interviewStage = await InterviewStage.create({
      candidateId: candidate.id,
      stage: 'technical',
      status: 'pending',
      interviewDate: new Date(Date.now() + 86400000) // 明天
    });
    console.log('4. 创建面试阶段成功:', interviewStage.toJSON());

    // 5. 测试关联查询
    const candidateWithStages = await Candidate.findByPk(candidate.id, {
      include: [
        { model: ExamStage },
        { model: InterviewStage }
      ]
    });
    console.log('5. 关联查询候选人及其阶段:', JSON.stringify(candidateWithStages.toJSON(), null, 2));

    // 6. 更新考试阶段
    await examStage.update({
      status: 'passed'
    });
    console.log('6. 更新考试阶段状态成功');

    // 7. 更新面试阶段
    await interviewStage.update({
      status: 'completed',
      score: 90.0,
      feedback: '技术能力优秀'
    });
    console.log('7. 更新面试阶段成功');

    // 8. 再次查询验证更新
    const updatedCandidate = await Candidate.findByPk(candidate.id, {
      include: [
        { model: ExamStage },
        { model: InterviewStage }
      ]
    });
    console.log('8. 更新后查询:', JSON.stringify(updatedCandidate.toJSON(), null, 2));

    console.log('=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
testModels();