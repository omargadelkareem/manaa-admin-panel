export default function StatusBadge({
  active,
  children,
}) {
  return (
    <span
      className={`status-badge ${
        active ? "success" : "danger"
      }`}
    >
      <span className="status-dot" />
      {children}
    </span>
  );
}
