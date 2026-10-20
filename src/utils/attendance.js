export function getAttendanceValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") {
    return value.timestamp ?? value.time ?? value.datetime ?? value.created_at ?? null;
  }
  return value;
}

export function toDate(value) {
  const raw = getAttendanceValue(value);
  if (raw === null) return null;

  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;

  if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
    let timestamp = Number(raw);
    if (timestamp > 0 && timestamp < 100000000000) timestamp *= 1000;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof raw === "string" && /^\d{1,2}:\d{2}/.test(raw)) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAttendanceTime(value) {
  if (!value) return "—";
  const date = toDate(value);
  if (date) {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const raw = getAttendanceValue(value);
  return typeof raw === "string" ? raw : "—";
}

function timeStringToMinutes(value) {
  const raw = getAttendanceValue(value);
  if (typeof raw !== "string") return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getWorkMinutes(record) {
  if (!record?.check_in || !record?.check_out) return null;

  const start = toDate(record.check_in);
  const end = toDate(record.check_out);
  let minutes = null;

  if (start && end) {
    minutes = Math.max(0, Math.round((end - start) / 60000));
  } else {
    const startMinutes = timeStringToMinutes(record.check_in);
    const endMinutes = timeStringToMinutes(record.check_out);
    if (startMinutes !== null && endMinutes !== null) {
      minutes = endMinutes - startMinutes;
      if (minutes < 0) minutes += 24 * 60;
    }
  }

  if (minutes === null) return null;

  const breakStart = toDate(record.break_start);
  const breakEnd = toDate(record.break_end);
  if (breakStart && breakEnd && breakEnd > breakStart) {
    minutes -= Math.round((breakEnd - breakStart) / 60000);
  }

  return Math.max(0, minutes);
}

export function formatWorkDuration(record) {
  const minutes = getWorkMinutes(record);
  if (minutes === null) return record?.check_in && !record?.check_out ? "قيد العمل" : "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return rest + " د";
  if (!rest) return hours + " س";
  return hours + " س " + rest + " د";
}

function imageSource(value) {
  if (!value || typeof value !== "string") return null;
  const clean = value.trim();
  if (!clean) return null;
  if (/^(https?:|data:|blob:)/i.test(clean)) return clean;
  if (clean.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(clean)) {
    return "data:image/jpeg;base64," + clean.replace(/\s/g, "");
  }
  return null;
}

export function getAttendancePhoto(record, employee) {
  const candidates = [
    record?.check_in?.attendance_photo_url,
    record?.check_in?.verification_photo_url,
    record?.check_in?.photo_url,
    record?.check_in?.image_url,
    record?.check_in?.photo,
    record?.attendance_photo_url,
    record?.verification_photo_url,
    record?.photo_url,
    employee?.profile_photo_url,
    employee?.profilePhotoUrl,
    employee?.photo_url,
    employee?.profile_image,
    employee?.photo,
    employee?.profilePhotoBase64,
  ];

  for (const candidate of candidates) {
    const src = imageSource(candidate);
    if (src) return src;
  }
  return null;
}

export function getLocationLabel(record) {
  return (
    record?.check_in?.location?.location_name ||
    record?.check_in?.location?.name ||
    record?.check_in?.geofence?.name ||
    record?.location_name ||
    "—"
  );
}

export function getCoordinates(record) {
  const location = record?.check_in?.location || record?.location || {};
  const lat = location.latitude ?? location.lat ?? null;
  const lng = location.longitude ?? location.lng ?? null;
  return { lat, lng };
}

export function isFaceVerified(record) {
  return record?.check_in?.face_identity_verified === true;
}

export function isLivenessVerified(record) {
  return record?.check_in?.face_liveness_verified === true;
}
