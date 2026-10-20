import { CalendarClock } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function ShiftsPage() {
  return (
    <div className="page">
      <PageHeader
        title="الورديات"
        description="إدارة أوقات العمل والورديات"
      />

      <section className="module-coming panel">
        <CalendarClock size={34} />
        <h2>إدارة الورديات</h2>
        <p>
          سيتم ربط الورديات مع مواعيد الحضور والانصراف.
        </p>
      </section>
    </div>
  );
}
