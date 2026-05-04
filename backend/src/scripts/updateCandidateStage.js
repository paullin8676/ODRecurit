const { sequelize, Candidate } = require('../models');

async function updateCandidates() {
  try {
    console.log('=== 更新候选人阶段为offer ===\n');

    const names = ['唐静', '冯超', '董琴'];

    for (const name of names) {
      const candidates = await Candidate.findAll({
        where: {
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', `%${name}%`)
        }
      });

      if (candidates.length === 0) {
        console.log(`❌ 未找到: ${name}`);
        continue;
      }

      for (const candidate of candidates) {
        console.log(`\n找到: ${candidate.name} (ID: ${candidate.id})`);
        console.log(`  修改前阶段: ${candidate.currentStage}`);

        await candidate.update({ currentStage: 'offer' });

        console.log(`  ✅ 修改后阶段: offer`);
      }
    }

    console.log('\n🎉 更新完成！');

  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await sequelize.close();
  }
}

updateCandidates();
