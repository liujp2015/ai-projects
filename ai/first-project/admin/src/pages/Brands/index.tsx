import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { useRequest, request } from '@umijs/max';
import { useState } from 'react';

const { TextArea } = Input;

export default function Brands() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest('/brands');

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await request(`/brands/${editingId}`, {
          method: 'PUT',
          data: values,
        });
        message.success('更新成功');
      } else {
        await request('/brands', {
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
      await request(`/brands/${id}`, { method: 'DELETE' });
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
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
          添加品牌
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data || []}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title={editingId ? '编辑品牌' : '添加品牌'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="品牌名称"
            rules={[{ required: true, message: '请输入品牌名称' }]}
          >
            <Input placeholder="品牌名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="品牌描述" />
          </Form.Item>
          <Form.Item name="logo" label="Logo URL">
            <Input placeholder="Logo图片地址" />
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



