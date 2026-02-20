import { Card, Row, Col, Statistic } from 'antd';

export default function Dashboard() {
  return (
    <div>
      <h1>仪表盘</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="总用户数" value={1128} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="商品总数" value={932} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="订单总数" value={1128} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日订单" value={93} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}



