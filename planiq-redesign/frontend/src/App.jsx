import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import InputPanel from './components/InputPanel.jsx';
import Top3Cards from './components/Top3Cards.jsx';
import XAIPanel from './components/XAIPanel.jsx';
import InsightsPanel from './components/InsightsPanel.jsx';
import PlanComparison from './components/PlanComparison.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import TrendDashboard from './components/TrendDashboard.jsx';
import ValueScoreCard from './components/ValueScoreCard.jsx';
import CustomPlanBuilder from './components/CustomPlanBuilder.jsx';
import ScenarioComparison from './components/ScenarioComparison.jsx';
import GamificationPanel from './components/GamificationPanel.jsx';
import DatasetBrowser from './components/DatasetBrowser.jsx';
import useHistory from './hooks/useHistory.js';
import {
  getModelInfo, getRecommendations, getInsights, getMockRecommendation,
  getScenarios, getCustomPlan,
} from './utils/api.js';

// ── Layout wrapper ──────────────────────────────────────────────────
function Page({ children, maxWidth = 1340 }) {
  return (
    <main style={{
      maxWidth,
      margin: '0 auto',
      padding: '6rem 2rem 5rem',
      minHeight: '100vh',
    }}>
      {children}
    </main>
  );
}

// ── Section header ──────────────────────────────────────────────────
function PageHeader({ title, subtitle, tag }) {
  return (
    <div style={{ marginBottom: '2rem' }} className="anim-fade-up">
      {tag && (
        <span style={{
          display: 'inline-block', marginBottom: 8,
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
          color: 'var(--c-primary)', background: 'var(--c-primary-dim)',
          padding: '3px 10px', borderRadius: 999,
          border: '1px solid rgba(0,212,255,0.2)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{tag}</span>
      )}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-3xl)', letterSpacing: '0.04em',
        marginBottom: 6, color: 'var(--text-primary)',
      }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)', maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Model info bar ──────────────────────────────────────────────────
function ModelBar({ info }) {
  if (!info) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      padding: '10px 16px', marginBottom: '1.75rem',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      background: 'rgba(13,21,37,0.6)',
      fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
    }} className="anim-fade-up delay-1">
      <span style={{ color: 'var(--c-green)' }}>●</span>
      <span><strong style={{ color: 'var(--c-primary)' }}>{info.algorithm}</strong></span>
      <span style={{ color: 'var(--border-mid)' }}>|</span>
      <span>Accuracy: <strong style={{ color: 'var(--c-green)' }}>{(info.accuracy * 100).toFixed(1)}%</strong></span>
      <span style={{ color: 'var(--border-mid)' }}>|</span>
      <span>{info.dataset_rows?.toLocaleString() ?? '—'} training records</span>
      <span style={{ color: 'var(--border-mid)' }}>|</span>
      <span>Feedback: <strong style={{ color: 'var(--text-primary)' }}>{info.feedback_count ?? 0}</strong></span>
      <span style={{ color: 'var(--border-mid)' }}>|</span>
      <span style={{ color: 'var(--c-purple)' }}>v{info.version}</span>
    </div>
  );
}

// ── Build mock insights from recommendation data (offline fallback) ──
function buildMockInsights(result, inputs) {
  const mc = inputs?.monthly_charges || 349;
  const rec = result?.top_recommendations?.[0]?.price || mc;
  const d = mc - rec;
  const eff = Math.max(0, Math.min(100, Math.round(100 - Math.abs(d) / Math.max(mc, 1) * 100)));
  return {
    persona: result?.persona,
    spending_efficiency_score: eff,
    cost_analysis: {
      current_monthly: mc, optimal_monthly: rec,
      monthly_difference: d, annual_difference: d * 12,
      overpaying: d > 100, underpaying: d < -50,
      message: d > 100
        ? `You're overspending by ₹${Math.round(d)}/month.`
        : 'Your spend is well-aligned.',
    },
    savings_trajectory: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      cumulative_savings: Math.max(0, Math.round(d * (i + 1))),
    })),
    xai_summary: { top_3_drivers: [], dominant_factor: result?.xai?.top_driver || 'value_score' },
    persona_advice: [
      'Compare annual plans — they often save 15–20%.',
      'Enable data compression in Chrome to cut data ~30%.',
      'Set per-app data limits on heavy consumers.',
    ],
    operator_picks: {},
    action_items: d > 100
      ? [
        { priority: 'HIGH', action: `Switch to the recommended plan — save ₹${Math.round(d)}/month`, saving: `₹${Math.round(d)}/mo` },
        { priority: 'LOW', action: 'Review your plan every 3 months as usage changes.', saving: 'varies' },
      ]
      : [{ priority: 'LOW', action: 'Your plan and usage are well-optimised. Review in 3 months.', saving: '₹0' }],
  };
}

