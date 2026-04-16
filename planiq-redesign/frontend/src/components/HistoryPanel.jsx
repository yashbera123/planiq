export default function HistoryPanel({ history = [], planFreq = {}, mostCommon, onClear }) {
  if (history.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '4rem 2rem',
        background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>◷</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.05em', marginBottom: 8 }}>NO HISTORY YET</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Run the AI Advisor to start building your session history.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Sessions', val: history.length, icon: '◈' },
          { label: 'Most Common', val: mostCommon || '—', icon: '🏆' },
          { label: 'Unique Plans', val: Object.keys(planFreq).length, icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--c-primary)' }}>{s.val}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.05), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.05em' }}>RECENT SESSIONS</div>
          <button onClick={onClear} style={{
            background: 'var(--c-red-dim)', border: '1px solid rgba(255,64,96,0.2)',
            borderRadius: 'var(--radius-sm)', color: 'var(--c-red)',
            cursor: 'pointer', padding: '5px 12px',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            letterSpacing: '0.04em',
          }}>✕ Clear</button>
        </div>

        <div>
          {history.slice(0, 20).map((entry, i) => (
            <div key={entry.pred_id || i} style={{
              padding: '14px 22px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 16,
              background: i % 2 === 0 ? 'transparent' : 'rgba(13,21,37,0.3)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(13,21,37,0.3)'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--c-primary-dim)', border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--c-primary)',
                flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{entry.plan_name || 'Unknown Plan'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {entry.ts ? new Date(entry.ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {entry.persona && ` · ${entry.persona}`}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-primary)', fontWeight: 600 }}>
                  {entry.confidence ? `${entry.confidence}%` : '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>confidence</div>
              </div>

              {entry.monthly_charges && (
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-green)', fontWeight: 600 }}>
                    ₹{entry.monthly_charges}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>spend</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
