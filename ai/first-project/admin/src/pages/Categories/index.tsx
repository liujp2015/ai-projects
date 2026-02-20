import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { useRequest, request } from '@umijs/max';
import { useState } from 'react';

const { TextArea } = Input;

export default function Categories() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest('/categories');

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await request(`/categories/${editingId}`, {
          method: 'PUT',
          data: values,
        });
        message.success('更新成功');
      } else {
        await request('/categories', {
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
      await request(`/categories/${id}`, { method: 'DELETE' });
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
      title: '父分类',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent: any) => parent?.name || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
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
          添加分类
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data || []}
        loading={loading}
        rowKey="id"
        expandable={{
          childrenColumnName: 'children',
        }}
      />
      <Modal
        title={editingId ? '编辑分类' : '添加分类'}
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
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="分类名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="分类描述" />
          </Form.Item>
          <Form.Item name="parentId" label="父分类">
            <Select placeholder="选择父分类" allowClear>
              {data
                ?.filter((cat: any) => cat.id !== editingId)
                .map((category: any) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="排序值" />
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



