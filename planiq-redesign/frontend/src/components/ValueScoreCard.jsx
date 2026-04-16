import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Value score badge ─────────────────────────────────────────────────
export function ValueScoreBadge({ score, size = 'md' }) {
  if (score == null) return null;
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Average';
  const color  = score >= 90 ? 'var(--c-green)' : score >= 75 ? 'var(--c-primary)' : 'var(--c-yellow)';
  const dim    = score >= 90 ? 'var(--c-green-dim)' : score >= 75 ? 'var(--c-primary-dim)' : 'var(--c-yellow-dim)';

  if (size === 'sm') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: dim, border: `1px solid ${color}44`,
      fontSize: 10, color, fontWeight: 700, fontFamily: 'var(--font-mono)',
    }}>
      {score} · {label}
    </span>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 'var(--radius-md)',
      background: dim, border: `1px solid ${color}33`,
    }}>
      {/* Arc gauge */}
      <svg width={44} height={30} viewBox="0 0 44 30">
        <path d="M4,26 A18,18 0 0,1 40,26" fill="none" stroke="var(--bg-elevated)" strokeWidth={5} strokeLinecap="round" />
        <path
          d="M4,26 A18,18 0 0,1 40,26"
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 56} 56`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={22} y={27} textAnchor="middle" fill={color}
          style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {score}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Value Score</div>
      </div>
    </div>
  );
}

// ── Why Not This Plan panel ───────────────────────────────────────────
export function WhyNotPanel({ plan, bestPlan, onClose }) {
  if (!plan || !bestPlan) return null;

  const priceDiff    = plan.price - bestPlan.price;
  const dataDiff     = (plan.data_gb || 0) - (bestPlan.data_gb || 0);
  const scoreDiff    = (plan.value_score || plan.match_score || 0) - (bestPlan.value_score || bestPlan.match_score || 0);

  const rows = [
    {
      label: 'Price',
      icon: '💸',
      status: priceDiff > 0 ? 'bad' : priceDiff < 0 ? 'good' : 'neutral',
      text: priceDiff > 0
        ? `₹${Math.round(priceDiff)} more expensive per month`
        : priceDiff < 0
        ? `₹${Math.round(-priceDiff)} cheaper (but may underfit your needs)`
        : 'Same price',
    },
    {
      label: 'Data',
      icon: '📶',
      status: dataDiff < -5 ? 'bad' : dataDiff > 5 ? 'good' : 'neutral',
      text: Math.abs(dataDiff) > 0.5
        ? `${Math.abs(dataDiff).toFixed(0)}GB ${dataDiff < 0 ? 'less' : 'more'} data vs recommended`
        : 'Similar data allowance',
    },
    {
      label: 'Match Score',
      icon: '🎯',
      status: scoreDiff < -5 ? 'bad' : 'neutral',
      text: scoreDiff < 0
        ? `Score ${Math.round(bestPlan.value_score || bestPlan.match_score || 0)} vs ${Math.round(plan.value_score || plan.match_score || 0)} — lower fit`
        : 'Competitive score',
    },
  ];

  const statusColor = { bad: 'var(--c-red)', good: 'var(--c-green)', neutral: 'var(--text-muted)' };
  const statusBg    = { bad: 'var(--c-red-dim)', good: 'var(--c-green-dim)', neutral: 'var(--bg-surface)' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid rgba(255,64,96,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '14px 16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          marginTop: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', letterSpacing: '0.05em', color: 'var(--c-red)' }}>
            WHY NOT THIS PLAN?
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, padding: '2px 6px',
          }}>✕</button>
        </div>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 10 }}>
          Comparing <strong style={{ color: 'var(--text-secondary)' }}>{plan.name}</strong> vs recommended <strong style={{ color: 'var(--c-primary)' }}>{bestPlan.name}</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              background: statusBg[row.status],
              border: `1px solid ${statusColor[row.status]}22`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  {row.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: statusColor[row.status] }}>{row.text}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main exported component ───────────────────────────────────────────
export default function ValueScoreCard({ plans }) {
  const [whyNot, setWhyNot] = useState(null);
  if (!plans || plans.length === 0) return null;

  const best = plans[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        Plan Value Scores
      </div>
      {plans.slice(0, 5).map((plan, i) => {
        const score = plan.value_score ?? Math.round(plan.match_score ?? 0);
        const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Average';
        const color = score >= 90 ? 'var(--c-green)' : score >= 75 ? 'var(--c-primary)' : 'var(--c-yellow)';
        const isWN  = whyNot?.plan_id === plan.plan_id;

        return (
          <div key={plan.plan_id || i} style={{ position: 'relative' }}>
            <motion.div
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: i === 0 ? 'linear-gradient(135deg, rgba(0,229,160,0.08), transparent)' : 'var(--bg-surface)',
                border: i === 0 ? '1px solid rgba(0,229,160,0.2)' : '1px solid var(--border)',
              }}
            >
              {i === 0 && (
                <span style={{ fontSize: 14 }}>⭐</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {plan.name || `Plan ${plan.plan_id}`}
                </div>
                {/* Score bar */}
                <div style={{ height: 4, borderRadius: 999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: i * 0.06 + 0.2, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 999, background: color }}
                  />
                </div>
              </div>
              {/* Score */}
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color, minWidth: 28, textAlign: 'right',
              }}>
                {score}
              </div>
              <div style={{
                fontSize: 9, color, padding: '2px 6px', borderRadius: 999,
                background: `${color}18`, border: `1px solid ${color}33`,
                flexShrink: 0,
              }}>
                {label}
              </div>

              {/* Why not? button (not shown on best) */}
              {i > 0 && (
                <button
                  onClick={() => setWhyNot(isWN ? null : plan)}
                  style={{
                    background: isWN ? 'rgba(255,64,96,0.15)' : 'none',
                    border: `1px solid ${isWN ? 'rgba(255,64,96,0.4)' : 'var(--border)'}`,
                    borderRadius: 6, cursor: 'pointer', padding: '3px 8px',
                    fontSize: 10, color: isWN ? 'var(--c-red)' : 'var(--text-muted)',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  {isWN ? 'close' : '?'}
                </button>
              )}
            </motion.div>

            {/* Why Not panel */}
            {isWN && (
              <WhyNotPanel plan={plan} bestPlan={best} onClose={() => setWhyNot(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
