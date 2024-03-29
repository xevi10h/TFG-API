export default class CartesianPoint {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z?: number) {
    this.x = x;
    this.y = y;
    this.z = z || 0;
  }
}
