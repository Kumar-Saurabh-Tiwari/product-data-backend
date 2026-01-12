import { IsString, IsOptional, IsUrl, IsNumber, IsDate } from 'class-validator';

/**
 * Request DTO for creating/updating navigation
 */
export class CreateNavigationDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsUrl()
  url?: string;
}

/**
 * Response DTO for navigation items
 */
export class NavigationResponseDto {
  id: string;
  title: string;
  slug: string;
  url?: string;
  productCount: number;
  lastScrapedAt: Date;
  children?: NavigationResponseDto[];
}

/**
 * Expanded navigation with categories
 */
export class NavigationDetailDto extends NavigationResponseDto {
  categories: CategoryDetailDto[];
}

/**
 * Category detail for navigation view
 */
export class CategoryDetailDto {
  id: string;
  title: string;
  slug: string;
  sourceUrl: string;
  productCount: number;
  children?: CategoryDetailDto[];
}

