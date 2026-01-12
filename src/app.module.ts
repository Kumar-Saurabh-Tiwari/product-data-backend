import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NavigationModule } from './modules/navigation/navigation.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { HistoryModule } from './modules/history/history.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { RootController } from './root.controller';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-explorer';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    NavigationModule,
    CategoryModule,
    ProductModule,
    HistoryModule,
    ScraperModule,
  ],
  controllers: [RootController],
})
export class AppModule {}
