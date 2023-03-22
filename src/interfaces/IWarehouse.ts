export default interface IWarehouse {
	_id?: String;
	name: String;
	isAutomatic: Boolean;
	coordinates: {
		longitude: number;
		latitude: number;
	};
	radius: number;
	capacity: number;
	createdAt: Date;
	updatedAt: Date;
	priority: number;
	model: String;
	maxRadius?: number;
	maxCapacity?: number;
}
