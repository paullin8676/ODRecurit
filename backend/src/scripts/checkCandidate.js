const { sequelize, Candidate, CandidateProductLine, Interview } = require('../models');

async function checkCandidate() {
  try {
    console.log('=== 检查韩明的记录 ===\n');

    // 查找韩明
    const candidates = await Candidate.findAll({
      where: {
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%韩明%')
      }
    });

    if (candidates.length === 0) {
      console.log('❌ 未找到韩明的记录');
      return;
    }

    for (const candidate of candidates) {
      console.log(`\n========== ${candidate.name} (ID: ${candidate.id}) ==========`);
      console.log(`候选人当前阶段: ${candidate.currentStage}`);

      // 查找关联的产品线
      const productLines = await CandidateProductLine.findAll({
        where: { candidateId: candidate.id }
      });

      console.log(`\n已关联产品线数量: ${productLines.length}`);

      for (const pl of productLines) {
        console.log(`\n产品线关联 ID: ${pl.id}, productLineId: ${pl.productLineId}`);
        console.log(`  - interviewStage: ${pl.interviewStage}`);

        const interview = await Interview.findOne({
          where: { candidateProductLineId: pl.id }
        });

        if (interview) {
          console.log(`  - Interview ID: ${interview.id}`);
          console.log(`  - Interview currentStage: ${interview.currentStage}`);
          console.log(`  - Interview finalStatus: ${interview.finalStatus}`);
        } else {
          console.log(`  - 无面试记录`);
        }
      }

      console.log('\n=== 面推规则检查 ===');
      console.log('can-recommend API 的 blockedStages:');
      console.log('  recommend_interview, qualification_interview, tech_interview_1,');
      console.log('  tech_interview_2, manager_interview, approval, offer,');
      console.log('  pending_onboarding, entry, leave');

      console.log('\n韩明的情况:');
      console.log(`  1. 候选人当前阶段: ${candidate.currentStage}`);
      console.log(`     - 是否在 blockedStages: ${['recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval', 'offer', 'pending_onboarding', 'entry', 'leave'].includes(candidate.currentStage)}`);

      console.log('\n  2. 已关联产品线: ' + productLines.length + ' 条');

      // 检查是否有通过的面试记录
      let hasPassedRecord = false;
      for (const pl of productLines) {
        const interview = await Interview.findOne({
          where: { candidateProductLineId: pl.id }
        });
        if (interview && interview.finalStatus === 'passed') {
          hasPassedRecord = true;
          break;
        }
      }
      console.log(`     - 是否有通过的面试记录: ${hasPassedRecord}`);

      console.log('\n  3. 已使用的 productLineIds:');
      const usedProductLineIds = productLines.map(pl => pl.productLineId);
      console.log(`     ${usedProductLineIds.join(', ')}`);

      console.log('\n=== 综合判断 ===');
      if (['recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval', 'offer', 'pending_onboarding', 'entry', 'leave'].includes(candidate.currentStage)) {
        console.log('❌ 不能面推：候选人处于面试阶段blockedStages中');
      } else if (hasPassedRecord) {
        console.log('❌ 不能面推：存在通过的面试记录');
      } else {
        console.log('需要检查是否有其他可用产品线...');
      }
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkCandidate();
