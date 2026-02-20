import { Table, Button, Space, Input, Select, message, Popconfirm } from "antd";
import { history } from "@umijs/max";
import { useRequest, request } from "@umijs/max";
import { useState } from "react";

const { Search } = Input;

export default function ProductsList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<any>({});

  const { data, loading, refresh } = useRequest("/products", {
    params: { page, limit: 10, ...filters },
  });

  const { data: brands } = useRequest("/brands");
  const { data: categories } = useRequest("/categories");

  // 兜底为数组，避免接口包装对象时 map 报错
  const brandOptions = Array.isArray(
    brands?.data?.data ?? brands?.data ?? brands
  )
    ? (brands?.data?.data ?? brands?.data ?? brands)
    : [];
  const categoryOptions = Array.isArray(
    categories?.data?.data ?? categories?.data ?? categories
  )
    ? (categories?.data?.data ?? categories?.data ?? categories)
    : [];

  const productList = Array.isArray(data?.data?.data ?? data?.data ?? data)
    ? (data?.data?.data ?? data?.data ?? data)
    : [];
  const total = data?.data?.total ?? data?.total ?? 0;

  const handleDelete = async (id: string) => {
    try {
      await request(`/products/${id}`, { method: "DELETE" });
      message.success("删除成功");
      refresh();
    } catch (error: any) {
      message.error("删除失败");
    }
  };

  const handlePush = async (id: string) => {
    try {
      await request(`/products/${id}/push`, { method: "POST" });
      message.success("推送成功");
    } catch (error: any) {
      message.error("推送失败");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "原价",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: "折扣价",
      dataIndex: "discountPrice",
      key: "discountPrice",
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: "平台",
      dataIndex: "platform",
      key: "platform",
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: any) => (
        <span>{record.isHidden ? "隐藏" : "显示"}</span>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => history.push(`/products/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button size="small" onClick={() => handlePush(record.id)}>
            推送
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
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Button type="primary" onClick={() => history.push("/products/create")}>
          添加商品
        </Button>
        <Search
          placeholder="搜索商品"
          style={{ width: 300 }}
          onSearch={(value) => setFilters({ ...filters, search: value })}
        />
        <Select
          placeholder="选择品牌"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, brandId: value })}
        >
          {brandOptions.map((brand: any) => (
            <Select.Option key={brand.id} value={brand.id}>
              {brand.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="选择分类"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, categoryId: value })}
        >
          {categoryOptions.map((category: any) => (
            <Select.Option key={category.id} value={category.id}>
              {category.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={productList}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
        }}
      />
    </div>
  );
}
