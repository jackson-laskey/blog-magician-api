import { Router } from 'express';
import { validateApiKey } from '../../middleware/auth';
import { getTags, getTagById, getTagBySlug } from '../../controllers/tags';

const router = Router();

// Add validateApiKey middleware to all routes
router.use(validateApiKey);

router.get('/', getTags);
router.get('/slug/:slug', getTagBySlug);
router.get('/:id([0-9a-fA-F]{24})', getTagById);

export default router; 