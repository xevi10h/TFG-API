import { Request, Response } from 'express';
import connection from '../database';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';

export const getExpeditions = async (req: Request, res: Response) => {
  const { dateRange, volumeRange, weightRange } = req.query;
  const query = mongoDbQueryCreation({
    dateRange:
      dateRange && typeof dateRange === 'string'
        ? [dateRange.split(',')[0], dateRange.split(',')[1]]
        : [],
    volumeRange:
      volumeRange && typeof volumeRange === 'string'
        ? [volumeRange.split(',')[0], volumeRange.split(',')[1]]
        : [],
    weightRange:
      weightRange && typeof weightRange === 'string'
        ? [weightRange.split(',')[0], weightRange.split(',')[1]]
        : [],
  });
  const expeditions = await connection
    .collection('expeditions')
    .aggregate([{ $match: { $and: query } }])
    .toArray();
  res.json(expeditions);
};

export const postExpeditionsForDataset = async (
  req: Request,
  res: Response
) => {
  const expeditions = await connection
    .collection('expeditions')
    .aggregate()
    .toArray();
  const features: any[] = [];
  expeditions.forEach((expedition: any) => {
    features.push({
      id: expedition._id.toString(),
      type: 'Feature',
      properties: {
        value: 1,
      },
      geometry: {
        coordinates: expedition.address.geometry.coordinates,
        type: 'Point',
      },
    });
  });
  const newDataset = {
    type: 'FeatureCollection',
    features: features,
  };
  await connection.collection('features').insertMany(features);
};
