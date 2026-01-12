import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ScrapeJob extends Document {
  @Prop({ required: true })
  targetUrl: string;

  @Prop({
    enum: [
      'navigation',
      'category',
      'product',
      'product_detail',
      'reviews',
    ],
    required: true,
  })
  targetType: string;

  @Prop({
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cached'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: null })
  startedAt: Date;

  @Prop({ default: null })
  finishedAt: Date;

  @Prop({ default: 0 })
  duration: number; // milliseconds

  @Prop({ default: null })
  errorLog: string;

  @Prop({ default: 0 })
  resultCount: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ default: 3 })
  maxRetries: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;

  @Prop({ type: String, default: null })
  sessionId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ScrapeJobSchema = SchemaFactory.createForClass(ScrapeJob);
ScrapeJobSchema.index({ targetUrl: 1 });
ScrapeJobSchema.index({ targetType: 1 });
ScrapeJobSchema.index({ status: 1 });
ScrapeJobSchema.index({ createdAt: -1 });
ScrapeJobSchema.index({ finishedAt: 1 });
