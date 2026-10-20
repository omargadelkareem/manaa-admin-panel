import { ReceiptText } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function PayslipsPage() {
  return (
    <div className="page">
      <PageHeader
        title="قسائم الرواتب"
        description="عرض وإصدار قسائم رواتب الموظفين"
      />

      <section className="module-coming panel">
        <ReceiptText size={34} />
        <h2>قسائم الرواتب</h2>
        <p>
          قسائم الرواتب الشهرية ستظهر هنا.
        </p>
      </section>
    </div>
  );
}
