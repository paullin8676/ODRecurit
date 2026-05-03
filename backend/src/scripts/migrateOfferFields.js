const { sequelize } = require('../models');
const { Interview, InterviewRound } = require('../models');

const STAGE_ORDER = {
  'recommend_interview': 0,
  'qualification_interview': 1,
  'tech_interview_1': 2,
  'tech_interview_2': 3,
  'manager_interview': 4,
  'approval': 5,
  'offer': 6
};

const migrateOfferFields = async () => {
  try {
    console.log('开始迁移 offer 字段...');

    // 使用原始 SQL 查询获取数据，因为模型可能字段名不匹配
    const [interviews] = await sequelize.query("SELECT * FROM Interview");
    console.log(`找到 ${interviews.length} 条 Interview 记录`);

    // 遍历每条记录
    for (const interview of interviews) {
      console.log(`处理 Interview ID ${interview.id}...`);

      // 检查是否有 offer 相关字段有值（处理下划线命名的字段）
      const hasOfferDate = interview.offer_date !== null || interview.offerDate !== null;
      const hasOfferApprover = 
        (interview.offer_approver !== null && interview.offer_approver !== '') || 
        (interview.offerApprover !== null && interview.offerApprover !== '');
      const hasOfferRemark = 
        (interview.offer_remark !== null && interview.offer_remark !== '') || 
        (interview.offerRemark !== null && interview.offerRemark !== '');

      // 如果有任何 offer 相关字段的值，创建或更新 InterviewRound 记录
      if (hasOfferDate || hasOfferApprover || hasOfferRemark) {
        console.log(`  - 有 offer 相关数据，迁移到 InterviewRound`);

        // 查找或创建 offer 阶段的 InterviewRound
        const [existingRounds] = await sequelize.query(`
          SELECT * FROM InterviewRound 
          WHERE interview_id = ${interview.id} AND stage_code = 'offer'
        `);

        let offerRound = existingRounds[0];

        if (!offerRound) {
          // 创建新的 offer 阶段记录
          const now = new Date().toISOString();
          await sequelize.query(`
            INSERT INTO InterviewRound 
            (interview_id, stage_code, stage_index, created_at, updated_at)
            VALUES (${interview.id}, 'offer', ${STAGE_ORDER['offer']}, '${now}', '${now}')
          `);
          console.log(`  - 创建了新的 offer 阶段记录`);

          // 获取刚创建的记录
          const [newRounds] = await sequelize.query(`
            SELECT * FROM InterviewRound 
            WHERE interview_id = ${interview.id} AND stage_code = 'offer'
          `);
          offerRound = newRounds[0];
        } else {
          console.log(`  - 已存在 offer 阶段记录，进行更新`);
        }

        // 构建更新语句
        const updates = [];
        if (hasOfferDate) {
          const dateValue = interview.offer_date || interview.offerDate;
          const dateStr = dateValue ? `'${new Date(dateValue).toISOString()}'` : 'NULL';
          updates.push(`scheduled_date = ${dateStr}`);
        }
        if (hasOfferApprover) {
          const approverValue = interview.offer_approver || interview.offerApprover;
          const approverStr = approverValue ? `'${approverValue.replace(/'/g, "''")}'` : 'NULL';
          updates.push(`interviewer = ${approverStr}`);
        }
        if (hasOfferRemark) {
          const remarkValue = interview.offer_remark || interview.offerRemark;
          const remarkStr = remarkValue ? `'${remarkValue.replace(/'/g, "''")}'` : 'NULL';
          updates.push(`content = ${remarkStr}`);
        }

        if (updates.length > 0) {
          await sequelize.query(`
            UPDATE InterviewRound 
            SET ${updates.join(', ')}, updated_at = '${new Date().toISOString()}'
            WHERE id = ${offerRound.id}
          `);
          console.log(`  - 更新了字段: ${updates.map(u => u.split('=')[0]).join(', ')}`);
        }
      }
    }

    console.log('');
    console.log('开始删除 Interview 表中的 offer 相关列...');

    // 检查 offer 相关列是否存在
    const [columns] = await sequelize.query("PRAGMA table_info(Interview)");
    const columnNames = columns.map(c => c.name);

    const hasOfferColumns = 
      columnNames.includes('offer_date') || 
      columnNames.includes('offer_approver') || 
      columnNames.includes('offer_remark') ||
      columnNames.includes('offerDate') || 
      columnNames.includes('offerApprover') || 
      columnNames.includes('offerRemark');

    if (hasOfferColumns) {
      // SQLite 不支持直接删除列，需要重建表
      console.log('  - 重建 Interview 表以删除 offer 相关列...');

      // 1. 创建临时表
      await sequelize.query(`
        CREATE TABLE Interview_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          candidateProductLineId INTEGER NOT NULL,
          currentStage VARCHAR(50) NOT NULL DEFAULT 'recommend_interview',
          finalStatus VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL
        )
      `);

      // 2. 复制数据
      await sequelize.query(`
        INSERT INTO Interview_temp (id, candidateProductLineId, currentStage, finalStatus, created_at, updated_at)
        SELECT id, candidateProductLineId, currentStage, finalStatus, created_at, updated_at FROM Interview
      `);

      // 3. 删除原表
      await sequelize.query("DROP TABLE Interview");

      // 4. 重命名临时表
      await sequelize.query("ALTER TABLE Interview_temp RENAME TO Interview");

      console.log('  - Interview 表重建完成');
    } else {
      console.log('  - offer 相关列已不存在，跳过');
    }

    console.log('');
    console.log('迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
};

migrateOfferFields();
