import { Router } from 'express';
import { getPosts, getPostById, getPostBySlug } from '../../controllers/posts';

const router = Router();

// GET /api/content/v1/posts/
router.get('/', getPosts);

// GET /api/content/v1/posts/{id}/
router.get('/:id([0-9a-fA-F]{24})', getPostById);

// GET /api/content/v1/posts/slug/{slug}/
router.get('/slug/:slug', getPostBySlug);

export default router; 