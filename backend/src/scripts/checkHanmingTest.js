const { sequelize, Candidate, Test, TestType } = require('../models');

async function checkHanmingTest() {
  try {
    console.log('=== 检查韩明的测试记录 ===\n');

    // 查找韩明
    const candidate = await Candidate.findOne({
      where: {
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%韩明%')
      }
    });

    if (!candidate) {
      console.log('❌ 未找到韩明的记录');
      return;
    }

    console.log(`韩明 (ID: ${candidate.id})`);
    console.log(`当前阶段: ${candidate.currentStage}\n`);

    // 获取测试记录
    const test = await Test.findOne({
      where: { candidateId: candidate.id },
      include: [{ model: TestType, as: 'TestType' }]
    });

    if (!test) {
      console.log('❌ 韩明没有测试记录');
      console.log('\n面推按钮显示条件分析：');
      console.log('1. isAfterTestComplete: true (offer 在 test_complete 之后)');
      console.log('2. canRecommend: 会调用 API 检查');
      console.log('3. test?.testPassed === true: ❌ 没有测试记录');
      console.log('\n结论：因为没有测试记录，面推按钮不会显示');
    } else {
      console.log('=== 测试记录 ===');
      console.log(`ID: ${test.id}`);
      console.log(`测试类型: ${test.TestType?.name || '-'}`);
      console.log(`测试日期: ${test.testDate || '-'}`);
      console.log(`完成日期: ${test.testCompleteDate || '-'}`);
      console.log(`忧虑值: ${test.worryValue || '-'}`);
      console.log(`乐观值: ${test.optimismValue || '-'}`);
      console.log(`一致性: ${test.consistency || '-'}`);
      console.log(`是否通过: ${test.testPassed === true ? '是' : test.testPassed === false ? '否' : '未设置'}`);

      console.log('\n面推按钮显示条件分析：');
      console.log('1. isAfterTestComplete: true (offer 在 test_complete 之后)');
      console.log('2. canRecommend: 需要调用 API 检查');
      console.log(`3. test?.testPassed === true: ${test.testPassed === true ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkHanmingTest();
