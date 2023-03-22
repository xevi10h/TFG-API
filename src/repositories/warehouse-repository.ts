import Warehouse from '../classes/Warehouse';
import IWarehouse from '../interfaces/IWarehouse';
import { WarehouseModel } from '../models/WarehouseModel';

export default class WarehouseRepository {
	async findAll(): Promise<IWarehouse[]> {
		return WarehouseModel.find({}).exec();
	}

	async findById(id: string): Promise<IWarehouse | null> {
		return WarehouseModel.findById(id).exec();
	}

	async create(warehouse: Warehouse) {
		return WarehouseModel.create(warehouse);
	}

	async createMany(warehouses: Warehouse[]): Promise<IWarehouse[]> {
		return WarehouseModel.insertMany(warehouses);
	}

	async update(
		id: string,
		warehouse: IWarehouse
	): Promise<IWarehouse | null> {
		return WarehouseModel.findByIdAndUpdate(id, warehouse, {
			new: true,
		}).exec();
	}

	async delete(id: string): Promise<IWarehouse | null> {
		return WarehouseModel.findByIdAndDelete(id).exec();
	}
}
