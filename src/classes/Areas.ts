import { makeSymmetricalGaussian } from '../utils/areaUtils';
import Area from './Area';
import Expedition from './Expedition';
import Warehouse from './Warehouse';

export default class Areas {
	areas: Area[];

	constructor(
		minLatitude: number,
		maxLatitude: number,
		minLongitude: number,
		maxLongitude: number,
		divisions: number
	) {
		this.areas = [];
		const latitudeInterval = (maxLatitude - minLatitude) / divisions;
		const longitudeInterval =
			(maxLongitude - minLongitude) / divisions;
		let indexId = 1;
		for (
			let lat = minLatitude;
			lat >= minLatitude && lat < maxLatitude;
			lat = lat + latitudeInterval
		) {
			for (
				let long = minLongitude;
				long >= minLongitude && long < maxLongitude;
				long = long + longitudeInterval
			) {
				this.areas.push(
					new Area(indexId, [
						[lat, lat + latitudeInterval],
						[long, long + longitudeInterval],
					])
				);
				indexId++;
			}
		}
	}

	fillAreas(expeditions: Expedition[]) {
		expeditions.forEach((expedition) => {
			const areaAssigned = this.areas.find(
				(area) =>
					area.coordinates[0][0] <= expedition.coordinates.x &&
					area.coordinates[0][1] >= expedition.coordinates.x &&
					area.coordinates[1][0] <= expedition.coordinates.y &&
					area.coordinates[1][1] >= expedition.coordinates.y
			);
			if (areaAssigned) {
				areaAssigned.value += expedition.value;
			}
		});
	}

	get maxPoint(): Area {
		return this.areas.reduce(
			(prev, curr) => (curr.value > prev.value ? curr : prev),
			new Area(
				0,
				[
					[0, 0],
					[0, 0],
				],
				0
			)
		);
	}

	get totalLoad(): number {
		return this.areas.reduce((prev, curr) => prev + curr.value, 0);
	}

	filterFilledAreas() {
		this.areas = this.areas.filter((area) => area.value > 0);
	}

	addWarehouse(warehouse: Warehouse): Warehouse {
		if (warehouse.maxRadius) {
			const warehouseGausian = makeSymmetricalGaussian(
				this.maxPoint.value,
				warehouse.coordinates.latitude,
				warehouse.coordinates.longitude,
				warehouse.maxRadius
			);
			this.areas.forEach((area) => {
				const newAreaValue = warehouseGausian(
					area.centralLatitude,
					area.centralLongitude
				);
				area.value -= newAreaValue;
				if (area.value < 0) area.value = 0;
				warehouse.capacity =
					warehouse?.capacity >= 0
						? warehouse.capacity + newAreaValue
						: newAreaValue;
			});
		}
		if (warehouse.maxCapacity) {
			const maxPossibleRadius = Number(
				process.env.MAX_RADIUS_TO_ITERATE
			);
			for (let depth = this.maxPoint.value; depth >= 0; depth -= 10) {
				for (
					let iterateRadius = 0;
					iterateRadius < maxPossibleRadius;
					iterateRadius += 0.1
				) {
					// Create the Gaussian for each warehouse in each depth
					const warehouseGausian = makeSymmetricalGaussian(
						depth,
						warehouse.coordinates.latitude,
						warehouse.coordinates.longitude,
						iterateRadius
					);
					// Calculate the difference between the gaussian for each point and the warehouse gaussian
					const result = this.areas.reduce(
						(prev: number, curr: Area) => {
							const gaussiana = warehouseGausian(
								curr.centralLatitude,
								curr.centralLongitude
							);
							const diference = curr.value - (depth - gaussiana);
							if (diference > 0) prev += diference;
							return prev;
						},
						0
					);
					if (result >= warehouse.maxCapacity) {
						this.areas.forEach((area) => {
							const newAreaValue = warehouseGausian(
								area.centralLatitude,
								area.centralLongitude
							);
							area.value -= newAreaValue;
							if (area.value < 0) area.value = 0;
						});
						warehouse.radius = iterateRadius;
						warehouse.capacity = result;
						return warehouse;
					}
				}
			}
		}
		return warehouse;
	}

