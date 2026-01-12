import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-explorer';

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

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const Navigation = mongoose.model('Navigation', navigationSchema);
    const Category = mongoose.model('Category', categorySchema);

    // Clear existing data
    await Navigation.deleteMany({});
    await Category.deleteMany({});

    // Create sample navigations
    const nav1 = await Navigation.create({
      title: 'Books',
      slug: 'books',
      productCount: 150,
    });

    const nav2 = await Navigation.create({
      title: 'Categories',
      slug: 'categories',
      productCount: 200,
    });

    console.log('Created navigations');

    // Create sample categories
    const cat1 = await Category.create({
      navigationId: nav1._id,
      title: 'Fiction',
      slug: 'fiction',
      sourceUrl: 'https://www.worldofbooks.com/books/fiction',
      productCount: 50,
    });

    const cat2 = await Category.create({
      navigationId: nav1._id,
      title: 'Non-Fiction',
      slug: 'non-fiction',
      sourceUrl: 'https://www.worldofbooks.com/books/non-fiction',
      productCount: 75,
    });

    const cat3 = await Category.create({
      navigationId: nav2._id,
      title: "Children's Books",
      slug: 'children',
      sourceUrl: 'https://www.worldofbooks.com/categories/children',
      productCount: 100,
    });

    console.log('Created categories');

    // Create subcategories
    await Category.create({
      navigationId: nav1._id,
      parentId: cat1._id,
      title: 'Science Fiction',
      slug: 'science-fiction',
      sourceUrl: 'https://www.worldofbooks.com/books/fiction/science-fiction',
      productCount: 20,
    });

    await Category.create({
      navigationId: nav1._id,
      parentId: cat1._id,
      title: 'Mystery',
      slug: 'mystery',
      sourceUrl: 'https://www.worldofbooks.com/books/fiction/mystery',
      productCount: 15,
    });

    console.log('Created subcategories');

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
