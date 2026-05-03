const { sequelize, Interview, InterviewRound, CandidateProductLine } = require('../models');

async function migrateInterviewData() {
  try {
    console.log('=== 开始 Interview 数据迁移 ===\n');

    await sequelize.authenticate();
    console.log('数据库连接成功\n');

    console.log('启用外键约束...');
    await sequelize.query('PRAGMA foreign_keys = OFF');
    console.log('外键约束已禁用\n');

    console.log('创建 InterviewRound 表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS InterviewRound (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interview_id INTEGER NOT NULL,
        stage_code VARCHAR(50) NOT NULL,
        stage_index INTEGER NOT NULL,
        scheduled_date DATETIME,
        interviewer VARCHAR(100),
        content TEXT,
        passed TINYINT(1),
        completed_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interview_id) REFERENCES Interview(id),
        UNIQUE(interview_id, stage_code)
      )
    `);
    console.log('InterviewRound 表创建成功\n');

    console.log('添加新列到 Interview 表...');
    try {
      await sequelize.query(`ALTER TABLE Interview ADD COLUMN currentStage VARCHAR(50) NOT NULL DEFAULT 'recommend_interview'`);
      console.log('currentStage 列添加成功');
    } catch (e) {
      console.log('currentStage 列已存在或添加失败:', e.message.split('\n')[0]);
    }

    try {
      await sequelize.query(`ALTER TABLE Interview ADD COLUMN finalStatus VARCHAR(20) NOT NULL DEFAULT 'pending'`);
      console.log('finalStatus 列添加成功');
    } catch (e) {
      console.log('finalStatus 列已存在或添加失败:', e.message.split('\n')[0]);
    }
    console.log('新列添加完成\n');

    const interviews = await sequelize.query('SELECT * FROM Interview', { type: sequelize.QueryTypes.SELECT });
    console.log(`找到 ${interviews.length} 条 Interview 记录\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const interview of interviews) {
      const existingRounds = await sequelize.query(
        `SELECT * FROM InterviewRound WHERE interview_id = ${interview.id}`,
        { type: sequelize.QueryTypes.SELECT }
      );

      if (existingRounds && existingRounds.length > 0) {
        console.log(`Interview ${interview.id} 已有 ${existingRounds.length} 条 Round 记录，跳过`);
        skippedCount++;
        continue;
      }

      const roundsToCreate = [];

      if (interview.qualificationInterviewDate || interview.qualificationInterviewer || interview.qualificationConclusion !== null) {
        roundsToCreate.push({
          interviewId: interview.id,
          stageCode: 'qualification_interview',
          stageIndex: 1,
          scheduledDate: interview.qualificationInterviewDate,
          interviewer: interview.qualificationInterviewer,
          content: interview.qualificationConclusion,
          passed: interview.qualificationPassed,
          completedAt: interview.qualificationInterviewDate ? new Date() : null
        });
      }

      if (interview.techInterview1Date || interview.techInterview1Interviewer || interview.techInterview1Content !== null) {
        roundsToCreate.push({
          interviewId: interview.id,
          stageCode: 'tech_interview_1',
          stageIndex: 2,
          scheduledDate: interview.techInterview1Date,
          interviewer: interview.techInterview1Interviewer,
          content: interview.techInterview1Content,
          passed: interview.techInterview1Passed,
          completedAt: interview.techInterview1Date ? new Date() : null
        });
      }

      if (interview.techInterview2Date || interview.techInterview2Interviewer || interview.techInterview2Content !== null) {
        roundsToCreate.push({
          interviewId: interview.id,
          stageCode: 'tech_interview_2',
          stageIndex: 3,
          scheduledDate: interview.techInterview2Date,
          interviewer: interview.techInterview2Interviewer,
          content: interview.techInterview2Content,
          passed: interview.techInterview2Passed,
          completedAt: interview.techInterview2Date ? new Date() : null
        });
      }

      if (interview.managerInterviewDate || interview.managerInterviewer || interview.managerInterviewContent !== null) {
        roundsToCreate.push({
          interviewId: interview.id,
          stageCode: 'manager_interview',
          stageIndex: 4,
          scheduledDate: interview.managerInterviewDate,
          interviewer: interview.managerInterviewer,
          content: interview.managerInterviewContent,
          passed: interview.managerInterviewPassed,
          completedAt: interview.managerInterviewDate ? new Date() : null
        });
      }

      if (interview.approvalDate || interview.approver || interview.approvalRemark !== null) {
        roundsToCreate.push({
          interviewId: interview.id,
          stageCode: 'approval',
          stageIndex: 5,
          scheduledDate: interview.approvalDate,
          interviewer: interview.approver,
          content: interview.approvalRemark,
          passed: interview.approvalPassed,
          completedAt: interview.approvalDate ? new Date() : null
        });
      }

      if (roundsToCreate.length > 0) {
        for (const round of roundsToCreate) {
          const scheduledDate = round.scheduledDate ? `'${round.scheduledDate}'` : 'NULL';
          const interviewer = round.interviewer ? `'${round.interviewer}'` : 'NULL';
          const content = round.content ? `'${round.content.replace(/'/g, "''")}'` : 'NULL';
          const passed = round.passed !== null ? (round.passed ? 1 : 0) : 'NULL';
          const completedAt = round.completedAt ? `'${round.completedAt}'` : 'NULL';

          await sequelize.query(`
            INSERT INTO InterviewRound (interview_id, stage_code, stage_index, scheduled_date, interviewer, content, passed, completed_at, created_at, updated_at)
            VALUES (${round.interviewId}, '${round.stageCode}', ${round.stageIndex}, ${scheduledDate}, ${interviewer}, ${content}, ${passed}, ${completedAt}, datetime('now'), datetime('now'))
          `);
        }
        console.log(`Interview ${interview.id}: 创建了 ${roundsToCreate.length} 条 Round 记录`);
      } else {
        await sequelize.query(`
          INSERT INTO InterviewRound (interview_id, stage_code, stage_index, created_at, updated_at)
          VALUES (${interview.id}, 'qualification_interview', 1, datetime('now'), datetime('now'))
        `);
        console.log(`Interview ${interview.id}: 无面试数据，创建空的资格面试 Round`);
      }

      migratedCount++;
    }

    console.log(`\n=== 迁移完成 ===`);
    console.log(`总 Interview 记录: ${interviews.length}`);
    console.log(`已迁移: ${migratedCount}`);
    console.log(`已跳过: ${skippedCount}`);

    const [roundCount] = await sequelize.query('SELECT COUNT(*) as count FROM InterviewRound', { type: sequelize.QueryTypes.SELECT });
    console.log(`\n总 InterviewRound 记录: ${roundCount.count}`);

    console.log('\n启用外键约束...');
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('外键约束已启用\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('迁移失败:', error);
    await sequelize.query('PRAGMA foreign_keys = ON').catch(() => {});
    process.exit(1);
  }
}

migrateInterviewData();