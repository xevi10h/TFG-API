import { Point } from 'mapbox-gl';
import IExpedition from '../interfaces/IExpedition';

export default class Expedition implements IExpedition {
	dateFull: Date;
	coordinates: Point;
	weight?: number;
	volume?: number;
	value?: number;

	constructor(expedition: IExpedition) {
		this.dateFull = expedition.dateFull;
		(this.coordinates = new Point(
			expedition.address.geometry.coordinates[1],
			expedition.address.geometry.coordinates[0]
		)),
			(this.weight = expedition.weight || 0);
		this.volume = expedition.volume || 0;
		this.value = expedition.value || 0;
	}

	calculateExpeditionValue(configValue: any) {
		switch (configValue) {
			case 'equal':
				this.value = 1;
			case 'max':
				this.value = Math.max(this.volume, this.weight);
			case 'min':
				this.value = Math.min(this.volume, this.weight);
			case 'sum':
				this.value = this.volume + this.weight;
			case 'mul':
				this.value = this.volume * this.weight;
			default:
				this.value = 1;
		}
	}
}
