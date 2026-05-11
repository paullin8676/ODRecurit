const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('开始迁移：在 interview_round 表中添加 entry_date 字段...');

db.serialize(() => {
  // 检查字段是否已存在
  db.all("PRAGMA table_info(interview_round)", (err, columns) => {
    if (err) {
      console.error('检查表结构时出错:', err);
      return;
    }
    
    const hasEntryDate = columns.some(col => col.name === 'entry_date');
    
    if (hasEntryDate) {
      console.log('entry_date 字段已存在，无需迁移');
      db.close();
      return;
    }
    
    // 添加字段
    db.run("ALTER TABLE interview_round ADD COLUMN entry_date DATETIME", (err) => {
      if (err) {
        console.error('添加字段时出错:', err);
      } else {
        console.log('✓ 成功添加 entry_date 字段到 interview_round 表');
      }
      db.close();
    });
  });
});
