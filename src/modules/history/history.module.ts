import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryService } from './history.service';
import { ViewHistory, ViewHistorySchema } from './view-history.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ViewHistory.name, schema: ViewHistorySchema }])],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
