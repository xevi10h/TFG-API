import { Request, Response } from 'express';
import connection from '../database';
import { Point } from 'mapbox-gl';
import Area from '../classes/Area';
import Expedition from '../classes/Expedition';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';
import CartesianPoint from '../classes/CartesianPoint';
import { getAllWarehouses } from './warehouses';
import ExpeditionRepository from '../repositories/expedition-repository';
import IExpedition from '../interfaces/IExpedition';
import WarehouseRepository from '../repositories/warehouse-repository';
import Warehouse from '../classes/Warehouse';
import Expeditions from '../classes/Expeditions';
import Areas from '../classes/Areas';
const warehouseRepository = new WarehouseRepository();
const expeditionRepository = new ExpeditionRepository();

export const getAreas = async (req: Request, res: Response) => {
	try {
		const { dateRange, volumeRange, weightRange, configValue } =
			req.query;
		const filters = {
			dateRange:
				Array.isArray(dateRange) &&
				dateRange?.map((d) => new Date(d)),
			volumeRange:
				Array.isArray(volumeRange) &&
				volumeRange?.map((v) => Number(v)),
			weightRange:
				Array.isArray(weightRange) &&
				weightRange?.map((w) => Number(w)),
		};
		const warehouses = await (
			await warehouseRepository.findAll()
		).map((w) => new Warehouse(w));
		const expeditions = await (
			await expeditionRepository.findWithFilters(filters)
		).map((e) => new Expedition(e));
		expeditions.forEach((e) =>
			e.calculateExpeditionValue(configValue)
		);
		const allExpeditions = new Expeditions(expeditions);
		const areas = new Areas(
			allExpeditions.minLatitude,
			allExpeditions.maxLatitude,
			allExpeditions.minLongitude,
			allExpeditions.maxLongitude,
			Number(process.env.NUM_DIVISIONS_CALCULATE)
		);
		areas.fillAreas(expeditions);
		areas.filterFilledAreas();
		warehouses.forEach((warehouse) => areas.addWarehouse(warehouse));
		res.json({
			areas: areas.areas,
			warehouses,
			maxNewPoint: areas.maxPoint.value,
			totalLoad: areas.totalLoad,
			minRadius: 0,
		});
	} catch (error) {
		console.log(error);
		res.status(400);
		res.json(error);
		res.end();
	}
};
