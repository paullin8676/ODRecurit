const fs = require('fs');
const path = require('path');
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
  { name: 'candidate', model: Candidate },
  { name: 'candidate_stage', model: CandidateStage },
  { name: 'candidate_stage_timeline', model: CandidateStageTimeline },
  { name: 'exam', model: Exam },
  { name: 'test', model: Test },
  { name: 'interview', model: Interview },
  { name: 'interview_round', model: InterviewRound },
  { name: 'employee', model: Employee }
];

async function backupData() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupData = {};
    const summary = {};
    
    console.log('========================================');
    console.log('开始备份招聘过程数据...');
    console.log('========================================\n');
    
    for (const { name, model } of TABLES) {
      console.log(`正在备份 ${name}...`);
      const records = await model.findAll({ raw: true });
      backupData[name] = records;
      summary[name] = records.length;
      console.log(`  ✓ ${name}: ${records.length} 条记录`);
    }
    
    const fileName = `recruitment_backup_${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    
    console.log('\n========================================');
    console.log('✓ 数据备份完成！');
    console.log('========================================\n');
    console.log('备份摘要:');
    for (const [table, count] of Object.entries(summary)) {
      console.log(`  ${table}: ${count} 条`);
    }
    console.log(`\n备份文件已保存至: ${filePath}`);
    
    const latestPath = path.join(backupDir, 'recruitment_backup_latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`同时已更新最新备份文件: ${latestPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 数据备份失败:', error);
    process.exit(1);
  }
}

backupData();
