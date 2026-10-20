export default function LoadingScreen({
  text = "جاري تحميل البيانات...",
}) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <span>{text}</span>
    </div>
  );
}
