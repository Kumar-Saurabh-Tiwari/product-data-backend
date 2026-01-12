# Backend API - Product Data Explorer

A NestJS-based backend for managing and scraping product data with MongoDB integration.

## 📋 Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Modules](#modules)
- [Database](#database)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 📌 Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 4.4 (or MongoDB Atlas account)

## 🚀 Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
```

## 💻 Development

### Local Development with Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start development server
npm run dev

# The server will run on http://localhost:3001
```

### With Nodemon Watch

```bash
npm run dev
```

### Build TypeScript

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 🌐 Production Deployment

### Render.com Deployment (Recommended)

#### Step 1: Configure Environment Variables in Render

In your Render service dashboard, go to **Environment** and add:

```env
MONGODB_URI=mongodb+srv://sk-dev:hzg1fYvaFhMo0KIV@sk-cluster.yfzgojj.mongodb.net/task-manager?retryWrites=true&w=majority
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
SCRAPING_DELAY=2000
CACHE_TTL=3600000
WORLD_OF_BOOKS_URL=https://www.worldofbooks.com
```

**Important Security Notes:**
- Never commit the MONGODB_URI to version control
- Use Render's environment variables, not .env files
- Restrict CORS_ORIGIN to your actual frontend domain
- Regenerate credentials in MongoDB Atlas if exposed

#### Step 2: Verify Deployment Checklist

✅ **Configuration:**
- [ ] MONGODB_URI is set in Render Environment
- [ ] NODE_ENV is set to "production"
- [ ] PORT is set to 3001
- [ ] CORS_ORIGIN matches your frontend domain

✅ **Build:**
- [ ] `npm run build` completes without errors
- [ ] dist/ folder contains compiled JavaScript
- [ ] package.json has correct start script: `node dist/main.js`

✅ **Runtime:**
- [ ] Container logs show "Application is running on..."
- [ ] Health check succeeds
- [ ] No "cannot find module" errors

#### Step 3: Testing the Deployment

```bash
# Test health check
curl https://your-app.onrender.com/

# Test an endpoint
curl https://your-app.onrender.com/api/navigations
```

### Docker Deployment

```bash
# Build image
docker build -t product-backend:latest .

# Run container with environment variables
docker run -p 3001:3001 \
  -e MONGODB_URI="mongodb+srv://sk-dev:password@cluster.mongodb.net/database" \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://your-domain.com \
  product-backend:latest
```

## ⚙️ Environment Configuration

### Required Variables

**MONGODB_URI** (Required for production)
- Connection string to MongoDB Atlas or local MongoDB
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- Default (local): `mongodb://localhost:27017/product-explorer`

**NODE_ENV**
- Set to `production` in production
- Set to `development` locally
- Default: `development`

**PORT**
- Server port
- Default: `3001`
- On Render: Keep as 3001 (automatically mapped to service port)

### Optional Variables

**CORS_ORIGIN**
- Frontend domain for CORS
- Default: `http://localhost:3000,http://localhost:3001`
- Example (production): `https://myapp.com`

**SCRAPING_DELAY**
- Delay between scraping requests in milliseconds
- Default: `1000` (1 second)

**CACHE_TTL**
- Cache time-to-live in milliseconds
- Default: `3600000` (1 hour)

**WORLD_OF_BOOKS_URL**
- Target website URL for scraping
- Default: `https://www.worldofbooks.com`

### Create .env File (Local Development Only)

```env
# .env (local development only - never commit this file)
MONGODB_URI=mongodb://localhost:27017/product-explorer
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
SCRAPING_DELAY=1000
CACHE_TTL=3600000
WORLD_OF_BOOKS_URL=https://www.worldofbooks.com
```

## 📚 Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── root.controller.ts         # Health check endpoint
├── config/                    # Configuration files
├── common/
│   ├── dto/                   # Data Transfer Objects
│   │   ├── category.dto.ts
│   │   ├── navigation.dto.ts
│   │   ├── product.dto.ts
│   │   └── scraper.dto.ts
│   └── utils/                 # Utility functions
└── modules/
    ├── navigation/            # Navigation module
    │   ├── navigation.module.ts
    │   ├── navigation.controller.ts
    │   ├── navigation.service.ts
    │   └── navigation.schema.ts
    ├── category/              # Category module
    │   ├── category.module.ts
    │   ├── category.controller.ts
    │   ├── category.service.ts
    │   └── category.schema.ts
    ├── product/               # Product module
    │   ├── product.module.ts
    │   ├── product.controller.ts
    │   ├── product.service.ts
    │   ├── product.schema.ts
    │   ├── product-detail.schema.ts
    │   └── review.schema.ts
    ├── scraper/               # Web scraping module
    │   ├── scraper.module.ts
    │   ├── scraper.controller.ts
    │   ├── scraper.service.ts
    │   └── scrape-job.schema.ts
    └── history/               # View history module
        ├── history.module.ts
        ├── history.service.ts
        └── view-history.schema.ts

scripts/
└── seed.ts                    # Database seeding script
```

## 🔌 API Endpoints

### Root
- `GET /` - Health check

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
- `GET /api/products/search` - Search products
- `POST /api/products` - Create product
- `POST /api/products/batch` - Batch create products
- `POST /api/products/:id/reviews` - Add product review

### Scraper API
- `POST /api/scraper/navigations` - Scrape navigations
- `POST /api/scraper/category` - Scrape category
- `GET /api/scraper/jobs` - Get scraping jobs status

### History API
- `POST /api/history` - Record product view
- `GET /api/history/:userId` - Get user view history
- `DELETE /api/history/:id` - Delete history record

## 📦 Modules

### Navigation Module
Manages site navigation structure and categories.

### Category Module
Handles product categories and subcategories.

### Product Module
Core product management - CRUD operations, details, reviews.

### Scraper Module
Web scraping functionality using Crawlee.
- Scrapes navigation from target website
- Extracts product data
- Manages scraping jobs

### History Module
Tracks user product views for analytics.

## 🗄️ Database

### MongoDB Schema

**Collections:**
- `navigations` - Site navigation structure
- `categories` - Product categories
- `products` - Product data
- `reviews` - Product reviews
- `viewhistories` - User view history
- `scrapejobs` - Scraping job logs

### Connection Details

The backend uses **Mongoose** for ODM (Object Data Modeling).

**Local MongoDB:**
```bash
mongosh
use product-explorer
```

**MongoDB Atlas (Production):**
- Connection string provided in MONGODB_URI env variable
- Automatic connection retry enabled
- Connection pooling configured

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 🔍 Troubleshooting

### MongoDB Connection Error

**Error:** `failed to connect to mongodb`

**Solution:**
1. Verify MONGODB_URI is correct
2. For MongoDB Atlas: 
   - Check IP whitelist (allow all for Render)
   - Verify username/password
   - Check network connectivity
3. For local MongoDB:
   - Ensure MongoDB is running: `docker ps`
   - Test connection: `mongosh "mongodb://localhost:27017"`

### CORS Errors in Frontend

**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
1. Update CORS_ORIGIN in environment variables
2. If multiple domains needed: `https://domain1.com,https://domain2.com`
3. Restart the service for changes to take effect

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
1. Kill process on port 3001: `lsof -ti:3001 | xargs kill -9`
2. Or change PORT env variable to different port

### Build Failures on Render

**Error:** `npm ERR! Build failed`

**Solution:**
1. Check build logs in Render dashboard
2. Ensure NODE_ENV is not set to "production" during build
3. Verify all dependencies are in package.json (not package-lock.json)
4. Clear Render's build cache and redeploy

### Module Not Found

**Error:** `Cannot find module '@nestjs/mongoose'`

**Solution:**
1. Run `npm install`
2. Ensure all dependencies from package.json are installed
3. Delete node_modules and package-lock.json, then reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 Environment Variable Validation

The application validates environment variables on startup. If required variables are missing or invalid, startup will fail with an error message.

## 🔐 Security Best Practices

1. **Never commit .env files** to version control
2. **Rotate MongoDB credentials** if exposed
3. **Use strong passwords** for database access
4. **Restrict CORS_ORIGIN** to trusted domains only
5. **Enable MongoDB IP whitelist** (allow Render's IPs)
6. **Use HTTPS** for all API calls in production
7. **Update dependencies** regularly: `npm audit`

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs in Render dashboard
3. Check MongoDB Atlas dashboard for connection issues
