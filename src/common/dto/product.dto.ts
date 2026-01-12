import { IsString, IsOptional, IsNumber, IsUrl } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sourceId: string;

  @IsUrl()
  sourceUrl: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  author: string;

  @IsNumber()
  @IsOptional()
  price: number;

  @IsString()
  @IsOptional()
  currency: string;

  @IsUrl()
  @IsOptional()
  imageUrl: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  categoryId: string;
}

export class ProductResponseDto {
  id: string;
  title: string;
  author: string;
  price: number;
  currency: string;
  imageUrl: string;
  sourceUrl: string;
  ratingsAvg: number;
  reviewsCount: number;
}

export class ProductDetailDto extends ProductResponseDto {
  description: string;
  reviews: ReviewDto[];
}

export class ReviewDto {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: Date;
}
