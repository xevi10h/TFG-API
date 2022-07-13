import { Request, Response } from 'express';
import connection from '../database';
import { Point } from 'mapbox-gl';
import Area from '../models/Area';
import Expedition from '../models/Expedition';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';
import CartesianPoint from '../models/CartesianPoint';

const numDivisions = 20;

function calculateExpeditionValue(
  expedition: Expedition,
  configValue: any
): number {
  switch (configValue) {
    case 'equal':
      return 1;
    case 'max':
      return Math.max(expedition.volume, expedition.weight);
    case 'min':
      return Math.min(expedition.volume, expedition.weight);
    case 'sum':
      return expedition.volume + expedition.weight;
    case 'min':
      return expedition.volume * expedition.weight;
    default:
      return 1;
  }
}

function minMaxCoordinates(expeditions: Expedition[]): any {
  return expeditions.reduce(
    (prev, curr) => {
      if (curr.coordinates.x < prev.minLatitude)
        prev.minLatitude = curr.coordinates.x;
      if (curr.coordinates.x > prev.maxLatitude)
        prev.maxLatitude = curr.coordinates.x;
      if (curr.coordinates.y < prev.minLongitude)
        prev.minLongitude = curr.coordinates.y;
      if (curr.coordinates.y > prev.maxLongitude)
        prev.maxLongitude = curr.coordinates.y;
      return prev;
    },
    {
      minLatitude: 90,
      maxLatitude: -90,
      minLongitude: 180,
      maxLongitude: -180,
    }
  );
}

function createEmptyAreas(
  minLatitude: number,
  maxLatitude: number,
  minLongitude: number,
  maxLongitude: number
) {
  const areas: Area[] = [];
  const latitudeInterval = (maxLatitude - minLatitude) / numDivisions;
  const longitudeInterval =
    (maxLongitude - minLongitude) / numDivisions;
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
      areas.push(
        new Area(indexId, [
          [lat, lat + latitudeInterval],
          [long, long + longitudeInterval],
        ])
      );
      indexId++;
    }
  }
  return areas;
}

function fillAreas(
  expeditions: Expedition[],
  areas: Area[],
  configValue: any
) {
  expeditions.forEach((expedition) => {
    const areaAssigned = areas.find(
      (area) =>
        area.coordinates[0][0] <= expedition.coordinates.x &&
        area.coordinates[0][1] >= expedition.coordinates.x &&
        area.coordinates[1][0] <= expedition.coordinates.y &&
        area.coordinates[1][1] >= expedition.coordinates.y
    );

    if (areaAssigned) {
      areaAssigned.value += calculateExpeditionValue(
        expedition,
        configValue
      );
    }
  });
  return areas;
}

function coordinatesToMeters(
  lat1: number,
  lat2: number,
  lon1: number,
  lon2: number
) {
  const rad = function (x: number) {
    return (x * Math.PI) / 180;
  };
  var R = 6378137; //Radi de la Terra en metres
  var dLat = rad(lat2 - lat1);
  var dLong = rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Number(d.toFixed(2));
}

function areasToCartesianGrid(
  areas: Area[],
  minLatitude: number,
  minLongitude: number
) {
  const cartesianGrid: CartesianPoint[] = [];
  areas.forEach((area) => {
    cartesianGrid.push(
      new CartesianPoint(
        coordinatesToMeters(
          area.coordinates[0][0] +
            (area.coordinates[0][1] - area.coordinates[0][0]) / 2,
          minLatitude,
          0,
          0
        ),
        coordinatesToMeters(
          0,
          0,
          area.coordinates[1][0] +
            (area.coordinates[1][1] - area.coordinates[1][0]) / 2,
          minLongitude
        ),
        area.value
      )
    );
  });
  return cartesianGrid;
}

function matchCartesianPointToArea(
  area: Area,
  cartesianGrid: CartesianPoint[],
  minLatitude: number,
  minLongitude: number
) {
  const xMin = coordinatesToMeters(
    minLatitude,
    area.coordinates[0][0],
    0,
    0
  );
  const xMax = coordinatesToMeters(
    minLatitude,
    area.coordinates[0][1],
    0,
    0
  );
  const yMin = coordinatesToMeters(
    0,
    0,
    minLongitude,
    area.coordinates[1][0]
  );
  const yMax = coordinatesToMeters(
    0,
    0,
    minLongitude,
    area.coordinates[1][1]
  );
  const cartesianPoint = cartesianGrid.find(
    (c) => c.x > xMin && c.x < xMax && c.y > yMin && c.y < yMax
  );
  if (cartesianPoint) area.value = cartesianPoint.z;
  else console.log('NOOOO TROBAT');
  return area;
}

function addWarehousesToCartesianGrid(
  warehouses: any[],
  cartesianGrid: CartesianPoint[],
  metersLat: number,
  metersLong: number,
  minLatitude: number,
  minLongitude: number
) {
  warehouses.forEach((warehouse) => {
    if (warehouse.isAutomatic) {
      const maxCartesianPoint = cartesianGrid.reduce(
        (prev: CartesianPoint, curr: CartesianPoint) => {
          if (curr.z > prev.z) return curr;
          return prev;
        },
        new CartesianPoint(0, 0, 0)
      );
      warehouse.coordinates = [
        minLatitude + maxCartesianPoint.x / metersLat,
        minLongitude + maxCartesianPoint.y / metersLong,
      ];
    }
  });
  return { warehouses, cartesianGrid };
}

export const createAreas = async (req: Request, res: Response) => {
  let {
    configValue,
    dateRange,
    volumeRange,
    weightRange,
    warehouses,
  } = req.body;
  const query = mongoDbQueryCreation({
    dateRange,
    volumeRange,
    weightRange,
  });
  const rawExpeditions = await connection
    .collection('expeditions')
    .aggregate([{ $match: query ? { $and: query } : {} }])
    .toArray();
  const expeditions: Array<Expedition> = [];
  rawExpeditions.forEach((rawExpedition: any) =>
    expeditions.push(
      new Expedition(
        rawExpedition.dateFull,
        rawExpedition.weight,
        rawExpedition.volume,
        new Point(
          rawExpedition.address.geometry.coordinates[0],
          rawExpedition.address.geometry.coordinates[1]
        )
      )
    )
  );
  const { minLatitude, maxLatitude, minLongitude, maxLongitude } =
    minMaxCoordinates(expeditions);
  const metersLat =
    coordinatesToMeters(minLatitude, maxLatitude, 0, 0) /
    (maxLatitude - minLatitude);
  const metersLong =
    coordinatesToMeters(0, 0, minLongitude, maxLongitude) /
    (maxLongitude - minLongitude);
  let areas: Area[] = createEmptyAreas(
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude
  );
  areas = fillAreas(expeditions, areas, configValue);
  let cartesianGrid = areasToCartesianGrid(
    areas,
    minLatitude,
    minLongitude
  );
  //Afegir magatzems
  ({ cartesianGrid, warehouses } = addWarehousesToCartesianGrid(
    warehouses,
    cartesianGrid,
    metersLat,
    metersLong,
    minLatitude,
    minLongitude
  ));
  //Calcular noves areas
  const newAreas = areas.map((area) =>
    matchCartesianPointToArea(
      area,
      cartesianGrid,
      minLatitude,
      minLongitude
    )
  );
  let areasFiltered = areas.filter((area) => area.value > 0);
  res.json({ areas: areasFiltered, warehouses });
};
