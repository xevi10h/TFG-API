export function coordinatesToKm(
	lat1: number,
	lat2: number,
	lon1: number,
	lon2: number
) {
	const rad = function (x: number) {
		return (x * Math.PI) / 180;
	};
	var R = 6378.137; //Radi de la Terra en quilòmetres
	var dLat = rad(lat2 - lat1);
	var dLong = rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(lat1)) *
			Math.cos(rad(lat2)) *
			Math.sin(dLong / 2) *
			Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return Number(d.toFixed(5));
}

// Returns the increment in lat and long of a distance in Km
export function RadiusToCoordinates(
	lat: number,
	long: number,
	distance: number
): { latDistance: number; longDistance: number } {
	const earthRadius = 6371;
	const lat1 = (Math.PI / 180) * lat;
	const long1 = (Math.PI / 180) * long;

	const lat2 = Math.asin(
		Math.sin(lat1) * Math.cos(distance / earthRadius) +
			Math.cos(lat1) * Math.sin(distance / earthRadius) * Math.cos(0)
	);

	const long2 =
		long1 +
		Math.atan2(
			Math.sin((Math.PI / 180) * 90) *
				Math.sin(distance / earthRadius) *
				Math.cos(lat1),
			Math.cos(distance / earthRadius) -
				Math.sin(lat1) * Math.sin(lat2)
		);
	return {
		latDistance: (180 / Math.PI) * lat2 - lat,
		longDistance: (180 / Math.PI) * long2 - long,
	};
}

export function makeSymmetricalGaussian(
	depth: number,
	lat0: number,
	long0: number,
	radius: number
) {
	return function (
		depth: number,
		lat0: number,
		long0: number,
		radius: number,
		lat: number,
		long: number
	) {
		const radiusCoordinates = RadiusToCoordinates(
			lat0,
			long0,
			radius
		);
		const exponent = -(
			Math.pow(lat - lat0, 2) /
				(2 * Math.pow(radiusCoordinates.latDistance / 3.5, 2)) +
			Math.pow(long - long0, 2) /
				(2 * Math.pow(radiusCoordinates.longDistance / 3.5, 2))
		);
		return depth * Math.pow(Math.E, exponent);
	}.bind(null, depth, lat0, long0, radius);
}

export function isPointInsideCircle(
	cLat: number,
	cLong: number,
	radius: number
) {
	return function (
		cLat: number,
		cLong: number,
		radius: number,
		pLat: number,
		pLong: number
	) {
		const radiusCoordinates = RadiusToCoordinates(
			cLat,
			cLong,
			radius
		);
		const dLat = pLat - cLat;
		const dLong = pLong - cLong;
		return (
			radiusCoordinates.latDistance >= dLat &&
			radiusCoordinates.longDistance >= dLong
		);
	};
}
