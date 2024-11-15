import { Schema, model } from 'mongoose';
import { Author } from '@jdl-keys/blog-magician-types';

const AuthorSchema = new Schema<Author>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  profile_image: { type: String },
  cover_image: { type: String },
  bio: { type: String },
  website: { type: String },
  location: { type: String },
  facebook: { type: String },
  twitter: { type: String },
  meta_title: { type: String },
  meta_description: { type: String },
  team_id: { 
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    get: (v: any) => v?.toString()
  },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

AuthorSchema.virtual('id').get(function(this: any) {
  return this._id.toHexString();
});

AuthorSchema.virtual('url').get(function(this: any) {
  return `/author/${this.slug}/`;
});

const AuthorModel = model<Author>('Author', AuthorSchema);
export default AuthorModel; 