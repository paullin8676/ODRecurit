const { sequelize } = require('../models');

const fixInterviewTable = async () => {
  try {
    console.log('检查 Interview 表结构...');

    // 检查 offerDate 列是否存在
    const [results] = await sequelize.query("PRAGMA table_info(Interview)");
    const columns = results.map(col => col.name);

    console.log('当前 Interview 表的列:', columns);

    // 添加缺失的列
    if (!columns.includes('offerDate')) {
      console.log('添加 offerDate 列...');
      await sequelize.query('ALTER TABLE Interview ADD COLUMN offerDate DATETIME');
    }

    if (!columns.includes('offerApprover')) {
      console.log('添加 offerApprover 列...');
      await sequelize.query('ALTER TABLE Interview ADD COLUMN offerApprover VARCHAR(100)');
    }

    if (!columns.includes('offerRemark')) {
      console.log('添加 offerRemark 列...');
      await sequelize.query('ALTER TABLE Interview ADD COLUMN offerRemark TEXT');
    }

    if (!columns.includes('currentStage')) {
      console.log('添加 currentStage 列...');
      await sequelize.query('ALTER TABLE Interview ADD COLUMN currentStage VARCHAR(50) NOT NULL DEFAULT \'recommend_interview\'');
    }

    if (!columns.includes('finalStatus')) {
      console.log('添加 finalStatus 列...');
      await sequelize.query('ALTER TABLE Interview ADD COLUMN finalStatus VARCHAR(20) NOT NULL DEFAULT \'pending\'');
    }

    console.log('检查完成！');

    // 验证修复
    const [verifyResults] = await sequelize.query("PRAGMA table_info(Interview)");
    const updatedColumns = verifyResults.map(col => col.name);
    console.log('修复后 Interview 表的列:', updatedColumns);

    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
};

fixInterviewTable();
