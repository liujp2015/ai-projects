import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import { useRequest, request } from "@umijs/max";
import { useState } from "react";

export default function Storages() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest("/storages");

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await request(`/storages/${editingId}`, {
          method: "PUT",
          data: values,
        });
        message.success("更新成功");
      } else {
        await request("/storages", {
          method: "POST",
          data: values,
        });
        message.success("创建成功");
      }
      setModalVisible(false);
      setEditingId(null);
      form.resetFields();
      refresh();
    } catch (error: any) {
      message.error("操作失败");
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request(`/storages/${id}`, { method: "DELETE" });
      message.success("删除成功");
      refresh();
    } catch (error: any) {
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
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
          添加存储配置
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data || []}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title={editingId ? "编辑存储配置" : "添加存储配置"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="存储配置名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select placeholder="选择存储类型">
              <Select.Option value="aliyun">阿里云OSS</Select.Option>
              <Select.Option value="qiniu">七牛云</Select.Option>
              <Select.Option value="aws">AWS S3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="endpoint" label="Endpoint">
            <Input placeholder="存储服务地址" />
          </Form.Item>
          <Form.Item
            name="accessKey"
            label="Access Key"
            rules={[{ required: true, message: "请输入Access Key" }]}
          >
            <Input placeholder="Access Key" />
          </Form.Item>
          <Form.Item
            name="secretKey"
            label="Secret Key"
            rules={[{ required: true, message: "请输入Secret Key" }]}
          >
            <Input.Password placeholder="Secret Key" />
          </Form.Item>
          <Form.Item name="bucket" label="Bucket">
            <Input placeholder="Bucket名称" />
          </Form.Item>
          <Form.Item name="region" label="Region">
            <Input placeholder="区域" />
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


