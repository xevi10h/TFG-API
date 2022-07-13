export default class Area {
  id: number;
  coordinates: Array<Array<number>>;
  value: number;

  constructor(
    id: number,
    coordinates: Array<Array<number>>,
    value?: number
  ) {
    this.id = id;
    this.coordinates = coordinates;
    this.value = value || 0;
  }
}
