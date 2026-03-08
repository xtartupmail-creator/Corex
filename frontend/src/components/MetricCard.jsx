export default function MetricCard({ label, value, accent = 'cyan' }) {
  return (
    <div className={`card accent-${accent}`}>
      <p className="metric-label">{label}</p>
      <h3>{value}</h3>
    </div>
  );
}
