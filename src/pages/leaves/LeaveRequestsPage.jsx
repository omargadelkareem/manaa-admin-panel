import { CalendarDays } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function LeaveRequestsPage() {
  return (
    <div className="page">
      <PageHeader
        title="طلبات الإجازة"
        description="إدارة طلبات إجازات الموظفين والموافقة عليها"
      />

      <section className="module-coming panel">
        <CalendarDays size={34} />
        <h2>طلبات الإجازة</h2>
        <p>
          الواجهة جاهزة للربط مع بيانات طلبات الموظفين الحالية.
        </p>
      </section>
    </div>
  );
}
