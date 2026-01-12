import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ViewHistory extends Document {
  @Prop({ type: String, default: null })
  sessionId: string;

  @Prop({ required: true })
  path: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ViewHistorySchema = SchemaFactory.createForClass(ViewHistory);
ViewHistorySchema.index({ sessionId: 1, createdAt: -1 });
