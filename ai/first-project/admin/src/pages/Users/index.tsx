import { Table, Button, Space, Modal, Form, Select, message, Popconfirm } from 'antd';
import { useRequest, request } from '@umijs/max';
import { useState } from 'react';

export default function Users() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, loading, refresh } = useRequest('/users', {
    params: { page, limit: 10 },
  });

  const { data: roles } = useRequest('/roles');

  const handleAssignRole = async (values: any) => {
    try {
      await request(`/users/${selectedUserId}/roles`, {
        method: 'POST',
        data: { roleId: values.roleId },
      });
      message.success('角色分配成功');
      setModalVisible(false);
      setSelectedUserId(null);
      form.resetFields();
      refresh();
    } catch (error: any) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await request(`/users/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      refresh();
    } catch (error: any) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            size="small"
            onClick={() => {
              setSelectedUserId(record.id);
              setModalVisible(true);
            }}
          >
            分配角色
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize: 10,
          onChange: setPage,
        }}
      />
      <Modal
        title="分配角色"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedUserId(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleAssignRole} layout="vertical">
          <Form.Item
            name="roleId"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              {roles?.map((role: any) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setModalVisible(false);
                setSelectedUserId(null);
                form.resetFields();
              }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}



