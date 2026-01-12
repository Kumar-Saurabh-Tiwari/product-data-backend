import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlaywrightCrawler } from 'crawlee';
import { ScrapeJob } from './scrape-job.schema';
import { ProductDetail } from '../product/product-detail.schema';

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // milliseconds
}

/**
 * Rate limiter state
 */
interface RateLimitState {
  requests: number;
  resetTime: number;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimitState: Map<string, RateLimitState> = new Map();
  private activeJobs: Map<string, Promise<any>> = new Map();

  // Configuration
  private readonly CACHE_TTL_MS = 3600000; // 1 hour
  private readonly RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute
  private readonly REQUEST_TIMEOUT_MS = 30000;
  private readonly RETRY_BACKOFF_MS = 2000;

  constructor(
    @InjectModel(ScrapeJob.name) private scrapeJobModel: Model<ScrapeJob>,
    @InjectModel(ProductDetail.name) private productDetailModel: Model<ProductDetail>,
  ) {}

  /**
   * Scrape navigation from World of Books homepage
   */
  async scrapeNavigation(siteUrl: string = 'https://www.worldofbooks.com/'): Promise<any[]> {
    const cacheKey = `nav:${siteUrl}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`Navigation cache hit for ${siteUrl}`);
      return cached;
    }

    this.checkRateLimit('worldofbooks.com');

    const job = await this.createScrapeJob(siteUrl, 'navigation');
    const startTime = Date.now();

    try {
      const headings = await this.executeNavigationCrawl(siteUrl);

      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'completed', headings.length, duration);
      this.setInCache(cacheKey, headings);

      return headings;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'failed', 0, duration, error.message);
      throw error;
    }
  }

  /**
   * Scrape category and products
   */
  async scrapeCategory(categoryUrl: string, categoryTitle: string): Promise<any> {
    const cacheKey = `cat:${categoryUrl}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`Category cache hit for ${categoryUrl}`);
      return cached;
    }

    if (!this.isValidUrl(categoryUrl)) {
      throw new BadRequestException('Invalid category URL');
    }

    this.checkRateLimit('worldofbooks.com');

    const job = await this.createScrapeJob(categoryUrl, 'category');
    const startTime = Date.now();

    try {
      const products = await this.executeCategoryCrawl(categoryUrl);
      const deduped = this.deduplicateProducts(products);

      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'completed', deduped.length, duration);
      this.setInCache(cacheKey, deduped);

      return {
        title: categoryTitle,
        url: categoryUrl,
        products: deduped,
        count: deduped.length,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'failed', 0, duration, error.message);
      throw error;
    }
  }

  /**
   * Scrape product detail with reviews and related products
   */
  async scrapeProductDetail(productUrl: string, sourceId: string): Promise<any> {
    const cacheKey = `prod:${productUrl}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`Product detail cache hit for ${productUrl}`);
      return cached;
    }

    if (!this.isValidUrl(productUrl)) {
      throw new BadRequestException('Invalid product URL');
    }

    this.checkRateLimit('worldofbooks.com');

    const job = await this.createScrapeJob(productUrl, 'product_detail');
    const startTime = Date.now();

    try {
      const details = await this.executeProductDetailCrawl(productUrl);
      
      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'completed', 1, duration);
      
      const enriched = {
        ...details,
        sourceId,
        sourceUrl: productUrl,
        lastScrapedAt: new Date(),
      };

      this.setInCache(cacheKey, enriched);
      return enriched;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.updateScrapeJob(job.id, 'failed', 0, duration, error.message);
      throw error;
    }
  }

  /**
   * Batch scrape multiple products with concurrency control
   */
  async batchScrape(
    productUrls: Array<{ url: string; sourceId: string }>,
    concurrency: number = 3,
    delayMs: number = 1000,
  ): Promise<any[]> {
    const results = [];
    const errors = [];

    this.logger.log(`Starting batch scrape of ${productUrls.length} products with concurrency=${concurrency}`);

    for (let i = 0; i < productUrls.length; i += concurrency) {
      const batch = productUrls.slice(i, i + concurrency);
      const promises = batch.map((item) =>
        this.scrapeProductDetail(item.url, item.sourceId)
          .then((result) => {
            results.push(result);
            return result;
          })
          .catch((error) => {
            this.logger.error(`Failed to scrape ${item.url}:`, error.message);
            errors.push({ url: item.url, error: error.message });
          }),
      );

      await Promise.all(promises);

      // Delay between batches
      if (i + concurrency < productUrls.length) {
        await this.delay(delayMs);
      }
    }

    this.logger.log(
      `Batch scrape completed: ${results.length} success, ${errors.length} failures`,
    );

    return {
      successful: results,
      failed: errors,
      stats: {
        total: productUrls.length,
        successCount: results.length,
        failureCount: errors.length,
        successRate: ((results.length / productUrls.length) * 100).toFixed(2) + '%',
      },
    } as any;
  }

  /**
   * Get scrape job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.scrapeJobModel.findById(jobId).exec();
    if (!job) {
      throw new BadRequestException('Job not found');
    }
    return job;
  }

  /**
   * Get cache status for a URL
   */
  getCacheStatus(url: string): any {
    const cacheKey = `prod:${url}`;
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return { isCached: false };
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const expiresIn = entry.ttl - age;

    return {
      isCached: true,
      cachedAt: new Date(entry.timestamp),
      expiresAt: new Date(entry.timestamp + entry.ttl),
      ageSeconds: Math.floor(age / 1000),
      expiresInSeconds: Math.floor(expiresIn / 1000),
      expired: expiresIn < 0,
    };
  }

  /**
   * Force clear cache for a URL
   */
  clearCache(url?: string): any {
    if (url) {
      const cacheKey = `prod:${url}`;
      const existed = this.cache.has(cacheKey);
      this.cache.delete(cacheKey);
      return { cleared: existed, url };
    } else {
      const size = this.cache.size;
      this.cache.clear();
      return { cleared: size, total: size };
    }
  }

  /**
   * Get scraper health & stats
   */
  async getHealth(): Promise<any> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 3600000);

    const [completedJobs, failedJobs, pendingJobs] = await Promise.all([
      this.scrapeJobModel.countDocuments({ status: 'completed', finishedAt: { $gte: last24h } }),
      this.scrapeJobModel.countDocuments({ status: 'failed', finishedAt: { $gte: last24h } }),
      this.scrapeJobModel.countDocuments({ status: 'pending' }),
    ]);

    const avgDuration = await this.scrapeJobModel
      .aggregate([
        { $match: { finishedAt: { $gte: last24h }, duration: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ])
      .exec();

    const totalJobs = completedJobs + failedJobs;
    const cacheHitRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0;

    return {
      status: pendingJobs > 5 ? 'degraded' : 'healthy',
      pendingJobs,
      completedJobsLast24h: completedJobs,
      failedJobsLast24h: failedJobs,
      cacheHitRate: parseFloat(cacheHitRate as any),
      avgScrapeDurationMs: avgDuration[0]?.avg || 0,
      cacheSize: this.cache.size,
      lastCheck: new Date(),
    };
  }

  // ========== PRIVATE METHODS ==========

  private async executeNavigationCrawl(siteUrl: string): Promise<any[]> {
    const headings = [];

    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: 1,
      preNavigationHooks: [
        async (_crawlingContext, gotoOptions) => {
          gotoOptions.timeout = this.REQUEST_TIMEOUT_MS;
        },
      ],
      async requestHandler({ page, request }) {
        try {
          await page.waitForLoadState('networkidle', { timeout: this.REQUEST_TIMEOUT_MS });

          // Extract main navigation from World of Books
          const navItems = await page.$$eval(
            'nav a, .navbar a, .menu a, [role="navigation"] a',
            (elements: any[]) => {
              return elements
                .slice(0, 20)
                .map((el) => ({
                  title: el.textContent?.trim() || '',
                  url: el.href || '',
                }))
                .filter((item) => item.title && item.title.length > 0);
            },
          ).catch(() => []);

          if (navItems.length > 0) {
            headings.push(...navItems);
          }
        } catch (error) {
          this.logger.warn(`Navigation crawl error: ${error.message}`);
        }
      },
    });

    await crawler.run([siteUrl]);
    return headings;
  }

  private async executeCategoryCrawl(categoryUrl: string): Promise<any[]> {
    const products = [];

    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: 1,
      preNavigationHooks: [
        async (_crawlingContext, gotoOptions) => {
          gotoOptions.timeout = this.REQUEST_TIMEOUT_MS;
        },
      ],
      async requestHandler({ page }) {
        try {
          await page.waitForLoadState('networkidle', { timeout: this.REQUEST_TIMEOUT_MS });

          const items = await page.$$eval(
            '.product-item, .book-card, [data-product], .product-card, .book-listing, .item-box',
            (elements: any[]) => {
              return elements
                .slice(0, 100)
                .map((el) => {
                  const titleEl = el.querySelector('h2, h3, .title, a.name');
                  const priceEl = el.querySelector('.price, [data-price], .product-price');
                  const authorEl = el.querySelector('.author, [data-author], .by');
                  const linkEl = el.querySelector('a[href]');
                  const imgEl = el.querySelector('img');

                  return {
                    title: titleEl?.textContent?.trim(),
                    price: priceEl?.textContent?.trim(),
                    author: authorEl?.textContent?.trim(),
                    url: linkEl?.href,
                    imageUrl: imgEl?.src || imgEl?.getAttribute('data-src'),
                  };
                })
                .filter((p) => p.title && p.url);
            },
          ).catch(() => []);

          products.push(...items);
        } catch (error) {
          this.logger.warn(`Category crawl error: ${error.message}`);
        }
      },
    });

    await crawler.run([categoryUrl]);
    return products;
  }

  private async executeProductDetailCrawl(productUrl: string): Promise<any> {
    let details = null;

    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: 1,
      preNavigationHooks: [
        async (_crawlingContext, gotoOptions) => {
          gotoOptions.timeout = this.REQUEST_TIMEOUT_MS;
        },
      ],
      async requestHandler({ page }) {
        try {
          await page.waitForLoadState('networkidle', { timeout: this.REQUEST_TIMEOUT_MS });

          details = await page.evaluate(() => {
            const titleEl = document.querySelector('h1, .product-title, [data-title]');
            const descEl = document.querySelector(
              '.description, [data-description], .product-description, .details',
            );
            const priceEl = document.querySelector('.price, [data-price]');
            const authorEl = document.querySelector('.author, [data-author], .by');
            const imgEl = document.querySelector('img[src], img[data-src]');
            const ratingEl = document.querySelector('.rating, [data-rating], .stars');

            const reviews = Array.from(document.querySelectorAll('.review, .customer-review, [data-review]')).map(
              (rev: any) => ({
                author: rev.querySelector('.reviewer-name, .user-name, .author')?.textContent?.trim(),
                rating: parseInt(
                  rev.querySelector('.review-rating, .stars, [data-rating]')?.textContent?.match(/\d+/)?.[0] || '0',
                ),
                text: rev.querySelector('.review-text, .comment, .text')?.textContent?.trim(),
                createdAt: new Date(),
              }),
            );

            return {
              title: titleEl?.textContent?.trim(),
              description: descEl?.textContent?.trim(),
              price: priceEl?.textContent?.trim(),
              author: authorEl?.textContent?.trim(),
              imageUrl: (imgEl as any)?.src || imgEl?.getAttribute('data-src'),
              ratingAvg: parseFloat(ratingEl?.textContent?.match(/\d+\.?\d*/)?.[0] || '0'),
              reviews: reviews.filter((r) => r.author && r.text),
              metadata: {
                isbn: document.querySelector('[data-isbn], .isbn')?.textContent?.trim(),
                publisher: document.querySelector('[data-publisher], .publisher')?.textContent?.trim(),
                publicationDate: document.querySelector('[data-publication], .published')?.textContent?.trim(),
              },
            };
          });
        } catch (error) {
          this.logger.warn(`Product detail crawl error: ${error.message}`);
          details = {};
        }
      },
    });

    await crawler.run([productUrl]);
    return details || {};
  }

  private deduplicateProducts(products: any[]): any[] {
    const seen = new Set<string>();
    return products.filter((p) => {
      const key = `${p.title}:${p.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async createScrapeJob(targetUrl: string, targetType: string): Promise<any> {
    const job = new this.scrapeJobModel({
      targetUrl,
      targetType,
      status: 'in_progress',
      startedAt: new Date(),
    });
    return job.save();
  }

  private async updateScrapeJob(
    jobId: any,
    status: string,
    resultCount: number,
    duration: number,
    errorLog?: string,
  ): Promise<void> {
    await this.scrapeJobModel.findByIdAndUpdate(jobId, {
      status,
      resultCount,
      duration,
      finishedAt: new Date(),
      errorLog: errorLog || null,
    });
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setInCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL_MS,
    });
  }

  private checkRateLimit(domain: string): void {
    const now = Date.now();
    const state = this.rateLimitState.get(domain) || { requests: 0, resetTime: now + this.RATE_LIMIT_WINDOW_MS };

    if (now > state.resetTime) {
      state.requests = 0;
      state.resetTime = now + this.RATE_LIMIT_WINDOW_MS;
    }

    state.requests++;

    if (state.requests > this.RATE_LIMIT_MAX_REQUESTS) {
      throw new InternalServerErrorException(
        `Rate limit exceeded for ${domain}. Max ${this.RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
      );
    }

    this.rateLimitState.set(domain, state);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
