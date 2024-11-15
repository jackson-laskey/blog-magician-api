//import { StylePrompt } from '@blog-platform/packages/types/src/index';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/*interface BlogSettings {
  _id: ObjectId;
  stylePrompts: Array<{
    name: string;
    prompt: string;
    id: string;
    isDefault: boolean;
  }>;
  team_id: ObjectId;
}*/

async function migrateStylePrompts() {
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

    const stylePromptsCollection = 'style_prompts';
    await db.createCollection(stylePromptsCollection);

    const blogSettings = await db.collection('blog_settings').find({}).toArray();
    console.log(`Found ${blogSettings.length} blog settings documents`);

    for (const settings of blogSettings) {
      if (!settings.stylePrompts) continue;

      for (const stylePrompt of settings.stylePrompts) {
        const _id = new ObjectId();
        const newStylePrompt = {
          _id,
          id: _id.toString(),
          name: stylePrompt.name,
          prompt: stylePrompt.prompt,
          isDefault: stylePrompt.isDefault,
          team_id: settings.team_id,
          created_at: new Date(),
          updated_at: new Date()
        };

        await db.collection('style_prompts').insertOne(newStylePrompt);
        console.log(`✓ Migrated style prompt: ${stylePrompt.name}`);
      }

      await db.collection('blog_settings').updateOne(
        { _id: settings._id },
        { $unset: { stylePrompts: "" } }
      );

      console.log(`✓ Updated blog settings document: ${settings._id}`);
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateStylePrompts().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
}); 