import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViewHistory } from './view-history.schema';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(@InjectModel(ViewHistory.name) private historyModel: Model<ViewHistory>) {}

  async recordView(sessionId: string, path: string, metadata: Record<string, any> = {}): Promise<void> {
    const history = new this.historyModel({
      sessionId,
      path,
      metadata,
    });
    await history.save();
  }

  async getHistory(sessionId: string, limit: number = 20): Promise<any[]> {
    const history = await this.historyModel
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return history.map((h) => ({
      path: h.path,
      metadata: h.metadata,
      createdAt: h.createdAt,
    }));
  }
}
