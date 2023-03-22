export default interface IExpedition {
	dateFull: Date;
	address?: {
		geometry: {
			coordinates: Array<number>;
		};
	};
	weight?: number;
	volume?: number;
	value?: number;
}
