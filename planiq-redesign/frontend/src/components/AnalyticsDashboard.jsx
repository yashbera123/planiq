function RadarChart({ values, labels, color = 'var(--c-primary)' }) {
  const N = values.length;
  const cx = 100, cy = 100, r = 70;
  const angles = values.map((_, i) => (Math.PI * 2 * i) / N - Math.PI / 2);
  const pts = values.map((v, i) => {
    const rad = r * v;
    return { x: cx + rad * Math.cos(angles[i]), y: cy + rad * Math.sin(angles[i]) };
  });
  const polygon = pts.map(p => `${p.x},${p.y}`).join(' ');
  const webLines = [0.25, 0.5, 0.75, 1].map(f =>
    values.map((_, i) => {
      const rad = r * f;
      return `${cx + rad * Math.cos(angles[i])},${cy + rad * Math.sin(angles[i])}`;
    }).join(' ')
  );
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 200, overflow: 'visible' }}>
      {webLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.5" />
      ))}
      {values.map((_, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(angles[i])} y2={cy + r * Math.sin(angles[i])}
          stroke="var(--border)" strokeWidth="0.5" />
      ))}
      <polygon points={polygon} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
      {values.map((_, i) => {
        const lx = cx + (r + 16) * Math.cos(angles[i]);
        const ly = cy + (r + 16) * Math.sin(angles[i]);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {labels[i]}
        </text>;
      })}
    </svg>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {d.value > 0 ? d.value : ''}
          </div>
          <div style={{
            width: '100%', height: `${(d.value / max) * 70}%`, minHeight: d.value > 0 ? 4 : 0,
            borderRadius: '3px 3px 0 0',
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            transition: 'height 0.8s ease',
          }} />
          <div style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ inputs }) {
  if (!inputs) return null;
  const { data_score = 0.5, call_score = 0.35, value_score = 0.45, monthly_charges = 349, num_services = 3, tenure = 18, has_streaming = 1 } = inputs;

  const usageCategory = data_score > 0.7 ? 'Heavy' : data_score > 0.4 ? 'Moderate' : 'Light';
  const spendCategory = monthly_charges > 500 ? 'Premium' : monthly_charges > 250 ? 'Mid-tier' : 'Budget';

  const radarVals = [data_score, call_score, value_score, num_services / 9, tenure / 72, has_streaming ? 0.8 : 0.2];
  const radarLabels = ['Data', 'Calls', 'Value', 'Services', 'Loyalty', 'Streaming'];

  const planDist = [
    { label: 'Basic', value: 12 },
    { label: 'Smart', value: 23 },
    { label: 'Power', value: 31 },
    { label: 'Ultra', value: 19 },
    { label: 'Pro', value: 9 },
    { label: 'Biz', value: 6 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Usage Profile', val: usageCategory, icon: '📶', color: 'var(--c-primary)' },
          { label: 'Spend Category', val: spendCategory, icon: '💰', color: 'var(--c-accent)' },
          { label: 'Loyalty Score', val: Math.round((tenure / 72) * 100) + '%', icon: '⭐', color: 'var(--c-yellow)' },
          { label: 'Service Load', val: `${num_services}/9`, icon: '🔌', color: 'var(--c-purple)' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{k.icon}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.04em', color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Radar */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '18px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.04em', marginBottom: 12 }}>USAGE RADAR</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart values={radarVals} labels={radarLabels} color="var(--c-primary)" />
          </div>
        </div>

        {/* Plan distribution */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '18px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.04em', marginBottom: 16 }}>PLATFORM DISTRIBUTION</div>
          <BarChart data={planDist} color="var(--c-purple)" />
          <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            % of users on each plan tier across the platform
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.04em', marginBottom: 16 }}>SCORE BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Data Usage Intensity', val: data_score, color: 'var(--c-primary)', fmt: v => `${Math.round(v * 100)}%` },
            { label: 'Call Volume Score', val: call_score, color: 'var(--c-purple)', fmt: v => `${Math.round(v * 100)}%` },
            { label: 'Value vs Peers', val: value_score, color: 'var(--c-accent)', fmt: v => `${Math.round(v * 100)}%` },
            { label: 'Monthly Spend', val: monthly_charges / 999, color: 'var(--c-green)', fmt: () => `₹${monthly_charges}` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: s.color, fontWeight: 600 }}>{s.fmt(s.val)}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.val * 100}%`, background: `linear-gradient(to right, ${s.color}, ${s.color}88)` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
