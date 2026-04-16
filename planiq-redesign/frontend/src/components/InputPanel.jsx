import { useState, useMemo } from 'react';
import { getMockRecommendation } from '../utils/api.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function SliderField({ label, icon, value, min, max, step = 1, onChange, formatVal, color = 'var(--c-primary)' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
          <span style={{ fontSize: 14 }}>{icon}</span> {label}
        </label>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color, minWidth: 90, textAlign: 'right' }}>
          {formatVal ? formatVal(value) : value}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0,
          height: 4, borderRadius: 999, transform: 'translateY(-50%)',
          width: `${pct}%`, background: color, pointerEvents: 'none',
          transition: 'width 0.1s',
          boxShadow: `0 0 6px ${color}66`,
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>{formatVal ? formatVal(min) : min}</span>
        <span>{formatVal ? formatVal(max) : max}</span>
      </div>
    </div>
  );
}

function Toggle({ label, icon, checked, onChange, description }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      border: `1px solid ${checked ? 'rgba(0,229,160,0.25)' : 'var(--border)'}`,
      background: checked ? 'rgba(0,229,160,0.06)' : 'var(--bg-surface)',
      marginBottom: 6, transition: 'var(--transition)', cursor: 'pointer',
    }} onClick={() => onChange(!checked)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</div>
          {description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{description}</div>}
        </div>
      </div>
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: checked ? 'var(--c-green)' : 'var(--bg-elevated)',
        position: 'relative', transition: 'var(--transition)',
        border: `1px solid ${checked ? 'var(--c-green)' : 'var(--border-mid)'}`,
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 20 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? '#020408' : 'var(--text-muted)',
          transition: 'var(--transition)',
        }} />
      </div>
    </div>
  );
}

function SelectField({ label, icon, value, options, onChange }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>
        <span>{icon}</span> {label}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '9px 12px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
        background: 'var(--bg-input)', color: 'var(--text-primary)',
        fontSize: 'var(--text-sm)', cursor: 'pointer', outline: 'none',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-mid)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const DEFAULTS = {
  tenure: 18, monthly_charges: 349, total_charges: 6282,
  has_tech_support: 0, has_online_security: 0, has_streaming: 1,
  contract_score: 0, payment_score: 1,
  data_score: 0.55, call_score: 0.40, value_score: 0.50,
  is_senior: 0, num_services: 3, churn_risk: 0,
};

const SECTIONS = [
  { id: 'usage',    label: 'Usage',    icon: '📊' },
  { id: 'plan',     label: 'Plan',     icon: '💳' },
  { id: 'services', label: 'Services', icon: '⚙️' },
];

const PLAN_NAMES = ['Basic', 'Smart 5G', 'Power 5G', 'Ultra 5G', 'Pro Max', 'Business'];
const PLAN_PRICES = [99, 199, 299, 449, 599, 899];
const PERSONA_MAP = {
  streamer:   { label: 'Streaming Enthusiast', icon: '📺', color: '#7C3AED' },
  data_heavy: { label: 'Heavy Data User',       icon: '📶', color: '#4F46E5' },
  caller:     { label: 'Power Caller',           icon: '📞', color: '#06B6D4' },
  budget:     { label: 'Budget User',            icon: '💰', color: '#10B981' },
  enterprise: { label: 'Business User',          icon: '🏢', color: '#F59E0B' },
  regular:    { label: 'Regular User',           icon: '📱', color: '#8B8BAB' },
};

