import Expedition from './Expedition';

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

	get centralLatitude() {
		return (this.coordinates[0][0] + this.coordinates[0][1]) / 2;
	}

	get centralLongitude() {
		return (this.coordinates[1][0] + this.coordinates[1][1]) / 2;
	}
}
