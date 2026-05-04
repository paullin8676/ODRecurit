const { sequelize } = require('../models');

console.log('开始清理候选人和员工数据...\n');

const tablesToClear = [
  'InterviewRound',
  'Interview',
  'CandidateProductLine',
  'Test',
  'ExamStage',
  'Exam',
  'Employee',
  'Candidate'
];

async function clearAllData() {
  try {
    for (const tableName of tablesToClear) {
      const model = sequelize.models[tableName];
      if (model) {
        const count = await model.count();
        if (count > 0) {
          await model.destroy({ where: {}, truncate: true });
          console.log(`✅ ${tableName}: 删除了 ${count} 条记录`);
        } else {
          console.log(`ℹ️ ${tableName}: 没有数据需要删除`);
        }
      } else {
        console.log(`⚠️ ${tableName}: 模型不存在，跳过`);
      }
    }
    
    console.log('\n🎉 数据清理完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据清理失败:', error);
    process.exit(1);
  }
}

clearAllData();
