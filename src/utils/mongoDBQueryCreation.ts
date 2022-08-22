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
  if (Array.isArray(dateRange) && dateRange.length > 1) {
    query = [
      ...query,
      { dateFull: { $gte: new Date(dateRange[0]) } },
      { dateFull: { $lte: new Date(dateRange[1]) } },
    ];
  }
  if (Array.isArray(volumeRange) && volumeRange.length > 1) {
    if (
      volumeRange[0] !== 'undefined' &&
      Number(volumeRange[0]) >= 0
    ) {
      query = [
        ...query,
        { volume: { $gte: Number(volumeRange[0]) } },
      ];
    }
    if (
      volumeRange[1] !== 'undefined' &&
      Number(volumeRange[1]) >= 0
    ) {
      query = [
        ...query,
        { volume: { $lte: Number(volumeRange[1]) } },
      ];
    }
  }
  if (Array.isArray(weightRange) && weightRange.length > 1) {
    if (
      weightRange[0] !== 'undefined' &&
      Number(weightRange[0]) >= 0
    ) {
      query = [
        ...query,
        { weight: { $gte: Number(weightRange[0]) } },
      ];
    }
    if (
      weightRange[1] !== 'undefined' &&
      Number(weightRange[1]) >= 0
    ) {
      query = [
        ...query,
        { weight: { $lte: Number(weightRange[1]) } },
      ];
    }
  }
  return query;
}
