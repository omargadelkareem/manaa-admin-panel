import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "لا توجد بيانات",
  description = "لا توجد بيانات متاحة للعرض حاليًا.",
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Inbox size={26} />
      </div>

      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
