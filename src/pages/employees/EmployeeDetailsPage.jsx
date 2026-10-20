import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

import {
  getEmployeeByFirebaseKey,
} from "../../services/firebase/employees.service.js";

export default function EmployeeDetailsPage() {
  const { id } = useParams();

  const [employee, setEmployee] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadEmployee() {
      try {
        const result =
          await getEmployeeByFirebaseKey(id);

        setEmployee(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEmployee();
  }, [id]);

  if (loading) {
    return (
      <LoadingScreen text="جاري تحميل بيانات الموظف..." />
    );
  }

  if (!employee) {
    return (
      <div className="page">
        <div className="alert alert-danger">
          الموظف غير موجود.
        </div>
      </div>
    );
  }

  const items = [
    {
      label: "كود الموظف",
      value: employee.emp_code,
      icon: Hash,
    },
    {
      label: "القسم",
      value: employee.department_name,
      icon: BriefcaseBusiness,
    },
    {
      label: "المسمى الوظيفي",
      value: employee.position_name,
      icon: UserRound,
    },
    {
      label: "الهاتف",
      value: employee.phone,
      icon: Phone,
    },
    {
      label: "البريد الإلكتروني",
      value: employee.email,
      icon: Mail,
    },
    {
      label: "منطقة العمل",
      value:
        employee.work_area ||
        employee.current_location_name,
      icon: MapPin,
    },
    {
      label: "تاريخ التعيين",
      value: employee.hire_date,
      icon: CalendarDays,
    },
    {
      label: "العنوان",
      value: employee.address,
      icon: MapPin,
    },
  ];

  return (
    <div className="page">
      <Link
        to="/employees"
        className="back-link"
      >
        <ArrowRight size={18} />
        العودة للموظفين
      </Link>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <section className="employee-profile-card">
        <div className="employee-profile-avatar">
          {(employee.name || "م").charAt(0)}
        </div>

        <div className="employee-profile-copy">
          <div className="employee-profile-title">
            <h1>
              {employee.name || "بدون اسم"}
            </h1>

            <StatusBadge
              active={employee.is_active !== false}
            >
              {employee.is_active !== false
                ? "نشط"
                : "غير نشط"}
            </StatusBadge>
          </div>

          <p>
            {employee.position_name || "موظف"}
            {" • "}
            {employee.department_name ||
              "بدون قسم"}
          </p>
        </div>
      </section>

      <section className="details-grid">
        {items.map(({ label, value, icon: Icon }) => (
          <article
            className="detail-card"
            key={label}
          >
            <div className="detail-icon">
              <Icon size={20} />
            </div>

            <div>
              <span>{label}</span>
              <strong>{value || "—"}</strong>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
