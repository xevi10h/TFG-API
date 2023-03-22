import Expedition from '../classes/Expedition';
import IExpedition from '../interfaces/IExpedition';
import IExpeditionFilter from '../interfaces/IExpeditionFilter';
import { ExpeditionModel } from '../models/ExpeditionModel';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';

export default class ExpeditionRepository {
	async findAll(): Promise<IExpedition[]> {
		return ExpeditionModel.find({}).exec();
	}

	async findById(id: string): Promise<IExpedition | null> {
		return ExpeditionModel.findById(id).exec();
	}

	async findWithFilters(
		filter: IExpeditionFilter
	): Promise<IExpedition[]> {
		const mongoFilter = mongoDbQueryCreation(filter);
		return ExpeditionModel.find({ $and: mongoFilter }).exec();
	}

	async create(expedition: Expedition) {
		return ExpeditionModel.create(expedition);
	}

	async createMany(
		expeditions: Expedition[]
	): Promise<IExpedition[]> {
		return ExpeditionModel.insertMany(expeditions);
	}

	async update(
		id: string,
		expedition: IExpedition
	): Promise<IExpedition | null> {
		return ExpeditionModel.findByIdAndUpdate(id, expedition, {
			new: true,
		}).exec();
	}

	async delete(id: string): Promise<IExpedition | null> {
		return ExpeditionModel.findByIdAndDelete(id).exec();
	}
}
