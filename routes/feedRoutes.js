import { Router } from 'express';
import { listGlobalFeed } from '../controllers/feedController.js';

const router = Router();

router.get('/', listGlobalFeed);

export default router;
