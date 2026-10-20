import { Building2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function CompanySettingsPage() {
  return (
    <div className="page">
      <PageHeader
        title="بيانات الشركة"
        description="إعداد بيانات شركة مناع للزجاج"
      />

      <section className="settings-card panel">
        <div className="settings-icon">
          <Building2 size={25} />
        </div>

        <div>
          <h2>شركة مناع للزجاج</h2>
          <p>الرياض - المملكة العربية السعودية</p>
        </div>
      </section>
    </div>
  );
}
