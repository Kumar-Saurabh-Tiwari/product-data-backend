import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScrapeJob, ScrapeJobSchema } from './scrape-job.schema';
import { ProductDetail, ProductDetailSchema } from '../product/product-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScrapeJob.name, schema: ScrapeJobSchema },
      { name: ProductDetail.name, schema: ProductDetailSchema },
    ]),
  ],
  providers: [ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
