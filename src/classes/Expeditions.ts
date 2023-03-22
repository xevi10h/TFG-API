import { coordinatesToKm } from '../utils/areaUtils';
import Expedition from './Expedition';

export default class Expeditions {
	expeditions: Expedition[];

	constructor(expeditions: Expedition[]) {
		this.expeditions = expeditions;
	}

	get minLatitude(): number {
		return this.expeditions.reduce(
			(prev, curr) =>
				curr.coordinates.x < prev ? curr.coordinates.x : prev,
			90
		);
	}

	get maxLatitude(): number {
		return this.expeditions.reduce(
			(prev, curr) =>
				curr.coordinates.x > prev ? curr.coordinates.x : prev,
			-90
		);
	}

	get minLongitude(): number {
		return this.expeditions.reduce(
			(prev, curr) =>
				curr.coordinates.y < prev ? curr.coordinates.y : prev,
			180
		);
	}

	get maxLongitude(): number {
		return this.expeditions.reduce(
			(prev, curr) =>
				curr.coordinates.y > prev ? curr.coordinates.y : prev,
			-180
		);
	}

	get averageLatitude(): number {
		return (this.minLatitude + this.maxLatitude) / 2;
	}

	get averageLongitude(): number {
		return (this.minLongitude + this.maxLongitude) / 2;
	}

	kmsLatitude(): number {
		return (
			coordinatesToKm(
				this.minLatitude,
				this.maxLatitude,
				this.averageLongitude,
				this.averageLongitude
			) /
			(this.maxLatitude - this.minLatitude)
		);
	}

	kmsLongitude(): number {
		return (
			coordinatesToKm(
				this.minLongitude,
				this.maxLongitude,
				this.averageLongitude,
				this.averageLongitude
			) /
			(this.maxLongitude - this.minLongitude)
		);
	}
}
