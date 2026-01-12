const mongoose = require('mongoose');

const mongoUri = 'mongodb://localhost:27017/product-explorer';

const navigationSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  productCount: { type: Number, default: 0 },
  lastScrapedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  navigationId: mongoose.Schema.Types.ObjectId,
  parentId: mongoose.Schema.Types.ObjectId,
  title: String,
  slug: String,
  sourceUrl: String,
  productCount: { type: Number, default: 0 },
  lastScrapedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  sourceId: { type: String, required: true },
  sourceUrl: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: String,
  price: Number,
  currency: { type: String, default: 'GBP' },
  imageUrl: String,
  description: String,
  categoryId: mongoose.Schema.Types.ObjectId,
  ratingsAvg: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  lastScrapedAt: Date,
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  author: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
}, { timestamps: true });

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const Navigation = mongoose.model('Navigation', navigationSchema);
    const Category = mongoose.model('Category', categorySchema);
    const Product = mongoose.model('Product', productSchema);
    const Review = mongoose.model('Review', reviewSchema);

    // Clear existing data
    await Navigation.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});

    console.log('Cleared existing data');

    // Create sample navigations
    const nav1 = await Navigation.create({
      title: 'Books',
      slug: 'books',
      productCount: 150,
    });

    const nav2 = await Navigation.create({
      title: 'Electronics',
      slug: 'electronics',
      productCount: 200,
    });

    console.log('Created navigations');

    // Create categories
    const cat1 = await Category.create({
      navigationId: nav1._id,
      title: 'Fiction',
      slug: 'fiction',
      sourceUrl: 'https://example.com/books/fiction',
      productCount: 75,
    });

    const cat2 = await Category.create({
      navigationId: nav1._id,
      title: 'Non-Fiction',
      slug: 'non-fiction',
      sourceUrl: 'https://example.com/books/non-fiction',
      productCount: 75,
    });

    const cat3 = await Category.create({
      navigationId: nav2._id,
      title: 'Laptops',
      slug: 'laptops',
      sourceUrl: 'https://example.com/electronics/laptops',
      productCount: 100,
    });

    console.log('Created categories');

    // Create sample products
    const prod1 = await Product.create({
      sourceId: 'book_1',
      sourceUrl: 'https://example.com/books/the-great-gatsby',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      price: 12.99,
      currency: 'GBP',
      imageUrl: 'https://via.placeholder.com/200x300?text=Great+Gatsby',
      description: 'A classic American novel set in the Jazz Age',
      categoryId: cat1._id,
      ratingsAvg: 4.5,
      reviewsCount: 128,
      lastScrapedAt: new Date(),
    });

    const prod2 = await Product.create({
      sourceId: 'book_2',
      sourceUrl: 'https://example.com/books/sapiens',
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      price: 18.99,
      currency: 'GBP',
      imageUrl: 'https://via.placeholder.com/200x300?text=Sapiens',
      description: 'A Brief History of Humankind',
      categoryId: cat2._id,
      ratingsAvg: 4.7,
      reviewsCount: 256,
      lastScrapedAt: new Date(),
    });

    const prod3 = await Product.create({
      sourceId: 'laptop_1',
      sourceUrl: 'https://example.com/electronics/macbook-pro',
      title: 'MacBook Pro 14"',
      author: 'Apple',
      price: 1999.99,
      currency: 'GBP',
      imageUrl: 'https://via.placeholder.com/200x300?text=MacBook+Pro',
      description: 'Powerful laptop with M3 Pro chip',
      categoryId: cat3._id,
      ratingsAvg: 4.8,
      reviewsCount: 512,
      lastScrapedAt: new Date(),
    });

    const prod4 = await Product.create({
      sourceId: 'book_3',
      sourceUrl: 'https://example.com/books/1984',
      title: '1984',
      author: 'George Orwell',
      price: 9.99,
      currency: 'GBP',
      imageUrl: 'https://via.placeholder.com/200x300?text=1984',
      description: 'A dystopian social science fiction novel',
      categoryId: cat1._id,
      ratingsAvg: 4.6,
      reviewsCount: 342,
      lastScrapedAt: new Date(),
    });

    console.log('Created products');

    // Create sample reviews
    await Review.create([
      {
        productId: prod1._id,
        author: 'John Doe',
        rating: 5,
        text: 'Amazing book! A true masterpiece of American literature.',
      },
      {
        productId: prod1._id,
        author: 'Jane Smith',
        rating: 4,
        text: 'Great story, but a bit slow in places.',
      },
      {
        productId: prod2._id,
        author: 'Bob Johnson',
        rating: 5,
        text: 'Mind-blowing perspective on human history!',
      },
      {
        productId: prod3._id,
        author: 'Alice Williams',
        rating: 5,
        text: 'Best laptop I\'ve ever owned. Highly recommended.',
      },
      {
        productId: prod4._id,
        author: 'Charlie Brown',
        rating: 5,
        text: 'A chilling and thought-provoking novel.',
      },
    ]);

    console.log('Created reviews');

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
