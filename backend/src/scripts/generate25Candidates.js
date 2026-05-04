const { sequelize, Candidate, Exam, Test } = require('../models');

console.log('开始生成25个候选人的测试数据...\n');

const candidateNames = [
  // 候选录入阶段 (5个)
  { name: '张小明', phone: '13800010001', stage: 'candidate_entry' },
  { name: '李小红', phone: '13800010002', stage: 'candidate_entry' },
  { name: '王大伟', phone: '13800010003', stage: 'candidate_entry' },
  { name: '赵小芳', phone: '13800010004', stage: 'candidate_entry' },
  { name: '刘强', phone: '13800010005', stage: 'candidate_entry' },
  // 机考申报 (5个)
  { name: '陈刚', phone: '13800010006', stage: 'exam_declare' },
  { name: '杨丽', phone: '13800010007', stage: 'exam_declare' },
  { name: '周军', phone: '13800010008', stage: 'exam_declare' },
  { name: '吴佳', phone: '13800010009', stage: 'exam_declare' },
  { name: '郑勇', phone: '13800010010', stage: 'exam_declare' },
  // 机考完成 (5个)
  { name: '孙莉', phone: '13800010011', stage: 'exam_complete' },
  { name: '马强', phone: '13800010012', stage: 'exam_complete' },
  { name: '朱杰', phone: '13800010013', stage: 'exam_complete' },
  { name: '胡敏', phone: '13800010014', stage: 'exam_complete' },
  { name: '林波', phone: '13800010015', stage: 'exam_complete' },
  // 韧测申报 (5个)
  { name: '何涛', phone: '13800010016', stage: 'test_declare' },
  { name: '高燕', phone: '13800010017', stage: 'test_declare' },
  { name: '罗磊', phone: '13800010018', stage: 'test_declare' },
  { name: '谢敏', phone: '13800010019', stage: 'test_declare' },
  { name: '韩明', phone: '13800010020', stage: 'test_declare' },
  // 韧测完成 (5个)
  { name: '唐静', phone: '13800010021', stage: 'test_complete' },
  { name: '冯超', phone: '13800010022', stage: 'test_complete' },
  { name: '于亮', phone: '13800010023', stage: 'test_complete' },
  { name: '董琴', phone: '13800010024', stage: 'test_complete' },
  { name: '萧文', phone: '13800010025', stage: 'test_complete' }
];

const genders = ['男', '女'];

async function generateTestData() {
  try {
    // 获取admin用户
    const User = sequelize.models.User;
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      console.error('未找到admin用户');
      process.exit(1);
    }

    let createdCount = 0;

    for (let i = 0; i < candidateNames.length; i++) {
      const data = candidateNames[i];
      
      // 创建候选人
      const candidate = await Candidate.create({
        name: data.name,
        phone: data.phone,
        email: `${data.name.toLowerCase().replace(/\s/g, '')}@example.com`,
        gender: genders[i % 2],
        idCard: `1101011990${String(i + 1).padStart(2, '0')}01${String(i + 1).padStart(2, '0')}`,
        currentStage: data.stage,
        lastOperatorId: admin.id
      });
      
      console.log(`✅ 创建候选人: ${data.name} (${data.stage})`);
      createdCount++;

      // 如果在机考相关阶段，创建机考记录
      if (data.stage.startsWith('exam_')) {
        await Exam.create({
          candidateId: candidate.id,
          examPaperId: 1,
          isOnlineExam: true,
          examDate: data.stage === 'exam_complete' ? new Date() : null,
          examCompleteDate: data.stage === 'exam_complete' ? new Date() : null,
          examTotalScore: 100,
          isCheating: false,
          examScore: data.stage === 'exam_complete' ? 75 + Math.floor(Math.random() * 20) : null,
          examPassed: data.stage === 'exam_complete' ? true : null
        });
        console.log(`   └─ 机考记录已创建`);
      }

      // 如果在韧测相关阶段，创建韧测记录
      if (data.stage.startsWith('test_')) {
        await Test.create({
          candidateId: candidate.id,
          testTypeId: 1,
          testDate: data.stage === 'test_complete' ? new Date() : null,
          testCompleteDate: data.stage === 'test_complete' ? new Date() : null,
          worryValue: data.stage === 'test_complete' ? 30 + Math.floor(Math.random() * 20) : null,
          optimismValue: data.stage === 'test_complete' ? 60 + Math.floor(Math.random() * 30) : null,
          consistency: data.stage === 'test_complete' ? 70 + Math.floor(Math.random() * 25) : null,
          testPassed: data.stage === 'test_complete' ? true : null
        });
        console.log(`   └─ 韧测记录已创建`);
      }
    }

    console.log(`\n🎉 测试数据生成完成！共创建了 ${createdCount} 个候选人`);
    console.log('\n数据分布:');
    console.log('  - 候选录入阶段: 5个');
    console.log('  - 机考申报: 5个');
    console.log('  - 机考完成: 5个');
    console.log('  - 韧测申报: 5个');
    console.log('  - 韧测完成: 5个');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据生成失败:', error);
    process.exit(1);
  }
}

generateTestData();
