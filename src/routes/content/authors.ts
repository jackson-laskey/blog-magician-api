import { Router } from 'express';
import { validateApiKey } from '../../middleware/auth';
import { getAuthors, getAuthorById, getAuthorBySlug } from '../../controllers/authors';

const router = Router();

// Add validateApiKey middleware to all routes
router.use(validateApiKey);

router.get('/', getAuthors);
router.get('/:id([0-9a-fA-F]{24})', getAuthorById);
router.get('/slug/:slug', getAuthorBySlug);

export default router; 