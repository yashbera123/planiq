import { useState } from 'react';

const OP_COLORS = {
  Jio:    { color: '#4d8aff', bg: 'rgba(0,70,255,0.08)',   border: 'rgba(0,70,255,0.2)' },
  Airtel: { color: '#ff6666', bg: 'rgba(255,0,0,0.07)',    border: 'rgba(255,0,0,0.18)' },
  Vi:     { color: '#ff9944', bg: 'rgba(255,107,0,0.08)',  border: 'rgba(255,107,0,0.18)' },
};

const TIER_LABELS = ['Light', 'Casual', 'Regular', 'Heavy', 'Power', 'Enterprise'];

function OperatorPill({ op }) {
  const style = OP_COLORS[op] || {};
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 999, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.04em', border: '1px solid',
      background: style.bg, color: style.color, borderColor: style.border,
    }}>
      {op}
    </span>
  );
}

function FitBadge({ fit }) {
  const colors = {
    Excellent: { color: 'var(--c-green)',   bg: 'var(--c-green-dim)' },
    Good:      { color: 'var(--c-primary)', bg: 'var(--c-primary-dim)' },
    Fair:      { color: 'var(--c-yellow)',  bg: 'var(--c-yellow-dim)' },
    Poor:      { color: 'var(--c-red)',     bg: 'var(--c-red-dim)' },
  }[fit] || { color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999, fontSize: 10,
      fontWeight: 700, background: colors.bg, color: colors.color,
    }}>
      {fit}
    </span>
  );
}

