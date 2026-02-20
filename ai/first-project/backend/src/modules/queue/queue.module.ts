import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebSocketModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
