import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'home',          label: 'Home',       icon: '⊡' },
  { id: 'optimizer',     label: 'Advisor',    icon: '◈' },
  { id: 'allplans',      label: 'All Plans',  icon: '📋' },
  { id: 'compare',       label: 'Compare',    icon: '⊞' },
  { id: 'trends',        label: 'Trends',     icon: '📈' },
  { id: 'builder',       label: 'Builder',    icon: '🛠' },
  { id: 'scenarios',     label: 'Scenarios',  icon: '📊' },
  { id: 'gamification',  label: 'Rewards',    icon: '🏆' },
  { id: 'analytics',     label: 'Analytics',  icon: '▦' },
  { id: 'history',       label: 'History',    icon: '◷' },
];

export default function Navbar({ activeSection, setActiveSection }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = (id) => { setActiveSection(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 2rem',
      background: scrolled ? 'rgba(6,11,20,0.92)' : 'rgba(6,11,20,0.5)',
      backdropFilter: 'blur(20px) saturate(1.5)',
      borderBottom: scrolled ? '1px solid rgba(0,212,255,0.1)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1340, margin: '0 auto', height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button onClick={() => nav('home')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--grad-primary)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 18, color: '#020408',
            boxShadow: '0 0 20px rgba(0,212,255,0.4)',
          }}>P</div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            letterSpacing: '0.1em', color: 'var(--text-primary)',
          }}>PLANIQ</span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'var(--c-primary)', background: 'var(--c-primary-dim)',
            padding: '2px 6px', borderRadius: 4,
            border: '1px solid rgba(0,212,255,0.2)',
          }}>v5</span>
        </button>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => nav(item.id)}
                style={{
                  background: active ? 'var(--c-primary-dim)' : 'none',
                  border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                  borderRadius: 'var(--radius-md)',
                  color: active ? 'var(--c-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', padding: '7px 14px',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'var(--transition)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'transparent'; }}}
              >
                <span style={{ fontSize: 11 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 'var(--text-xs)', color: 'var(--c-green)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--c-green)', display: 'inline-block',
            boxShadow: '0 0 8px var(--c-green)',
          }} />
          AI ONLINE
        </div>
      </div>
    </nav>
  );
}
