const { ProductLine, CandidateProductLine, Candidate } = require('../models/index');

async function updateCandidatesStage() {
  try {
    console.log('开始更新候选人阶段...');
    
    const autoProductLine = await ProductLine.findOne({ 
      where: { name: '汽车事业部' } 
    });
    
    if (!autoProductLine) {
      console.log('未找到"汽车事业部"产品线');
      return;
    }
    
    console.log(`找到汽车事业部产品线，ID: ${autoProductLine.id}`);
    
    const candidateProductLines = await CandidateProductLine.findAll({
      where: { productLineId: autoProductLine.id }
    });
    
    console.log(`找到 ${candidateProductLines.length} 条候选人关联记录`);
    
    const candidateIds = candidateProductLines.map(cpl => cpl.candidateId);
    
    if (candidateIds.length === 0) {
      console.log('没有找到属于汽车事业部的候选人');
      return;
    }
    
    const updatedCandidateCount = await Candidate.update(
      { currentStage: 'entry' },
      { where: { id: candidateIds } }
    );

    console.log(`成功更新 ${updatedCandidateCount[0]} 位候选人的 Candidate.currentStage 为"入职"`);
    
  } catch (error) {
    console.error('更新过程中发生错误:', error);
  }
}

updateCandidatesStage().then(() => {
  console.log('更新操作完成');
  process.exit(0);
});
