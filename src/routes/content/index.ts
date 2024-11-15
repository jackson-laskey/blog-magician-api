import { Router } from 'express';
import postsRouter from './posts';
import authorsRouter from './authors';
import tagsRouter from './tags';

const router = Router();

router.use('/posts', postsRouter);
router.use('/authors', authorsRouter);
router.use('/tags', tagsRouter);

export default router; 