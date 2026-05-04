const { sequelize, Candidate, CandidateProductLine } = require('../models');

async function checkRecommendDate() {
  try {
    console.log('=== 检查推荐日期是否保存 ===\n');

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
    console.log(`候选人ID: ${candidate.id}\n`);

    // 获取所有关联的产品线
    const associations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id }
    });

    console.log(`关联记录数量: ${associations.length}`);

    associations.forEach((assoc, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log(`  ID: ${assoc.id}`);
      console.log(`  产品线ID: ${assoc.productLineId}`);
      console.log(`  面试阶段: ${assoc.interviewStage}`);
      console.log(`  推荐日期: ${assoc.recommendDate ? new Date(assoc.recommendDate).toLocaleDateString() : '❌ 为空'}`);
      console.log(`  创建时间: ${new Date(assoc.createdAt).toLocaleString()}`);
      console.log(`  更新时间: ${new Date(assoc.updatedAt).toLocaleString()}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkRecommendDate();
