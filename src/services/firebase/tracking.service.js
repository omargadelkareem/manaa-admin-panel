import {
  onValue,
  ref,
} from "firebase/database";

import { database } from "./firebase.js";

const TRACKING_PATH = "employee_tracking";

function normalizePoint(pointKey, point = {}) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);

  return {
    pointKey,
    ...point,
    latitude:
      Number.isFinite(latitude)
        ? latitude
        : null,
    longitude:
      Number.isFinite(longitude)
        ? longitude
        : null,
    timestamp:
      Number(point.timestamp || pointKey || 0),
    accuracy:
      point.accuracy !== undefined &&
      point.accuracy !== null
        ? Number(point.accuracy)
        : null,
  };
}

function normalizeEmployeeTracking(
  firebaseEmployeeKey,
  value = {}
) {
  const routePoints = Object.entries(
    value.route_points || {}
  )
    .map(([pointKey, point]) =>
      normalizePoint(pointKey, point)
    )
    .filter(
      (point) =>
        point.latitude !== null &&
        point.longitude !== null
    )
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp
    );

  return {
    firebaseEmployeeKey,
    ...value,
    routePoints,
    lastPoint:
      routePoints.length > 0
        ? routePoints[
            routePoints.length - 1
          ]
        : null,
  };
}

function normalizeTracking(data) {
  if (!data) return [];

  return Object.entries(data)
    .map(([firebaseEmployeeKey, value]) =>
      normalizeEmployeeTracking(
        firebaseEmployeeKey,
        value
      )
    )
    .filter(
      (item) =>
        item.routePoints.length > 0
    );
}

export function subscribeToEmployeeTracking(
  callback,
  onError
) {
  return onValue(
    ref(database, TRACKING_PATH),
    (snapshot) => {
      callback(
        normalizeTracking(
          snapshot.val()
        )
      );
    },
    onError
  );
}
