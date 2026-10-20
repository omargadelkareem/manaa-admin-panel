import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Coffee, MapPin, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import { findEmployeeByCode } from "../../services/firebase/employees.service.js";
import { getAttendanceRecord, getDateKey } from "../../services/firebase/attendance.service.js";
import {
  formatAttendanceTime,
  formatWorkDuration,
  getAttendancePhoto,
  getCoordinates,
  getLocationLabel,
  isFaceVerified,
  isLivenessVerified,
} from "../../utils/attendance.js";

function Verification({ ok, label }) {
  return (
    <div className={`verification-item ${ok ? "ok" : "no"}`}>
      {ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span>{label}</span>
      <strong>{ok ? "تم التحقق" : "غير مؤكد"}</strong>
    </div>
  );
}

export default function AttendanceDetailsPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date") || getDateKey();
  const [employee, setEmployee] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [employeeResult, recordResult] = await Promise.all([
          findEmployeeByCode(id),
          getAttendanceRecord(date, id),
        ]);
        setEmployee(employeeResult);
        setRecord(recordResult);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, date]);

  if (loading) return <LoadingScreen text="جاري تحميل تفاصيل الحضور..." />;

  const photo = getAttendancePhoto(record, employee);
  const coordinates = getCoordinates(record);
  const hasCoordinates = coordinates.lat !== null && coordinates.lng !== null;

  return (
    <div className="page attendance-details-page">
      <Link to="/attendance" className="back-link"><ArrowRight size={18} />العودة للحضور</Link>

      <section className="attendance-employee-hero">
        <div className="attendance-photo-large">
          {photo ? <img src={photo} alt={employee?.name || "الموظف"} /> : <UserRound size={34} />}
        </div>
        <div className="attendance-hero-copy">
          <span className="eyebrow">سجل حضور الموظف</span>
          <h1>{employee?.name || "موظف"}</h1>
          <p>كود الموظف: {id} · {employee?.position_name || "بدون مسمى"} · {employee?.department_name || "بدون قسم"}</p>
        </div>
        <div className="attendance-date-chip"><CalendarDays size={18} /><div><span>تاريخ السجل</span><strong>{date}</strong></div></div>
      </section>

      <section className="attendance-timeline-grid">
        <article className="attendance-metric-card">
          <Clock3 size={21} /><span>وقت الحضور</span><strong>{formatAttendanceTime(record?.check_in)}</strong>
        </article>
        <article className="attendance-metric-card">
          <Clock3 size={21} /><span>وقت الانصراف</span><strong>{formatAttendanceTime(record?.check_out)}</strong>
        </article>
        <article className="attendance-metric-card featured">
          <Clock3 size={21} /><span>إجمالي ساعات العمل</span><strong>{formatWorkDuration(record)}</strong>
        </article>
        <article className="attendance-metric-card">
          <Coffee size={21} /><span>الاستراحة</span>
          <strong>{record?.break_start ? `${formatAttendanceTime(record.break_start)} - ${formatAttendanceTime(record.break_end)}` : "—"}</strong>
        </article>
      </section>

      <div className="attendance-detail-columns">
        <section className="panel attendance-proof-panel">
          <div className="panel-header"><div><h2>إثبات عملية البصمة</h2><p>الصورة ونتائج التحقق المسجلة مع الحضور</p></div><ShieldCheck size={21} /></div>
          <div className="attendance-proof-body">
            <div className="attendance-proof-photo">
              {photo ? <img src={photo} alt="صورة إثبات الحضور" /> : <div className="photo-not-recorded"><UserRound size={34} /><strong>لا توجد صورة حضور محفوظة</strong><span>سيظهر هنا تصوير البصمة عندما يرسله التطبيق مع سجل الحضور.</span></div>}
            </div>
            <div className="verification-list">
              <Verification ok={isFaceVerified(record)} label="مطابقة هوية الوجه" />
              <Verification ok={isLivenessVerified(record)} label="فحص حيوية الوجه" />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2>بيانات الموقع</h2><p>الموقع المسجل أثناء عملية الحضور</p></div><MapPin size={21} /></div>
          <div className="clean-detail-list">
            <div><span>موقع البصمة</span><strong>{getLocationLabel(record)}</strong></div>
            <div><span>منطقة عمل الموظف</span><strong>{employee?.work_area || employee?.current_location_name || "—"}</strong></div>
            <div><span>خط العرض</span><strong>{coordinates.lat ?? "—"}</strong></div>
            <div><span>خط الطول</span><strong>{coordinates.lng ?? "—"}</strong></div>
            {hasCoordinates && <a className="button button-ghost map-link" href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`} target="_blank" rel="noreferrer">فتح الموقع على الخريطة</a>}
          </div>
        </section>
      </div>

      <section className="panel employee-attendance-info">
        <div className="panel-header"><div><h2>بيانات الموظف</h2><p>البيانات المرتبطة بسجل الحضور</p></div><UserRound size={21} /></div>
        <div className="record-properties clean-properties">
          <div><span>الاسم</span><strong>{employee?.name || "—"}</strong></div>
          <div><span>الكود</span><strong>{id}</strong></div>
          <div><span>القسم</span><strong>{employee?.department_name || "—"}</strong></div>
          <div><span>المسمى الوظيفي</span><strong>{employee?.position_name || "—"}</strong></div>
          <div><span>منطقة العمل</span><strong>{employee?.work_area || "—"}</strong></div>
          <div><span>الحالة</span><strong>{employee?.app_status || (employee?.is_active === false ? "غير نشط" : "نشط")}</strong></div>
        </div>
      </section>
    </div>
  );
}
