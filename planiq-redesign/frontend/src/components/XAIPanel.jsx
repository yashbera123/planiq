import { useEffect, useRef, useState } from 'react';

const COLORS = ['var(--c-primary)', 'var(--c-purple)', 'var(--c-green)', 'var(--c-accent)', 'var(--c-yellow)', 'var(--c-orange)'];

function XAIBar({ item, index, color, visible }) {
  const pct = item.contribution_pct || 0;
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transition: `opacity 0.4s ${index * 0.07}s ease, transform 0.4s ${index * 0.07}s ease`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: color, flexShrink: 0,
            boxShadow: `0 0 6px ${color}`,
          }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {item.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            raw: {typeof item.raw_value === 'number' ? item.raw_value.toFixed(2) : item.raw_value}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)',
            fontWeight: 700, color,
            minWidth: 38, textAlign: 'right',
          }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Bar track */}
      <div style={{
        height: 8, borderRadius: 999,
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div
          className="xai-bar-fill"
          style={{
            width: visible ? `${Math.min(pct, 100)}%` : '0%',
            background: `linear-gradient(to right, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
            animationDelay: `${index * 0.07 + 0.1}s`,
            transition: `width 0.9s cubic-bezier(0.34,1.1,0.64,1) ${index * 0.07 + 0.1}s`,
          }}
        />
      </div>
    </div>
  );
}

export default function XAIPanel({ xai }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!xai) return null;
  const { feature_contributions = [], top_driver, explanation } = xai;
  if (feature_contributions.length === 0) return null;

  const top = feature_contributions[0];

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        animation: 'fadeUp 0.5s 0.3s ease both',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(180,79,255,0.07), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)',
            letterSpacing: '0.05em', marginBottom: 2,
          }}>
            EXPLAINABLE AI
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Feature contribution to this recommendation
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 'var(--radius-md)',
          background: 'var(--c-purple-dim)', border: '1px solid rgba(180,79,255,0.2)',
        }}>
          <div style={{ fontSize: 9, color: 'var(--c-purple)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
            Top Driver
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {top_driver || top?.label}
          </div>
        </div>
      </div>

      {/* Explanation callout */}
      {explanation && (
        <div style={{
          margin: '14px 18px 0',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(180,79,255,0.06)',
          border: '1px solid rgba(180,79,255,0.15)',
          fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65,
        }}>
          <span style={{ color: 'var(--c-purple)', fontWeight: 600, marginRight: 4 }}>🔍</span>
          {explanation}
        </div>
      )}

      {/* Bars */}
      <div style={{ padding: '16px 18px' }}>
        {feature_contributions.map((item, i) => (
          <XAIBar
            key={item.feature}
            item={item}
            index={i}
            color={COLORS[i % COLORS.length]}
            visible={visible}
          />
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid var(--border)',
        fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
      }}>
        Based on GradientBoostingClassifier model weights · {feature_contributions.length} features analyzed
      </div>
    </div>
  );
}
