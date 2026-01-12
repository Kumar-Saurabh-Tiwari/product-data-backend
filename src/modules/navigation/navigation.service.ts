import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Navigation } from './navigation.schema';
import { Category } from '../category/category.schema';
import {
  CreateNavigationDto,
  NavigationResponseDto,
  NavigationDetailDto,
  CategoryDetailDto,
} from '@/common/dto/navigation.dto';

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);

  constructor(
    @InjectModel(Navigation.name) private navigationModel: Model<Navigation>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Get all navigation items
   */
  async findAll(): Promise<NavigationResponseDto[]> {
    const navigations = await this.navigationModel.find().exec();
    return navigations.map(this.mapToDto.bind(this));
  }

  /**
   * Get all navigations with their category trees
   */
  async findAllWithCategories(): Promise<NavigationDetailDto[]> {
    const navigations = await this.navigationModel.find().exec();
    const detailed = [];

    for (const nav of navigations) {
      detailed.push(await this.mapToDetailDto(nav));
    }

    return detailed;
  }

  /**
   * Get navigation by ID with categories
   */
  async findByIdWithCategories(id: string): Promise<NavigationDetailDto> {
    const navigation = await this.navigationModel.findById(id).exec();
    if (!navigation) {
      throw new NotFoundException(`Navigation with ID ${id} not found`);
    }
    return this.mapToDetailDto(navigation);
  }

  /**
   * Get navigation by slug
   */
  async findBySlug(slug: string): Promise<NavigationResponseDto> {
    const navigation = await this.navigationModel.findOne({ slug }).exec();
    if (!navigation) {
      throw new NotFoundException(`Navigation with slug ${slug} not found`);
    }
    return this.mapToDto(navigation);
  }

  /**
   * Get navigation by slug with categories
   */
  async findBySlugWithCategories(slug: string): Promise<NavigationDetailDto> {
    const navigation = await this.navigationModel.findOne({ slug }).exec();
    if (!navigation) {
      throw new NotFoundException(`Navigation with slug ${slug} not found`);
    }
    return this.mapToDetailDto(navigation);
  }

  /**
   * Create new navigation
   */
  async create(dto: CreateNavigationDto): Promise<NavigationResponseDto> {
    // Auto-generate slug if not provided
    const slug = dto.slug || dto.title.toLowerCase().replace(/\s+/g, '-');

    const navigation = new this.navigationModel({
      title: dto.title,
      slug,
      url: dto.url,
      productCount: 0,
      lastScrapedAt: null,
    });

    const saved = await navigation.save();
    return this.mapToDto(saved);
  }

  /**
   * Update navigation
   */
  async update(id: string, title: string): Promise<NavigationResponseDto> {
    const navigation = await this.navigationModel.findByIdAndUpdate(
      id,
      { title, lastScrapedAt: new Date() },
      { new: true },
    );

    if (!navigation) {
      throw new NotFoundException(`Navigation with ID ${id} not found`);
    }

    return this.mapToDto(navigation);
  }

  /**
   * Sync navigation with scrape data
   * Updates last_scraped_at timestamp
   */
  async syncWithScrape(navigationId: string): Promise<any> {
    const navigation = await this.navigationModel.findByIdAndUpdate(
      navigationId,
      { lastScrapedAt: new Date() },
      { new: true },
    );

    if (!navigation) {
      throw new NotFoundException(`Navigation with ID ${navigationId} not found`);
    }

    // Update product count based on categories
    const categories = await this.categoryModel.find({
      navigationId: new Types.ObjectId(navigationId),
    });

    const totalProducts = categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);

    await this.navigationModel.findByIdAndUpdate(navigationId, {
      productCount: totalProducts,
    });

    return {
      id: navigation._id.toString(),
      title: navigation.title,
      slug: navigation.slug,
      lastScrapedAt: new Date(),
      categoriesCount: categories.length,
      totalProducts,
    };
  }

  /**
   * Map document to DTO
   */
  private mapToDto(doc: Navigation): NavigationResponseDto {
    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      productCount: doc.productCount || 0,
      lastScrapedAt: doc.lastScrapedAt,
    };
  }

  /**
   * Map document to detailed DTO with categories
   */
  private async mapToDetailDto(doc: Navigation): Promise<NavigationDetailDto> {
    const categories = await this.categoryModel
      .find({ navigationId: doc._id, parentId: null })
      .sort({ title: 1 })
      .exec();

    const categoryDtos = await Promise.all(
      categories.map((cat) => this.mapCategoryToDetail(cat)),
    );

    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      productCount: doc.productCount || 0,
      lastScrapedAt: doc.lastScrapedAt,
      categories: categoryDtos,
    };
  }

  /**
   * Map category document to detail DTO with children
   */
  private async mapCategoryToDetail(cat: Category): Promise<CategoryDetailDto> {
    const children = await this.categoryModel
      .find({ parentId: cat._id })
      .sort({ title: 1 })
      .exec();

    const childDtos = await Promise.all(
      children.map((child) => this.mapCategoryToDetail(child)),
    );

    return {
      id: cat._id.toString(),
      title: cat.title,
      slug: cat.slug,
      sourceUrl: cat.sourceUrl,
      productCount: cat.productCount || 0,
      children: childDtos.length > 0 ? childDtos : undefined,
    };
  }
}
