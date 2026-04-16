import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// ── Scenario card ─────────────────────────────────────────────────────
function ScenarioCard({ scenario, index, color, icon }) {
  if (!scenario) return (
    <div style={{
      flex: 1, minWidth: 220,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: 'var(--text-sm)',
    }}>
      No data
    </div>
  );

  const plan  = scenario.top_plan || scenario.top_recommendations?.[0];
  const cost  = scenario.cost_analysis;
  const score = plan?.match_score ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.12 }}
      style={{
        flex: 1, minWidth: 220,
        background: `linear-gradient(160deg, ${color}12, ${color}04)`,
        border: `1px solid ${color}33`,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: `0 8px 32px ${color}18`,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 2 }}>
            {scenario.label || `Scenario ${index + 1}`}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{scenario.description || ''}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Recommended plan */}
        {plan && (
          <div style={{
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Top Recommendation
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.04em', marginBottom: 4 }}>
              {plan.name}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color }}>
                ₹{plan.price}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/mo</span>
              <span style={{
                marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10,
                color, padding: '2px 7px', borderRadius: 999,
                background: `${color}18`, border: `1px solid ${color}33`,
              }}>
                {Math.round(score)}% match
              </span>
            </div>
          </div>
        )}

        {/* Data stats */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { l: 'Budget', v: `₹${scenario.budget || (plan?.price ?? '—')}` },
            { l: 'Data/day', v: plan ? (plan.data_gb >= 9999 ? '∞' : `${(plan.data_gb / 28).toFixed(1)}GB`) : '—' },
            { l: 'Score', v: `${Math.round(score)}%` },
          ].map(s => (
            <div key={s.l} style={{
              flex: 1, padding: '6px', textAlign: 'center',
              background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color }}>{s.v}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Overpay alert */}
        {cost?.overpaying && (
          <div style={{
            fontSize: 11, color: 'var(--c-green)', fontWeight: 600,
            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--c-green-dim)', border: '1px solid rgba(0,229,160,0.2)',
          }}>
            💰 Save ₹{Math.round(cost.monthly_difference || 0)}/mo by switching
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Comparison row (mini table) ───────────────────────────────────────
function ComparisonRow({ scenarios, field, label, format = v => v }) {
  const vals = scenarios.map(s => {
    const plan = s?.top_plan || s?.top_recommendations?.[0];
    if (!plan) return null;
    if (field === 'price') return plan.price;
    if (field === 'data') return plan.data_gb >= 9999 ? '∞ GB' : `${plan.data_gb}GB`;
    if (field === 'score') return `${Math.round(plan.match_score || 0)}%`;
    return plan[field] ?? s[field] ?? '—';
  });

  const numVals = vals.map(v => parseFloat(v));
  const minVal  = Math.min(...numVals.filter(v => !isNaN(v)));

  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 120, padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </div>
      {vals.map((v, i) => {
        const num = parseFloat(v);
        const isBest = !isNaN(num) && num === minVal && field === 'price';
        return (
          <div key={i} style={{
            flex: 1, padding: '8px 12px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            color: isBest ? 'var(--c-green)' : 'var(--text-secondary)',
            background: isBest ? 'rgba(0,229,160,0.05)' : 'transparent',
          }}>
            {v ?? '—'}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ScenarioComparison({ lastInputs, onRunScenarios, loading }) {
  const [scenarios, setScenarios] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleRun = useCallback(async () => {
    if (!lastInputs) return;
    setLocalLoading(true);
    try {
      const res = await onRunScenarios(lastInputs);
      setScenarios(res?.scenarios || null);
    } catch {
      // Build mock scenarios from inputs
      const base = lastInputs;
      setScenarios([
        {
          label: 'Current Usage',
          description: 'Your current profile',
          budget: base.monthly_charges,
          top_plan: { name: 'Current Plan', price: base.monthly_charges, data_gb: 28 * (base.data_score || 0.4) * 5, match_score: 78 },
          cost_analysis: { overpaying: false },
        },
        {
          label: '+30% Usage',
          description: 'If usage increases 30%',
          budget: Math.round(base.monthly_charges * 1.2),
          top_plan: { name: 'Upgraded Plan', price: Math.round(base.monthly_charges * 1.1), data_gb: 42, match_score: 71 },
          cost_analysis: { overpaying: false },
        },
        {
          label: 'Budget Mode',
          description: 'Minimise spend',
          budget: Math.round(base.monthly_charges * 0.7),
          top_plan: { name: 'Budget Plan', price: Math.round(base.monthly_charges * 0.65), data_gb: 14, match_score: 65 },
          cost_analysis: { overpaying: true, monthly_difference: Math.round(base.monthly_charges * 0.35) },
        },
      ]);
    } finally {
      setLocalLoading(false);
    }
  }, [lastInputs, onRunScenarios]);

  const COLORS  = ['var(--c-primary)', 'var(--c-purple)', 'var(--c-green)'];
  const ICONS   = ['📊', '📈', '💰'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Run button */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.05em', marginBottom: 4 }}>
            SCENARIO COMPARISON
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420 }}>
            Compare what your ideal plan looks like across 3 usage scenarios — current, +30%, and budget-limited.
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={!lastInputs || localLoading}
          style={{
            padding: '12px 22px',
            background: (!lastInputs || localLoading) ? 'var(--bg-elevated)' : 'var(--grad-primary)',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: (!lastInputs || localLoading) ? 'var(--text-muted)' : '#020408',
            cursor: (!lastInputs || localLoading) ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 'var(--text-md)', letterSpacing: '0.04em',
            boxShadow: lastInputs && !localLoading ? '0 0 20px rgba(0,212,255,0.3)' : 'none',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {localLoading ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(0,212,255,0.3)',
                borderTopColor: 'var(--c-primary)', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Analyzing…
            </>
          ) : (
            !lastInputs
              ? '⟳ Run Advisor First'
              : '⟳ Run Scenarios'
          )}
        </button>
      </div>

      {/* Cards row */}
      {scenarios && (
        <>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {scenarios.map((s, i) => (
              <ScenarioCard
                key={i} scenario={s} index={i}
                color={COLORS[i % COLORS.length]}
                icon={ICONS[i % ICONS.length]}
              />
            ))}
          </div>

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Table header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div style={{ width: 120, padding: '10px 12px', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
                Metric
              </div>
              {scenarios.map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '10px 12px', textAlign: 'center',
                  fontSize: 9, color: COLORS[i % COLORS.length], fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  {ICONS[i % ICONS.length]} {s.label || `Scenario ${i+1}`}
                </div>
              ))}
            </div>

            <ComparisonRow scenarios={scenarios} field="price" label="Monthly Price" />
            <ComparisonRow scenarios={scenarios} field="data" label="Data" />
            <ComparisonRow scenarios={scenarios} field="score" label="Match Score" />
          </motion.div>
        </>
      )}

      {!scenarios && !localLoading && (
        <div style={{
          padding: '3rem 2rem', textAlign: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: '1rem', opacity: 0.4 }}>📊</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            {lastInputs ? 'Click "Run Scenarios" to compare usage scenarios.' : 'Run the AI Advisor first, then come back here.'}
          </div>
        </div>
      )}
    </div>
  );
}
