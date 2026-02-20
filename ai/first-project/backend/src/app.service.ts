import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '返利折扣网 API 服务运行中';
  }
}



