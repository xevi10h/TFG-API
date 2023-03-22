import { Request, Response } from 'express';
import WarehouseRepository from '../repositories/warehouse-repository';
import ExpeditionRepository from '../repositories/expedition-repository';
import Warehouse from '../classes/Warehouse';
import Expedition from '../classes/Expedition';
import Expeditions from '../classes/Expeditions';
import Areas from '../classes/Areas';
const warehouseRepository = new WarehouseRepository();
const expeditionRepository = new ExpeditionRepository();

export const getAllWarehouses = async (
	req: Request,
	res: Response
) => {
	try {
		const allWarehouses = await warehouseRepository.findAll();
		res.json(allWarehouses);
		res.status(200);
		res.end();
	} catch (error) {
		console.log(error);
		res.json(error);
		res.status(404);
		res.end();
	}
};

export const getWarehouseById = async (
	req: Request,
	res: Response
) => {
	try {
		const warehouse = await warehouseRepository.findById(
			req.params.id
		);
		res.json(warehouse);
		res.status(200);
		res.end();
	} catch (error) {
		console.log(error);
		res.json(error);
		res.status(404);
		res.end();
	}
};

export const createWarehouse = async (
	req: Request,
	res: Response
) => {
	try {
		const configValue = req.body?.configValue;
		const filters = req.body?.filters;
		const warehouse = req.body?.warehouse;
		const allWarehouses = await (
			await warehouseRepository.findAll()
		).map((w) => new Warehouse(w));
		const newWarehousePriority = allWarehouses.reduce(
			(prev, curr) => (curr.priority > prev ? curr.priority : prev),
			0
		);
		const newWarehouse = new Warehouse({
			...warehouse,
			priority: newWarehousePriority,
		});
		const allExpeditions = await (
			await expeditionRepository.findWithFilters(filters)
		).map((e) => new Expedition(e));
		allExpeditions.forEach((e) =>
			e.calculateExpeditionValue(configValue)
		);
		const expeditions = new Expeditions(allExpeditions);
		const areas = new Areas(
			expeditions.minLatitude,
			expeditions.maxLatitude,
			expeditions.minLongitude,
			expeditions.maxLongitude,
			Number(process.env.NUM_DIVISIONS_CALCULATE)
		);
		areas.fillAreas(allExpeditions);
		areas.filterFilledAreas();
		if (newWarehouse.isAutomatic) {
			newWarehouse.calculateBestCoordinatesNewWarehouse(
				allWarehouses,
				areas
			);
		}
		const createdWarehouse = await warehouseRepository.create(
			newWarehouse
		);
		res.status(201);
		res.json(createdWarehouse);
		res.end();
	} catch (error) {
		console.log(error);
		res.status(400);
		res.json(error);
		res.end();
	}
};

export const createMultipleWarehouses = async (
	req: Request,
	res: Response
) => {
	try {
		const warehouses = req.body.warehouses;
		const createdWarehouses = await warehouseRepository.createMany(
			warehouses
		);
		res.status(201);
		res.json(createdWarehouses);
		res.end();
	} catch (error) {
		console.log(error);
		res.status(422);
		res.json(error);
		res.end();
	}
};

export const updateWarehouse = async (
	req: Request,
	res: Response
) => {
	try {
		const updatedWarehouse = await warehouseRepository.update(
			req.params.id,
			req.body
		);
		res.status(200);
		res.json(updatedWarehouse);
		res.end();
	} catch (error) {
		console.log(error);
		res.status(404);
		res.end();
	}
};

export const deleteWarehouse = async (
	req: Request,
	res: Response
) => {
	try {
		await warehouseRepository.delete(req.params.id);
		res.status(204);
		res.end();
	} catch (error) {
		console.log(error);
		res.status(404);
		res.end();
	}
};

export const reCalculateWarehouses = async (
	req: Request,
	res: Response
) => {
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
		const allExpeditions = await (
			await expeditionRepository.findWithFilters(filters)
		).map((e) => new Expedition(e));
		allExpeditions.forEach((e) =>
			e.calculateExpeditionValue(configValue)
		);
		const expeditions = new Expeditions(allExpeditions);
		const areas = new Areas(
			expeditions.minLatitude,
			expeditions.maxLatitude,
			expeditions.minLongitude,
			expeditions.maxLongitude,
			Number(process.env.NUM_DIVISIONS_CALCULATE)
		);
		areas.fillAreas(allExpeditions);
		areas.filterFilledAreas();
		const addedWarehouse = warehouses.filter(
			(warehouse) => warehouse.isAutomatic === false
		);
		warehouses.forEach((warehouse) => {
			if (warehouse.isAutomatic) {
				warehouse.calculateBestCoordinatesNewWarehouse(
					addedWarehouse,
					areas
				);
				warehouseRepository.update(
					warehouse._id.toString(),
					warehouse
				);
				addedWarehouse.push(warehouse);
			}
		});
		res.status(200);
		res.json({ warehouses });
		res.end();
		return;
	} catch (error) {
		console.log(error);
		res.json(error);
		res.status(404);
		res.end();
	}
};
