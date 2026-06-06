/**
 * MetricsBar — 4-column stats strip with text-slide hover.
 */
const METRICS = [
  { value: '97.8%', label: 'Detection accuracy' },
  { value: '7', label: 'Analysis layers' },
  { value: '<200ms', label: 'Avg. response time' },
  { value: '80+', label: 'Brands protected' },
];

export default function MetricsBar() {
  return (
    <div className="landing-metrics">
      {METRICS.map(({ value, label }) => (
        <div className="metric hover-parent" key={label}>
          <div className="metric-n">
            <span className="text-slide">
              <span className="ts-top">{value}</span>
              <span className="ts-bot">{value}</span>
            </span>
          </div>
          <div className="metric-l">
            <span className="m-dot" />
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
