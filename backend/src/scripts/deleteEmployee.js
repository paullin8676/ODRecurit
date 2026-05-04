const { sequelize, Employee } = require('../models');

async function deleteEmployee() {
  try {
    console.log('=== 删除唐静的员工记录 ===\n');

    // 查找唐静
    const employees = await Employee.findAll({
      where: {
        name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%唐静%')
      }
    });

    if (employees.length === 0) {
      console.log('❌ 未找到唐静的员工记录');
      return;
    }

    for (const employee of employees) {
      console.log(`找到: ${employee.name} (ID: ${employee.id})`);
      await employee.destroy();
      console.log(`✅ 已删除`);
    }

    console.log('\n🎉 删除完成！');

  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    await sequelize.close();
  }
}

deleteEmployee();
