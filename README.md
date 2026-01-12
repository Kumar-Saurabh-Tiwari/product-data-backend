# Backend API - Product Data Explorer

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm build

# Production
npm start
```

## 📚 Project Structure

```
src/
├── config/              # Configuration files
├── modules/
│   ├── navigation/      # Navigation module
│   ├── category/        # Category module
│   ├── product/         # Product module
│   ├── scraper/         # Web scraping module
│   └── history/         # View history module
├── common/
│   ├── dto/            # Data Transfer Objects
│   └── utils/          # Utility functions
├── app.module.ts       # Main module
└── main.ts            # Entry point
```

## 🔌 API Endpoints

### Navigation API
- `GET /api/navigations` - Get all navigations
- `GET /api/navigations/:slug` - Get by slug
- `POST /api/navigations` - Create navigation

### Category API
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get by ID
- `GET /api/categories/:id/children` - Get subcategories
- `POST /api/categories` - Create category

### Product API
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `POST /api/products/batch` - Batch create products
- `POST /api/products/:id/reviews` - Add review

## 🗄️ MongoDB Connection

The backend uses Mongoose for MongoDB integration. Connection string is configured via `MONGODB_URI` env variable.

## 🧪 Testing

```bash
npm run test
npm run test:watch
```

## 📦 Dependencies

- @nestjs/core, @nestjs/common - NestJS framework
- @nestjs/mongoose - MongoDB integration
- mongoose - MongoDB ODM
- crawlee - Web scraping
- class-validator, class-transformer - DTO validation
- typescript - Type safety

## ⚙️ Configuration

Create `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/product-explorer
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
SCRAPING_DELAY=1000
CACHE_TTL=3600000
WORLD_OF_BOOKS_URL=https://www.worldofbooks.com
```

## 🕷️ Scraping Module

The `ScraperService` handles web scraping:

```typescript
// Scrape navigations
const headings = await scraperService.scrapeNavigationHeadings();

// Scrape category products
const products = await scraperService.scrapeCategory(categoryUrl);

// Scrape product details
const details = await scraperService.scrapeProductDetail(productUrl);
```

## 🔄 Data Flow

1. Frontend requests data from API
2. API checks cache/database
3. If not cached, trigger scraper
4. Scraper fetches data from World of Books
5. Data is stored in MongoDB
6. API returns data to frontend

## 🛡️ Error Handling

All endpoints include error handling:
- Validation errors return 400
- Not found errors return 404
- Server errors return 500
- All errors include descriptive messages

## 📊 Logging

Basic logging is implemented via NestJS Logger:
- Each service logs important actions
- Errors are logged with full stack traces
- Can be extended with Winston or similar

## 🚀 Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables on hosting platform

3. Start with:
   ```bash
   npm start
   ```

## 💡 Extension Points

### Adding New Modules
1. Create module folder in `src/modules`
2. Create schema, service, controller
3. Create module file
4. Import in AppModule

### Custom Scrapers
Extend `ScraperService` to add new scraping methods for different page types.

### Validation
Use class-validator decorators in DTOs to add custom validation rules.
