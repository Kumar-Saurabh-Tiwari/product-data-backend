import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, ProductResponseDto, ProductDetailDto, ReviewDto } from '@/common/dto/product.dto';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ): Promise<ProductResponseDto[]> {
    return this.productService.findAll(parseInt(limit), parseInt(skip));
  }

  @Get('category/:categoryId')
  async getByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ): Promise<ProductResponseDto[]> {
    return this.productService.findByCategory(categoryId, parseInt(limit), parseInt(skip));
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductDetailDto> {
    return this.productService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(dto);
  }

  @Post('batch')
  async createBatch(@Body() dtos: CreateProductDto[]): Promise<ProductResponseDto[]> {
    return this.productService.createBatch(dtos);
  }

  @Post(':id/reviews')
  async addReview(
    @Param('id') productId: string,
    @Body() body: { author: string; rating: number; text: string },
  ): Promise<ReviewDto> {
    return this.productService.addReview(productId, body.author, body.rating, body.text);
  }
}
