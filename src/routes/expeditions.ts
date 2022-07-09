import { Router } from 'express';
import { getExpeditions } from '../controllers/expeditions';
const router = Router();

router.get('/', getExpeditions);

export default router;
