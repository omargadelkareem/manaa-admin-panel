import { Settings } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";

export default function SystemSettingsPage() {
  return (
    <div className="page">
      <PageHeader
        title="إعدادات النظام"
        description="إعدادات الحضور والتطبيق ولوحة الإدارة"
      />

      <section className="module-coming panel">
        <Settings size={34} />
        <h2>إعدادات النظام</h2>
        <p>
          سيتم تجميع إعدادات الحضور والمواقع والنظام في هذه الصفحة.
        </p>
      </section>
    </div>
  );
}
