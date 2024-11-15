import { Post, Author, Tag } from '@jdl-keys/blog-magician-types';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Internal MongoDB document type (includes _id and blog_prompt)
interface MongoPost extends Omit<Post, 'id'> {
  _id: ObjectId;
  blog_prompt?: string;
}

async function migratePost(oldPost: any): Promise<MongoPost> {
  // Create a default author if none exists
  const defaultAuthor: Author = {
    id: 'default-author',
    name: oldPost.author || 'Default Author',
    slug: 'default-author',
    profile_image: oldPost.author_headshot || '',
    bio: 'Default author bio',
    website: '',
    location: '',
    meta_title: 'Default Author',
    meta_description: 'Default author bio'
  };

  // Create a default tag
  const defaultTag: Tag = {
    id: 'default-tag',
    name: 'General',
    slug: 'general',
    description: 'General content category',
    visibility: 'public',
    meta_title: 'General Content',
    meta_description: 'General content category'
  };

  // Parse dates properly
  const createdAt = new Date(oldPost.created_at?.$date || oldPost.createdAt?.$date || oldPost.createdAt || Date.now());
  const updatedAt = new Date(oldPost.updated_at?.$date || oldPost.updatedAt?.$date || oldPost.updatedAt || Date.now());
  const publishedAt = new Date(oldPost.published_at?.$date || oldPost.createdAt?.$date || oldPost.createdAt || Date.now());

  // Parse numbers properly
  const readingTime = parseInt(String(oldPost.reading_time?.$numberInt || oldPost.read_time?.$numberInt || oldPost.reading_time || oldPost.read_time || '0'));
  const targetWordCount = parseInt(String(oldPost.target_word_count?.$numberInt || oldPost.targetWordCount?.$numberInt || oldPost.target_word_count || oldPost.targetWordCount || '1000'));

  // Generate meta description from content if not present
  const metaDescription = oldPost.meta_description || 
    stripHtml(oldPost.html || oldPost.content || '').substring(0, 160);

  // Create new record with all required fields
  const newPost: MongoPost = {
    _id: new ObjectId(oldPost._id),
    title: oldPost.title || 'Untitled Post',
    slug: oldPost.slug || createSlug(oldPost.title || 'Untitled Post'),
    html: oldPost.html || oldPost.content || '',
    plaintext: stripHtml(oldPost.html || oldPost.content || ''),
    feature_image: oldPost.feature_image || oldPost.cover_image || '',
    feature_image_alt: oldPost.title || 'Blog post image',
    feature_image_caption: 'Blog post featured image',
    featured: false,
    visibility: 'public',
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: publishedAt,
    custom_excerpt: oldPost.custom_excerpt || oldPost.preview || '',
    meta_title: oldPost.meta_title || oldPost.title || 'Untitled Post',
    meta_description: metaDescription,
    authors: [defaultAuthor],
    primary_author: defaultAuthor,
    tags: [defaultTag],
    primary_tag: defaultTag,
    reading_time: readingTime,
    team_id: (oldPost.team_id || oldPost.team?.$oid || oldPost.team || {}).toString(),
    created_by: (oldPost.created_by || oldPost.createdBy?.$oid || oldPost.createdBy || {}).toString(),
    style_preset: oldPost.style_preset || oldPost.stylePreset || '',
    custom_style: oldPost.custom_style || oldPost.customStyle || '',
    use_custom_style: Boolean(oldPost.use_custom_style || oldPost.useCustomStyle),
    seo_keywords: oldPost.seo_keywords || oldPost.seoKeywords || [],
    target_word_count: targetWordCount,
    status: oldPost.status || 'published',
    uuid: oldPost.uuid || generateUUID(),
    canonical_url: oldPost.canonical_url || '',
    codeinjection_head: oldPost.codeinjection_head || '',
    codeinjection_foot: oldPost.codeinjection_foot || '',
    custom_template: oldPost.custom_template || '',
    email_subject: oldPost.email_subject || oldPost.title || 'Untitled Post',
    // Internal fields (not exposed in Content API)
    blog_prompt: oldPost.blog_prompt || oldPost.blogPrompt || ''
  };

  return newPost;
}

async function migratePosts() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Failed to get database instance');
    }

    // Get all posts
    console.log('Fetching posts...');
    const posts = await db.collection('blogposts').find({}).toArray();
    console.log(`Found ${posts.length} posts to migrate`);

    // Create new collection for migration
    const newCollectionName = 'blogposts_new';
    await db.createCollection(newCollectionName);
    
    // Migrate each post to new collection
    for (const post of posts) {
      try {
        console.log(`Migrating post: ${post.title}`);
        const newPost = await migratePost(post);
        
        await db.collection(newCollectionName).insertOne(newPost);
        
        console.log(`✓ Successfully migrated post: ${post.title}`);
      } catch (error) {
        console.error(`× Failed to migrate post ${post.title}:`, error);
      }
    }

    // Rename collections to swap old and new
    const oldCollectionName = 'blogposts_old';
    await db.collection('blogposts').rename(oldCollectionName);
    await db.collection(newCollectionName).rename('blogposts');
    
    console.log('Migration complete');
    console.log(`Old collection renamed to: ${oldCollectionName}`);
    console.log('You can verify the migration and then drop the old collection');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Helper functions
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Add UUID generation helper
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run migration
migratePosts().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
}); 