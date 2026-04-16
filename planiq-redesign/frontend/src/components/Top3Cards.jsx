import { useState, useEffect, useRef } from 'react';
import { submitFeedback } from '../utils/api.js';

const RANK_CONFIG = [
  {
    bg: 'linear-gradient(135deg, rgba(0,212,255,0.10), rgba(0,128,255,0.06))',
    border: 'rgba(0,212,255,0.35)', glow: 'rgba(0,212,255,0.18)',
    accent: 'var(--c-primary)', crown: '🥇', label: 'BEST MATCH',
  },
  {
    bg: 'linear-gradient(135deg, rgba(180,79,255,0.08), rgba(123,47,190,0.05))',
    border: 'rgba(180,79,255,0.22)', glow: 'rgba(180,79,255,0.08)',
    accent: 'var(--c-purple)', crown: '🥈', label: '2ND PICK',
  },
  {
    bg: 'linear-gradient(135deg, rgba(0,229,160,0.06), rgba(0,180,216,0.04))',
    border: 'rgba(0,229,160,0.18)', glow: 'rgba(0,229,160,0.06)',
    accent: 'var(--c-green)', crown: '🥉', label: '3RD CHOICE',
  },
];

// Animated number counter
function AnimatedNumber({ target, prefix = '', suffix = '', duration = 900 }) {
  const [current, setCurrent] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3); // ease-out cubic
      setCurrent(Math.round(eased * target));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span className="anim-count">{prefix}{current.toLocaleString('en-IN')}{suffix}</span>;
}

function PersonaBadge({ persona }) {
  if (!persona) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 'var(--radius-lg)',
      background: `linear-gradient(135deg, ${persona.color}18, ${persona.color}08)`,
      border: `1px solid ${persona.color}33`,
      marginBottom: 14,
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${persona.color}22`, border: `1px solid ${persona.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{persona.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          Your User Profile
        </div>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: persona.color }}>
          {persona.name}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {persona.description}
        </div>
      </div>
    </div>
  );
}

