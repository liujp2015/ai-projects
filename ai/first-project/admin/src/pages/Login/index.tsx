import { Form, Input, Button, message } from 'antd';
import { history } from '@umijs/max';
import { request } from '@umijs/max';

export default function LoginPage() {
  const onFinish = async (values: any) => {
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        data: values,
      });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      message.success('登录成功');
      history.push('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: 400 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>管理后台登录</h1>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}



