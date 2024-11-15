import { Request, Response } from 'express';
import { Tag, ContentAPIResponse } from '@jdl-keys/blog-magician-types';
import TagModel from '../models/Tag';
import { ObjectId } from 'mongodb';

// Define custom request interface
interface AuthRequest extends Request {
  teamId: string;
}

export async function getTags(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const teamId = new ObjectId(req.teamId);

    const [tags, total] = await Promise.all([
      TagModel.find({ team_id: teamId })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TagModel.countDocuments({ team_id: teamId })
    ]);

    const pages = Math.ceil(total / limit);

    const response: ContentAPIResponse<Tag> = {
      data: tags,
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
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Error fetching tags' });
  }
}

export async function getTagById(req: Request, res: Response) {
  try {
    const teamId = new ObjectId(req.teamId);
    const tag = await TagModel.findOne({
      _id: new ObjectId(req.params.id),
      team_id: teamId
    }).lean();

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (!tag.team_id) {
      return res.status(500).json({ error: 'Invalid tag data: missing team_id' });
    }

    const transformedTag: Tag = {
      ...tag,
      id: tag._id.toString(),
      team_id: tag.team_id.toString()
    };

    return res.json({ data: transformedTag });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return res.status(500).json({ error: 'Error fetching tag' });
  }
}

export async function getTagBySlug(req: Request, res: Response) {
  try {
    const teamId = new ObjectId(req.teamId);
    const tag = await TagModel.findOne({
      slug: req.params.slug,
      team_id: teamId
    }).lean();

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (!tag.team_id) {
      return res.status(500).json({ error: 'Invalid tag data: missing team_id' });
    }

    const transformedTag: Tag = {
      ...tag,
      id: tag._id.toString(),
      team_id: tag.team_id.toString()
    };

    return res.json({ data: transformedTag });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return res.status(500).json({ error: 'Error fetching tag' });
  }
} 