const { sequelize } = require('../models');

async function addColumns() {
  try {
    console.log('Checking and adding columns...');
    
    // 检查表结构
    const [columns] = await sequelize.query('PRAGMA table_info(Interview)');
    const columnNames = columns.map(c => c.name);
    console.log('Existing columns:', columnNames);
    
    const columnsToAdd = [
      { name: 'offerDate', type: 'DATETIME' },
      { name: 'offerApprover', type: 'VARCHAR(100)' },
      { name: 'offerRemark', type: 'TEXT' }
    ];
    
    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        await sequelize.query(`ALTER TABLE Interview ADD COLUMN ${col.name} ${col.type}`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addColumns();
