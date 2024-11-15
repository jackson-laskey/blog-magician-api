import { Schema, model } from 'mongoose';
import { Post } from '@jdl-keys/blog-magician-types';

const AuthorSchema = new Schema({
  id: String,
  name: String,
  slug: String,
  profile_image: String,
  bio: String,
  website: String,
  location: String,
  meta_title: String,
  meta_description: String
});

const TagSchema = new Schema({
  id: String,
  name: String,
  slug: String,
  description: String,
  feature_image: String,
  meta_title: String,
  meta_description: String,
  visibility: {
    type: String,
    enum: ['public', 'internal'],
    default: 'public'
  }
});

const PostSchema = new Schema<Post>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  html: { type: String, required: true },
  plaintext: String,
  feature_image: String,
  feature_image_alt: String,
  feature_image_caption: String,
  featured: { type: Boolean, default: false },
  visibility: {
    type: String,
    enum: ['public', 'members', 'paid'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  published_at: Date,
  custom_excerpt: String,
  authors: [AuthorSchema],
  primary_author: AuthorSchema,
  tags: [TagSchema],
  primary_tag: TagSchema,
  reading_time: Number,
  team_id: { 
    type: Schema.Types.ObjectId,
    ref: 'Team', 
    required: true,
    get: (v: any) => v?.toString()
  },
  created_by: { 
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    get: (v: any) => v?.toString()
  },
  style_preset: String,
  custom_style: String,
  use_custom_style: { type: Boolean, default: false },
  blog_prompt: String,
  seo_keywords: [String],
  target_word_count: { type: Number, default: 1000 },
  uuid: String,
  canonical_url: String,
  codeinjection_head: String,
  codeinjection_foot: String,
  custom_template: String,
  email_subject: String,
  meta_title: String,
  meta_description: String
}, {
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

PostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const PostModel = model<Post>('Post', PostSchema);
export default PostModel; 