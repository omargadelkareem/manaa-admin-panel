import { useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Clock3, UserCheck, UserMinus, Users } from "lucide-react";

import PageHeader from "../../components/layout/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { subscribeToEmployees } from "../../services/firebase/employees.service.js";
import { getDateKey, subscribeToTodayAttendance } from "../../services/firebase/attendance.service.js";
import { formatAttendanceTime, formatWorkDuration, getAttendancePhoto } from "../../utils/attendance.js";

export default function DashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeEmployees = subscribeToEmployees(
      (data) => { setEmployees(data); setEmployeesLoading(false); },
      (err) => { setError(err.message); setEmployeesLoading(false); }
    );
    const unsubscribeAttendance = subscribeToTodayAttendance(
      (data) => { setAttendance(data); setAttendanceLoading(false); },
      (err) => { setError(err.message); setAttendanceLoading(false); }
    );
    return () => { unsubscribeEmployees(); unsubscribeAttendance(); };
  }, []);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.is_active !== false).length;
    const presentCodes = new Set(attendance.map((r) => String(r.employeeCode)));
    const present = presentCodes.size;
    const absent = employees.filter((e) => e.is_active !== false && !presentCodes.has(String(e.emp_code))).length;
    const departments = new Set(employees.map((e) => e.department_name).filter(Boolean)).size;
    return { total: employees.length, activeEmployees, present, absent, departments };
  }, [employees, attendance]);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => map.set(String(employee.emp_code || ""), employee));
    return map;
  }, [employees]);

  if (employeesLoading || attendanceLoading) return <LoadingScreen text="جاري تجهيز لوحة التحكم..." />;

  return (
    <div className="page">
      <PageHeader title="لوحة التحكم" description={`نظرة سريعة على حالة الموارد البشرية اليوم ${getDateKey()}`} />
      {error && <div className="alert alert-danger">تعذر تحميل بعض البيانات: {error}</div>}

      <section className="stats-grid">
        <StatCard title="إجمالي الموظفين" value={stats.total} icon={Users} description={`${stats.activeEmployees} موظف نشط`} />
        <StatCard title="الحضور اليوم" value={stats.present} icon={UserCheck} description="موظفون سجلوا الحضور" />
        <StatCard title="الغياب المتوقع" value={stats.absent} icon={UserMinus} description="من الموظفين النشطين" />
        <StatCard title="الأقسام" value={stats.departments} icon={BriefcaseBusiness} description="أقسام مسجلة بالنظام" />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header"><div><h2>حضور اليوم</h2><p>آخر عمليات تسجيل الحضور</p></div><Clock3 size={20} /></div>
          {attendance.length === 0 ? (
            <EmptyState title="لا يوجد حضور مسجل" description="لم يتم تسجيل حضور أي موظف اليوم حتى الآن." />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>الموظف</th><th>الكود</th><th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th></tr></thead>
                <tbody>
                  {attendance.slice(0, 8).map((record) => {
                    const employee = employeeMap.get(String(record.employeeCode));
                    const photo = getAttendancePhoto(record, employee);
                    return (
                      <tr key={record.employeeCode}>
                        <td><div className="employee-cell">
                          {photo ? <img className="attendance-avatar-image" src={photo} alt={employee?.name || "الموظف"} /> : <div className="mini-avatar">{(employee?.name || "م").charAt(0)}</div>}
                          <div className="employee-cell-copy"><strong>{employee?.name || record.employeeCode}</strong><span>{employee?.department_name || "—"}</span></div>
                        </div></td>
                        <td>{record.employeeCode}</td>
                        <td>{formatAttendanceTime(record.check_in)}</td>
                        <td>{formatAttendanceTime(record.check_out)}</td>
                        <td><strong>{formatWorkDuration(record)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="panel overview-panel">
          <div className="panel-header"><div><h2>حالة النظام</h2><p>ملخص سريع</p></div><Activity size={20} /></div>
          <div className="overview-list">
            <div><span>الموظفون النشطون</span><strong>{stats.activeEmployees}</strong></div>
            <div><span>الحضور اليوم</span><strong>{stats.present}</strong></div>
            <div><span>الأقسام</span><strong>{stats.departments}</strong></div>
            <div><span>قاعدة البيانات</span><strong className="online-text">متصلة</strong></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
