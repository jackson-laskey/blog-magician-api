import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function updateTeamIds() {
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

    const posts = await db.collection('blogposts').find({}).toArray();
    console.log(`Found ${posts.length} posts to update`);

    for (const post of posts) {
      try {
        // Convert string team_id to ObjectId
        if (typeof post.team_id === 'string' || post.team) {
          const teamId = new ObjectId(post.team_id || post.team);
          await db.collection('blogposts').updateOne(
            { _id: post._id },
            { 
              $set: { team_id: teamId },
              $unset: { team: "" } // Remove old team field if it exists
            }
          );
          console.log(`✓ Updated team_id for post: ${post.title}`);
        }
      } catch (error) {
        console.error(`× Failed to update team_id for post ${post.title}:`, error);
      }
    }

    console.log('Update complete');
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateTeamIds().catch(error => {
  console.error('Update script failed:', error);
  process.exit(1);
}); 