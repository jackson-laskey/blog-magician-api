import { Request, Response } from 'express';
import { Post as PostType, ContentAPIResponse, Author } from '@jdl-keys/blog-magician-types';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// Define custom request interface
interface AuthRequest extends Request {
  teamId: string;
}

export async function getPosts(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const teamId = new ObjectId(req.teamId);
    
    const total = await db.collection('blogposts').countDocuments({ team_id: teamId });
    const pages = Math.ceil(total / limit);

    const posts = await db.collection('blogposts')
      .find({ team_id: teamId })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get all unique author IDs from the posts
    const authorIds = [...new Set(posts.flatMap(post => {
      const ids = [];
      if (post.primary_author?.id) ids.push(post.primary_author.id);
      if (post.authors) {
        ids.push(...post.authors.map((a: { id: string }) => a.id));
      }
      return ids;
    }))];

    // Fetch all authors in one query
    const authors = authorIds.length > 0
      ? await db.collection('authors')
          .find({ 
            _id: { 
              $in: authorIds.map(id => {
                try {
                  return new ObjectId(id);
                } catch (e) {
                  console.warn('Invalid ObjectId:', id);
                  return null;
                }
              }).filter((id): id is ObjectId => id !== null)
            } 
          })
          .toArray()
      : [];

    // Create author lookup map with proper typing
    const authorMap = new Map(authors.map(author => [
      author._id.toString(),
      {
        id: author._id.toString(),
        name: author.name,
        slug: author.slug,
        profile_image: author.profile_image,
        cover_image: author.cover_image,
        bio: author.bio,
        website: author.website,
        location: author.location,
        facebook: author.facebook,
        twitter: author.twitter,
        meta_title: author.meta_title,
        meta_description: author.meta_description,
        team_id: author.team_id,
        isDefault: author.isDefault
      } as Author
    ]));

    // Create default author for posts without one
    const defaultAuthor: Author = {
      id: 'default',
      name: 'Anonymous',
      slug: 'anonymous',
      profile_image: '',
      bio: '',
      website: '',
      location: '',
      meta_title: '',
      meta_description: ''
    };

    const formattedPosts: PostType[] = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      html: post.html || post.content,
      plaintext: post.plaintext,
      feature_image: post.feature_image || post.cover_image,
      feature_image_alt: post.feature_image_alt,
      feature_image_caption: post.feature_image_caption,
      featured: post.featured || false,
      visibility: post.visibility || 'public',
      created_at: post.created_at || post.createdAt,
      updated_at: post.updated_at || post.updatedAt,
      published_at: post.published_at || post.createdAt,
      custom_excerpt: post.custom_excerpt || post.preview,
      authors: (post.authors || [])
        .map((author: { id: string }) => authorMap.get(author.id))
        .filter((author: Author | undefined): author is Author => author !== undefined),
      primary_author: post.primary_author?.id 
        ? authorMap.get(post.primary_author.id) || defaultAuthor
        : defaultAuthor,
      tags: post.tags || [],
      primary_tag: post.primary_tag,
      reading_time: post.reading_time || post.read_time || 0,
      team_id: post.team_id || post.team,
      created_by: post.created_by || post.createdBy,
      style_preset: post.style_preset || post.stylePreset,
      custom_style: post.custom_style || post.customStyle,
      use_custom_style: post.use_custom_style || post.useCustomStyle || false,
      blog_prompt: post.blog_prompt || post.blogPrompt,
      seo_keywords: post.seo_keywords || post.seoKeywords || [],
      target_word_count: post.target_word_count || post.targetWordCount || 1000,
      status: post.status || 'published'
    }));

    const response: ContentAPIResponse<PostType> = {
      data: formattedPosts,
      meta: {
        pagination: {
          page,
          limit,
          pages,
          total,
          next: page < pages ? page + 1 : undefined,
          prev: page > 1 ? page - 1 : undefined
        }
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Error fetching posts' });
  }
}

