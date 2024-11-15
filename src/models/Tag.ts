import mongoose from 'mongoose';
import { Tag } from '@jdl-keys/blog-magician-types';

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  feature_image: String,
  visibility: {
    type: String,
    enum: ['public', 'internal'],
    default: 'public'
  },
  meta_title: String,
  meta_description: String,
  og_image: String,
  og_title: String,
  og_description: String,
  twitter_image: String,
  twitter_title: String,
  twitter_description: String,
  codeinjection_head: String,
  codeinjection_foot: String,
  canonical_url: String,
  accent_color: String,
  url: String,
  team_id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      if (ret.team_id) {
        ret.team_id = ret.team_id.toString();
      }
      return ret;
    }
  }
});

// Ensure indexes
tagSchema.index({ team_id: 1, slug: 1 }, { unique: true });
tagSchema.index({ team_id: 1 });

const TagModel = mongoose.model<Tag & mongoose.Document>('Tag', tagSchema);

export default TagModel; 