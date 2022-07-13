import { Request, Response } from 'express';
import connection from '../database';
import mongoDbQueryCreation from '../utils/mongoDBQueryCreation';

export const getExpeditions = async (req: Request, res: Response) => {
  const { dateRange, volumeRange, weightRange } = req.query;
  const query = mongoDbQueryCreation({
    dateRange,
    volumeRange,
    weightRange,
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
