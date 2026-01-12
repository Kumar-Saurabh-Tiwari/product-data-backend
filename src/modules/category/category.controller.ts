import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  CategoryResponseDto,
  CategoryWithProductsDto,
} from '@/common/dto/category.dto';

/**
 * Category API Controller
 * Handles category management and product browsing by category
 */
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/categories
   * Get all categories, optionally filtered by navigation
   */
  @Get()
  async getAll(@Query('navigationId') navigationId?: string): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll(navigationId);
  }

  /**
   * GET /api/categories/slug/:slug
   * Get category by slug
   */
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    return this.categoryService.findBySlug(slug);
  }

  /**
   * GET /api/categories/:id/children
   * Get subcategories
   */
  @Get(':id/children')
  async getChildren(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    return this.categoryService.findChildren(id);
  }

  /**
   * GET /api/categories/:id/products
   * Get products in category with pagination
   */
  @Get(':id/products')
  async getCategoryProducts(
    @Param('id') id: string,
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ): Promise<CategoryWithProductsDto> {
    return this.categoryService.getCategoryWithProducts(id, parseInt(limit), parseInt(skip));
  }

  /**
   * GET /api/categories/:id
   * Get category by ID
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.findById(id);
  }

  /**
   * POST /api/categories
   * Create new category
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.create(dto);
  }

  /**
   * POST /api/categories/:id/sync
   * Sync category with latest scrape
   */
  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async syncCategory(@Param('id') id: string): Promise<any> {
    return this.categoryService.syncWithScrape(id);
  }
}
