import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

import {
  subscribeToEmployees,
} from "../../services/firebase/employees.service.js";

import {
  getDateKey,
  subscribeToAttendanceByDate,
} from "../../services/firebase/attendance.service.js";

function extractTime(value) {
  if (!value) return "—";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.time ||
      value.formatted_time ||
      value.datetime ||
      "—"
    );
  }

  return String(value);
}

export default function AttendancePage() {
  const navigate = useNavigate();

  const [date, setDate] = useState(
    getDateKey()
  );

  const [employees, setEmployees] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [employeesLoading, setEmployeesLoading] =
    useState(true);

  const [attendanceLoading, setAttendanceLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      subscribeToEmployees(
        (data) => {
          setEmployees(data);
          setEmployeesLoading(false);
        },
        (err) => {
          setError(err.message);
          setEmployeesLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    setAttendanceLoading(true);

    const unsubscribe =
      subscribeToAttendanceByDate(
        date,
        (data) => {
          setAttendance(data);
          setAttendanceLoading(false);
        },
        (err) => {
          setError(err.message);
          setAttendanceLoading(false);
        }
      );

    return unsubscribe;
  }, [date]);

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

  const rows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return attendance
      .map((record) => ({
        ...record,
        employee:
          employeeMap.get(
            String(record.employeeCode)
          ) || null,
      }))
      .filter((record) => {
        if (!query) return true;

        return (
          String(
            record.employee?.name || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(record.employeeCode)
            .toLowerCase()
            .includes(query) ||
          String(
            record.employee?.department_name ||
              ""
          )
            .toLowerCase()
            .includes(query)
        );
      });
  }, [
    attendance,
    employeeMap,
    search,
  ]);

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active !== false
    ).length;

  const absent = Math.max(
    activeEmployees - attendance.length,
    0
  );

  if (
    employeesLoading ||
    attendanceLoading
  ) {
    return (
      <LoadingScreen text="جاري تحميل سجل الحضور..." />
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="الحضور والانصراف"
        description="متابعة الحضور والانصراف اليومي للموظفين"
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <StatCard
          title="إجمالي الموظفين"
          value={activeEmployees}
          icon={Users}
        />

        <StatCard
          title="الحضور"
          value={attendance.length}
          icon={UserCheck}
        />

        <StatCard
          title="الغياب المتوقع"
          value={absent}
          icon={UserMinus}
        />

        <StatCard
          title="التاريخ"
          value={date}
          icon={CalendarDays}
        />
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث بالاسم أو الكود أو القسم..."
            />
          </div>

          <div className="date-filter">
            <CalendarDays size={17} />

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="toolbar-count">
            <Clock3 size={17} />
            {rows.length} سجل
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="لا توجد سجلات حضور"
            description={`لا توجد عمليات حضور مسجلة بتاريخ ${date}.`}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الكود</th>
                  <th>القسم</th>
                  <th>الحضور</th>
                  <th>الانصراف</th>
                  <th>منطقة العمل</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {rows.map((record) => (
                  <tr
                    key={
                      record.employeeCode
                    }
                  >
                    <td>
                      <div className="employee-cell">
                        <div className="mini-avatar">
                          {(
                            record.employee
                              ?.name || "م"
                          ).charAt(0)}
                        </div>

                        <strong>
                          {record.employee
                            ?.name ||
                            "موظف"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {record.employeeCode}
                    </td>

                    <td>
                      {record.employee
                        ?.department_name ||
                        "—"}
                    </td>

                    <td>
                      {extractTime(
                        record.check_in
                      )}
                    </td>

                    <td>
                      {extractTime(
                        record.check_out
                      )}
                    </td>

                    <td>
                      {record.employee
                        ?.work_area ||
                        record.employee
                          ?.current_location_name ||
                        "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() =>
                          navigate(
                            `/attendance/${record.employeeCode}?date=${date}`
                          )
                        }
                      >
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
