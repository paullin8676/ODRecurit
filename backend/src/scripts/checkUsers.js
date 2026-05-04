const { sequelize, User } = require('../models');

async function checkUsers() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'password', 'role', 'realName']
    });

    console.log('=== 用户列表 ===');
    users.forEach(user => {
      console.log(`\n用户名: ${user.username}`);
      console.log(`密码: ${user.password}`);
      console.log(`角色: ${user.role}`);
      console.log(`真实姓名: ${user.realName}`);
      console.log(`密码长度: ${user.password.length}`);
      console.log(`密码是否加密: ${user.password.length > 30 ? '是' : '否'}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
