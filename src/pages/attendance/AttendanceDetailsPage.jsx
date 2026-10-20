import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Coffee,
  MapPin,
  UserRound,
} from "lucide-react";

import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import LoadingScreen from "../../components/common/LoadingScreen.jsx";

import {
  findEmployeeByCode,
} from "../../services/firebase/employees.service.js";

import {
  getAttendanceRecord,
  getDateKey,
} from "../../services/firebase/attendance.service.js";

function display(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return (
      value.time ||
      value.formatted_time ||
      value.name ||
      JSON.stringify(value)
    );
  }

  return String(value);
}

export default function AttendanceDetailsPage() {
  const { id } = useParams();

  const [params] =
    useSearchParams();

  const date =
    params.get("date") ||
    getDateKey();

  const [employee, setEmployee] =
    useState(null);

  const [record, setRecord] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [
          employeeResult,
          recordResult,
        ] = await Promise.all([
          findEmployeeByCode(id),
          getAttendanceRecord(
            date,
            id
          ),
        ]);

        setEmployee(employeeResult);
        setRecord(recordResult);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, date]);

  if (loading) {
    return (
      <LoadingScreen text="جاري تحميل تفاصيل الحضور..." />
    );
  }

  return (
    <div className="page">
      <Link
        to="/attendance"
        className="back-link"
      >
        <ArrowRight size={18} />
        العودة للحضور
      </Link>

      <section className="employee-profile-card">
        <div className="employee-profile-avatar">
          {(employee?.name || "م").charAt(
            0
          )}
        </div>

        <div className="employee-profile-copy">
          <h1>
            {employee?.name ||
              "موظف"}
          </h1>

          <p>
            كود الموظف: {id}
          </p>
        </div>
      </section>

      <section className="details-grid">
        <article className="detail-card">
          <div className="detail-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>التاريخ</span>
            <strong>{date}</strong>
          </div>
        </article>

        <article className="detail-card">
          <div className="detail-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>الحضور</span>
            <strong>
              {display(
                record?.check_in?.timestamp ??
                record?.check_in?.time ??
                record?.check_in
              )}
            </strong>
          </div>
        </article>

        <article className="detail-card">
          <div className="detail-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>الانصراف</span>
            <strong>
              {display(
                record?.check_out?.timestamp ??
                record?.check_out?.time ??
                record?.check_out
              )}
            </strong>
          </div>
        </article>

        <article className="detail-card">
          <div className="detail-icon">
            <Coffee size={20} />
          </div>

          <div>
            <span>الاستراحة</span>
            <strong>
              {record?.break_start ||
              record?.break_end
                ? "مسجلة"
                : "—"}
            </strong>
          </div>
        </article>

        <article className="detail-card">
          <div className="detail-icon">
            <UserRound size={20} />
          </div>

          <div>
            <span>القسم</span>
            <strong>
              {employee?.department_name ||
                "—"}
            </strong>
          </div>
        </article>

        <article className="detail-card">
          <div className="detail-icon">
            <MapPin size={20} />
          </div>

          <div>
            <span>منطقة العمل</span>
            <strong>
              {employee?.work_area ||
                employee?.current_location_name ||
                "—"}
            </strong>
          </div>
        </article>
      </section>

      {record && (
        <section className="panel raw-record-panel">
          <div className="panel-header">
            <div>
              <h2>
                بيانات السجل
              </h2>
              <p>
                جميع البيانات المسجلة
                لهذا اليوم
              </p>
            </div>
          </div>

          <div className="record-properties">
            {Object.entries(record)
              .filter(
                ([key]) =>
                  key !==
                  "employeeCode"
              )
              .map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>
                    {display(value)}
                  </strong>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