export default function PlanComparison({ plans, recommendedId }) {
  const [sortKey, setSortKey] = useState('match_score');
  const [sortDir, setSortDir] = useState('desc');
  const [opFilter, setOpFilter] = useState('all');

  if (!plans || plans.length === 0) return null;

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  // Expand with real-world operator data
  const expanded = plans.flatMap(p => {
    const realOps = p.real_world || [];
    if (realOps.length > 0) {
      return realOps.map(rp => ({
        ...p, ...rp,
        // keep base plan match score
        match_score: p.match_score,
        persona_fit: p.persona_fit,
        is_best_match: p.is_best_match,
        base_plan_id: p.plan_id,
        id: rp.id,
      }));
    }
    return [{ ...p, operator: '—', id: p.plan_id }];
  });

  // Operator tab filter
  const operators = ['all', ...new Set(expanded.map(p => p.operator).filter(o => o !== '—'))];
  const filteredPlans = opFilter === 'all'
    ? plans
    : plans.filter(p => (p.real_world || []).some(rp => rp.operator === opFilter));

  const sorted = [...filteredPlans].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  // Compute min/max for color-coding
  const scores  = plans.map(p => p.match_score);
  const prices  = plans.map(p => p.price);
  const maxScore = Math.max(...scores), minScore = Math.min(...scores);
  const minPrice = Math.min(...prices), maxPrice  = Math.max(...prices);

  const scoreColor = (v) => {
    const pct = (v - minScore) / (maxScore - minScore || 1);
    return pct > 0.6 ? 'var(--c-green)' : pct > 0.3 ? 'var(--c-primary)' : 'var(--text-muted)';
  };
  const priceColor = (v) => {
    const pct = (v - minPrice) / (maxPrice - minPrice || 1);
    return pct < 0.35 ? 'var(--c-green)' : pct < 0.65 ? 'var(--text-primary)' : 'var(--c-red)';
  };

  const SortBtn = ({ k, children }) => (
    <button onClick={() => handleSort(k)} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: sortKey === k ? 'var(--c-primary)' : 'var(--text-muted)',
      fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
      fontWeight: 600, letterSpacing: '0.04em',
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '4px 0', userSelect: 'none',
    }}>
      {children} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </button>
  );

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      animation: 'fadeUp 0.5s ease both',
    }}>
      {/* Operator filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.2)',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginRight: 4 }}>
          FILTER:
        </span>
        {operators.map(op => {
          const style = OP_COLORS[op] || {};
          const isActive = opFilter === op;
          return (
            <button key={op} onClick={() => setOpFilter(op)} style={{
              padding: '4px 11px', borderRadius: 999, fontSize: 11,
              fontWeight: 600, border: '1px solid', cursor: 'pointer',
              background: isActive ? (style.bg || 'var(--c-primary-dim)') : 'transparent',
              color: isActive ? (style.color || 'var(--c-primary)') : 'var(--text-muted)',
              borderColor: isActive ? (style.border || 'var(--border-mid)') : 'var(--border)',
              transition: 'var(--transition)',
              textTransform: op === 'all' ? 'uppercase' : 'none',
              letterSpacing: '0.04em',
            }}>
              {op === 'all' ? 'ALL PLANS' : op}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {sorted.length} plans · Click headers to sort
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)' }}>
              {[
                { label: 'Plan', key: 'name', w: 140 },
                { label: 'Match', key: 'match_score', w: 90 },
                { label: 'Price', key: 'price', w: 80 },
                { label: 'Data', key: 'data_gb', w: 70 },
                { label: 'Calls', key: 'calls_min', w: 70 },
                { label: '₹/GB', key: 'cost_per_gb', w: 65 },
                { label: 'Validity', key: 'validity', w: 70 },
                { label: 'Usage Fit', key: 'usage_fit', w: 90 },
                { label: 'Persona', key: 'persona_fit', w: 90 },
                { label: 'Saving', key: 'monthly_savings', w: 85 },
              ].map(col => (
                <th key={col.key} style={{
                  padding: '10px 12px', textAlign: 'left',
                  fontSize: 10, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--border)',
                  minWidth: col.w, whiteSpace: 'nowrap',
                }}>
                  <SortBtn k={col.key}>{col.label.toUpperCase()}</SortBtn>
                </th>
              ))}
              <th style={{
                padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border)',
              }}>OPERATORS</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((plan, i) => {
              const isRec = String(plan.plan_id) === String(recommendedId);
              const saving = plan.monthly_savings || 0;

              return (
                <tr key={plan.plan_id || i}
                  style={{
                    background: isRec
                      ? 'linear-gradient(90deg, rgba(0,212,255,0.06), transparent)'
                      : i % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.15)',
                    borderLeft: isRec ? '3px solid var(--c-primary)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isRec) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isRec) e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.15)'; }}
                >
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isRec && (
                        <span style={{
                          fontSize: 9, background: 'var(--c-primary)', color: '#020408',
                          padding: '1px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
                        }}>BEST</span>
                      )}
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: isRec ? 'var(--c-primary)' : 'var(--text-primary)' }}>
                        {plan.name}
                      </span>
                    </div>
                    {plan.tag && (
                      <span style={{ fontSize: 9, color: 'var(--c-yellow)', marginTop: 2, display: 'block' }}>{plan.tag}</span>
                    )}
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        height: 4, width: `${Math.round(plan.match_score)}%`,
                        maxWidth: 48, background: scoreColor(plan.match_score),
                        borderRadius: 999, opacity: 0.7,
                      }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: scoreColor(plan.match_score), fontWeight: 700 }}>
                        {Math.round(plan.match_score)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ fontWeight: 700, color: priceColor(plan.price) }}>₹{plan.price}</span>
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {plan.data_gb >= 9999 ? <span style={{ color: 'var(--c-primary)' }}>∞</span> : `${plan.data_gb}GB`}
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {plan.calls_min >= 9999 ? <span style={{ color: 'var(--c-purple)' }}>Unltd</span> : plan.calls_min ? `${plan.calls_min}m` : 'Unltd'}
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                    {plan.cost_per_gb >= 999 ? '—' : `₹${plan.cost_per_gb}`}
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {plan.validity}d
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {TIER_LABELS[parseInt(plan.plan_id)] || 'Regular'}
                    </span>
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)' }}>
                    {plan.persona_fit ? <FitBadge fit={plan.persona_fit} /> : '—'}
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {saving > 0
                      ? <span style={{ color: 'var(--c-green)', fontWeight: 700 }}>+₹{Math.round(saving)}/mo</span>
                      : saving < 0
                        ? <span style={{ color: 'var(--c-red)', fontWeight: 700 }}>-₹{Math.round(-saving)}/mo</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>

                  <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(plan.real_world || []).slice(0, 3).map(rp => (
                        <OperatorPill key={rp.id} op={rp.operator} />
                      ))}
                      {(!plan.real_world || plan.real_world.length === 0) && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--c-green)' }}>■</span> Low price &nbsp;
          <span style={{ color: 'var(--c-red)' }}>■</span> High price &nbsp;·&nbsp;
          <span style={{ color: 'var(--c-green)' }}>↑</span> High match &nbsp;
          <span style={{ color: 'var(--text-muted)' }}>↓</span> Low match
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          All 6 tiers · Jio + Airtel + Vi
        </span>
      </div>
    </div>
  );
}
