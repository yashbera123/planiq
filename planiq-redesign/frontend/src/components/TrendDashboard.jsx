import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';

// ── Custom tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit, color }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(8,14,26,0.95)', border: `1px solid ${color}44`,
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>Session {label}</div>
      <div style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
        {unit === '₹' ? `₹${payload[0].value}` : `${(payload[0].value * 100).toFixed(0)}%`}
      </div>
    </div>
  );
}

// ── Chart wrapper ─────────────────────────────────────────────────────
function TrendChart({ data, dataKey, color, label, unit, insight }) {
  const hasData = data && data.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        flex: 1,
        minWidth: 220,
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {label}
          </div>
          {insight && (
            <div style={{ fontSize: 11, color, fontWeight: 600 }}>{insight}</div>
          )}
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, boxShadow: `0 0 8px ${color}`,
          marginTop: 3,
        }} />
      </div>

      {/* Chart */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="session" tick={{ fill: '#3E5A7A', fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#3E5A7A', fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad_${dataKey})`}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 12,
        }}>
          Run the advisor 2× to see trends
        </div>
      )}
    </motion.div>
  );
}

// ── Insight generator ─────────────────────────────────────────────────
function calcInsight(arr, key, label, unit) {
  if (arr.length < 2) return null;
  const last = arr[arr.length - 1][key];
  const prev = arr[arr.length - 2][key];
  if (!prev) return null;
  const pct = Math.round(((last - prev) / prev) * 100);
  if (Math.abs(pct) < 3) return `${label} stable`;
  return pct > 0
    ? `↑ ${pct}% increase`
    : `↓ ${Math.abs(pct)}% decrease`;
}

// ── Main component ────────────────────────────────────────────────────
export default function TrendDashboard({ history }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history]
      .reverse()
      .slice(-10)
      .map((e, i) => ({
        session: i + 1,
        data_score: e.data_score ?? 0,
        call_score: e.call_score ?? 0,
        monthly_charges: e.monthly_charges ?? 0,
      }));
  }, [history]);

  const dataInsight  = calcInsight(chartData, 'data_score',       'Data usage', '%');
  const callInsight  = calcInsight(chartData, 'call_score',        'Call usage', '%');
  const spendInsight = calcInsight(chartData, 'monthly_charges',   'Spending',   '₹');

  // Summary box
  const totalSessions = history?.length || 0;
  const avgSpend = totalSessions
    ? Math.round(history.reduce((s, e) => s + (e.monthly_charges || 0), 0) / totalSessions)
    : 0;
  const totalSavings = history?.reduce((s, e) => s + (e.savings || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
      >
        {[
          { label: 'Sessions', val: totalSessions, color: 'var(--c-primary)', icon: '📊' },
          { label: 'Avg Spend', val: `₹${avgSpend}/mo`, color: 'var(--c-purple)', icon: '💳' },
          { label: 'Total Saved', val: `₹${Math.round(totalSavings)}`, color: 'var(--c-green)', icon: '💰' },
        ].map(p => (
          <div key={p.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            flex: '1 0 140px',
          }}>
            <span style={{ fontSize: 22 }}>{p.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-lg)', color: p.color }}>
                {p.val}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {p.label}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <TrendChart
          data={chartData} dataKey="data_score"
          color="var(--c-primary)" label="Data Usage Trend"
          unit="%" insight={dataInsight}
        />
        <TrendChart
          data={chartData} dataKey="call_score"
          color="var(--c-purple)" label="Call Usage Trend"
          unit="%" insight={callInsight}
        />
        <TrendChart
          data={chartData} dataKey="monthly_charges"
          color="var(--c-green)" label="Spending Trend"
          unit="₹" insight={spendInsight}
        />
      </div>

      {/* History timeline */}
      {history && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Recent Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 6).map((e, i) => (
              <div key={e.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                animation: `fadeUp 0.35s ${i * 0.06}s ease both`,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === 0 ? 'var(--c-green)' : 'var(--border-mid)',
                  boxShadow: i === 0 ? '0 0 8px var(--c-green)' : 'none',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {e.plan_name || 'Unknown Plan'}
                  </span>
                  {e.persona && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
                      · {e.persona}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-primary)' }}>
                  ₹{e.monthly_charges || '—'}/mo
                </div>
                {e.savings > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--c-green)', fontWeight: 600 }}>
                    ₹{Math.round(e.savings)} saved
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {e.ts ? new Date(e.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
