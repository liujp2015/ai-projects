import { Table, Button, Space, Input, Select, message } from 'antd';
import { useRequest } from '@umijs/max';
import { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';

const { Search } = Input;

export default function Orders() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<any>({});

  const { data, loading } = useRequest('/orders', {
    params: { page, limit: 10, ...filters },
  });

  const handleExport = () => {
    message.info('导出功能待实现');
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.email || '-',
    },
    {
      title: '商品',
      dataIndex: 'product',
      key: 'product',
      render: (product: any) => product?.title || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Search
          placeholder="搜索订单号"
          style={{ width: 300 }}
          onSearch={(value) => setFilters({ ...filters, search: value })}
        />
        <Select
          placeholder="订单状态"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="pending">待处理</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出订单
        </Button>
      </div>
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
    </div>
  );
}



