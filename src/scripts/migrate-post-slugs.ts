import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Function to generate random string
function generateRandomString(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

async function migratePostSlugs() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Failed to get database instance');
    }

    // Find all posts without slugs
    const posts = await db.collection('blogposts').find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).toArray();

    console.log(`Found ${posts.length} posts without slugs`);

    // Update each post with a new slug
    for (const post of posts) {
      const newSlug = `new-post-${generateRandomString(10)}`;
      
      await db.collection('blogposts').updateOne(
        { _id: post._id },
        { 
          $set: { 
            slug: newSlug,
            updated_at: new Date()
          } 
        }
      );

      console.log(`Updated post ${post._id} with new slug: ${newSlug}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migratePostSlugs().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
}); 