const { sequelize } = require('../models');

async function dropOfferColumns() {
  try {
    console.log('开始删除 Interview 表的 offer 相关列...');
    
    // 1. 创建临时表（不包含 offer 相关列）
    console.log('  - 创建临时表...');
    await sequelize.query(`
      CREATE TABLE Interview_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidateProductLineId INTEGER NOT NULL,
        currentStage VARCHAR(50) NOT NULL DEFAULT 'recommend_interview',
        finalStatus VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE (candidateProductLineId)
      )
    `);
    
    // 2. 复制数据（只复制存在的列）
    console.log('  - 复制数据...');
    await sequelize.query(`
      INSERT INTO Interview_temp (id, candidateProductLineId, currentStage, finalStatus, created_at, updated_at)
      SELECT id, candidateProductLineId, currentStage, finalStatus, created_at, updated_at FROM Interview
    `);
    
    // 3. 删除原表
    console.log('  - 删除原表...');
    await sequelize.query('DROP TABLE Interview');
    
    // 4. 重命名临时表
    console.log('  - 重命名临时表...');
    await sequelize.query('ALTER TABLE Interview_temp RENAME TO Interview');
    
    console.log('Interview 表重建完成！');
    
    // 验证
    const [columns] = await sequelize.query('PRAGMA table_info(Interview)');
    console.log('Interview 表当前列:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('删除列失败:', error);
    process.exit(1);
  }
}

dropOfferColumns();
