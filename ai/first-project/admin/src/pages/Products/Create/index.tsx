import { Form, Input, InputNumber, Select, Switch, Button, message } from 'antd';
import { history, useRequest } from '@umijs/max';
import { request } from '@umijs/max';

const { TextArea } = Input;

export default function ProductCreate() {
  const [form] = Form.useForm();

  const { data: brands } = useRequest('/brands');
  const { data: categories } = useRequest('/categories');
  const { data: storages } = useRequest('/storages');

  const onFinish = async (values: any) => {
    try {
      await request('/products', {
        method: 'POST',
        data: values,
      });
      message.success('商品创建成功');
      history.push('/products/list');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>添加商品</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="title"
          label="商品标题"
          rules={[{ required: true, message: '请输入商品标题' }]}
        >
          <Input placeholder="商品标题" />
        </Form.Item>

        <Form.Item name="description" label="商品描述">
          <TextArea rows={4} placeholder="商品描述" />
        </Form.Item>

        <Form.Item
          name="originalPrice"
          label="原价"
          rules={[{ required: true, message: '请输入原价' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="discountPrice"
          label="折扣价"
          rules={[{ required: true, message: '请输入折扣价' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="link"
          label="跳转链接"
          rules={[{ required: true, message: '请输入跳转链接' }]}
        >
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="brandId" label="品牌">
          <Select placeholder="选择品牌" allowClear>
            {brands?.map((brand: any) => (
              <Select.Option key={brand.id} value={brand.id}>
                {brand.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="categoryId" label="分类">
          <Select placeholder="选择分类" allowClear>
            {categories?.map((category: any) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="platform" label="购物平台">
          <Input placeholder="如：淘宝、京东等" />
        </Form.Item>

        <Form.Item name="keywords" label="关键字">
          <Input placeholder="关键字，用逗号分隔" />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="isTop" label="是否置顶" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="isHidden" label="是否隐藏" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => history.back()}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}



