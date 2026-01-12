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
import { NavigationService } from './navigation.service';
import {
  CreateNavigationDto,
  NavigationResponseDto,
  NavigationDetailDto,
} from '@/common/dto/navigation.dto';

/**
 * Navigation API Controller
 * Handles navigation menu/structure endpoints
 */
@Controller('api/navigations')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  /**
   * GET /api/navigations/slug/:slug
   * Get navigation by slug (must be before :id route)
   */
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<NavigationDetailDto> {
    return this.navigationService.findBySlugWithCategories(slug);
  }

  /**
   * GET /api/navigations
   * Get all navigation items with optional category tree
   */
  @Get()
  async getAll(
    @Query('withCategories') withCategories?: string,
  ): Promise<NavigationResponseDto[] | NavigationDetailDto[]> {
    if (withCategories === 'true') {
      return this.navigationService.findAllWithCategories();
    }
    return this.navigationService.findAll();
  }

  /**
   * GET /api/navigations/:id
   * Get a specific navigation item
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<NavigationDetailDto> {
    return this.navigationService.findByIdWithCategories(id);
  }

  /**
   * POST /api/navigations
   * Create a new navigation item
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateNavigationDto): Promise<NavigationResponseDto> {
    return this.navigationService.create(dto);
  }

  /**
   * POST /api/navigations/:id/sync
   * Sync navigation with latest scrape data
   * Triggers a scrape and updates the navigation
   */
  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async syncNavigation(@Param('id') id: string): Promise<any> {
    return this.navigationService.syncWithScrape(id);
  }
}
