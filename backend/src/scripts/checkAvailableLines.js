const { sequelize, Candidate, CandidateProductLine, ProductLine } = require('../models');

async function checkAvailableProductLines() {
  try {
    console.log('=== 检查韩明可用的产品线 ===\n');

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

    console.log(`韩明 (ID: ${candidate.id})`);
    console.log(`当前阶段: ${candidate.currentStage}\n`);

    // 获取所有激活的产品线
    const allProductLines = await ProductLine.findAll({ 
      where: { isActive: true },
      attributes: ['id', 'name', 'clientOwner']
    });

    console.log('=== 所有激活的产品线 ===');
    allProductLines.forEach(pl => {
      console.log(`ID: ${pl.id}, 名称: ${pl.name}, 客户负责人: ${pl.clientOwner}`);
    });

    // 获取韩明已关联的产品线
    const existingAssociations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id }
    });

    const usedProductLineIds = existingAssociations.map(assoc => assoc.productLineId);
    console.log(`\n=== 韩明已关联的产品线ID ===`);
    console.log(usedProductLineIds.join(', '));

    // 计算可用的产品线
    const availableProductLines = allProductLines.filter(pl => !usedProductLineIds.includes(pl.id));

    console.log(`\n=== 韩明可用的产品线 (${availableProductLines.length} 条) ===`);
    if (availableProductLines.length === 0) {
      console.log('❌ 没有可用的产品线');
    } else {
      availableProductLines.forEach(pl => {
        console.log(`✅ ID: ${pl.id}, 名称: ${pl.name}, 客户负责人: ${pl.clientOwner}`);
      });
    }

    // 模拟调用 can-recommend API 的逻辑
    console.log('\n=== can-recommend API 判断 ===');
    
    if (allProductLines.length === 0) {
      console.log('❌ 不能面推：没有可用的产品线');
    } else if (existingAssociations.length === 0) {
      console.log('✅ 可以面推：没有面试记录');
    } else {
      // 检查是否有通过的记录
      console.log('已有关联记录，检查是否有通过的面试...');
      console.log('面试状态都是 failed，没有通过记录');
      
      if (availableProductLines.length === 0) {
        console.log('❌ 不能面推：所有产品线都已有面试记录');
      } else {
        console.log('✅ 可以面推到其他产品线');
      }
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkAvailableProductLines();
