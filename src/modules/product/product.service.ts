import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './product.schema';
import { Review } from './review.schema';
import { CreateProductDto, ProductResponseDto, ProductDetailDto, ReviewDto } from '@/common/dto/product.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async findAll(limit: number = 20, skip: number = 0): Promise<ProductResponseDto[]> {
    const products = await this.productModel
      .find()
      .limit(limit)
      .skip(skip)
      .exec();
    return products.map(p => this.mapToDto(p));
  }

  async findByCategory(categoryId: string, limit: number = 20, skip: number = 0): Promise<ProductResponseDto[]> {
    const products = await this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .limit(limit)
      .skip(skip)
      .exec();
    return products.map(this.mapToDto);
  }

  async findById(id: string): Promise<ProductDetailDto> {
    const product = await this.productModel.findById(id).exec();
    if (!product) return null;

    const reviews = await this.reviewModel.find({ productId: new Types.ObjectId(id) }).exec();
    return this.mapToDetailDto(product, reviews);
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productModel.findOne({ sourceUrl: dto.sourceUrl }).exec();
    if (existing) {
      return this.mapToDto(existing);
    }

    const product = new this.productModel({
      sourceId: dto.sourceId,
      sourceUrl: dto.sourceUrl,
      title: dto.title,
      author: dto.author,
      price: dto.price,
      currency: dto.currency,
      imageUrl: dto.imageUrl,
      description: dto.description,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : null,
      lastScrapedAt: new Date(),
    });

    const saved = await product.save();
    return this.mapToDto(saved);
  }

  async createBatch(dtos: CreateProductDto[]): Promise<ProductResponseDto[]> {
    const products = [];
    for (const dto of dtos) {
      const product = await this.create(dto);
      products.push(product);
    }
    return products;
  }

  async addReview(productId: string, author: string, rating: number, text: string): Promise<ReviewDto> {
    const review = new this.reviewModel({
      productId: new Types.ObjectId(productId),
      author,
      rating,
      text,
    });

    const saved = await review.save();

    // Update product rating average and count
    const reviews = await this.reviewModel.find({ productId: new Types.ObjectId(productId) }).exec();
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.productModel.findByIdAndUpdate(productId, {
      ratingsAvg: avgRating,
      reviewsCount: reviews.length,
    });

    return {
      id: saved._id.toString(),
      author: saved.author,
      rating: saved.rating,
      text: saved.text,
      createdAt: saved.createdAt,
    };
  }

  private mapToDto(doc: Product): ProductResponseDto {
    return {
      id: doc._id.toString(),
      title: doc.title,
      author: doc.author,
      price: doc.price,
      currency: doc.currency,
      imageUrl: doc.imageUrl,
      sourceUrl: doc.sourceUrl,
      ratingsAvg: doc.ratingsAvg,
      reviewsCount: doc.reviewsCount,
    };
  }

  private mapToDetailDto(doc: Product, reviews: Review[]): ProductDetailDto {
    return {
      id: doc._id.toString(),
      title: doc.title,
      author: doc.author,
      price: doc.price,
      currency: doc.currency,
      imageUrl: doc.imageUrl,
      sourceUrl: doc.sourceUrl,
      description: doc.description,
      ratingsAvg: doc.ratingsAvg,
      reviewsCount: doc.reviewsCount,
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        author: r.author,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
      })),
    };
  }
}
