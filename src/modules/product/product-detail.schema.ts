import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductDetail extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, unique: true })
  productId: Types.ObjectId;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: Object, default: {} })
  specs: Record<string, any>; // JSON blob for flexible metadata

  @Prop({ type: Number, default: 0 })
  ratingsAvg: number;

  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @Prop({
    type: [
      {
        id: String,
        author: String,
        rating: { type: Number, min: 1, max: 5 },
        text: String,
        createdAt: Date,
      },
    ],
    default: [],
  })
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    text: string;
    createdAt: Date;
  }>;

  @Prop({
    type: [
      {
        id: String,
        title: String,
        author: String,
        price: Number,
        imageUrl: String,
        sourceUrl: String,
      },
    ],
    default: [],
  })
  relatedProducts: Array<{
    id: string;
    title: string;
    author?: string;
    price: number;
    imageUrl?: string;
    sourceUrl: string;
  }>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; // publisher, isbn, publication_date, etc.

  @Prop({ default: null })
  lastScrapedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductDetailSchema = SchemaFactory.createForClass(ProductDetail);
ProductDetailSchema.index({ productId: 1 });
ProductDetailSchema.index({ lastScrapedAt: -1 });
