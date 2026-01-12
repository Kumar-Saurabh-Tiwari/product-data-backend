import { IsString, IsOptional, IsUrl, IsNumber, IsMongoId } from 'class-validator';

/**
 * Request DTO for creating category
 */
export class CreateCategoryDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsUrl()
  sourceUrl: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  navigationId?: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

/**
 * Category response DTO
 */
export class CategoryResponseDto {
  id: string;
  title: string;
  slug: string;
  sourceUrl: string;
  productCount: number;
  lastScrapedAt?: Date;
  children?: CategoryResponseDto[];
}

/**
 * Category with products list
 */
export class CategoryWithProductsDto extends CategoryResponseDto {
  products: CategoryProductDto[];
  totalProducts: number;
}

/**
 * Simple product representation in category view
 */
export class CategoryProductDto {
  id: string;
  title: string;
  author?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sourceUrl: string;
}

