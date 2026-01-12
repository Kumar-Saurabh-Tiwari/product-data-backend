import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import {
  TriggerNavigationScrapeDto,
  TriggerCategoryScrapeDto,
  TriggerProductDetailScrapeDto,
  BatchScrapDto,
  RefetchProductDto,
  NavigationItemResponseDto,
  CategoryResponseDto,
  ProductDetailResponseDto,
  ScrapeJobResponseDto,
  BulkScrapeResultDto,
  CacheStatusDto,
  ScraperHealthDto,
} from '@/common/dto/scraper.dto';

/**
 * Scraper API Controller
 * Handles all scraping-related endpoints with validation, error handling, and caching
 */
@Controller('api/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // ========== NAVIGATION ENDPOINTS ==========

  /**
   * GET /api/scraper/navigation/scrape
   * Scrape navigation headings from World of Books homepage
   * Supports caching with custom TTL
   */
  @Get('navigation/scrape')
  @HttpCode(HttpStatus.OK)
  async scrapeNavigation(
    @Query() dto: TriggerNavigationScrapeDto,
  ): Promise<NavigationItemResponseDto[]> {
    const headings = await this.scraperService.scrapeNavigation(dto.siteUrl);
    return headings.map((h, idx) => ({
      id: `nav-${idx}`,
      title: h.title,
      slug: h.title.toLowerCase().replace(/\s+/g, '-'),
      url: h.url,
      productCount: 0,
      lastScrapedAt: new Date(),
    }));
  }

  // ========== CATEGORY ENDPOINTS ==========

  /**
   * POST /api/scraper/category/scrape
   * Scrape a specific category page
   * Returns category with products list
   */
  @Post('category/scrape')
  @HttpCode(HttpStatus.CREATED)
  async scrapeCategory(@Body() dto: TriggerCategoryScrapeDto): Promise<any> {
    const result = await this.scraperService.scrapeCategory(dto.categoryUrl, dto.categoryTitle);
    return {
      id: `cat-${Date.now()}`,
      title: result.title,
      url: result.url,
      productCount: result.count,
      products: result.products.slice(0, 50), // Limit to 50 per response
      lastScrapedAt: new Date(),
    };
  }

  /**
   * GET /api/scraper/category/:categoryId/cache-status
   * Check if category is cached
   */
  @Get('category/:categoryUrl/cache-status')
  async getCategoryCacheStatus(@Param('categoryUrl') categoryUrl: string): Promise<CacheStatusDto> {
    return this.scraperService.getCacheStatus(decodeURIComponent(categoryUrl));
  }

  // ========== PRODUCT ENDPOINTS ==========

  /**
   * POST /api/scraper/product/scrape
   * Scrape a product detail page
   * Extracts full details, reviews, related products, metadata
   */
  @Post('product/scrape')
  @HttpCode(HttpStatus.CREATED)
  async scrapeProductDetail(@Body() dto: TriggerProductDetailScrapeDto): Promise<ProductDetailResponseDto> {
    const result = await this.scraperService.scrapeProductDetail(dto.productUrl, dto.sourceId);
    return {
      id: `prod-${Date.now()}`,
      sourceId: result.sourceId,
      title: result.title || 'Unknown',
      author: result.author,
      price: parseFloat(result.price || '0'),
      currency: 'GBP',
      imageUrl: result.imageUrl,
      sourceUrl: result.sourceUrl,
      description: result.description,
      specs: result.specs || {},
      ratingsAvg: result.ratingAvg || 0,
      reviewsCount: result.reviews?.length || 0,
      lastScrapedAt: result.lastScrapedAt,
      reviews: (result.reviews || []).map((r, idx) => ({
        id: `rev-${idx}`,
        author: r.author || 'Anonymous',
        rating: r.rating || 0,
        text: r.text || '',
        createdAt: new Date(r.createdAt),
      })),
      relatedProducts: result.relatedProducts || [],
      metadata: result.metadata || {},
    };
  }

  /**
   * POST /api/scraper/product/batch
   * Batch scrape multiple products with concurrency control
   * Handles queuing and rate limiting automatically
   */
  @Post('product/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  async batchScrapeProducts(@Body() dto: BatchScrapDto): Promise<BulkScrapeResultDto> {
    const startTime = Date.now();

    const productUrls = dto.products.map((p) => ({
      url: p.productUrl,
      sourceId: p.sourceId,
    }));

    const result = await this.scraperService.batchScrape(
      productUrls,
      dto.concurrency || 3,
      dto.delayMs || 1000,
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      jobId: `batch-${Date.now()}`,
      total: (result as any).stats.total,
      successful: (result as any).stats.successCount,
      failed: (result as any).stats.failureCount,
      cached: 0, // Would track cache hits separately
      jobs: (result as any).successful.map((p: any, idx: number) => ({
        id: `job-${idx}`,
        targetUrl: p.sourceUrl,
        targetType: 'product_detail',
        status: 'completed',
        startedAt: new Date(startTime),
        finishedAt: new Date(endTime),
        duration: duration / (result as any).stats.total, // Average duration
        resultCount: 1,
      })),
      startedAt: new Date(startTime),
      finishedAt: new Date(endTime),
      duration,
    };
  }

  /**
   * GET /api/scraper/product/:productUrl/cache-status
   * Check if product is cached and how much longer the cache is valid
   */
  @Get('product/cache-status')
  async getProductCacheStatus(@Query('url') productUrl: string): Promise<CacheStatusDto> {
    return this.scraperService.getCacheStatus(productUrl);
  }

  /**
   * POST /api/scraper/product/refetch
   * Force refetch a product (bypass cache)
   * Useful for manual refresh of stale data
   */
  @Post('product/refetch')
  @HttpCode(HttpStatus.CREATED)
  async refetchProduct(@Body() dto: RefetchProductDto): Promise<any> {
    // Clear cache and re-scrape
    this.scraperService.clearCache(dto.sourceUrl);
    
    if (dto.sourceUrl) {
      return this.scraperService.scrapeProductDetail(dto.sourceUrl, dto.productId);
    }

    return { message: 'Refetch initiated', productId: dto.productId };
  }

  // ========== JOB MANAGEMENT ==========

  /**
   * GET /api/scraper/jobs/:jobId
   * Get status of a scrape job
   * Returns job metadata, status, timing, error log if any
   */
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<ScrapeJobResponseDto> {
    return this.scraperService.getJobStatus(jobId);
  }

  // ========== CACHE MANAGEMENT ==========

  /**
   * DELETE /api/scraper/cache
   * Clear all cache or specific URL cache
   * Useful for forcing re-scrapes
   */
  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  async clearCache(@Query('url') url?: string): Promise<any> {
    return this.scraperService.clearCache(url);
  }

  // ========== HEALTH & MONITORING ==========

  /**
   * GET /api/scraper/health
   * Get scraper health status and statistics
   * Shows pending jobs, success rates, cache info
   */
  @Get('health')
  async getHealth(): Promise<ScraperHealthDto> {
    return this.scraperService.getHealth();
  }

  /**
   * GET /api/scraper/stats
   * Alias for health endpoint
   */
  @Get('stats')
  async getStats(): Promise<any> {
    return this.getHealth();
  }
}
