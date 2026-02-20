import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Popconfirm } from 'antd';
import { useRequest, request } from '@umijs/max';
import { useState } from 'react';

export default function Banners() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest('/banners');

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await request(`/banners/${editingId}`, {
          method: 'PUT',
          data: values,
        });
        message.success('更新成功');
      } else {
        await request('/banners', {
          method: 'POST',
          data: values,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      setEditingId(null);
      form.resetFields();
      refresh();
    } catch (error: any) {
      message.error('操作失败');
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request(`/banners/${id}`, { method: 'DELETE' });
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => (
        <img src={url} alt="" style={{ width: 100, height: 50, objectFit: 'cover' }} />
      ),
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (isActive ? '启用' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
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
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          添加Banner
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data || []}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title={editingId ? '编辑Banner' : '添加Banner'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="标题">
            <Input placeholder="Banner标题" />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="图片URL"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input placeholder="图片地址" />
          </Form.Item>
          <Form.Item name="link" label="链接">
            <Input placeholder="跳转链接" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setModalVisible(false);
                setEditingId(null);
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

