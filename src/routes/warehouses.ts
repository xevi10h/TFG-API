import { Router } from 'express';
import {
	createWarehouse,
	getAllWarehouses,
	createMultipleWarehouses,
	deleteWarehouse,
	updateWarehouse,
	reCalculateWarehouses,
} from '../controllers/warehouses';
const router = Router();

router.get('/', getAllWarehouses);
router.post('/', createWarehouse);
router.post('/many', createMultipleWarehouses);
router.patch('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);
router.patch('/', reCalculateWarehouses);

export default router;
