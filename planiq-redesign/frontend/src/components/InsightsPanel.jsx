import { useState, useEffect, useRef } from 'react';

// Animated savings SVG line chart
function SavingsChart({ data, color }) {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDrawn(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.cumulative_savings), 1);
  const w = 300, h = 70, pad = 8;

  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - (d.cumulative_savings / maxVal) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;

  return (
    <div ref={ref}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        12-Month Cumulative Savings Trajectory
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {drawn && (
          <>
            <polygon points={areaPoints} fill="url(#chartGrad2)" style={{ animation: 'fadeIn 0.6s ease both' }} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
              style={{ animation: 'fadeIn 0.5s ease both' }} />
            {data.map((d, i) => {
              if (i % 3 !== 0 && i !== data.length - 1) return null;
              const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
              const y = h - pad - (d.cumulative_savings / maxVal) * (h - 2 * pad);
              return (
                <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5}
                  fill={color}
                  style={{ animation: `fadeIn 0.4s ${i * 0.04}s ease both` }}
                />
              );
            })}
          </>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
        <span>Month 1</span>
        <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          ₹{Math.round(data[data.length - 1]?.cumulative_savings || 0)} at 12mo
        </span>
      </div>
    </div>
  );
}

// Efficiency gauge
function SpendingGauge({ score }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

  const color = score >= 80 ? 'var(--c-green)' : score >= 50 ? 'var(--c-yellow)' : 'var(--c-red)';
  const label = score >= 80 ? 'Optimized' : score >= 50 ? 'Average' : 'Overspending';

  // SVG arc: 270° arc from -135° to +135°
  const radius = 38, cx = 50, cy = 54;
  const circumference = 2 * Math.PI * radius;
  const startAngle = -135, sweepAngle = 270;

  const polarToXY = (angle, r) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = polarToXY(startAngle, radius);
  const end = polarToXY(startAngle + sweepAngle, radius);
  const fillEnd = polarToXY(startAngle + sweepAngle * (score / 100), radius);
  const largeArc = (sweepAngle * (score / 100)) > 180 ? 1 : 0;
  const fillLargeArc = sweepAngle > 180 ? 1 : 0;

  const trackD = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${fillLargeArc} 1 ${end.x} ${end.y}`;
  const fillD = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width="100" height="66" viewBox="0 0 100 66">
        <path d={trackD} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" strokeLinecap="round" />
        {animated && (
          <path d={fillD} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, animation: 'fadeIn 0.8s ease both' }}
          />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {score}%
        </text>
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Efficiency Score</span>
    </div>
  );
}

export default function InsightsPanel({ insights, loading }) {
  if (loading) return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.05em', marginBottom: 14 }}>
        SMART INSIGHTS
      </div>
      {[200, 150, 100].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 13, width: `${w}px`, maxWidth: '100%', marginBottom: 10 }} />
      ))}
      <div className="skeleton" style={{ height: 60, width: '100%', marginBottom: 10 }} />
    </div>
  );

  if (!insights) return null;

  const {
    spending_efficiency_score = 75,
    cost_analysis = {},
    savings_trajectory = [],
    persona_advice = [],
    action_items = [],
    operator_picks = {},
    persona,
  } = insights;

  const savingsColor = cost_analysis.overpaying ? 'var(--c-green)' : cost_analysis.underpaying ? 'var(--c-yellow)' : 'var(--c-primary)';

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      animation: 'fadeUp 0.5s 0.4s ease both',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(0,229,160,0.07), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.05em' }}>
            SMART INSIGHTS
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Cost optimization · behavioral analysis
          </div>
        </div>
        <SpendingGauge score={spending_efficiency_score} />
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Savings chart */}
        {savings_trajectory.length > 0 && cost_analysis.monthly_difference > 20 && (
          <div style={{
            padding: '12px 14px', background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          }}>
            <SavingsChart data={savings_trajectory} color={savingsColor} />
          </div>
        )}

        {/* Action items */}
        {action_items.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Priority Action Items
            </div>
            {action_items.map((item, i) => {
              const colors = { HIGH: 'var(--c-red)', MEDIUM: 'var(--c-yellow)', LOW: 'var(--c-green)' };
              const bgs    = { HIGH: 'var(--c-red-dim)', MEDIUM: 'var(--c-yellow-dim)', LOW: 'var(--c-green-dim)' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                  padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  background: bgs[item.priority] || 'var(--bg-surface)',
                  border: `1px solid ${colors[item.priority] || 'var(--border)'}33`,
                  animation: `fadeUp 0.4s ${i * 0.08}s ease both`,
                }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: colors[item.priority] || 'var(--text-muted)',
                    letterSpacing: '0.04em', minWidth: 44,
                    padding: '2px 5px', borderRadius: 4,
                    background: `${colors[item.priority] || 'var(--border)'}22`,
                    textAlign: 'center',
                  }}>
                    {item.priority}
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.action}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: colors[item.priority], fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.saving}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Persona tips */}
        {persona_advice.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {persona ? `Tips for ${persona.name}` : 'Personalized Tips'}
            </div>
            {persona_advice.slice(0, 3).map((tip, i) => (
              <div key={i} style={{
                fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                padding: '7px 12px', marginBottom: 5, lineHeight: 1.6,
                borderLeft: '2px solid var(--c-primary)',
                background: 'var(--c-primary-dim)',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                animation: `fadeUp 0.4s ${i * 0.08 + 0.2}s ease both`,
              }}>
                {tip}
              </div>
            ))}
          </div>
        )}

        {/* Operator picks */}
        {Object.keys(operator_picks).length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Best Matching Real Plans
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(operator_picks).map(([op, plan]) => {
                const opClass = op === 'jio' ? 'op-jio' : op === 'airtel' ? 'op-airtel' : 'op-vi';
                return (
                  <div key={op} style={{
                    flex: '1 0 100px', padding: '10px 12px',
                    borderRadius: 'var(--radius-md)', border: '1px solid',
                  }} className={opClass}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {op}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 700 }}>
                      ₹{plan.price}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{plan.name}</div>
                    {plan.perks && plan.perks.length > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                        {plan.perks.slice(0, 2).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
