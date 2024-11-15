import { Request, Response } from 'express';
import { Author, ContentAPIResponse } from '@jdl-keys/blog-magician-types';
import AuthorModel from '../models/Author';
import { ObjectId } from 'mongodb';

// Define interface for our custom request type that includes teamId
interface AuthRequest extends Request {
  teamId: string;
}

export async function getAuthors(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const teamId = new ObjectId(req.teamId);

    const [authors, total] = await Promise.all([
      AuthorModel.find({ team_id: teamId })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuthorModel.countDocuments({ team_id: teamId })
    ]);

    const pages = Math.ceil(total / limit);

    const response: ContentAPIResponse<Author> = {
      data: authors,
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
    console.error('Error fetching authors:', error);
    return res.status(500).json({ error: 'Error fetching authors' });
  }
}

export async function getAuthorById(req: AuthRequest, res: Response) {
  try {
    const teamId = new ObjectId(req.teamId);
    const author = await AuthorModel.findOne({
      _id: new ObjectId(req.params.id),
      team_id: teamId
    }).lean();

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    if (!author.team_id) {
      return res.status(500).json({ error: 'Invalid author data: missing team_id' });
    }

    const transformedAuthor: Author = {
      ...author,
      id: author._id.toString(),
      team_id: author.team_id.toString()
    };

    return res.json({ data: transformedAuthor });
  } catch (error) {
    console.error('Error fetching author:', error);
    return res.status(500).json({ error: 'Error fetching author' });
  }
}

export async function getAuthorBySlug(req: AuthRequest, res: Response) {
  try {
    const teamId = new ObjectId(req.teamId);
    const author = await AuthorModel.findOne({
      slug: req.params.slug,
      team_id: teamId
    }).lean();

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    if (!author.team_id) {
      return res.status(500).json({ error: 'Invalid author data: missing team_id' });
    }

    const transformedAuthor: Author = {
      ...author,
      id: author._id.toString(),
      team_id: author.team_id.toString()
    };

    return res.json({ data: transformedAuthor });
  } catch (error) {
    console.error('Error fetching author:', error);
    return res.status(500).json({ error: 'Error fetching author' });
  }
} 