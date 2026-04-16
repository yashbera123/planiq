import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDatasetPlans } from '../utils/api.js';

// ── Provider colors ───────────────────────────────────────────────────
const PROVIDER_STYLES = {
  Jio:    { color: '#4d8aff', bg: 'rgba(0,70,255,0.10)',  border: 'rgba(0,70,255,0.25)',    icon: '🔵' },
  Airtel: { color: '#ff6666', bg: 'rgba(255,0,0,0.08)',   border: 'rgba(255,0,0,0.20)',     icon: '🔴' },
  VI:     { color: '#ff9944', bg: 'rgba(255,107,0,0.08)', border: 'rgba(255,107,0,0.20)',   icon: '🟠' },
};

function getProviderStyle(provider) {
  const key = (provider || '').replace(/\s/g, '');
  if (key === 'VodafoneIdea' || key === 'VI' || key === 'Vi') return PROVIDER_STYLES.VI;
  return PROVIDER_STYLES[provider] || PROVIDER_STYLES.Jio;
}

// ── Single plan card ──────────────────────────────────────────────────
function DatasetPlanCard({ plan, index }) {
  const ps = getProviderStyle(plan.operator || plan.provider);
  const dataPerDay = plan.data_per_day || 0;
  const totalData  = plan.data_gb || (dataPerDay * (plan.validity_days || 28));
  const benefits   = plan.benefits || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.5) }}
      style={{
        background: `linear-gradient(160deg, ${ps.bg}, var(--bg-card))`,
        border: `1px solid ${ps.border}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 36px ${ps.bg}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px', borderBottom: `1px solid ${ps.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: ps.color,
              padding: '2px 8px', borderRadius: 999,
              background: ps.bg, border: `1px solid ${ps.border}`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {plan.operator || plan.provider}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {plan.network || '4G'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {plan.validity_days || plan.validity || 28} days validity
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)',
            fontWeight: 700, color: ps.color, lineHeight: 1,
          }}>
            ₹{plan.price}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            ₹{plan.cost_per_gb || (plan.price / Math.max(totalData, 0.1)).toFixed(1)}/GB
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 6 }}>
        {[
          { l: 'Data/Day', v: `${dataPerDay}GB`, icon: '📶' },
          { l: 'Total', v: totalData >= 9999 ? '∞' : `${Math.round(totalData)}GB`, icon: '💾' },
          { l: 'Calls', v: plan.calls || 'Unltd', icon: '📞' },
          { l: 'SMS/Day', v: plan.sms_per_day || '100', icon: '💬' },
        ].map(s => (
          <div key={s.l} style={{
            flex: 1, padding: '7px 4px', textAlign: 'center',
            background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 12, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
              {s.v}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      {benefits.length > 0 && (
        <div style={{ padding: '6px 16px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {benefits.map((b, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: b === 'OTT' ? 'rgba(180,79,255,0.12)' : 'var(--bg-surface)',
              color: b === 'OTT' ? 'var(--c-purple)' : 'var(--text-muted)',
              border: `1px solid ${b === 'OTT' ? 'rgba(180,79,255,0.25)' : 'var(--border)'}`,
            }}>
              {b === 'OTT' ? '🎬 OTT Included' : b === 'Basic' ? '📱 Basic' : b}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Summary stats row ─────────────────────────────────────────────────
function StatsRow({ plans, providers }) {
  const avgPrice = plans.length ? Math.round(plans.reduce((s, p) => s + p.price, 0) / plans.length) : 0;
  const cheapest = plans.length ? Math.min(...plans.map(p => p.price)) : 0;
  const maxData  = plans.length ? Math.max(...plans.map(p => p.data_per_day || 0)) : 0;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {[
        { label: 'Total Plans',  val: plans.length, color: 'var(--c-primary)', icon: '📋' },
        { label: 'Avg Price',    val: `₹${avgPrice}`, color: 'var(--c-purple)', icon: '💰' },
        { label: 'Cheapest',     val: `₹${cheapest}`, color: 'var(--c-green)', icon: '🏷️' },
        { label: 'Max Data/Day', val: `${maxData}GB`, color: 'var(--c-primary)', icon: '📶' },
        { label: 'Providers',    val: providers.length, color: 'var(--c-yellow)', icon: '🏢' },
      ].map(p => (
        <div key={p.label} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          flex: '1 0 120px',
        }}>
          <span style={{ fontSize: 18 }}>{p.icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)', color: p.color }}>
              {p.val}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {p.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function DatasetBrowser() {
  const [allPlans,   setAllPlans]   = useState([]);
  const [providers,  setProviders]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [sortBy,     setSortBy]     = useState('price_asc');
  const [maxPrice,   setMaxPrice]   = useState(1000);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    setLoading(true);
    getDatasetPlans()
      .then(data => {
        setAllPlans(data.plans || []);
        setProviders(data.all_providers || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load dataset. Make sure the Flask backend is running.');
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = [...allPlans];
    if (filter !== 'all') {
      result = result.filter(p =>
        (p.operator || p.provider || '').toLowerCase() === filter.toLowerCase()
      );
    }
    result = result.filter(p => p.price <= maxPrice);

    if (sortBy === 'price_asc')  result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'data_desc')  result.sort((a, b) => (b.data_per_day || 0) - (a.data_per_day || 0));
    if (sortBy === 'value')      result.sort((a, b) => (a.cost_per_gb || 999) - (b.cost_per_gb || 999));

    return result;
  }, [allPlans, filter, sortBy, maxPrice]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{
      padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)',
      background: 'var(--c-red-dim)', border: '1px solid rgba(255,64,96,0.25)',
      color: 'var(--c-red)', fontSize: 'var(--text-sm)',
    }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <StatsRow plans={filtered} providers={providers} />

      {/* Filters bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        {/* Provider filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', ...providers].map(p => {
            const isActive = filter === p;
            const ps = p === 'all' ? null : getProviderStyle(p);
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                style={{
                  background: isActive ? (ps ? ps.bg : 'var(--c-primary-dim)') : 'none',
                  border: `1px solid ${isActive ? (ps ? ps.border : 'rgba(0,212,255,0.25)') : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? (ps ? ps.color : 'var(--c-primary)') : 'var(--text-secondary)',
                  cursor: 'pointer', padding: '6px 14px',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
                  transition: 'all 0.15s',
                }}
              >
                {p === 'all' ? '✦ All' : p}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
            padding: '6px 10px', fontSize: 11, cursor: 'pointer',
          }}
        >
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="data_desc">Data: Most First</option>
          <option value="value">Best ₹/GB Value</option>
        </select>

        {/* Max price slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max:</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: 'var(--c-green)', minWidth: 42,
          }}>₹{maxPrice}</span>
          <input
            type="range" min={99} max={1000} step={10}
            value={maxPrice}
            onChange={e => setMaxPrice(parseInt(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
      </div>

      {/* Count */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
      }}>
        <span>Showing {filtered.length} of {allPlans.length} plans from telecom_plans_full_dataset.json</span>
        <span style={{ color: 'var(--c-green)' }}>● LIVE DATA</span>
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        <AnimatePresence>
          {filtered.map((plan, i) => (
            <DatasetPlanCard key={plan.id || `${plan.provider}_${plan.price}_${i}`} plan={plan} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div style={{
          padding: '3rem', textAlign: 'center', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 40, marginBottom: '1rem', opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>No plans match your filters. Try adjusting the budget or provider.</div>
        </div>
      )}
    </div>
  );
}
