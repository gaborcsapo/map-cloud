import { MathUtils, Vector3 } from "three";
import { distance, destination } from "@turf/turf";

export const EARTH_RADIUS = 6371010;
export const WORLD_SIZE = Math.PI * EARTH_RADIUS;

function toLatLngLiteral(latLng) {
  if (window.google && google.maps && latLng instanceof google.maps.LatLng) {
    return latLng.toJSON();
  }
  return latLng;
}

/**
 * Converts latitude and longitude to meters.
 */
export function latLngToMeters(latLng) {
  latLng = toLatLngLiteral(latLng);

  const x = EARTH_RADIUS * MathUtils.degToRad(latLng.lng);
  const y =
    0 -
    EARTH_RADIUS *
      Math.log(
        Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(latLng.lat)))
      );
  return { x, y };
}

/**
 * Converts latitude and longitude to world space coordinates with y up.
 */
export function latLngToVector3(point, target = new Vector3()) {
    const { x, y } = latLngToMeters(point);
    return target.set(x, 0, -y);
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

/**
 * Converts latitude and longitude to world space coordinates relative
 * to a reference location with y up.
 */
export function latLngToVector3Relative(
  point,
  reference,
  target = new Vector3()
) {
  const p = latLngToVector3(point);
  const r = latLngToVector3(reference);

  target.setX(Math.abs(r.x - p.x) * Math.sign(p.x - r.x));
  target.setY(Math.abs(r.y - p.y) * Math.sign(p.y - r.y));
  target.setZ(Math.abs(r.z - p.z) * Math.sign(p.z - r.z));

  return target;
}

export function latLngAltToVector2(point, ref, target) {
    const [dx, dy] = latLngToMetersRelative(point, ref);
    return target.set(dx, -dy);
}

export function latLngAltToVector3(point, ref, target) {
    if (!target)
        target = new Vector3;
    const [dx, dy] = latLngToMetersRelative(point, ref);
    const {altitude = 0} = point;

    return target.set(dx, altitude, -dy);
}

export function vector3ToLatLngAlt(point, ref) {
    const distance = point.length();
    const bearing = getNorthBasedBearing(point);

    const target = destination([ref.lng, ref.lat], distance, bearing, {
      units: 'meters'
    });

    const coords = target.geometry.coordinates;
    return {
      lat: coords[1],
      lng: coords[0],
      altitude: point.y
    };
}

function getNorthBasedBearing(point) {
    const bearingRad = Math.atan2(-point.z, point.x);
    const bearingDeg = (180 * bearingRad) / Math.PI;
    let bearingDegDisplacement = bearingDeg - 90;
    if (bearingDegDisplacement < -180) bearingDegDisplacement += 360;
    return -bearingDegDisplacement;
}