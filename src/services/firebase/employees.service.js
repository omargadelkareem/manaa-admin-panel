import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

import { database } from "./firebase.js";

const EMPLOYEES_PATH = "employees";

function normalizeEmployees(data) {
  if (!data) return [];

  return Object.entries(data).map(([firebaseKey, employee]) => ({
    firebaseKey,
    ...employee,
  }));
}

export function subscribeToEmployees(callback, onError) {
  const employeesRef = ref(database, EMPLOYEES_PATH);

  return onValue(
    employeesRef,
    (snapshot) => {
      callback(normalizeEmployees(snapshot.val()));
    },
    onError
  );
}

export async function getEmployees() {
  const snapshot = await get(ref(database, EMPLOYEES_PATH));

  return normalizeEmployees(snapshot.val());
}

export async function getEmployeeByFirebaseKey(firebaseKey) {
  const snapshot = await get(
    ref(database, `${EMPLOYEES_PATH}/${firebaseKey}`)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    firebaseKey,
    ...snapshot.val(),
  };
}

export async function findEmployeeByCode(empCode) {
  const employees = await getEmployees();

  return (
    employees.find(
      (employee) =>
        String(employee.emp_code || "").trim() ===
        String(empCode || "").trim()
    ) || null
  );
}

export async function createEmployee(employee) {
  const employeesRef = ref(database, EMPLOYEES_PATH);
  const newEmployeeRef = push(employeesRef);

  const now = Date.now();

  const payload = {
    address: employee.address || "",
    app_role: employee.app_role || "موظف",
    app_status: employee.app_status || "نشط",
    created_at: now,
    current_location_name:
      employee.current_location_name || employee.work_area || "",
    department_name: employee.department_name || "",
    email: employee.email || "",
    emp_code: String(employee.emp_code || "").trim(),
    fingerprint: employee.fingerprint || "",
    hire_date: employee.hire_date || "",
    id: String(employee.emp_code || "").trim(),
    is_active:
      employee.is_active === false ? false : true,
    last_name: employee.last_name || "",
    name: employee.name || "",
    national_id: employee.national_id || "",
    password: employee.password || "",
    password_created:
      employee.password_created === true,
    phone: employee.phone || "",
    position_name: employee.position_name || "",
    updated_at: now,
    work_area:
      employee.work_area ||
      employee.current_location_name ||
      "",
  };

  await set(newEmployeeRef, payload);

  return newEmployeeRef.key;
}

export async function updateEmployee(firebaseKey, data) {
  await update(
    ref(database, `${EMPLOYEES_PATH}/${firebaseKey}`),
    {
      ...data,
      updated_at: Date.now(),
    }
  );
}

export async function deleteEmployee(firebaseKey) {
  await remove(
    ref(database, `${EMPLOYEES_PATH}/${firebaseKey}`)
  );
}

export async function importEmployeesBatch(employees) {
  const existing = await getEmployees();

  const existingCodes = new Set(
    existing.map((employee) =>
      String(employee.emp_code || "").trim()
    )
  );

  const imported = [];
  const skipped = [];
  const failed = [];

  for (const employee of employees) {
    const code = String(employee.emp_code || "").trim();

    if (!code) {
      skipped.push({
        employee,
        reason: "كود الموظف غير موجود",
      });

      continue;
    }

    if (existingCodes.has(code)) {
      skipped.push({
        employee,
        reason: "كود الموظف موجود بالفعل",
      });

      continue;
    }

    try {
      const firebaseKey = await createEmployee(employee);

      existingCodes.add(code);

      imported.push({
        ...employee,
        firebaseKey,
      });
    } catch (error) {
      failed.push({
        employee,
        reason: error.message,
      });
    }
  }

  return {
    imported,
    skipped,
    failed,
  };
}
