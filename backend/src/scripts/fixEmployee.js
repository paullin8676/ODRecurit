const { sequelize, Candidate, CandidateProductLine, Employee } = require('../models');

async function fixEmployee() {
  try {
    // 找到所有在待入职状态但没有员工记录的候选人
    const candidates = await Candidate.findAll({
      where: { currentStage: 'pending_onboarding' }
    });

    for (const candidate of candidates) {
      console.log(`检查候选人: ${candidate.name}`);
      
      const candidateProductLines = await CandidateProductLine.findAll({
        where: { candidateId: candidate.id }
      });

      for (const pl of candidateProductLines) {
        const existingEmployee = await Employee.findOne({
          where: {
            candidateId: candidate.id,
            productLineId: pl.productLineId
          }
        });

        if (!existingEmployee) {
          console.log(`为 ${candidate.name} 创建员工记录...`);
          await Employee.create({
            candidateId: candidate.id,
            productLineId: pl.productLineId,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            gender: candidate.gender,
            idCard: candidate.idCard,
            currentStage: 'pending_onboarding',
            lastOperatorId: candidate.lastOperatorId
          });
          console.log(`✅ 已为 ${candidate.name} 创建员工记录`);
        } else {
          console.log(`✅ ${candidate.name} 已有员工记录`);
        }
      }
    }

    console.log('\n🎉 修复完成！');
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixEmployee();
