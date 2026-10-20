import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, FileText, Search, Users } from "lucide-react";
import * as XLSX from "xlsx";

import PageHeader from "../../components/layout/PageHeader.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getEmployees } from "../../services/firebase/employees.service.js";
import { getAttendanceRange } from "../../services/firebase/attendance.service.js";
import { formatAttendanceTime, formatWorkDuration, getWorkMinutes } from "../../utils/attendance.js";

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function escapeHtml(value) {
  return String(value ?? "—").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getEmployees(), getAttendanceRange()])
      .then(([employeeData, attendanceData]) => { setEmployees(employeeData); setRecords(attendanceData); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [String(e.emp_code), e])), [employees]);
  const departments = useMemo(() => [...new Set(employees.map((e) => e.department_name).filter(Boolean))].sort(), [employees]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
      .map((r) => ({ ...r, employee: employeeMap.get(String(r.employeeCode)) || null }))
      .filter((r) => !department || r.employee?.department_name === department)
      .filter((r) => !q || [r.employee?.name, r.employeeCode, r.employee?.department_name].some((v) => String(v || "").toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, employeeMap, from, to, department, search]);

  const summary = useMemo(() => {
    const employeeCodes = new Set(rows.map((r) => String(r.employeeCode)));
    const totalMinutes = rows.reduce((sum, r) => sum + (getWorkMinutes(r) || 0), 0);
    const completed = rows.filter((r) => r.check_in && r.check_out).length;
    const open = rows.filter((r) => r.check_in && !r.check_out).length;
    return { records: rows.length, employees: employeeCodes.size, totalHours: (totalMinutes / 60).toFixed(1), completed, open };
  }, [rows]);

  function exportExcel() {
    const data = rows.map((r) => ({
      "التاريخ": r.date,
      "كود الموظف": r.employeeCode,
      "اسم الموظف": r.employee?.name || "",
      "القسم": r.employee?.department_name || "",
      "المسمى الوظيفي": r.employee?.position_name || "",
      "منطقة العمل": r.employee?.work_area || r.employee?.current_location_name || "",
      "وقت الحضور": formatAttendanceTime(r.check_in),
      "وقت الانصراف": formatAttendanceTime(r.check_out),
      "إجمالي ساعات العمل": formatWorkDuration(r),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [12,14,24,20,20,20,14,14,18].map((wch) => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, `manaa-attendance-${from}-to-${to}.xlsx`);
  }

  function exportPdf() {
    const body = rows.map((r) => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.employeeCode)}</td><td>${escapeHtml(r.employee?.name)}</td><td>${escapeHtml(r.employee?.department_name)}</td><td>${escapeHtml(formatAttendanceTime(r.check_in))}</td><td>${escapeHtml(formatAttendanceTime(r.check_out))}</td><td>${escapeHtml(formatWorkDuration(r))}</td></tr>`).join("");
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير الحضور والانصراف</title><style>
      body{font-family:Arial,Tahoma,sans-serif;padding:28px;color:#172b23}h1{margin:0 0 6px;font-size:22px}.sub{color:#68766f;margin-bottom:20px}.summary{display:flex;gap:10px;margin:18px 0}.summary div{border:1px solid #ddd;padding:10px 14px;border-radius:8px}.summary strong{display:block;font-size:18px;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f1f5f3}@page{size:A4 landscape;margin:12mm}@media print{body{padding:0}}
    </style></head><body><h1>شركة مناع للزجاج</h1><div class="sub">تقرير الحضور والانصراف · من ${escapeHtml(from)} إلى ${escapeHtml(to)}</div>
    <div class="summary"><div>السجلات<strong>${summary.records}</strong></div><div>الموظفون<strong>${summary.employees}</strong></div><div>إجمالي الساعات<strong>${summary.totalHours}</strong></div><div>سجلات مكتملة<strong>${summary.completed}</strong></div></div>
    <table><thead><tr><th>التاريخ</th><th>الكود</th><th>الموظف</th><th>القسم</th><th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th></tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=()=>{window.print();}</script></body></html>`);
    win.document.close();
  }

  if (loading) return <LoadingScreen text="جاري تجهيز مركز التقارير..." />;

  return (
    <div className="page reports-page">
      <PageHeader title="التقارير" description="تقارير الحضور والانصراف قابلة للفلترة والتصدير والطباعة" />

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="report-summary-grid">
        <article><span>إجمالي السجلات</span><strong>{summary.records}</strong><FileText size={20} /></article>
        <article><span>الموظفون في التقرير</span><strong>{summary.employees}</strong><Users size={20} /></article>
        <article><span>إجمالي ساعات العمل</span><strong>{summary.totalHours}</strong><CalendarDays size={20} /></article>
        <article><span>سجلات مكتملة</span><strong>{summary.completed}</strong><FileSpreadsheet size={20} /></article>
      </section>

      <section className="panel report-filters">
        <div className="report-filter-row">
          <label><span>من تاريخ</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label><span>إلى تاريخ</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <label><span>القسم</span><select value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">كل الأقسام</option>{departments.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="report-search"><span>بحث</span><div><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم أو كود الموظف" /></div></label>
        </div>
        <div className="report-export-actions">
          <button className="button button-primary" onClick={exportExcel} disabled={!rows.length}><FileSpreadsheet size={17} />تنزيل Excel</button>
          <button className="button button-ghost" onClick={exportPdf} disabled={!rows.length}><Download size={17} />تنزيل / طباعة PDF</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><div><h2>تقرير الحضور والانصراف</h2><p>{rows.length} سجل مطابق للفلاتر الحالية</p></div></div>
        {!rows.length ? <EmptyState title="لا توجد بيانات" description="غيّر الفترة أو الفلاتر لعرض سجلات التقرير." /> : (
          <div className="table-wrapper"><table className="data-table report-table">
            <thead><tr><th>التاريخ</th><th>الكود</th><th>الموظف</th><th>القسم</th><th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={`${r.date}-${r.employeeCode}`}><td>{r.date}</td><td>{r.employeeCode}</td><td><strong>{r.employee?.name || "—"}</strong></td><td>{r.employee?.department_name || "—"}</td><td>{formatAttendanceTime(r.check_in)}</td><td>{formatAttendanceTime(r.check_out)}</td><td><strong>{formatWorkDuration(r)}</strong></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
