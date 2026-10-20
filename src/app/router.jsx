import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import DashboardPage from "../pages/dashboard/DashboardPage.jsx";

import EmployeesPage from "../pages/employees/EmployeesPage.jsx";
import EmployeeDetailsPage from "../pages/employees/EmployeeDetailsPage.jsx";
import ImportEmployeesPage from "../pages/employees/ImportEmployeesPage.jsx";

import AttendancePage from "../pages/attendance/AttendancePage.jsx";
import AttendanceDetailsPage from "../pages/attendance/AttendanceDetailsPage.jsx";

import LocationsPage from "../pages/locations/LocationsPage.jsx";
import LiveTrackingPage from "../pages/tracking/LiveTrackingPage.jsx";

import LeaveRequestsPage from "../pages/leaves/LeaveRequestsPage.jsx";
import ShiftsPage from "../pages/shifts/ShiftsPage.jsx";

import PayrollPage from "../pages/payroll/PayrollPage.jsx";
import PayslipsPage from "../pages/payroll/PayslipsPage.jsx";

import ReportsPage from "../pages/reports/ReportsPage.jsx";

import CompanySettingsPage from "../pages/settings/CompanySettingsPage.jsx";
import SystemSettingsPage from "../pages/settings/SystemSettingsPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/import" element={<ImportEmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />

        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/:id" element={<AttendanceDetailsPage />} />

        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/live-tracking" element={<LiveTrackingPage />} />

        <Route path="/leaves" element={<LeaveRequestsPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />

        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payslips" element={<PayslipsPage />} />

        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/settings/company" element={<CompanySettingsPage />} />
        <Route path="/settings/system" element={<SystemSettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
