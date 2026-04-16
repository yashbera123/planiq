import { useMemo } from 'react';
import { motion } from 'framer-motion';

// ── Badge definitions ─────────────────────────────────────────────────
const BADGES = [
  {
    id: 'smart_saver',
    icon: '🏆',
    name: 'Smart Saver',
    desc: 'Saved ₹500+ across sessions',
    color: 'var(--c-green)',
    dim: 'var(--c-green-dim)',
    threshold: (savings) => savings >= 500,
  },
  {
    id: 'optimized_user',
    icon: '⚡',
    name: 'Optimized User',
    desc: 'Used AI advisor 5+ times',
    color: 'var(--c-primary)',
    dim: 'var(--c-primary-dim)',
    threshold: (_, sessions) => sessions >= 5,
  },
  {
    id: 'plan_explorer',
    icon: '🔭',
    name: 'Plan Explorer',
    desc: 'Compared multiple providers',
    color: 'var(--c-purple)',
    dim: 'var(--c-purple-dim)',
    threshold: (_, sessions) => sessions >= 2,
  },
  {
    id: 'budget_hero',
    icon: '💰',
    name: 'Budget Hero',
    desc: 'Saved ₹2000+ this year',
    color: 'var(--c-yellow)',
    dim: 'var(--c-yellow-dim)',
    threshold: (savings) => savings >= 2000,
  },
];

// ── Animated counter ──────────────────────────────────────────────────
function Counter({ value, prefix = '', suffix = '' }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
    >
      {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
    </motion.span>
  );
}

// ── Badge card ────────────────────────────────────────────────────────
function BadgeCard({ badge, earned, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: earned
          ? `linear-gradient(135deg, ${badge.dim}, transparent)`
          : 'var(--bg-surface)',
        border: `1px solid ${earned ? badge.color + '44' : 'var(--border)'}`,
        opacity: earned ? 1 : 0.45,
        filter: earned ? 'none' : 'grayscale(1)',
        transition: 'all 0.3s',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: earned ? `${badge.color}22` : 'var(--bg-elevated)',
        border: `1px solid ${earned ? badge.color + '44' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: earned ? `0 0 16px ${badge.color}33` : 'none',
      }}>
        {earned ? badge.icon : '🔒'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: earned ? badge.color : 'var(--text-muted)', marginBottom: 2 }}>
          {badge.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {badge.desc}
        </div>
      </div>
      {earned && (
        <span style={{
          fontSize: 10, color: badge.color,
          padding: '2px 8px', borderRadius: 999,
          background: `${badge.color}18`, border: `1px solid ${badge.color}33`,
          fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
        }}>
          EARNED
        </span>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function GamificationPanel({ history }) {
  const { totalSavings, sessions, earnedBadges, monthSavings } = useMemo(() => {
    if (!history || history.length === 0) return { totalSavings: 0, sessions: 0, earnedBadges: [], monthSavings: 0 };

    const totalSavings = Math.round(history.reduce((s, e) => s + (e.savings || 0), 0));
    const sessions     = history.length;

    // Month savings (last 30 days approx)
    const now = Date.now();
    const monthSavings = Math.round(
      history
        .filter(e => e.ts && (now - new Date(e.ts).getTime()) < 30 * 24 * 60 * 60 * 1000)
        .reduce((s, e) => s + (e.savings || 0), 0)
    );

    const earnedBadges = BADGES.filter(b => b.threshold(totalSavings, sessions)).map(b => b.id);

    return { totalSavings, sessions, earnedBadges, monthSavings };
  }, [history]);

  const hasAnyData = history && history.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Hero savings card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,229,160,0.12), rgba(0,180,216,0.06))',
          border: '1px solid rgba(0,229,160,0.25)',
          borderRadius: 'var(--radius-xl)', padding: '24px 28px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,229,160,0.12)',
        }}
      >
        {/* Background glow circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,229,160,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(0,180,216,0.06)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'var(--c-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            💰 Your Total Savings
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            background: 'linear-gradient(135deg, #00E5A0, #00B4D8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', lineHeight: 1, marginBottom: 8,
          }}>
            <Counter value={totalSavings} prefix="₹" />
          </div>

          {monthSavings > 0 && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
              🎉 <strong style={{ color: 'var(--c-green)' }}>₹{monthSavings} saved</strong> this month by using PlanIQ
            </div>
          )}

          {!hasAnyData && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 16 }}>
              Run the AI Advisor to start tracking your savings.
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Sessions', val: sessions, icon: '📊' },
              { label: 'This Month', val: `₹${monthSavings}`, icon: '📅' },
              { label: 'Badges', val: earnedBadges.length, icon: '🏆' },
            ].map(s => (
              <div key={s.label} style={{
                flex: '1 0 100px', padding: '10px 12px',
                background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,229,160,0.12)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--c-green)' }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Badges section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.04em' }}>
            ACHIEVEMENT BADGES
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--border-mid), transparent)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {earnedBadges.length}/{BADGES.length} EARNED
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BADGES.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={earnedBadges.includes(badge.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Progress to next badge */}
      {hasAnyData && earnedBadges.length < BADGES.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: '14px 18px', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Next Badge Progress
          </div>
          {(() => {
            const nextBadge = BADGES.find(b => !earnedBadges.includes(b.id));
            if (!nextBadge) return null;
            const prog = nextBadge.id === 'smart_saver' ? Math.min((totalSavings / 500) * 100, 100)
              : nextBadge.id === 'budget_hero' ? Math.min((totalSavings / 2000) * 100, 100)
              : nextBadge.id === 'optimized_user' ? Math.min((sessions / 5) * 100, 100)
              : Math.min((sessions / 2) * 100, 100);
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: nextBadge.color, fontWeight: 600 }}>
                    {nextBadge.icon} {nextBadge.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(prog)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prog}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                    style={{ height: '100%', borderRadius: 999, background: nextBadge.color }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>{nextBadge.desc}</div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
