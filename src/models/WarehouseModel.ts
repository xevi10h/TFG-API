import { Model, Schema, model } from 'mongoose';
import IWarehouse from '../interfaces/IWarehouse';

const WarehouseSchema = new Schema({
	createdAt: {
		type: Date,
		required: true,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		required: true,
		default: Date.now,
	},
	coordinates: {
		longitude: {
			type: Number,
			required: function (this: IWarehouse) {
				return !this.isAutomatic;
			},
			min: [-180, 'Longitude must be greater than or equal to -180'],
			max: [180, 'Longitude must be less than or equal to 180'],
		},
		latitude: {
			type: Number,
			required: function (this: IWarehouse) {
				return !this.isAutomatic;
			},
			min: [-90, 'Latitude must be greater than or equal to -90'],
			max: [90, 'Latitude must be less than or equal to 90'],
		},
	},
	radius: {
		type: Number,
		min: [0, 'Radius must be greater than or equal to 0'],
	},
	capacity: {
		type: Number,
		min: [0, 'Capacity must be greater than or equal to 0'],
	},
	name: {
		type: String,
		required: true,
	},
	isAutomatic: {
		type: Boolean,
		required: true,
	},
	priority: {
		type: Number,
		required: true,
		min: [0, 'Priority must be greater than or equal to 0'],
	},
	model: {
		type: String,
		required: true,
		enum: ['gaussian', 'cylinder'],
	},
	maxRadius: {
		type: Number,
		min: [0, 'maxRadius must be greater than or equal to 0'],
	},
	maxCapacity: {
		type: Number,
		min: [0, 'maxCapacity must be greater than or equal to 0'],
		validate: function (this: IWarehouse) {
			return (this.maxCapacity && !this.maxRadius) ||
				(!this.maxCapacity && this.maxRadius)
				? true
				: false;
		},
		message: 'maxCapacity is prohibited when maxRadius is present.',
	},
});

const warehouseSchema = new Schema(WarehouseSchema);

export const WarehouseModel: Model<IWarehouse> = model<IWarehouse>(
	'Warehouse',
	warehouseSchema
);
