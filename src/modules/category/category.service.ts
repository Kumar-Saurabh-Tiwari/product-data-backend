import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './category.schema';
import { Product } from '../product/product.schema';
import {
  CreateCategoryDto,
  CategoryResponseDto,
  CategoryWithProductsDto,
  CategoryProductDto,
} from '@/common/dto/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Get all categories, optionally filtered by navigationId
   */
  async findAll(navigationId?: string): Promise<CategoryResponseDto[]> {
    const query = navigationId ? { navigationId: new Types.ObjectId(navigationId) } : { parentId: null };
    const categories = await this.categoryModel.find(query).sort({ title: 1 }).exec();
    return Promise.all(categories.map((cat) => this.mapToDto(cat)));
  }

  /**
   * Get child categories
   */
  async findChildren(parentId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .sort({ title: 1 })
      .exec();
    return Promise.all(categories.map((cat) => this.mapToDto(cat)));
  }

  /**
   * Get category by ID
   */
  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.mapToDto(category);
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return this.mapToDto(category);
  }

  /**
   * Get category with products
   */
  async getCategoryWithProducts(
    id: string,
    limit: number = 20,
    skip: number = 0,
  ): Promise<CategoryWithProductsDto> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const products = await this.productModel
      .find({ categoryId: new Types.ObjectId(id) })
      .limit(limit)
      .skip(skip)
      .sort({ title: 1 })
      .exec();

    const totalProducts = await this.productModel.countDocuments({
      categoryId: new Types.ObjectId(id),
    });

    const productDtos: CategoryProductDto[] = products.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      author: p.author,
      price: p.price || 0,
      currency: p.currency,
      imageUrl: p.imageUrl,
      sourceUrl: p.sourceUrl,
    }));

    const dto = await this.mapToDto(category);

    return {
      ...dto,
      products: productDtos,
      totalProducts,
    };
  }

  /**
   * Create new category
   */
  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Auto-generate slug if not provided
    const slug = dto.slug || dto.title.toLowerCase().replace(/\s+/g, '-');

    const category = new this.categoryModel({
      title: dto.title,
      slug,
      sourceUrl: dto.sourceUrl,
      navigationId: dto.navigationId ? new Types.ObjectId(dto.navigationId) : null,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      productCount: 0,
      lastScrapedAt: null,
    });

    const saved = await category.save();
    return this.mapToDto(saved);
  }

  /**
   * Update product count
   */
  async updateProductCount(id: string, count: number): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(id, {
      productCount: count,
      lastScrapedAt: new Date(),
    });
  }

  /**
   * Sync category with latest scrape
   */
  async syncWithScrape(categoryId: string): Promise<any> {
    const category = await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { lastScrapedAt: new Date() },
      { new: true },
    );

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Update product count
    const productCount = await this.productModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
    });

    await this.categoryModel.findByIdAndUpdate(categoryId, {
      productCount,
    });

    return {
      id: category._id.toString(),
      title: category.title,
      lastScrapedAt: new Date(),
      productCount,
    };
  }

  /**
   * Map category document to DTO with children
   */
  private async mapToDto(doc: Category): Promise<CategoryResponseDto> {
    const children = await this.findChildren(doc._id.toString());
    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      sourceUrl: doc.sourceUrl,
      productCount: doc.productCount || 0,
      lastScrapedAt: doc.lastScrapedAt,
      children: children.length > 0 ? children : undefined,
    };
  }
}
