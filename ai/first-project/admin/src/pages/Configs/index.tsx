import { Table, Button, Space, Modal, Form, Input, message } from "antd";
import { useRequest, request } from "@umijs/max";
import { useState } from "react";

const { TextArea } = Input;

export default function Configs() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest("/configs");

  const handleSubmit = async (values: any) => {
    try {
      await request(`/configs/${editingKey}`, {
        method: "PUT",
        data: { value: values.value },
      });
      message.success("更新成功");
      setModalVisible(false);
      setEditingKey(null);
      form.resetFields();
      refresh();
    } catch (error: any) {
      message.error("操作失败");
    }
  };

  const handleEdit = (record: any) => {
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "配置键",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "配置值",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Table
        columns={columns}
        dataSource={data || []}
        loading={loading}
        rowKey="key"
      />
      <Modal
        title="编辑配置"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingKey(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="配置键">
            <Input value={editingKey || ""} disabled />
          </Form.Item>
          <Form.Item
            name="value"
            label="配置值"
            rules={[{ required: true, message: "请输入配置值" }]}
          >
            <TextArea rows={4} placeholder="配置值" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setModalVisible(false);
                setEditingKey(null);
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


