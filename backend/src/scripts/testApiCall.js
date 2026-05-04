const axios = require('axios');

async function testApiCall() {
  try {
    // 先登录获取 token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功');

    // 测试 can-recommend API
    const recommendResponse = await axios.get('http://localhost:3000/api/candidates/174/can-recommend', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n=== can-recommend API 返回结果 ===');
    console.log(JSON.stringify(recommendResponse.data, null, 2));

    // 测试 tests API
    const testsResponse = await axios.get('http://localhost:3000/api/tests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n=== tests API 返回结果 ===');
    console.log('数据结构:', Object.keys(testsResponse.data));
    if (testsResponse.data.tests) {
      console.log('tests 数组长度:', testsResponse.data.tests.length);
      // 查找韩明的数据
      const hanming = testsResponse.data.tests.find(t => t.name === '韩明');
      if (hanming) {
        console.log('\n韩明的数据:');
        console.log('ID:', hanming.id);
        console.log('当前阶段:', hanming.currentStage);
        console.log('测试记录:', hanming.test ? '有' : '无');
        if (hanming.test) {
          console.log('测试通过:', hanming.test.testPassed);
        }
      } else {
        console.log('\n❌ 未找到韩明的记录');
      }
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

testApiCall();
