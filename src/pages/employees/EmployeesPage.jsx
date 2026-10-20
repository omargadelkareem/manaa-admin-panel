import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileSpreadsheet,
  Search,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

import {
  subscribeToEmployees,
} from "../../services/firebase/employees.service.js";

export default function EmployeesPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (firebaseError) => {
        setError(firebaseError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        employees
          .map(
            (employee) =>
              employee.department_name
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        String(employee.name || "")
          .toLowerCase()
          .includes(query) ||
        String(employee.emp_code || "")
          .toLowerCase()
          .includes(query) ||
        String(employee.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(employee.position_name || "")
          .toLowerCase()
          .includes(query);

      const matchesDepartment =
        department === "all" ||
        employee.department_name === department;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, department]);

  if (loading) {
    return (
      <LoadingScreen text="جاري تحميل الموظفين..." />
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="الموظفون"
        description={`إدارة بيانات ${employees.length} موظف مسجل بالنظام`}
        actions={
          <Link
            className="button button-primary"
            to="/employees/import"
          >
            <FileSpreadsheet size={18} />
            استيراد Excel
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث بالاسم، الكود، الوظيفة أو الهاتف..."
            />
          </div>

          <select
            className="select-control"
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            <option value="all">
              جميع الأقسام
            </option>

            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="toolbar-count">
            <Users size={17} />
            {filteredEmployees.length} موظف
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <EmptyState
            title="لا توجد نتائج"
            description="جرّب تغيير البحث أو فلتر القسم."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الكود</th>
                  <th>القسم</th>
                  <th>المسمى الوظيفي</th>
                  <th>منطقة العمل</th>
                  <th>الحالة</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr key={employee.firebaseKey}>
                      <td>
                        <div className="employee-cell">
                          <div className="mini-avatar">
                            {(employee.name || "م")
                              .charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {employee.name ||
                                "بدون اسم"}
                            </strong>

                            <small>
                              {employee.phone ||
                                employee.email ||
                                "لا توجد بيانات اتصال"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="code-chip">
                          {employee.emp_code ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        {employee.department_name ||
                          "—"}
                      </td>

                      <td>
                        {employee.position_name ||
                          "—"}
                      </td>

                      <td>
                        {employee.work_area ||
                          employee.current_location_name ||
                          "—"}
                      </td>

                      <td>
                        <StatusBadge
                          active={
                            employee.is_active !==
                            false
                          }
                        >
                          {employee.is_active !==
                          false
                            ? "نشط"
                            : "غير نشط"}
                        </StatusBadge>
                      </td>

                      <td>
                        <button
                          className="button button-ghost"
                          onClick={() =>
                            navigate(
                              `/employees/${employee.firebaseKey}`
                            )
                          }
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
