export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          {Icon && <Icon size={21} />}
        </div>

        <span>{title}</span>
      </div>

      <strong className="stat-value">{value}</strong>

      {description && (
        <small>{description}</small>
      )}
    </article>
  );
}
