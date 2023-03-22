import IExpedition from '../interfaces/IExpedition';
import IWarehouse from '../interfaces/IWarehouse';
import { coordinatesToKm } from '../utils/areaUtils';
import Area from './Area';
import Areas from './Areas';
import CartesianGrid from './Areas';
import CartesianPoint from './CartesianPoint';
import Expedition from './Expedition';
import Expeditions from './Expeditions';

export default class Warehouse implements IWarehouse {
	_id: String;
	createdAt: Date;
	updatedAt: Date;
	coordinates: {
		longitude: number;
		latitude: number;
	};
	radius: number;
	capacity: number;
	name: String;
	isAutomatic: Boolean;
	priority: number;
	model: String;
	maxRadius?: number;
	maxCapacity?: number;

	constructor(warehouse: IWarehouse) {
		this._id = warehouse._id;
		this.createdAt = warehouse.createdAt;
		this.updatedAt = warehouse.updatedAt;
		this.coordinates = warehouse.coordinates;
		this.radius = warehouse.radius;
		this.capacity = warehouse.capacity;
		this.name = warehouse.name;
		this.isAutomatic = warehouse.isAutomatic;
		this.priority = warehouse.priority;
		this.model = warehouse.model;
		this.maxRadius = warehouse.maxRadius;
		this.maxCapacity = warehouse.maxCapacity;
	}

	assignFrom(warehouse: IWarehouse): void {
		this._id = warehouse._id;
		this.createdAt = warehouse.createdAt;
		this.updatedAt = warehouse.updatedAt;
		this.coordinates = warehouse.coordinates;
		this.radius = warehouse.radius;
		this.capacity = warehouse.capacity;
		this.name = warehouse.name;
		this.isAutomatic = warehouse.isAutomatic;
		this.maxRadius = warehouse.maxRadius;
		this.maxCapacity = warehouse.maxCapacity;
	}

	async calculateBestCoordinatesNewWarehouse(
		warehouses: Warehouse[],
		areas: Areas
	) {
		warehouses.forEach((warehouse) => areas.addWarehouse(warehouse));
		if (this.maxRadius) {
			this.assignFrom(areas.returnBestWarehouseForMaxRadius(this));
		}
		if (this.maxCapacity) {
			this.assignFrom(areas.returnBestWarehouseForMaxCapacity(this));
		}
	}
}
