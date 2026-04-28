const { sequelize, ProductLine, TestType, ExamPaper, ExamPassLine } = require('../models');

async function deleteDisabledRecords() {
  try {
    console.log('开始删除禁用的记录...');

    // 删除禁用的产品线
    try {
      const productLineCount = await ProductLine.destroy({
        where: { isActive: false }
      });
      console.log(`删除了 ${productLineCount} 条禁用的产品线记录`);
    } catch (error) {
      console.error('删除禁用的产品线记录时出错:', error.message);
    }

    // 删除禁用的测试类型
    try {
      // 先删除关联的测试记录
      const { Test } = require('../models');
      const disabledTestTypes = await TestType.findAll({
        where: { isActive: false }
      });
      const testTypeIds = disabledTestTypes.map(tt => tt.id);
      
      if (testTypeIds.length > 0) {
        const testCount = await Test.destroy({
          where: { testTypeId: testTypeIds }
        });
        console.log(`删除了 ${testCount} 条关联的测试记录`);
      }
      
      // 再删除禁用的测试类型
      const testTypeCount = await TestType.destroy({
        where: { isActive: false }
      });
      console.log(`删除了 ${testTypeCount} 条禁用的测试类型记录`);
    } catch (error) {
      console.error('删除禁用的测试类型记录时出错:', error.message);
    }

    // 删除禁用的考试试卷
    try {
      // 先删除关联的考试记录
      const { Exam } = require('../models');
      const disabledExamPapers = await ExamPaper.findAll({
        where: { isActive: false }
      });
      const examPaperIds = disabledExamPapers.map(ep => ep.id);
      
      if (examPaperIds.length > 0) {
        const examCount = await Exam.destroy({
          where: { examPaperId: examPaperIds }
        });
        console.log(`删除了 ${examCount} 条关联的考试记录`);
      }
      
      // 再删除禁用的考试试卷
      const examPaperCount = await ExamPaper.destroy({
        where: { isActive: false }
      });
      console.log(`删除了 ${examPaperCount} 条禁用的考试试卷记录`);
    } catch (error) {
      console.error('删除禁用的考试试卷记录时出错:', error.message);
    }

    // 删除禁用的机考通过线
    try {
      const examPassLineCount = await ExamPassLine.destroy({
        where: { isCurrent: false }
      });
      console.log(`删除了 ${examPassLineCount} 条禁用的机考通过线记录`);
    } catch (error) {
      console.error('删除禁用的机考通过线记录时出错:', error.message);
    }

    console.log('删除禁用记录完成！');
  } catch (error) {
    console.error('删除禁用记录时出错:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

deleteDisabledRecords();