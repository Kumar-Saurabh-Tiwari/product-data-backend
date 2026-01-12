import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Navigation' })
  navigationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  sourceUrl: string;

  @Prop({ default: 0 })
  productCount: number;

  @Prop({ default: null })
  lastScrapedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
