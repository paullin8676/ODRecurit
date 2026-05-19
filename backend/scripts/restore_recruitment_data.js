const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');
const { 
  Candidate, 
  CandidateStage, 
  CandidateStageTimeline,
  Exam, 
  Test, 
  Interview, 
  InterviewRound, 
  Employee 
} = require('../src/models');

const TABLES = [
  { name: 'interview_round', model: InterviewRound },
  { name: 'interview', model: Interview },
  { name: 'exam', model: Exam },
  { name: 'test', model: Test },
  { name: 'employee', model: Employee },
  { name: 'candidate_stage_timeline', model: CandidateStageTimeline },
  { name: 'candidate_stage', model: CandidateStage },
  { name: 'candidate', model: Candidate }
];

const INSERT_TABLES = [
  { name: 'candidate', model: Candidate },
  { name: 'candidate_stage', model: CandidateStage },
  { name: 'candidate_stage_timeline', model: CandidateStageTimeline },
  { name: 'exam', model: Exam },
  { name: 'test', model: Test },
  { name: 'interview', model: Interview },
  { name: 'interview_round', model: InterviewRound },
  { name: 'employee', model: Employee }
];

function getBackupFile() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const customPath = path.resolve(args[0]);
    if (fs.existsSync(customPath)) {
      return customPath;
    }
    console.log(`警告: 指定的备份文件不存在: ${customPath}`);
  }
  
  const latestPath = path.join(__dirname, '../backups/recruitment_backup_latest.json');
  if (fs.existsSync(latestPath)) {
    return latestPath;
  }
  
  const backupDir = path.join(__dirname, '../backups');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('recruitment_backup_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      return path.join(backupDir, files[0]);
    }
  }
  
  return null;
}

async function restoreData() {
  const backupFile = getBackupFile();
  
  if (!backupFile) {
    console.error('错误: 未找到备份文件！');
    console.error('\n使用方法:');
    console.error('  node scripts/restore_recruitment_data.js [备份文件路径]');
    console.error('\n或先运行备份:');
    console.error('  node scripts/backup_recruitment_data.js');
    process.exit(1);
  }
  
  console.log(`使用备份文件: ${backupFile}\n`);
  
  let backupData;
  try {
    backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  } catch (error) {
    console.error('解析备份文件失败:', error);
    process.exit(1);
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    console.log('========================================');
    console.log('开始恢复招聘过程数据...');
    console.log('========================================\n');
    
    for (const { name, model } of TABLES) {
      console.log(`正在清空 ${name}...`);
      await model.destroy({ where: {}, transaction, force: true });
      console.log(`  ✓ ${name} 已清空`);
    }
    
    console.log('\n----------------------------------------\n');
    
    for (const { name, model } of INSERT_TABLES) {
      const records = backupData[name] || [];
      if (records.length > 0) {
        console.log(`正在插入 ${name} (${records.length} 条)...`);
        await model.bulkCreate(records, { 
          transaction,
          updateOnDuplicate: ['id']
        });
        console.log(`  ✓ ${name}: ${records.length} 条记录已插入`);
      } else {
        console.log(`跳过 ${name}: 无数据`);
      }
    }
    
    await transaction.commit();
    
    console.log('\n========================================');
    console.log('✓ 数据恢复完成！');
    console.log('========================================\n');
    console.log('恢复摘要:');
    for (const { name } of INSERT_TABLES) {
      const count = (backupData[name] || []).length;
      if (count > 0) {
        console.log(`  ${name}: ${count} 条`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\n✗ 数据恢复失败，已回滚所有变更:', error);
    process.exit(1);
  }
}

restoreData();
