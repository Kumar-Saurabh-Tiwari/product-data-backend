import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      message: 'ProductData API - Web Scraping & E-commerce Platform',
      version: '1.0.0',
      endpoints: {
        navigations: 'GET /api/navigations',
        categories: 'GET /api/categories',
        products: 'GET /api/products',
        scraper: 'GET /api/scraper/health',
        documentation: 'See README.md for full API documentation',
      },
      status: 'running',
    };
  }
}
