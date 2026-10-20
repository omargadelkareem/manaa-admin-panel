import { ChartNoAxesCombined } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function ReportsPage() {
  return (
    <div className="page">
      <PageHeader
        title="التقارير"
        description="تقارير الحضور والغياب والموظفين والرواتب"
      />

      <section className="module-coming panel">
        <ChartNoAxesCombined size={34} />
        <h2>مركز التقارير</h2>
        <p>
          سيتم توفير التقارير والطباعة والتصدير إلى Excel من هنا.
        </p>
      </section>
    </div>
  );
}
