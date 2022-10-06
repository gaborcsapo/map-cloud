import { MathUtils, Vector3 } from "three";
import { distance } from "@turf/turf";

export const EARTH_RADIUS = 6371010;
export const WORLD_SIZE = Math.PI * EARTH_RADIUS;

function toLatLngLiteral(latLng) {
    if (window.google && google.maps && latLng instanceof google.maps.LatLng) {
        return latLng.toJSON();
    }
    return latLng;
}

export function latLngToMeters(latLng) {
    latLng = toLatLngLiteral(latLng);
    const x = EARTH_RADIUS * MathUtils.degToRad(latLng.lng);
    const y = 0 - EARTH_RADIUS * Math.log(Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(latLng.lat))));

    return { x, y };
}

export function MetersToLatLng(point) {
    const lng = MathUtils.radToDeg(point.x/EARTH_RADIUS);
    const lat = MathUtils.radToDeg(((Math.atan(Math.exp((0 - point.y)/EARTH_RADIUS))/0.5) - Math.PI * 0.5) * -1)

    return { lat: lat, lng: lng, alt: 0 };
}

export function latLngToVector3(point, target = new Vector3()) {
    const { x, y } = latLngToMeters(point);
    return target.set(x, 0, -y);
}

export function latLngAltToVector3(point, target = new Vector3()) {
    const { x, y } = latLngToMeters(point);
    const {altitude = 0} = point;
    return target.set(x, altitude, -y);
}

export function vector3ToLatLngAlt(vector) {
    return MetersToLatLng({x: vector.x, y: -vector.z});
}

export function latLngToMetersRelative(point, reference) {
    const dx = distance([reference.lng, reference.lat], [point.lng, reference.lat], {
        units: 'meters'
    });

    const sx = Math.sign(point.lng - reference.lng);

    const dy = distance([reference.lng, reference.lat], [reference.lng, point.lat], {
        units: 'meters'
    });
    const sy = Math.sign(point.lat - reference.lat);
    return [sx * dx, sy * dy];
}

export function latLngAltRelToVector3(point, ref, target) {
    if (!target)
        target = new Vector3;
    const [dx, dy] = latLngToMetersRelative(point, ref);
    const {altitude = 0} = point;

    return target.set(dx, altitude, -dy);
}