export default function InputPanel({ onPredict, loading }) {
  const [vals, setVals] = useState(DEFAULTS);
  const [tab, setTab] = useState('usage');

  const set  = (k) => (v) => setVals(p => ({ ...p, [k]: v }));
  const setN = (k) => (v) => setVals(p => ({ ...p, [k]: typeof v === 'string' ? parseFloat(v) : v }));

  const handleSubmit = () => {
    onPredict({ ...vals, total_charges: vals.monthly_charges * vals.tenure });
  };

  // Live preview using mock logic
  const livePreview = useMemo(() => {
    try { return getMockRecommendation(vals); } catch { return null; }
  }, [vals]);

  const livePersona = livePreview?.persona;
  const liveTier    = livePreview?.best_plan_id || '2';
  const livePrice   = PLAN_PRICES[parseInt(liveTier)] || 299;
  const liveName    = PLAN_NAMES[parseInt(liveTier)] || 'Power 5G';
  const liveSaving  = vals.monthly_charges - livePrice;

  const personaInfo = livePersona ? (PERSONA_MAP[livePersona.id] || PERSONA_MAP.regular) : PERSONA_MAP.regular;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(180,79,255,0.04))',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.05em', marginBottom: 2 }}>
          USAGE PROFILE
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Configure your usage · AI preview updates live
        </div>
      </div>

      {/* Live persona badge */}
      <div style={{
        margin: '10px 16px 0',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: `${personaInfo.color}14`,
        border: `1px solid ${personaInfo.color}30`,
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.3s ease',
      }}>
        <span style={{ fontSize: 16 }}>{personaInfo.icon}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Live Profile
          </span>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: personaInfo.color }}>
            {personaInfo.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--c-primary)' }}>
            {liveName}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', padding: '10px 16px 0', gap: 4, borderBottom: '1px solid var(--border)' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} style={{
            background: tab === s.id ? 'var(--c-primary-dim)' : 'none',
            border: `1px solid ${tab === s.id ? 'rgba(0,212,255,0.2)' : 'transparent'}`,
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            borderBottom: tab === s.id ? '2px solid var(--c-primary)' : '2px solid transparent',
            color: tab === s.id ? 'var(--c-primary)' : 'var(--text-muted)',
            cursor: 'pointer', padding: '7px 14px',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'var(--transition)',
          }}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {tab === 'usage' && (
          <div>
            <SliderField label="Data Intensity" icon="📶" value={vals.data_score} min={0} max={1} step={0.01}
              formatVal={v => ['Light','Low','Moderate','High','Heavy','Ultra'][Math.min(5, Math.floor(v * 5))] + ` (${Math.round(v * 100)}%)`}
              color="var(--c-primary)" onChange={set('data_score')} />
            <SliderField label="Call Volume" icon="📞" value={vals.call_score} min={0} max={1} step={0.01}
              formatVal={v => ['Minimal','Low','Moderate','High','Heavy','Power'][Math.min(5, Math.floor(v * 5))] + ` (${Math.round(v * 100)}%)`}
              color="var(--c-purple)" onChange={set('call_score')} />
            <SliderField label="Spend vs Peers" icon="💰" value={vals.value_score} min={0} max={1} step={0.01}
              formatVal={v => ['Saver','Below Avg','Average','Above Avg','Premium','Max'][Math.min(5, Math.floor(v * 5))] + ` (${Math.round(v * 100)}%)`}
              color="var(--c-accent)" onChange={set('value_score')} />
            <SliderField label="Current Monthly Spend" icon="₹" value={vals.monthly_charges} min={49} max={999} step={1}
              formatVal={v => `₹${v}/mo`}
              color="var(--c-green)" onChange={set('monthly_charges')} />
          </div>
        )}

        {tab === 'plan' && (
          <div>
            <SliderField label="Account Tenure" icon="📅" value={vals.tenure} min={1} max={72} step={1}
              formatVal={v => `${v} months`}
              color="var(--c-primary)" onChange={set('tenure')} />
            <SelectField label="Contract Type" icon="📄" value={vals.contract_score}
              options={[{ value: 0, label: 'Month-to-Month' }, { value: 1, label: '1 Year Contract' }, { value: 2, label: '2 Year Contract' }]}
              onChange={setN('contract_score')} />
            <SelectField label="Payment Method" icon="💳" value={vals.payment_score}
              options={[{ value: 0, label: 'Electronic Check' }, { value: 1, label: 'Mailed Check' }, { value: 2, label: 'Bank Transfer' }, { value: 3, label: 'Credit Card' }]}
              onChange={setN('payment_score')} />
            <Toggle label="Senior Citizen" icon="👴" checked={vals.is_senior === 1}
              onChange={v => set('is_senior')(v ? 1 : 0)} description="Special senior plans available" />
            <Toggle label="High Churn Risk" icon="⚠️" checked={vals.churn_risk === 1}
              onChange={v => set('churn_risk')(v ? 1 : 0)} description="Affects churn-prevention recommendations" />
          </div>
        )}

        {tab === 'services' && (
          <div>
            <SliderField label="Number of Active Services" icon="🔌" value={vals.num_services} min={0} max={9} step={1}
              formatVal={v => `${v} service${v !== 1 ? 's' : ''}`}
              color="var(--c-purple)" onChange={set('num_services')} />
            <Toggle label="Streaming Services" icon="📺" checked={vals.has_streaming === 1}
              onChange={v => set('has_streaming')(v ? 1 : 0)} description="OTT, music, video platforms" />
            <Toggle label="Tech Support add-on" icon="🛠️" checked={vals.has_tech_support === 1}
              onChange={v => set('has_tech_support')(v ? 1 : 0)} description="Premium 24/7 support" />
            <Toggle label="Online Security bundle" icon="🔒" checked={vals.has_online_security === 1}
              onChange={v => set('has_online_security')(v ? 1 : 0)} description="VPN + security suite" />
          </div>
        )}

        {/* Live summary row */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 14, padding: 12,
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          {[
            { label: 'Data',     val: Math.round(vals.data_score * 100) + '%',   color: 'var(--c-primary)' },
            { label: 'Calls',    val: Math.round(vals.call_score * 100) + '%',   color: 'var(--c-purple)' },
            { label: 'Spend',    val: '₹' + vals.monthly_charges,                color: 'var(--c-green)' },
            { label: 'Services', val: vals.num_services,                          color: 'var(--c-accent)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: s.color }}>
                {s.val}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Live savings preview */}
        {Math.abs(liveSaving) > 20 && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: liveSaving > 0 ? 'var(--c-green-dim)' : 'rgba(255,140,66,0.1)',
            border: `1px solid ${liveSaving > 0 ? 'rgba(0,229,160,0.2)' : 'rgba(255,140,66,0.2)'}`,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.3s ease both',
          }}>
            <span style={{ fontSize: 16 }}>{liveSaving > 0 ? '💡' : '⚠️'}</span>
            <div style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {liveSaving > 0
                ? <>Estimated saving: <strong style={{ color: 'var(--c-green)' }}>₹{Math.round(liveSaving)}/mo</strong> by switching to {liveName}</>
                : <>Your current spend is <strong style={{ color: 'var(--c-orange)' }}>₹{Math.round(-liveSaving)}/mo below</strong> the recommended plan</>
              }
            </div>
          </div>
        )}

        {/* Analyze CTA */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', marginTop: 14,
          background: loading ? 'var(--bg-elevated)' : 'var(--grad-primary)',
          border: 'none', borderRadius: 'var(--radius-md)',
          color: loading ? 'var(--text-muted)' : '#020408',
          cursor: loading ? 'not-allowed' : 'pointer',
          padding: '14px 20px',
          fontSize: 'var(--text-md)', fontWeight: 700, letterSpacing: '0.04em',
          boxShadow: loading ? 'none' : '0 0 24px rgba(0,212,255,0.35)',
          transition: 'var(--transition)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,212,255,0.5)'; }}}
        onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.35)'; }}}
        >
          {loading ? (
            <>
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid var(--text-muted)', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
              ANALYZING PROFILE…
            </>
          ) : '◈ ANALYZE MY PROFILE'}
        </button>
      </div>
    </div>
  );
}
