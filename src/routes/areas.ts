import { Router } from 'express';
import { getAreas } from '../controllers/areas';
const router = Router();

router.get('/', getAreas);

export default router;