// ── Empty state for pages requiring a prediction ─────────────────────
function NeedsAnalysis({ onGo }) {
  return (
    <div style={{
      textAlign: 'center', padding: '5rem 2rem',
      background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ fontSize: 52, marginBottom: '1.25rem' }}>◈</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.06em', marginBottom: 10 }}>
        RUN THE ADVISOR FIRST
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', maxWidth: 340, margin: '0 auto 1.5rem' }}>
        Analyze your usage profile to unlock personalized plan comparisons and insights.
      </p>
      <button onClick={onGo} style={{
        background: 'var(--grad-primary)', border: 'none',
        borderRadius: 'var(--radius-md)', color: '#020408',
        cursor: 'pointer', padding: '12px 24px',
        fontSize: 'var(--text-md)', fontWeight: 700, letterSpacing: '0.04em',
        boxShadow: '0 0 24px rgba(0,212,255,0.35)',
        transition: 'var(--transition)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >
        Go to AI Advisor →
      </button>
    </div>
  );
}

// ── Default inputs ───────────────────────────────────────────────────
const DEFAULT_INPUTS = {
  tenure: 18, monthly_charges: 349, total_charges: 6282,
  has_tech_support: 0, has_online_security: 0, has_streaming: 1,
  contract_score: 0, payment_score: 1,
  data_score: 0.55, call_score: 0.40, value_score: 0.50,
  is_senior: 0, num_services: 3, churn_risk: 0,
};

// ═══════════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [loading,       setLoading]       = useState(false);
  const [insightsLoad,  setInsightsLoad]  = useState(false);
  const [result,        setResult]        = useState(null);
  const [insights,      setInsights]      = useState(null);
  const [error,         setError]         = useState(null);
  const [lastInputs,    setLastInputs]    = useState(null);
  const [modelInfo,     setModelInfo]     = useState(null);

  const { history, addEntry, clearHistory, planFreq, mostCommon } = useHistory();

  // Load model info on mount
  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  const handlePredict = useCallback(async (inputs) => {
    setLoading(true);
    setError(null);
    setLastInputs(inputs);
    setInsights(null);
    setResult(null);

    try {
      let data;
      try {
        data = await getRecommendations(inputs);
      } catch {
        data = getMockRecommendation(inputs);
      }

      setResult(data);
      addEntry(data, inputs);
      setActiveSection('optimizer');

      // Fetch insights in background
      setInsightsLoad(true);
      try {
        const ins = await getInsights(inputs);
        setInsights(ins);
      } catch {
        setInsights(buildMockInsights(data, inputs));
      } finally {
        setInsightsLoad(false);
      }

      // Refresh model info
      getModelInfo().then(setModelInfo).catch(() => {});
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [addEntry]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* ─────────── HOME ─────────── */}
      {activeSection === 'home' && (
        <HeroSection
          onGetStarted={() => setActiveSection('optimizer')}
          onViewCatalog={() => setActiveSection('allplans')}
          modelInfo={modelInfo}
        />
      )}

      {/* ─────────── ADVISOR / OPTIMIZER ─────────── */}
      {activeSection === 'optimizer' && (
        <Page>
          <PageHeader
            tag="AI Advisor"
            title="PLAN OPTIMIZER"
            subtitle="Configure your usage profile. The AI returns top-3 ranked plans with full explainability, cost analysis, and real-world operator picks."
          />
          <ModelBar info={modelInfo} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: result ? '390px 1fr' : '1fr',
            gap: '2rem',
            maxWidth: result ? '100%' : 520,
            margin: result ? '0' : '0 auto',
            alignItems: 'start',
          }}>
            {/* ── Left: Input panel ── */}
            <div style={{ position: 'sticky', top: 78 }}>
              <InputPanel onPredict={handlePredict} loading={loading} />

              {error && (
                <div style={{
                  marginTop: '1rem', padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--c-red-dim)',
                  border: '1px solid rgba(255,64,96,0.25)',
                  color: 'var(--c-red)',
                  fontSize: 'var(--text-sm)',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Loading pulse */}
              {loading && (
                <div style={{
                  marginTop: '1rem', padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--c-primary-dim)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid rgba(0,212,255,0.3)',
                    borderTopColor: 'var(--c-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-primary)' }}>
                    AI analyzing your profile…
                  </span>
                </div>
              )}
            </div>

            {/* ── Right: Results dashboard ── */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Top3Cards result={result} />
                <XAIPanel xai={result.xai} />
                {/* Value score panel */}
                {result.all_plans_ranked?.length > 0 && (
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                    boxShadow: 'var(--shadow-card)',
                    animation: 'fadeUp 0.5s 0.35s ease both',
                  }}>
                    <ValueScoreCard plans={result.all_plans_ranked} />
                  </div>
                )}
                <InsightsPanel insights={insights} loading={insightsLoad} />
              </div>
            )}
          </div>

          {/* ── Full-width comparison table ── */}
          {result?.all_plans_ranked && (
            <div style={{ marginTop: '2.5rem' }} className="anim-fade-up delay-5">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.04em' }}>
                  FULL COMPARISON
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ALL TIERS · JIO + AIRTEL + VI
                </span>
              </div>
              <PlanComparison
                plans={result.all_plans_ranked}
                recommendedId={result.best_plan_id}
              />
            </div>
          )}

          {/* ── Initial empty state ── */}
          {!result && !loading && (
            <div style={{
              marginTop: '3rem', textAlign: 'center', padding: '3.5rem 2rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
            }} className="anim-fade-in">
              <div style={{ fontSize: 52, marginBottom: '1rem', opacity: 0.6 }}>◈</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', letterSpacing: '0.06em', marginBottom: 8, color: 'var(--text-secondary)' }}>
                READY TO ANALYZE
              </div>
              <p style={{ maxWidth: 340, margin: '0 auto', lineHeight: 1.65, fontSize: 'var(--text-sm)' }}>
                Configure your usage profile on the left and click{' '}
                <strong style={{ color: 'var(--c-primary)' }}>Analyze My Profile</strong>{' '}
                to receive AI-powered top-3 plan recommendations with full explainability.
              </p>
            </div>
          )}
        </Page>
      )}

      {/* ─────────── COMPARE ─────────── */}
      {activeSection === 'compare' && (
        <Page>
          <PageHeader
            tag="Compare"
            title="PLAN COMPARISON"
            subtitle="All 6 tiers ranked by your ML match score across Jio, Airtel, and Vi."
          />
          {result?.all_plans_ranked ? (
            <PlanComparison
              plans={result.all_plans_ranked}
              recommendedId={result.best_plan_id}
            />
          ) : (
            <NeedsAnalysis onGo={() => setActiveSection('optimizer')} />
          )}
        </Page>
      )}

      {/* ─────────── ANALYTICS ─────────── */}
      {activeSection === 'analytics' && (
        <Page>
          <PageHeader
            tag="Analytics"
            title="USAGE ANALYTICS"
            subtitle="Visual breakdown of your usage signals, behavior patterns, and platform distribution."
          />
          <AnalyticsDashboard inputs={lastInputs || DEFAULT_INPUTS} />
        </Page>
      )}

      {/* ─────────── HISTORY ─────────── */}
      {activeSection === 'history' && (
        <Page>
          <PageHeader
            tag="History"
            title="SESSION HISTORY"
            subtitle="Track all your recommendation sessions and spot usage trends over time."
          />
          <HistoryPanel
            history={history}
            planFreq={planFreq}
            mostCommon={mostCommon}
            onClear={clearHistory}
          />
        </Page>
      )}

      {/* ─────────── ALL PLANS (Dataset) ─────────── */}
      {activeSection === 'allplans' && (
        <Page maxWidth={1400}>
          <PageHeader
            tag="Dataset · telecom_plans_full_dataset.json"
            title="ALL TELECOM PLANS"
            subtitle="Browse all real telecom plans from Jio, Airtel, and VI loaded from the dataset. Filter by provider, budget, and data."
          />
          <DatasetBrowser />
        </Page>
      )}

      {/* ─────────── TRENDS ─────────── */}
      {activeSection === 'trends' && (
        <Page>
          <PageHeader
            tag="Trend Analysis"
            title="USAGE TRENDS"
            subtitle="Visualise how your data, calls, and spending have evolved across sessions."
          />
          <TrendDashboard history={history} />
        </Page>
      )}

      {/* ─────────── BUILDER ─────────── */}
      {activeSection === 'builder' && (
        <Page>
          <PageHeader
            tag="Plan Builder"
            title="CUSTOM PLAN FINDER"
            subtitle="Enter your mobile number to auto-detect your provider, then define your ideal specs to find the best plan."
          />
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <CustomPlanBuilder
              onGetCustomPlan={async (form) => {
                try { return await getCustomPlan(form); }
                catch {
                  // local offline heuristic
                  const budget   = form.budget;
                  const data     = form.desired_data;
                  const operator = form.operator || '';
                  const mockPlans = [
                    { name: 'Jio 2GB/Day', operator: 'Jio', price: 249, data_gb: 56, validity: 28, calls: 'Unlimited', benefits: ['JioTV', 'JioCinema'] },
                    { name: 'Airtel 2GB/Day', operator: 'Airtel', price: 349, data_gb: 56, validity: 28, calls: 'Unlimited', benefits: ['Disney+', 'Wynk'] },
                    { name: 'Vi 1.5GB/Day', operator: 'VI', price: 269, data_gb: 42, validity: 28, calls: 'Unlimited', benefits: ['Binge All Night'] },
                    { name: 'Jio Basic', operator: 'Jio', price: 149, data_gb: 28, validity: 28, calls: 'Unlimited', benefits: ['JioTV'] },
                    { name: 'Airtel Elite', operator: 'Airtel', price: 699, data_gb: 84, validity: 28, calls: 'Unlimited', benefits: ['Netflix Mobile', 'Disney+'] },
                  ];
                  let pool = mockPlans;
                  if (operator) {
                    pool = mockPlans.filter(p => p.operator.toLowerCase() === operator.toLowerCase());
                    if (!pool.length) pool = mockPlans;
                  }
                  const sorted = pool
                    .filter(p => p.price <= budget)
                    .sort((a, b) => Math.abs(a.data_gb / 28 - data) - Math.abs(b.data_gb / 28 - data));
                  return { closest_plan: sorted[0] || pool[0] };
                }
              }}
            />
          </div>
        </Page>
      )}

      {/* ─────────── SCENARIOS ─────────── */}
      {activeSection === 'scenarios' && (
        <Page>
          <PageHeader
            tag="What-If Analysis"
            title="SCENARIO COMPARISON"
            subtitle="See how plan recommendations change across different usage scenarios."
          />
          <ScenarioComparison
            lastInputs={lastInputs}
            onRunScenarios={async (inputs) => {
              try { return await getScenarios(inputs); }
              catch { throw new Error('offline'); }
            }}
          />
        </Page>
      )}

      {/* ─────────── GAMIFICATION ─────────── */}
      {activeSection === 'gamification' && (
        <Page>
          <PageHeader
            tag="Achievements"
            title="YOUR REWARDS"
            subtitle="Track real savings and unlock badges as you optimise your telecom spending."
          />
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <GamificationPanel history={history} />
          </div>
        </Page>
      )}

      {/* ─────────── Footer ─────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22,
            background: 'var(--grad-primary)',
            borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, color: '#020408',
          }}>P</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            PLANIQ v4.0 · GradientBoosting ML · Jio + Airtel + Vi · Explainable AI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-green)', display: 'inline-block', boxShadow: '0 0 6px var(--c-green)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {modelInfo ? `${modelInfo.algorithm} · ${(modelInfo.accuracy * 100).toFixed(1)}% accuracy` : 'AI Ready'}
          </span>
        </div>
      </footer>
    </div>
  );
}
