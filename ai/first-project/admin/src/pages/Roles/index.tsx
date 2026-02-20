import { Table, Button, Space, Modal, Form, Input, Tree, message, Popconfirm } from 'antd';
import { useRequest, request } from '@umijs/max';
import { useState } from 'react';

export default function Roles() {
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: roles, loading, refresh } = useRequest('/roles');
  const { data: permissions } = useRequest('/permissions');

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await request(`/roles/${editingId}`, {
          method: 'PUT',
          data: values,
        });
        message.success('更新成功');
      } else {
        await request('/roles', {
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

  const handleAssignPermissions = async (values: any) => {
    try {
      await request(`/roles/${editingId}/permissions`, {
        method: 'POST',
        data: { permissionIds: values.permissionIds },
      });
      message.success('权限分配成功');
      setPermissionModalVisible(false);
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
      await request(`/roles/${id}`, { method: 'DELETE' });
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
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            size="small"
            onClick={() => {
              setEditingId(record.id);
              const role = roles?.find((r: any) => r.id === record.id);
              const checkedKeys = role?.permissions?.map((p: any) => p.permissionId) || [];
              permissionForm.setFieldsValue({ permissionIds: checkedKeys });
              setPermissionModalVisible(true);
            }}
          >
            分配权限
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

  const treeData = permissions?.map((perm: any) => ({
    title: `${perm.name} (${perm.code})`,
    key: perm.id,
  }));

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
          添加角色
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={roles || []}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title={editingId ? '编辑角色' : '添加角色'}
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
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="角色名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="角色描述" />
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
      <Modal
        title="分配权限"
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          permissionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={permissionForm} onFinish={handleAssignPermissions} layout="vertical">
          <Form.Item
            name="permissionIds"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              treeData={treeData}
              defaultCheckedKeys={permissionForm.getFieldValue('permissionIds')}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setPermissionModalVisible(false);
                permissionForm.resetFields();
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



