import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Clock3,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

import PageHeader from "../../components/layout/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

import {
  subscribeToEmployees,
} from "../../services/firebase/employees.service.js";

import {
  getDateKey,
  subscribeToTodayAttendance,
} from "../../services/firebase/attendance.service.js";

function formatAttendanceTime(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  let rawValue = value;

  if (typeof value === "object") {
    rawValue =
      value.timestamp ??
      value.time ??
      value.created_at ??
      null;
  }

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "—";
  }

  // Firebase/JS timestamp in milliseconds
  if (
    typeof rawValue === "number" ||
    /^\d+$/.test(String(rawValue))
  ) {
    let timestamp = Number(rawValue);

    // Support timestamps stored in seconds as well.
    if (timestamp > 0 && timestamp < 100000000000) {
      timestamp *= 1000;
    }

    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  // ISO date/string date
  const parsedDate = new Date(rawValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Legacy value such as 08:30
  if (typeof rawValue === "string") {
    return rawValue;
  }

  return "—";
}

function getCheckIn(record) {
  return formatAttendanceTime(
    record?.check_in ??
    record?.check_in_time
  );
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [employeesLoading, setEmployeesLoading] =
    useState(true);

  const [attendanceLoading, setAttendanceLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeEmployees = subscribeToEmployees(
      (data) => {
        setEmployees(data);
        setEmployeesLoading(false);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError(firebaseError.message);
        setEmployeesLoading(false);
      }
    );

    const unsubscribeAttendance =
      subscribeToTodayAttendance(
        (data) => {
          setAttendance(data);
          setAttendanceLoading(false);
        },
        (firebaseError) => {
          console.error(firebaseError);
          setError(firebaseError.message);
          setAttendanceLoading(false);
        }
      );

    return () => {
      unsubscribeEmployees();
      unsubscribeAttendance();
    };
  }, []);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(
      (employee) => employee.is_active !== false
    ).length;

    const present = attendance.length;

    const absent = Math.max(
      activeEmployees - present,
      0
    );

    const departments = new Set(
      employees
        .map((employee) => employee.department_name)
        .filter(Boolean)
    ).size;

    return {
      total: employees.length,
      activeEmployees,
      present,
      absent,
      departments,
    };
  }, [employees, attendance]);

  const employeeMap = useMemo(() => {
    const map = new Map();

    employees.forEach((employee) => {
      map.set(
        String(employee.emp_code || ""),
        employee
      );
    });

    return map;
  }, [employees]);

  const loading =
    employeesLoading || attendanceLoading;

  if (loading) {
    return (
      <LoadingScreen text="جاري تجهيز لوحة التحكم..." />
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="لوحة التحكم"
        description={`نظرة سريعة على حالة الموارد البشرية اليوم ${getDateKey()}`}
      />

      {error && (
        <div className="alert alert-danger">
          تعذر تحميل بعض البيانات: {error}
        </div>
      )}

      <section className="stats-grid">
        <StatCard
          title="إجمالي الموظفين"
          value={stats.total}
          icon={Users}
          description={`${stats.activeEmployees} موظف نشط`}
        />

        <StatCard
          title="الحضور اليوم"
          value={stats.present}
          icon={UserCheck}
          description="سجلات الحضور المسجلة"
        />

        <StatCard
          title="الغياب المتوقع"
          value={stats.absent}
          icon={UserMinus}
          description="بناءً على الموظفين النشطين"
        />

        <StatCard
          title="الأقسام"
          value={stats.departments}
          icon={BriefcaseBusiness}
          description="أقسام مسجلة بالنظام"
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>حضور اليوم</h2>
              <p>آخر عمليات تسجيل الحضور</p>
            </div>

            <Clock3 size={20} />
          </div>

          {attendance.length === 0 ? (
            <EmptyState
              title="لا يوجد حضور مسجل"
              description="لم يتم تسجيل حضور أي موظف اليوم حتى الآن."
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>الكود</th>
                    <th>القسم</th>
                    <th>وقت الحضور</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance
                    .slice(0, 8)
                    .map((record) => {
                      const employee =
                        employeeMap.get(
                          String(record.employeeCode)
                        );

                      return (
                        <tr key={record.employeeCode}>
                          <td>
                            <div className="employee-cell">
                              <div className="mini-avatar">
                                {(employee?.name || "م")
                                  .charAt(0)}
                              </div>

                              <strong>
                                {employee?.name ||
                                  record.employeeCode}
                              </strong>
                            </div>
                          </td>

                          <td>{record.employeeCode}</td>

                          <td>
                            {employee?.department_name ||
                              "—"}
                          </td>

                          <td>{getCheckIn(record)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="panel overview-panel">
          <div className="panel-header">
            <div>
              <h2>حالة النظام</h2>
              <p>ملخص سريع</p>
            </div>

            <Activity size={20} />
          </div>

          <div className="overview-list">
            <div>
              <span>الموظفون النشطون</span>
              <strong>{stats.activeEmployees}</strong>
            </div>

            <div>
              <span>الحضور اليوم</span>
              <strong>{stats.present}</strong>
            </div>

            <div>
              <span>الأقسام</span>
              <strong>{stats.departments}</strong>
            </div>

            <div>
              <span>قاعدة البيانات</span>
              <strong className="online-text">
                متصلة
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

