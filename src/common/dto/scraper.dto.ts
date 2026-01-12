import {
  IsString,
  IsUrl,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDate,
  ValidateNested,
  IsJSON,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ========== ENUMS ==========
export enum ScrapeJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CACHED = 'cached',
}

export enum ScrapeTargetType {
  NAVIGATION = 'navigation',
  CATEGORY = 'category',
  PRODUCT = 'product',
  PRODUCT_DETAIL = 'product_detail',
  REVIEWS = 'reviews',
}

// ========== REQUEST DTOs ==========

/**
 * Trigger a navigation scrape
 * GET /api/scraper/navigation/scrape
 */
export class TriggerNavigationScrapeDto {
  @IsOptional()
  @IsString()
  siteUrl?: string = 'https://www.worldofbooks.com/';

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetries?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeoutMs?: number = 30000;
}

/**
 * Trigger a category scrape
 * POST /api/scraper/category/scrape
 */
export class TriggerCategoryScrapeDto {
  @IsString()
  @IsUrl()
  categoryUrl: string;

  @IsString()
  categoryTitle: string;

  @IsString()
  @IsOptional()
  navigationId?: string;

  @IsString()
  @IsOptional()
  parentCategoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetries?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeoutMs?: number = 30000;
}

/**
 * Trigger a product detail scrape
 * POST /api/scraper/product/scrape
 */
export class TriggerProductDetailScrapeDto {
  @IsString()
  @IsUrl()
  productUrl: string;

  @IsString()
  sourceId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetries?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeoutMs?: number = 30000;
}

/**
 * Batch scrape request
 * POST /api/scraper/batch
 */
export class BatchScrapDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriggerProductDetailScrapeDto)
  products: TriggerProductDetailScrapeDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  concurrency?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delayMs?: number = 1000;
}

/**
 * Force refetch product data (bypass cache)
 * POST /api/scraper/refetch
 */
export class RefetchProductDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  sourceUrl?: string;
}

// ========== RESPONSE DTOs ==========

/**
 * Navigation item response
 */
export class NavigationItemResponseDto {
  id: string;
  title: string;
  slug: string;
  url?: string;
  productCount: number;
  lastScrapedAt: Date;
}

/**
 * Category with products info
 */
export class CategoryResponseDto {
  id: string;
  navigationId: string;
  parentId?: string;
  title: string;
  slug: string;
  sourceUrl: string;
  productCount: number;
  lastScrapedAt: Date;
  children?: CategoryResponseDto[];
}

/**
 * Product detail with reviews
 */
export class ProductDetailResponseDto {
  id: string;
  sourceId: string;
  title: string;
  author?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sourceUrl: string;
  description?: string;
  specs?: Record<string, any>;
  ratingsAvg: number;
  reviewsCount: number;
  lastScrapedAt: Date;
  reviews: ProductReviewResponseDto[];
  relatedProducts?: RelatedProductDto[];
  metadata?: Record<string, any>;
}

/**
 * Product review
 */
export class ProductReviewResponseDto {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: Date;
}

/**
 * Related product info
 */
export class RelatedProductDto {
  id: string;
  title: string;
  author?: string;
  price: number;
  imageUrl?: string;
  sourceUrl: string;
}

/**
 * Scrape job status
 */
export class ScrapeJobResponseDto {
  id: string;
  targetUrl: string;
  targetType: ScrapeTargetType;
  status: ScrapeJobStatus;
  startedAt: Date;
  finishedAt?: Date;
  duration?: number; // ms
  errorLog?: string;
  resultCount: number;
}

/**
 * Bulk scrape result
 */
export class BulkScrapeResultDto {
  jobId: string;
  total: number;
  successful: number;
  failed: number;
  cached: number;
  jobs: ScrapeJobResponseDto[];
  startedAt: Date;
  finishedAt: Date;
  duration: number; // ms
}

/**
 * Cache status
 */
export class CacheStatusDto {
  isCached: boolean;
  cachedAt: Date;
  expiresAt: Date;
  ageSeconds: number;
}

/**
 * Health & stats response
 */
export class ScraperHealthDto {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pendingJobs: number;
  completedJobsLast24h: number;
  failedJobsLast24h: number;
  cacheHitRate: number; // %
  avgScrapeDurationMs: number;
  lastCheck: Date;
}

// ========== ERROR DTOs ==========

export class ErrorDetailDto {
  code: string;
  message: string;
  timestamp: Date;
  path?: string;
  details?: Record<string, any>;
}
