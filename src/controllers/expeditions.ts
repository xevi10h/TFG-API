import { Request, Response } from 'express';
import connection from '../database';
import ExpeditionRepository from '../repositories/expedition-repository';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';
const expeditionRepository = new ExpeditionRepository();

export const getExpeditions = async (req: Request, res: Response) => {
	const { dateRange, volumeRange, weightRange } = req.query;
	const filters = {
		dateRange:
			Array.isArray(dateRange) && dateRange?.map((d) => new Date(d)),
		volumeRange:
			Array.isArray(volumeRange) &&
			volumeRange?.map((v) => Number(v)),
		weightRange:
			Array.isArray(weightRange) &&
			weightRange?.map((w) => Number(w)),
	};
	const expeditions = await expeditionRepository.findWithFilters(
		filters
	);
	res.json(expeditions);
};
