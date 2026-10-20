import {
  get,
  onValue,
  ref,
} from "firebase/database";

import { database } from "./firebase.js";

const ATTENDANCE_PATH = "attendance_records";

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeRecord(employeeCode, record = {}) {
  return {
    employeeCode,
    ...record,
  };
}

function normalizeDay(data) {
  if (!data) return [];

  return Object.entries(data).map(([employeeCode, record]) =>
    normalizeRecord(employeeCode, record)
  );
}

export function subscribeToAttendanceByDate(
  date,
  callback,
  onError
) {
  return onValue(
    ref(database, `${ATTENDANCE_PATH}/${date}`),
    (snapshot) => {
      callback(normalizeDay(snapshot.val()));
    },
    onError
  );
}

export function subscribeToTodayAttendance(
  callback,
  onError
) {
  return subscribeToAttendanceByDate(
    getDateKey(),
    callback,
    onError
  );
}

export async function getAttendanceByDate(date) {
  const snapshot = await get(
    ref(database, `${ATTENDANCE_PATH}/${date}`)
  );

  return normalizeDay(snapshot.val());
}

export async function getAttendanceRecord(
  date,
  employeeCode
) {
  const snapshot = await get(
    ref(
      database,
      `${ATTENDANCE_PATH}/${date}/${employeeCode}`
    )
  );

  if (!snapshot.exists()) return null;

  return normalizeRecord(
    employeeCode,
    snapshot.val()
  );
}

export async function getAttendanceRange() {
  const snapshot = await get(
    ref(database, ATTENDANCE_PATH)
  );

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  const records = [];

  Object.entries(data).forEach(([date, day]) => {
    Object.entries(day || {}).forEach(
      ([employeeCode, record]) => {
        records.push({
          date,
          employeeCode,
          ...record,
        });
      }
    );
  });

  return records;
}