	returnBestWarehouseForMaxRadius(warehouse: Warehouse) {
		const now = new Date();
		return this.areas.reduce(
			(prevBestWarehouse, currArea) => {
				// Create the Gaussian for each warehouse
				const pointGausian = makeSymmetricalGaussian(
					this.maxPoint.value,
					currArea.centralLatitude,
					currArea.centralLongitude,
					warehouse.maxRadius
				);
				// Calculate the difference between the gaussian for each point and the warehouse gaussian
				const result = this.areas.reduce(
					(prev: number, curr: Area) => {
						const gaussiana = pointGausian(
							curr.centralLatitude,
							curr.centralLongitude
						);
						const diference =
							curr.value - (this.maxPoint.value - gaussiana);
						if (diference > 0) prev += diference;
						return prev;
					},
					0
				);
				// If the warehouse is bettern than the previous, we substitute it
				if (result > prevBestWarehouse.capacity) {
					prevBestWarehouse = new Warehouse({
						name: warehouse.name,
						isAutomatic: warehouse.isAutomatic,
						coordinates: {
							longitude: currArea.centralLongitude,
							latitude: currArea.centralLatitude,
						},
						radius: warehouse.maxRadius,
						maxRadius: warehouse.maxRadius,
						capacity: result,
						createdAt: now,
						updatedAt: now,
						priority: warehouse.priority,
						model: warehouse.model,
					});
				}
				return prevBestWarehouse;
			},
			new Warehouse({
				name: warehouse.name,
				isAutomatic: warehouse.isAutomatic,
				coordinates: {
					longitude: 0,
					latitude: 0,
				},
				radius: 0,
				capacity: 0,
				createdAt: now,
				updatedAt: now,
				priority: warehouse.priority,
				model: warehouse.model,
			})
		);
	}

	returnBestWarehouseForMaxCapacity(warehouse: Warehouse) {
		const maxPossibleRadius = Number(
			process.env.MAX_RADIUS_TO_ITERATE
		);
		const now = new Date();
		return this.areas.reduce(
			(prevBestWarehouse, currArea) => {
				let bestWarehouseForThisArea: Warehouse;
				for (
					let depth = this.maxPoint.value;
					!bestWarehouseForThisArea && depth >= 0;
					depth -= 10
				) {
					for (
						let iterateRadius = 0;
						!bestWarehouseForThisArea &&
						iterateRadius < maxPossibleRadius;
						iterateRadius += 0.1
					) {
						// Create the Gaussian for each warehouse in each depth
						const pointGausian = makeSymmetricalGaussian(
							depth,
							currArea.centralLatitude,
							currArea.centralLongitude,
							iterateRadius
						);
						// Calculate the difference between the gaussian for each point and the warehouse gaussian
						const result = this.areas.reduce(
							(prev: number, curr: Area) => {
								const gaussiana = pointGausian(
									curr.centralLatitude,
									curr.centralLongitude
								);
								const diference = curr.value - (depth - gaussiana);
								if (diference > 0) prev += diference;
								return prev;
							},
							0
						);
						if (result >= warehouse.maxCapacity) {
							bestWarehouseForThisArea = new Warehouse({
								name: warehouse.name,
								isAutomatic: warehouse.isAutomatic,
								coordinates: {
									longitude: currArea.centralLongitude,
									latitude: currArea.centralLatitude,
								},
								radius: iterateRadius,
								capacity: result,
								maxCapacity: warehouse.maxCapacity,
								createdAt: now,
								updatedAt: now,
								model: warehouse.model,
								priority: 1,
							});
						}
					}
				}
				return bestWarehouseForThisArea?.radius <
					prevBestWarehouse?.radius
					? bestWarehouseForThisArea
					: prevBestWarehouse;
			},
			new Warehouse({
				name: warehouse.name,
				isAutomatic: warehouse.isAutomatic,
				coordinates: {
					longitude: 0,
					latitude: 0,
				},
				radius: maxPossibleRadius,
				capacity: 0,
				createdAt: now,
				updatedAt: now,
				model: warehouse.model,
				maxCapacity: warehouse.maxCapacity,
				priority: 1,
			})
		);
	}
}
