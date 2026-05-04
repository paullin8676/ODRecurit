const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../recruit.db');
const db = new sqlite3.Database(dbPath);

console.log('检查数据库表...\n');

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log('现有表:');
  tables.forEach(table => {
    console.log('  -', table.name);
  });
  
  db.close();
});
