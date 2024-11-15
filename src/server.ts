import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from '@blog-platform/database';
import contentRoutes from './routes/content';
import mongoose from 'mongoose';
import { validateApiKey } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Add logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Content API routes
app.use('/api/content/v1', validateApiKey, contentRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB and start server
connectToDatabase().then(async () => {
  // Verify database connection
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  
  // Check if database connection is available
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }
  
  // List all collections
  const collections = await db.collections();
  console.log('Available collections:', collections.map(c => c.collectionName));
  
  // Count documents in blogposts collection
  const count = await db.collection('blogposts').countDocuments();
  console.log('Number of blog posts:', count);
  
  app.listen(port, () => {
    console.log(`Content API server running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
}); 