function SavingsCard({ costAnalysis }) {
  if (!costAnalysis) return null;
  const { overpaying, underpaying, monthly_saving, yearly_saving, current_spend, recommended_price, switch_message } = costAnalysis;
  const saving = monthly_saving || 0;

  if (Math.abs(saving) < 20) return (
    <div style={{
      padding: '14px 18px', borderRadius: 'var(--radius-md)',
      background: 'var(--c-green-dim)', border: '1px solid rgba(0,229,160,0.2)',
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      animation: 'fadeUp 0.4s 0.1s ease both',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'rgba(0,229,160,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>✅</div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--c-green)', fontSize: 'var(--text-sm)' }}>Spending Well Optimized</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{switch_message}</div>
      </div>
    </div>
  );

  const isOver = overpaying && saving > 0;

  return (
    <div style={{
      padding: '18px 20px', borderRadius: 'var(--radius-lg)',
      background: isOver
        ? 'linear-gradient(135deg, rgba(0,229,160,0.10), rgba(0,180,216,0.06))'
        : 'linear-gradient(135deg, rgba(255,140,66,0.10), rgba(255,64,96,0.06))',
      border: `1px solid ${isOver ? 'rgba(0,229,160,0.3)' : 'rgba(255,140,66,0.25)'}`,
      marginBottom: 16,
      position: 'relative', overflow: 'hidden',
      animation: 'scaleIn 0.5s 0.15s ease both',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: isOver ? 'rgba(0,229,160,0.06)' : 'rgba(255,140,66,0.06)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
        <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>
          {isOver ? '💸' : '⚠️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 4,
          }}>
            {isOver ? 'Monthly Overspend Detected' : 'Plan Underpowered'}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            color: isOver ? 'var(--c-green)' : 'var(--c-orange)',
            lineHeight: 1,
          }}>
            {isOver ? (
              <AnimatedNumber target={Math.round(saving)} prefix="₹" suffix="/mo saved" />
            ) : (
              <span>₹{Math.round(-saving)}/mo gap</span>
            )}
          </div>

          {isOver && yearly_saving > 0 && (
            <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              That's{' '}
              <strong style={{ color: 'var(--c-green)' }}>
                <AnimatedNumber target={Math.round(yearly_saving)} prefix="₹" /> saved per year
              </strong>{' '}
              — just by switching
            </div>
          )}

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6 }}>
            {switch_message}
          </div>
        </div>
      </div>

      {/* Current vs Optimal */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <div style={{
          flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
            Current Spend
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--c-red)' }}>
            ₹{current_spend}/mo
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          color: 'var(--text-muted)', fontSize: 16,
        }}>→</div>
        <div style={{
          flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
            Optimal Plan
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--c-green)' }}>
            ₹{recommended_price}/mo
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, rank, accent, bg, border, glow, crown, label, predictionId }) {
  const [feedback, setFeedback] = useState(null);
  const [expanded, setExpanded] = useState(rank === 1);

  const fitColor = {
    Excellent: 'var(--c-green)', Good: 'var(--c-primary)',
    Fair: 'var(--c-yellow)', Poor: 'var(--c-red)',
  }[plan.persona_fit] || 'var(--text-muted)';

  const handleFeedback = async (rating) => {
    setFeedback(rating);
    try { await submitFeedback({ predictionId, predictedPlan: plan.plan_id, rating, inputs: {} }); } catch {}
  };

  const realPlans = plan.real_world || [];

  return (
    <div
      style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: rank === 1 ? `0 0 0 1px ${border}, 0 8px 40px ${glow}, var(--shadow-card)` : 'var(--shadow-card)',
        overflow: 'hidden',
        animation: `fadeUp 0.55s ${(rank - 1) * 0.12}s ease both`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {/* Card header */}
      <div style={{
        padding: '16px 18px 12px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20 }}>{crown}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: accent, letterSpacing: '0.08em' }}>
              {label}
            </span>
            {rank === 1 && (
              <span style={{
                fontSize: 10, background: accent, color: '#020408',
                padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                TOP PICK
              </span>
            )}
            {plan.tag && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(255,214,10,0.12)', color: 'var(--c-yellow)',
                border: '1px solid rgba(255,214,10,0.2)', fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
                {plan.tag}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
            {plan.name}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>
            {plan.validity}d validity · {plan.network || '5G'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: accent, lineHeight: 1 }}>
            ₹{plan.price}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
            /month
          </div>
          <div style={{
            marginTop: 6, padding: '3px 9px', borderRadius: 999,
            background: `${accent}20`, border: `1px solid ${accent}44`,
            fontSize: 11, fontFamily: 'var(--font-mono)', color: accent,
            display: 'inline-block',
          }}>
            {Math.round(plan.match_score)}% match
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 6 }}>
        {[
          { label: 'Data',    val: plan.data_gb >= 9999 ? '∞' : `${plan.data_gb}GB`, icon: '📶' },
          { label: 'Calls',   val: plan.calls_min >= 9999 ? 'Unltd' : plan.calls_min ? `${plan.calls_min}m` : 'Unltd', icon: '📞' },
          { label: '₹/GB',    val: plan.cost_per_gb >= 999 ? '∞' : `₹${plan.cost_per_gb}`, icon: '💰' },
          { label: 'Fit',     val: plan.persona_fit || 'Good', isColor: true, fitColor },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, padding: '7px 6px', textAlign: 'center',
            background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)',
            border: s.isColor ? `1px solid ${fitColor}33` : '1px solid var(--border)',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)',
              color: s.isColor ? s.fitColor : 'var(--text-primary)',
            }}>
              {s.val}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Why this plan */}
      {plan.reason && (
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: 9, color: accent, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
            WHY THIS PLAN
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {plan.reason}
          </div>
        </div>
      )}

      {/* Real-world operator plans */}
      {realPlans.length > 0 && (
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
            Available From
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {realPlans.map(rp => {
              const opClass = rp.operator === 'Jio' ? 'op-jio' : rp.operator === 'Airtel' ? 'op-airtel' : 'op-vi';
              return (
                <div key={rp.id} style={{
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  border: '1px solid',
                }} className={opClass}>
                  {rp.operator} · ₹{rp.price}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips accordion */}
      {plan.tips && plan.tips.length > 0 && (
        <div style={{ borderTop: `1px solid ${border}` }}>
          <button onClick={() => setExpanded(e => !e)} style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px',
            fontSize: 'var(--text-xs)', color: accent, fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}0a`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <span>💡 {expanded ? 'Hide' : 'Show'} Saving Tips</span>
            <span style={{ transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          {expanded && (
            <div style={{ padding: '0 18px 12px', display: 'flex', flexDirection: 'column', gap: 5, animation: 'fadeDown 0.25s ease both' }}>
              {plan.tips.slice(0, 3).map((tip, i) => (
                <div key={i} style={{
                  fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                  padding: '7px 10px', background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)', lineHeight: 1.55,
                  borderLeft: `2px solid ${accent}`,
                }}>
                  {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      <div style={{
        padding: '9px 18px', borderTop: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Was this helpful?</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {feedback ? (
            <span style={{ fontSize: 'var(--text-xs)', color: feedback === 'up' ? 'var(--c-green)' : 'var(--c-accent)', fontWeight: 600 }}>
              {feedback === 'up' ? '✓ Thanks!' : '✗ Noted — we\'ll improve'}
            </span>
          ) : (
            <>
              <button onClick={() => handleFeedback('up')} style={{
                background: 'var(--c-green-dim)', border: '1px solid rgba(0,229,160,0.2)',
                borderRadius: 6, cursor: 'pointer', padding: '4px 10px', fontSize: 14,
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >👍</button>
              <button onClick={() => handleFeedback('down')} style={{
                background: 'var(--c-red-dim)', border: '1px solid rgba(255,64,96,0.2)',
                borderRadius: 6, cursor: 'pointer', padding: '4px 10px', fontSize: 14,
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >👎</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Top3Cards({ result }) {
  if (!result) return null;
  const { top_recommendations = [], persona, cost_analysis, prediction_id } = result;

  return (
    <div className="anim-fade-in">
      <PersonaBadge persona={persona} />
      <SavingsCard costAnalysis={cost_analysis} />

      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.05em' }}>
          TOP RECOMMENDATIONS
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--border-mid), transparent)' }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          AI-RANKED · ML-POWERED
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top_recommendations.slice(0, 3).map((plan, i) => (
          <PlanCard
            key={plan.plan_id || i}
            plan={plan}
            rank={i + 1}
            predictionId={prediction_id}
            {...RANK_CONFIG[i]}
          />
        ))}
      </div>
    </div>
  );
}
