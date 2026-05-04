const { sequelize, Candidate, ProductLine, CandidateProductLine, Interview } = require('../models');

async function testCanRecommend(candidateId) {
  try {
    console.log(`=== 测试 can-recommend API (候选人ID: ${candidateId}) ===\n`);

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      console.log('❌ 候选人不存在');
      return;
    }

    console.log(`候选人: ${candidate.name}`);
    console.log(`当前阶段: ${candidate.currentStage}\n`);

    // 2. 检查是否有可用的产品线
    const productLines = await ProductLine.findAll({ where: { isActive: true } });
    console.log(`可用产品线数量: ${productLines.length}`);
    
    if (!productLines || productLines.length === 0) {
      console.log('❌ 没有可用的产品线');
      return;
    }

    // 3. 检查是否已有面试记录
    const existingAssociations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id },
      include: [{ model: Interview }]
    });

    console.log(`已有面试记录数量: ${existingAssociations.length}\n`);

    if (existingAssociations.length === 0) {
      console.log('✅ 可以面推，返回所有可用产品线');
      return;
    }

    // 检查是否有通过的记录
    const hasPassedRecord = existingAssociations.some(assoc => {
      return assoc.Interview && assoc.Interview.finalStatus === 'passed';
    });

    if (hasPassedRecord) {
      console.log('❌ 存在通过的面试记录，不能面推');
      return;
    }

    console.log('✓ 没有通过的面试记录');

    // 检查是否还有产品线没有推荐过
    const usedProductLineIds = existingAssociations.map(assoc => assoc.productLineId);
    console.log(`已使用的产品线ID: ${usedProductLineIds.join(', ')}`);

    const availableProductLines = productLines.filter(pl => !usedProductLineIds.includes(pl.id));
    console.log(`可用产品线数量: ${availableProductLines.length}`);

    if (availableProductLines.length === 0) {
      console.log('❌ 所有产品线都已有面试记录');
    } else {
      console.log('✅ 可以面推到其他产品线');
      availableProductLines.forEach(pl => {
        console.log(`  - ${pl.name}`);
      });
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

testCanRecommend(174);
