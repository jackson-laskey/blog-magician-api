import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrateBlogSettings() {
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

    // Create blog_settings collection if it doesn't exist
    await db.createCollection('blog_settings');

    // Get all teams with blogSettings
    const teams = await db.collection('teams').find({
      blogSettings: { $exists: true }
    }).toArray();

    console.log(`Found ${teams.length} teams with blog settings`);

    for (const team of teams) {
      if (!team.blogSettings) continue;

      // Create new blog settings document
      const blogSettingsDoc = {
        ...team.blogSettings,
        team_id: team._id,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('blog_settings').insertOne(blogSettingsDoc);

      // Update team with reference to blog settings
      await db.collection('teams').updateOne(
        { _id: team._id },
        {
          $set: { blogSettingsId: result.insertedId },
          $unset: { blogSettings: "" }
        }
      );

      console.log(`Migrated settings for team ${team._id}`);
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
migrateBlogSettings().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
}); 