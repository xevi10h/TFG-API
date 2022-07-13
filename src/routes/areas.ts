import { Router } from 'express';
import { createAreas } from '../controllers/areas';
const router = Router();

router.post('/', createAreas);

export default router;
