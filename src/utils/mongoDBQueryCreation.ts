interface propsMongoDBQueryCreation {
  dateRange: any;
  volumeRange: any;
  weightRange: any;
}

export default function mongoDbQueryCreation(
  props: propsMongoDBQueryCreation
): any[] {
  const { dateRange, volumeRange, weightRange } = props;
  let query: any[] = [];
  if (dateRange && typeof dateRange === 'string') {
    query = [
      ...query,
      { dateFull: { $gte: new Date(dateRange.split(',')[0]) } },
      { dateFull: { $lte: new Date(dateRange.split(',')[1]) } },
    ];
  }
  if (volumeRange && typeof volumeRange === 'string') {
    const volumeRangeFrom = volumeRange.split(',')[0];
    const volumeRangeTo = volumeRange.split(',')[1];
    if (
      volumeRangeFrom !== 'undefined' &&
      Number(volumeRangeFrom) >= 0
    ) {
      query = [
        ...query,
        { volume: { $gte: Number(volumeRangeFrom) } },
      ];
    }
    if (volumeRangeTo !== 'undefined' && Number(volumeRangeTo) >= 0) {
      query = [...query, { volume: { $lte: Number(volumeRangeTo) } }];
    }
  }
  if (weightRange && typeof weightRange === 'string') {
    const weightRangeFrom = weightRange.split(',')[0];
    const weightRangeTo = weightRange.split(',')[1];
    if (
      weightRangeFrom !== 'undefined' &&
      Number(weightRangeFrom) >= 0
    ) {
      query = [
        ...query,
        { weight: { $gte: Number(weightRangeFrom) } },
      ];
    }
    if (weightRangeTo !== 'undefined' && Number(weightRangeTo) >= 0) {
      query = [...query, { weight: { $lte: Number(weightRangeTo) } }];
    }
  }
  return query;
}
