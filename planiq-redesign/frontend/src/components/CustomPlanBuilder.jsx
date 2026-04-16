import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Provider color/style map ──────────────────────────────────────────
const PROVIDER_STYLE = {
  Jio:    { color: '#0066FF', bg: 'rgba(0,102,255,0.10)', border: 'rgba(0,102,255,0.30)', logo: '🔵', gradient: 'linear-gradient(135deg, rgba(0,102,255,0.12), rgba(0,60,180,0.06))' },
  Airtel: { color: '#E8251F', bg: 'rgba(232,37,31,0.10)',  border: 'rgba(232,37,31,0.30)', logo: '🔴', gradient: 'linear-gradient(135deg, rgba(232,37,31,0.12), rgba(180,20,20,0.06))' },
  VI:     { color: '#CD1163', bg: 'rgba(205,17,99,0.10)',  border: 'rgba(205,17,99,0.30)', logo: '🟣', gradient: 'linear-gradient(135deg, rgba(205,17,99,0.12), rgba(140,10,70,0.06))' },
};

// ── Closest match card ────────────────────────────────────────────────
function MatchCard({ plan, label, providerLock }) {
  if (!plan) return null;
  const ps = PROVIDER_STYLE[plan.operator] || PROVIDER_STYLE.Jio;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: ps.gradient,
        border: `1px solid ${ps.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        boxShadow: `0 0 30px ${ps.bg}`,
      }}
    >
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
        padding: '4px 10px', borderRadius: 999,
        background: ps.bg, border: `1px solid ${ps.border}`,
        fontSize: 10, color: ps.color, fontWeight: 700, letterSpacing: '0.07em',
      }}>
        ✦ {label || 'BEST PLAN FROM YOUR PROVIDER'}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.04em' }}>
            {plan.name || plan.plan_name || 'Recommended Plan'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>
            {plan.validity || plan.validity_days || 28}d validity · {plan.network || '5G'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: ps.color, lineHeight: 1 }}>
            ₹{plan.price}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>/month</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { l: 'Data', v: plan.data_gb >= 9999 ? '∞' : `${plan.data_gb ?? plan.data_per_day ?? '—'}GB` },
          { l: 'Calls', v: plan.calls_min >= 9999 ? 'Unltd' : plan.calls ?? 'Unlimited' },
          { l: 'Validity', v: `${plan.validity ?? plan.validity_days ?? 28}d` },
        ].map(s => (
          <div key={s.l} style={{
            flex: 1, padding: '8px 6px', textAlign: 'center',
            background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Operator badge */}
      {plan.operator && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600,
            border: `1px solid ${ps.border}`, color: ps.color, background: ps.bg,
          }}>
            {ps.logo} {plan.operator}
          </span>
          {providerLock && (
            <span style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 10,
              color: 'var(--text-muted)', background: 'var(--bg-surface)',
              border: '1px solid var(--border)', fontStyle: 'italic',
            }}>
              Filtered to your provider
            </span>
          )}
          {plan.benefits?.slice(0, 2).map((b, i) => (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11,
              color: 'var(--text-muted)', background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}>{b}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Provider detected badge ───────────────────────────────────────────
function ProviderBadge({ provider, confidence, message, onClear }) {
  const ps = PROVIDER_STYLE[provider] || PROVIDER_STYLE.Jio;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: ps.gradient,
        border: `1px solid ${ps.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      {/* Animated dot */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: ps.bg, border: `2px solid ${ps.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {ps.logo}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)',
            letterSpacing: '0.04em', color: ps.color,
          }}>
            {provider}
          </span>
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 999,
            background: ps.bg, border: `1px solid ${ps.border}`,
            color: ps.color, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {confidence === 'high' ? '✓ HIGH' : confidence === 'medium' ? '~ MEDIUM' : '? LOW'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClear}
        title="Clear provider lock"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,64,96,0.12)'; e.currentTarget.style.color = 'var(--c-red)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        ✕
      </button>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function CustomPlanBuilder({ onGetCustomPlan }) {
  const [form, setForm] = useState({
    desired_data: 2,
    call_intensity: 0.5,
    budget: 300,
  });
  const [selectedProvider, setSelectedProvider] = useState(null); // 'Jio' | 'Airtel' | 'VI' | null
  const [result, setResult] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [tried, setTried] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const clearProvider = () => {
    setSelectedProvider(null);
    setResult(null);
    setTried(false);
  };

  const handleFind = async () => {
    setLocalLoading(true);
    setTried(true);
    try {
      const payload = {
        ...form,
        ...(selectedProvider ? { operator: selectedProvider } : {}),
      };
      const res = await onGetCustomPlan(payload);
      setResult(res?.closest_plan || res?.plan || null);
    } catch {
      setResult(null);
    } finally {
      setLocalLoading(false);
    }
  };

  const sliders = [
    {
      key: 'desired_data',
      label: 'Desired Data / Day',
      display: `${form.desired_data} GB/day`,
      min: 0.5, max: 5, step: 0.5,
      color: 'var(--c-primary)',
    },
    {
      key: 'call_intensity',
      label: 'Call Usage',
      display: `${Math.round(form.call_intensity * 100)}%`,
      min: 0, max: 1, step: 0.05,
      color: 'var(--c-purple)',
    },
    {
      key: 'budget',
      label: 'Monthly Budget',
      display: `₹${form.budget}`,
      min: 99, max: 999, step: 10,
      color: 'var(--c-green)',
    },
  ];

  const ps = selectedProvider ? (PROVIDER_STYLE[selectedProvider] || PROVIDER_STYLE.Jio) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Form card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 22px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.05em', marginBottom: 4 }}>
          CUSTOM PLAN FINDER
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 20 }}>
          Enter your mobile number to auto-detect your provider, then set your ideal specs.
        </div>

        {/* ── Provider Selector ── */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 10 }}>
            📡 Select Your Service Provider
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['Jio', 'Airtel', 'VI'].map(prov => {
              const style = PROVIDER_STYLE[prov];
              const isSelected = selectedProvider === prov;
              return (
                <motion.button
                  key={prov}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedProvider(isSelected ? null : prov);
                    setResult(null);
                    setTried(false);
                  }}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? style.color : 'var(--border)'}`,
                    background: isSelected ? style.gradient : 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 20px ${style.bg}` : 'none',
                    outline: 'none',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{style.logo}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                    color: isSelected ? style.color : 'var(--text-secondary)',
                  }}>
                    {prov}
                  </span>
                  {isSelected && (
                    <span style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 999,
                      background: style.bg, border: `1px solid ${style.border}`,
                      color: style.color, fontWeight: 700, letterSpacing: '0.05em',
                    }}>
                      ✓ SELECTED
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
          {selectedProvider && (
            <div style={{
              marginTop: 8, padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,214,10,0.06)',
              border: '1px solid rgba(255,214,10,0.15)',
              fontSize: 9, color: 'var(--c-yellow)', lineHeight: 1.5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>ⓘ Showing only <strong>{selectedProvider}</strong> plans matching your specs.</span>
              <button
                onClick={clearProvider}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 12, padding: '0 4px',
                }}
              >✕ Clear</button>
            </div>
          )}
        </div>

        {/* ── Sliders ── */}
        {sliders.map(s => (
          <div key={s.key} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {s.label}
              </label>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: s.color,
                padding: '2px 8px', borderRadius: 999,
                background: `${s.color}15`, border: `1px solid ${s.color}33`,
              }}>
                {s.display}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${((form[s.key] - s.min) / (s.max - s.min)) * 100}%`,
                background: `linear-gradient(to right, ${s.color}40, ${s.color}20)`,
                borderRadius: 999, pointerEvents: 'none', transition: 'width 0.15s',
              }} />
              <input
                type="range"
                min={s.min} max={s.max} step={s.step}
                value={form[s.key]}
                onChange={e => set(s.key, parseFloat(e.target.value))}
                style={{ position: 'relative', zIndex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
              <span>{s.min}</span><span>{s.max}</span>
            </div>
          </div>
        ))}

        <button
          onClick={handleFind}
          disabled={localLoading}
          style={{
            width: '100%', padding: '13px 20px',
            background: localLoading
              ? 'var(--bg-elevated)'
              : selectedProvider
                ? `linear-gradient(135deg, ${ps?.color}, ${ps?.color}CC)`
                : 'var(--grad-primary)',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: localLoading ? 'var(--text-muted)' : '#fff',
            cursor: localLoading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 'var(--text-md)', letterSpacing: '0.04em',
            boxShadow: localLoading ? 'none' : `0 0 24px ${selectedProvider ? ps?.bg : 'rgba(0,212,255,0.35)'}`,
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {localLoading ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Finding Match…
            </>
          ) : selectedProvider
            ? `✦ Find Best ${selectedProvider} Plan`
            : '✦ Find My Plan'}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <MatchCard
            plan={result}
            label={selectedProvider ? `BEST ${selectedProvider.toUpperCase()} PLAN FOR YOU` : 'CLOSEST AVAILABLE PLAN'}
            providerLock={!!selectedProvider}
          />
        )}
        {tried && !result && !localLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '16px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--c-yellow-dim)', border: '1px solid rgba(255,214,10,0.2)',
              fontSize: 'var(--text-sm)', color: 'var(--c-yellow)',
            }}
          >
            ⚠️ No exact match found{selectedProvider ? ` from ${selectedProvider}` : ' in dataset'}. Try adjusting your budget or data requirements.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
