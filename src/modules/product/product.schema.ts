import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  sourceId: string;

  @Prop({ required: true, unique: true })
  sourceUrl: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, default: null })
  author: string;

  @Prop({ type: Number, default: null })
  price: number;

  @Prop({ default: 'GBP' })
  currency: string;

  @Prop({ type: String, default: null })
  imageUrl: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  ratingsAvg: number;

  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @Prop({ default: null })
  lastScrapedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ sourceId: 1 });
ProductSchema.index({ sourceUrl: 1 });
ProductSchema.index({ lastScrapedAt: 1 });
