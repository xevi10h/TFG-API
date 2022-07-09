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
