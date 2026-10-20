import { WalletCards } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function PayrollPage() {
  return (
    <div className="page">
      <PageHeader
        title="الرواتب"
        description="إدارة الرواتب والخصومات والإضافي"
      />

      <section className="module-coming panel">
        <WalletCards size={34} />
        <h2>نظام الرواتب</h2>
        <p>
          سيتم احتساب الرواتب اعتمادًا على بيانات الموظفين والحضور.
        </p>
      </section>
    </div>
  );
}