export async function getPostBySlug(req: AuthRequest, res: Response): Promise<Response> {
  try {
    console.log('Attempting to find post with slug:', req.params.slug);
    console.log('Team ID:', req.teamId);
    
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    console.log('Query:', {
      slug: req.params.slug,
      team_id: new ObjectId(req.teamId)
    });

    const post = await db.collection('blogposts').findOne({
      slug: req.params.slug,
      team_id: new ObjectId(req.teamId)
    });

    console.log('Found post:', post ? 'yes' : 'no');

    if (!post) {
      console.log('Post not found with slug:', req.params.slug);
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create default author if needed
    const defaultAuthor: Author = {
      id: 'default',
      name: 'Anonymous',
      slug: 'anonymous',
      profile_image: '',
      bio: '',
      website: '',
      location: '',
      meta_title: '',
      meta_description: ''
    };

    // Format the post response
    const formattedPost = {
      id: post._id.toString(),
      title: post.title || '',
      slug: post.slug,
      html: post.html || post.content || '',
      feature_image: post.feature_image || post.cover_image || '',
      created_at: post.created_at || post.createdAt,
      published_at: post.published_at || post.createdAt,
      reading_time: post.reading_time || post.read_time || 0,
      primary_author: post.primary_author || defaultAuthor,
      tags: post.tags || [],
      custom_excerpt: post.custom_excerpt || post.preview || '',
      status: post.status || 'published'
    };

    // Log the formatted response
    console.log('Formatted post:', {
      id: formattedPost.id,
      title: formattedPost.title,
      slug: formattedPost.slug
    });

    return res.json({ post: formattedPost });
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return res.status(500).json({ error: 'Error fetching post' });
  }
}

export async function getPostById(req: AuthRequest, res: Response): Promise<Response> {
  try {
    console.log('Attempting to find post with ID:', req.params.id);
    
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const teamId = new ObjectId(req.teamId);

    const post = await db.collection('blogposts').findOne({
      _id: new ObjectId(req.params.id),
      team_id: teamId
    });

    if (!post) {
      console.log('Post not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Post not found' });
    }

    const formattedPost = {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      html: post.html || post.content,
      plaintext: post.plaintext,
      feature_image: post.feature_image || post.cover_image,
      feature_image_alt: post.feature_image_alt,
      feature_image_caption: post.feature_image_caption,
      featured: post.featured || false,
      visibility: post.visibility || 'public',
      created_at: post.created_at || post.createdAt,
      updated_at: post.updated_at || post.updatedAt,
      published_at: post.published_at || post.createdAt,
      custom_excerpt: post.custom_excerpt || post.preview,
      authors: post.authors || [],
      primary_author: post.primary_author,
      tags: post.tags || [],
      primary_tag: post.primary_tag,
      reading_time: post.reading_time || post.read_time || 0,
      team_id: post.team_id || post.team,
      created_by: post.created_by || post.createdBy,
      style_preset: post.style_preset || post.stylePreset,
      custom_style: post.custom_style || post.customStyle,
      use_custom_style: post.use_custom_style || post.useCustomStyle || false,
      blog_prompt: post.blog_prompt || post.blogPrompt,
      seo_keywords: post.seo_keywords || post.seoKeywords || [],
      target_word_count: post.target_word_count || post.targetWordCount || 1000,
      status: post.status || 'published'
    };

    return res.json({ data: formattedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ 
      error: 'Error fetching post', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export async function getPostsByTag(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const teamId = new ObjectId(req.teamId);

    const posts = await db.collection('blogposts')
      .find({ 
        'tags.slug': req.params.slug,
        team_id: teamId
      })
      .toArray();

    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      html: post.html || post.content,
      plaintext: post.plaintext,
      feature_image: post.feature_image || post.cover_image,
      feature_image_alt: post.feature_image_alt,
      feature_image_caption: post.feature_image_caption,
      featured: post.featured || false,
      visibility: post.visibility || 'public',
      created_at: post.created_at || post.createdAt,
      updated_at: post.updated_at || post.updatedAt,
      published_at: post.published_at || post.createdAt,
      custom_excerpt: post.custom_excerpt || post.preview,
      authors: post.authors || [],
      primary_author: post.primary_author,
      tags: post.tags || [],
      primary_tag: post.primary_tag,
      reading_time: post.reading_time || post.read_time || 0,
      team_id: post.team_id || post.team,
      created_by: post.created_by || post.createdBy,
      style_preset: post.style_preset || post.stylePreset,
      custom_style: post.custom_style || post.customStyle,
      use_custom_style: post.use_custom_style || post.useCustomStyle || false,
      blog_prompt: post.blog_prompt || post.blogPrompt,
      seo_keywords: post.seo_keywords || post.seoKeywords || [],
      target_word_count: post.target_word_count || post.targetWordCount || 1000,
      status: post.status || 'published'
    }));

    return res.json({ data: formattedPosts });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching posts by tag' });
  }
}

export async function getPostsByAuthor(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const teamId = new ObjectId(req.teamId);

    const posts = await db.collection('blogposts')
      .find({ 
        'authors.slug': req.params.slug,
        team_id: teamId
      })
      .toArray();

    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      html: post.html || post.content,
      plaintext: post.plaintext,
      feature_image: post.feature_image || post.cover_image,
      feature_image_alt: post.feature_image_alt,
      feature_image_caption: post.feature_image_caption,
      featured: post.featured || false,
      visibility: post.visibility || 'public',
      created_at: post.created_at || post.createdAt,
      updated_at: post.updated_at || post.updatedAt,
      published_at: post.published_at || post.createdAt,
      custom_excerpt: post.custom_excerpt || post.preview,
      authors: post.authors || [],
      primary_author: post.primary_author,
      tags: post.tags || [],
      primary_tag: post.primary_tag,
      reading_time: post.reading_time || post.read_time || 0,
      team_id: post.team_id || post.team,
      created_by: post.created_by || post.createdBy,
      style_preset: post.style_preset || post.stylePreset,
      custom_style: post.custom_style || post.customStyle,
      use_custom_style: post.use_custom_style || post.useCustomStyle || false,
      blog_prompt: post.blog_prompt || post.blogPrompt,
      seo_keywords: post.seo_keywords || post.seoKeywords || [],
      target_word_count: post.target_word_count || post.targetWordCount || 1000,
      status: post.status || 'published'
    }));

    return res.json({ data: formattedPosts });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching posts by author' });
  }
} 