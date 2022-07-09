import { Request, Response } from 'express';
import connection from '../database';
import { Point } from 'mapbox-gl';
import Area from '../models/Area';
import Expedition from '../models/Expedition';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';

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

export const getAreas = async (req: Request, res: Response) => {
  const { configValue, dateRange, volumeRange, weightRange } =
    req.query;
  console.log(req.query);
  const query = mongoDbQueryCreation({
    dateRange,
    volumeRange,
    weightRange,
  });
  console.log(1111);
  console.log(query);
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
    expeditions.reduce(
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
  const areas: Area[] = [];
  const numDivisions = 20;
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
  let areasFiltered = areas.filter((area) => area.value > 0);
  res.json(areasFiltered);
};
