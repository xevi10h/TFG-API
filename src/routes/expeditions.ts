import { Router } from 'express';
import {
  getExpeditions,
  postExpeditionsForDataset,
} from '../controllers/expeditions';
const router = Router();

router.get('/', getExpeditions);
router.post('/', postExpeditionsForDataset);

export default router;
