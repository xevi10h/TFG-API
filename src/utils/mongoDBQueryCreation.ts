import IExpeditionFilter from '../interfaces/IExpeditionFilter';

export default function mongoDbQueryCreation(
	filter: IExpeditionFilter
): any[] {
	const { dateRange, volumeRange, weightRange } = filter || {};
	let query: any[] = [];
	if (Array.isArray(dateRange) && dateRange.length > 1) {
		query = [
			...query,
			{ dateFull: { $gte: dateRange[0] } },
			{ dateFull: { $lte: dateRange[1] } },
		];
	}
	if (
		Array.isArray(filter?.volumeRange) &&
		filter?.volumeRange.length > 1
	) {
		if (Number(filter?.volumeRange[0]) >= 0) {
			query = [
				...query,
				{ volume: { $gte: Number(volumeRange[0]) } },
			];
		}
		if (Number(volumeRange[1]) >= 0) {
			query = [
				...query,
				{ volume: { $lte: Number(volumeRange[1]) } },
			];
		}
	}
	if (Array.isArray(weightRange) && weightRange.length > 1) {
		if (Number(weightRange[0]) >= 0) {
			query = [
				...query,
				{ weight: { $gte: Number(weightRange[0]) } },
			];
		}
		if (Number(weightRange[1]) >= 0) {
			query = [
				...query,
				{ weight: { $lte: Number(weightRange[1]) } },
			];
		}
	}
	return query.length === 0 ? [{}] : query;
}
