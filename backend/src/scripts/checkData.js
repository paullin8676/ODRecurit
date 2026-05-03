const { Op, fn, col, literal } = require('sequelize');
const { Candidate, CandidateProductLine } = require('../models');

async function checkData() {
  try {
    console.log('候选人总数:', await Candidate.count());
    
    const stageCounts = await Candidate.findAll({
      attributes: ['currentStage', [fn('COUNT', col('id')), 'count']],
      group: ['currentStage'],
      raw: true
    });
    
    console.log('\n各阶段分布(原始数据):');
    console.log(JSON.stringify(stageCounts, null, 2));
    
    console.log('\n候选人-产品线关联记录数:', await CandidateProductLine.count());
    
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkData().then(() => process.exit(0));
