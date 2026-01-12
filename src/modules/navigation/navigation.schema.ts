import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Navigation extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: null })
  lastScrapedAt: Date;

  @Prop({ default: 0 })
  productCount: number;
}

export const NavigationSchema = SchemaFactory.createForClass(Navigation);
