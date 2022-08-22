import { Request, Response } from 'express';
import connection from '../database';
import { Point } from 'mapbox-gl';
import Area from '../models/Area';
import Expedition from '../models/Expedition';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';
import CartesianPoint from '../models/CartesianPoint';

const numDivisions = 30;

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
    case 'mul':
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
  var R = 6378.137; //Radi de la Terra en metres
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
  return Number(d.toFixed(5));
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
  if (cartesianPoint) area.value = cartesianPoint.z || 0;
  return area;
}

function makeGaussian(
  amplitude: number,
  x0: number,
  y0: number,
  sigmaX: number,
  sigmaY: number
) {
  return function (
    amplitude: number,
    x0: number,
    y0: number,
    sigmaX: number,
    sigmaY: number,
    x: number,
    y: number
  ) {
    var exponent = -(
      Math.pow(x - x0, 2) / (2 * Math.pow(sigmaX, 2)) +
      Math.pow(y - y0, 2) / (2 * Math.pow(sigmaY, 2))
    );
    return amplitude * Math.pow(Math.E, exponent);
  }.bind(null, amplitude, x0, y0, sigmaX, sigmaY);
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
    //Busquem la màxima altura de la superfície de paquets perquè si no les gaussianes no es creuaran amb la superfície
    const maxCartesianPoint = cartesianGrid.reduce(
      (prev: CartesianPoint, curr: CartesianPoint) => {
        if (curr.z > prev.z) return curr;
        return prev;
      },
      new CartesianPoint(0, 0, 0)
    );
    if (warehouse.isAutomatic && warehouse.isFixed !== true) {
      //AFEGIR DECIDIR PUNT EN FUNCIÓ DE LA INTEGRAL
      if (warehouse.strategy === 'maxArea') {
        warehouse.coordinates = new Point(
          minLatitude + maxCartesianPoint.x / metersLat,
          minLongitude + maxCartesianPoint.y / metersLong
        );
      }
      if (warehouse.strategy === 'integral') {
        const newWarehouse = cartesianGrid.reduce(
          (prevPoint: CartesianPoint, currPoint: CartesianPoint) => {
            //Construim la gaussiana de cada punt
            const pointGausian = makeGaussian(
              maxCartesianPoint.z,
              currPoint.x,
              currPoint.y,
              warehouse.radius / 3.5,
              warehouse.radius / 3.5
            );
            // Busquem el sumatori de diferències entre la gaussiana en qüestió y la quadrícula
            const result = cartesianGrid.reduce(
              (prev: number, curr: CartesianPoint) => {
                const gaussiana = pointGausian(curr.x, curr.y);
                const diference =
                  curr.z - (maxCartesianPoint.z - gaussiana);
                if (diference > 0) prev += diference;
                return prev;
              },
              0
            );
            if (result > prevPoint.z) {
              prevPoint = new CartesianPoint(
                currPoint.x,
                currPoint.y,
                result
              );
            }
            return prevPoint;
          },
          new CartesianPoint(0, 0, 0)
        );
        warehouse.coordinates = new Point(
          minLatitude + newWarehouse.x / metersLat,
          minLongitude + newWarehouse.y / metersLong
        );
      }
    }
    const warehouseGausian = makeGaussian(
      maxCartesianPoint.z,
      coordinatesToMeters(minLatitude, warehouse.coordinates.x, 0, 0),
      coordinatesToMeters(
        0,
        0,
        minLongitude,
        warehouse.coordinates.y
      ),
      warehouse.radius / 3.5,
      warehouse.radius / 3.5
    );
    let absorbedLoad = 0;
    cartesianGrid.forEach((point: CartesianPoint) => {
      const oldValue = point.z;
      point.z -= warehouseGausian(point.x, point.y);
      if (
        !point ||
        point.z === undefined ||
        point.z === null ||
        point.z < 0
      ) {
        point.z = 0;
      }
      absorbedLoad += oldValue - point.z;
    });
    warehouse.absorbedLoad = absorbedLoad;
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
    weightRange,
    volumeRange,
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
  const widthArea =
    coordinatesToMeters(0, 0, minLongitude, maxLongitude) /
    numDivisions;
  const heightArea =
    coordinatesToMeters(minLatitude, maxLatitude, 0, 0) /
    numDivisions;
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
  if (Array.isArray(warehouses) && warehouses.length > 0) {
    ({ cartesianGrid, warehouses } = addWarehousesToCartesianGrid(
      warehouses,
      cartesianGrid,
      metersLat,
      metersLong,
      minLatitude,
      minLongitude
    ));
  }
  //Calcular noves areas
  let newAreas = areas.map((area) =>
    matchCartesianPointToArea(
      area,
      cartesianGrid,
      minLatitude,
      minLongitude
    )
  );

  newAreas = newAreas.filter((area) => area.value > 0);
  const { newMaxPoint, totalLoad } = newAreas.reduce(
    (prev, curr: Area) => {
      if (curr.value > prev.newMaxPoint)
        prev.newMaxPoint = curr.value;
      prev.totalLoad += curr.value;
      return prev;
    },
    { newMaxPoint: 0, totalLoad: 0 }
  );
  res.json({
    areas: newAreas,
    warehouses,
    minRadius: Math.max(widthArea, heightArea),
    maxNewPoint: newMaxPoint,
    totalLoad: totalLoad,
  });
};
