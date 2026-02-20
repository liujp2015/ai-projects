import { Module } from '@nestjs/common';
import { ClickRecordsService } from './click-records.service';
import { ClickRecordsController } from './click-records.controller';

@Module({
  controllers: [ClickRecordsController],
  providers: [ClickRecordsService],
  exports: [ClickRecordsService],
})
export class ClickRecordsModule {}

