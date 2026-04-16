import { useEffect, useState } from 'react';

const STATS = [
  { value: '18M+', label: 'Plans Analyzed' },
  { value: '94.2%', label: 'Match Accuracy' },
  { value: '₹2,800', label: 'Avg. Annual Savings' },
  { value: '3', label: 'Live Operators' },
];

const OPERATORS = ['JIO', 'AIRTEL', 'VI'];

export default function HeroSection({ onGetStarted, onViewCatalog, modelInfo }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      paddingTop: 62,
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Gradient orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '5%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,79,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,160,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Ticker bar */}
      <div style={{
        position: 'absolute', top: 62, left: 0, right: 0,
        background: 'rgba(0,212,255,0.06)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        padding: '6px 0',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', gap: '4rem', whiteSpace: 'nowrap',
          animation: 'ticker 25s linear infinite',
          width: 'max-content',
        }}>
          {[...Array(3)].map((_, ri) =>
            ['JIO 5G — ₹599 Unlimited', 'AIRTEL Elite — ₹699 | Netflix + Disney+', 'VI 3GB/Day — ₹479 | SonyLIV', 'JIO Annual — ₹2999 | 365 Days', 'AIRTEL Smart — ₹155 | 4G Basic', 'VI Work From Home — ₹599'].map((t, i) => (
              <span key={`${ri}-${i}`} style={{
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)', letterSpacing: '0.06em',
              }}>◆ {t}</span>
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        {/* Operator badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }} className="anim-fade-up">
          {OPERATORS.map((op, i) => (
            <span key={op} style={{
              padding: '4px 12px', borderRadius: 999,
              fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
              fontWeight: 600, letterSpacing: '0.08em',
              background: op === 'JIO' ? 'rgba(0,70,255,0.12)' : op === 'AIRTEL' ? 'rgba(255,0,0,0.1)' : 'rgba(255,107,0,0.1)',
              color: op === 'JIO' ? '#4d8aff' : op === 'AIRTEL' ? '#ff6666' : '#ff9944',
              border: `1px solid ${op === 'JIO' ? 'rgba(0,70,255,0.25)' : op === 'AIRTEL' ? 'rgba(255,0,0,0.2)' : 'rgba(255,107,0,0.2)'}`,
              animationDelay: `${i * 0.1}s`,
            }}>{op}</span>
          ))}
          <span style={{
            padding: '4px 12px', borderRadius: 999,
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
            fontWeight: 600, letterSpacing: '0.08em',
            background: 'var(--c-green-dim)', color: 'var(--c-green)',
            border: '1px solid rgba(0,229,160,0.2)',
          }}>REAL PLANS</span>
        </div>

        {/* Hero title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
          letterSpacing: '0.02em',
          lineHeight: 0.95,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
        }} className="anim-fade-up delay-1">
          <span style={{ display: 'block' }}>INTELLIGENT</span>
          <span style={{
            display: 'block',
            background: 'var(--grad-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>TELECOM</span>
          <span style={{ display: 'block' }}>ADVISOR</span>
        </h1>

        <p style={{
          fontSize: 'var(--text-lg)', color: 'var(--text-secondary)',
          maxWidth: 520, lineHeight: 1.7, marginBottom: '2.5rem',
        }} className="anim-fade-up delay-2">
          ML-powered plan recommendations backed by real Jio, Airtel & Vi data.
          Save money, match your usage, and understand exactly why.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '3.5rem' }}
          className="anim-fade-up delay-3">
          <button onClick={onGetStarted} style={{
            background: 'var(--grad-primary)',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: '#020408', cursor: 'pointer',
            padding: '14px 28px',
            fontSize: 'var(--text-md)', fontWeight: 700,
            letterSpacing: '0.03em',
            boxShadow: '0 0 30px rgba(0,212,255,0.4)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(0,212,255,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,255,0.4)'; }}
          >
            ◈ Get AI Recommendations →
          </button>
          <button onClick={onViewCatalog} style={{
            background: 'none',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            padding: '14px 24px',
            fontSize: 'var(--text-md)', fontWeight: 500,
            transition: 'var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ▦ View Plan Catalog
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}
          className="anim-fade-up delay-4">
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: '16px 24px',
              borderRadius: i === 0 ? '12px 0 0 12px' : i === STATS.length - 1 ? '0 12px 12px 0' : 0,
              background: 'rgba(13,21,37,0.6)',
              border: '1px solid var(--border)',
              flex: '0 0 auto',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)',
                fontWeight: 600, color: 'var(--c-primary)',
              }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Model info pill */}
        {modelInfo && (
          <div style={{
            marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(13,21,37,0.7)', border: '1px solid var(--border)',
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }} className="anim-fade-up delay-5">
            <span style={{ color: 'var(--c-green)' }}>◆</span>
            {modelInfo.algorithm} · {(modelInfo.accuracy * 100).toFixed(1)}% accuracy · v{modelInfo.version}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to bottom, transparent, var(--bg-void))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
