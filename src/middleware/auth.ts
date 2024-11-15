import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import mongoose from 'mongoose';

export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.get('X-API-Key');

  if (!apiKey) {
    res.status(401).json({ error: 'API key is required' });
    return;
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database connection not available');
      res.status(500).json({ error: 'Database connection not available' });
      return;
    }

    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    const team = await db.collection('teams').findOne({
      'apiKeys.hash': hashedKey
    });

    if (!team) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.teamId = team._id.toString();

    await db.collection('teams').updateOne(
      { 
        _id: team._id,
        'apiKeys.hash': hashedKey
      },
      { 
        $set: { 
          'apiKeys.$.lastUsed': new Date() 
        }
      }
    );

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 