import { Model, Schema, model } from 'mongoose';
import IExpedition from '../interfaces/IExpedition';

const ExpeditionSchema = new Schema({
	dateFull: {
		type: Date,
		required: true,
		default: Date.now,
	},
	address: {
		geometry: {
			coordinates: {
				type: Array<Number>(2),
				required: true,
			},
		},
	},
	weight: {
		type: Number,
		min: [0, 'Weight must be greater than or equal to 0'],
	},
	volume: {
		type: Number,
		min: [0, 'Volume must be greater than or equal to 0'],
	},
	value: {
		type: Number,
		min: [0, 'Value must be greater than or equal to 0'],
	},
});

const expeditionSchema = new Schema(ExpeditionSchema);

export const ExpeditionModel: Model<IExpedition> = model<IExpedition>(
	'Expedition',
	expeditionSchema
);
