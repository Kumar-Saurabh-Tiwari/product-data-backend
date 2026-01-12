import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { Navigation, NavigationSchema } from './navigation.schema';
import { Category, CategorySchema } from '../category/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Navigation.name, schema: NavigationSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [NavigationService],
  controllers: [NavigationController],
  exports: [NavigationService],
})
export class NavigationModule {}
