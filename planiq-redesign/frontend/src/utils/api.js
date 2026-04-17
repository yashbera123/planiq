/**
 * PlanIQ API Client v4.0
 * All original exports unchanged. New v4 exports added.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'https://planiq-zuaz.onrender.com';

async function _post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} error: ${res.status}`);
  return res.json();
}
async function _get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path} error: ${res.status}`);
  return res.json();
}

// ── Original (unchanged) ─────────────────────────────────────────────
export const predictPlan = (d) => _post('/predict', d);
export const getPlans = () => _get('/plans');
export const checkHealth = () => _get('/health');
export const getModelInfo = () => _get('/model-info');

export async function submitFeedback({ predictionId, predictedPlan, correctPlan, rating, inputs }) {
  return _post('/feedback', {
    prediction_id: predictionId, predicted_plan: predictedPlan,
    correct_plan: correctPlan, rating, inputs
  });
}

// ── New v4 ───────────────────────────────────────────────────────────
export const getRecommendations = (d) => _post('/recommend', d);
export const getComparison = (d) => _post('/compare', d);
export const getInsights = (d) => _post('/insights', d);
export const getPlanProfiles = () => _get('/plan-profiles');
export const getHistory = (n) => _get(`/history?limit=${n || 20}`);
export const getScenarios = (d) => _post('/scenario', d);
export const getCustomPlan = (d) => _post('/custom-plan', d);
export const getWhyNot = (d) => _post('/why-not', d);
export const detectProvider = (mobile) => _post('/detect-provider', { mobile });
export const getDatasetPlans = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.provider) qs.set('provider', params.provider);
  if (params.max_price) qs.set('max_price', params.max_price);
  if (params.min_data) qs.set('min_data', params.min_data);
  const q = qs.toString();
  return _get(`/dataset-plans${q ? '?' + q : ''}`);
};

// ── Rich mock (used when backend offline) ────────────────────────────
// Mock plans derived from telecom_plans_full_dataset.json (representative per tier)
const PLANS_MOCK = {
  '0': { name: 'Jio ₹149', price: 149, data_gb: 20, calls_min: 0, validity: 20, sms: 100, tag: 'Starter' },
  '1': { name: 'Airtel ₹239', price: 239, data_gb: 42, calls_min: 0, validity: 28, sms: 100, tag: 'Popular' },
  '2': { name: 'VI ₹319', price: 319, data_gb: 56, calls_min: 0, validity: 28, sms: 100, tag: 'Value' },
  '3': { name: 'Jio ₹449', price: 449, data_gb: 84, calls_min: 0, validity: 28, sms: 100, tag: 'Best Value' },
  '4': { name: 'Airtel ₹719', price: 719, data_gb: 126, calls_min: 0, validity: 84, sms: 100, tag: 'Premium' },
  '5': { name: 'VI ₹901', price: 901, data_gb: 252, calls_min: 0, validity: 84, sms: 100, tag: 'Enterprise' },
};

export function getMockRecommendation(inputs) {
  const { data_score = 0.4, call_score = 0.35, value_score = 0.4,
    monthly_charges = 349, num_services = 3, tenure = 18, has_streaming = 1, churn_risk = 0 } = inputs;

  const usage = 0.4 * data_score + 0.3 * call_score + 0.2 * value_score
    + 0.05 * Math.min(monthly_charges / 999, 1) + 0.05 * num_services / 9;

  const pid = usage < 0.167 ? '0' : usage < 0.333 ? '1' : usage < 0.5 ? '2' : usage < 0.667 ? '3' : usage < 0.833 ? '4' : '5';
  const plan = PLANS_MOCK[pid];
  const diff = monthly_charges - plan.price;
  const conf = parseFloat((85 + Math.random() * 12).toFixed(1));

  const allRanked = Object.entries(PLANS_MOCK).map(([id, p]) => {
    const d = Math.abs(parseInt(id) - parseInt(pid));
    const score = d === 0 ? conf : d === 1 ? 45 + Math.random() * 15 : d === 2 ? 20 + Math.random() * 10 : 5 + Math.random() * 5;
    return {
      ...p, plan_id: id, match_score: parseFloat(score.toFixed(1)), recommended: id === pid,
      monthly_savings: monthly_charges - p.price,
      annual_savings: Math.max(0, monthly_charges - p.price) * 12,
      overpaying: monthly_charges - p.price > 100,
      cost_per_gb: parseFloat((p.price / Math.max(p.data_gb, 1)).toFixed(1)),
      real_world: []
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const persona = data_score > 0.7 && has_streaming
    ? { id: 'streamer', name: 'Streaming Enthusiast', icon: '📺', color: '#7C3AED', description: 'Heavy data user prioritising OTT content.' }
    : data_score > 0.6 ? { id: 'data_heavy', name: 'Heavy Data User', icon: '📶', color: '#4F46E5', description: 'Power data consumer.' }
      : call_score > 0.6 ? { id: 'caller', name: 'Power Caller', icon: '📞', color: '#06B6D4', description: 'Call-heavy user.' }
        : monthly_charges < 200 ? { id: 'budget', name: 'Budget User', icon: '💰', color: '#10B981', description: 'Cost-conscious user.' }
          : { id: 'regular', name: 'Regular User', icon: '📱', color: '#8B8BAB', description: 'Balanced usage.' };

  const xai = [
    { feature: 'value_score', label: 'Spend vs Peers', contribution_pct: 34, importance_pct: 33.7, raw_value: value_score },
    { feature: 'call_score', label: 'Call Volume', contribution_pct: 30, importance_pct: 30.6, raw_value: call_score },
    { feature: 'data_score', label: 'Data Usage Intensity', contribution_pct: 16, importance_pct: 16.5, raw_value: data_score },
    { feature: 'monthly_charges', label: 'Monthly Charge', contribution_pct: 10, importance_pct: 10.4, raw_value: monthly_charges },
    { feature: 'num_services', label: 'Active Services', contribution_pct: 6, importance_pct: 5.8, raw_value: num_services },
    { feature: 'tenure', label: 'Tenure (Loyalty)', contribution_pct: 4, importance_pct: 0.4, raw_value: tenure },
  ];

  const top3 = allRanked.slice(0, 3).map((p, i) => ({
    ...p, rank: i + 1,
    reason: ['Your profile closely matches this plan tier.',
      'A strong alternative with better data-per-rupee value.',
      'Consider if your data usage increases.'][i],
    tips: ['Connect to Wi-Fi when available.', 'Stream at 480p to reduce data 50%.', 'Set monthly usage alerts.'],
    persona_fit: ['Excellent', 'Good', 'Fair'][i],
  }));

  const pred_id = `mock_${Date.now()}`;
  return {
    success: true, prediction_id: pred_id,
    top_recommendations: top3, best_plan_id: pid,
    persona, xai: {
      feature_contributions: xai, top_driver: xai[0].label,
      explanation: `'${xai[0].label}' contributed ${xai[0].contribution_pct}% to this prediction.`
    },
    cost_analysis: {
      overpaying: diff > 100, underpaying: diff < -50,
      amount: Math.max(0, Math.round(diff)), annual_savings: Math.max(0, Math.round(diff * 12)),
      gap: Math.max(0, Math.round(-diff)),
      current_spend: monthly_charges, recommended_price: plan.price,
      monthly_saving: Math.round(diff), yearly_saving: Math.round(diff * 12),
      switch_message: diff > 100 ? `You're overspending by ₹${Math.round(diff)}/month. Saving ₹${Math.round(diff * 12)}/year.`
        : diff < -50 ? `Your plan is ₹${Math.round(-diff)}/month cheaper but may not cover usage.`
          : 'Your spend is well-aligned with the recommended plan.',
    },
    all_plans_ranked: allRanked, model_confidence: conf, model_version: '4.0-mock',
    // backward compat fields
    recommendation: {
      plan_id: pid, ...plan, confidence: conf,
      reason: top3[0]?.reason || '', cost_tips: top3[0]?.tips || [],
      top_features: xai.slice(0, 3).map(x => ({ feature: x.feature, importance: x.importance_pct / 100 })),
      overpayment_analysis: {
        overpaying: diff > 100, amount: Math.max(0, Math.round(diff)),
        annual_savings: Math.max(0, Math.round(diff * 12))
      }
    },
    all_plans: allRanked,
    input_summary: { data_score, call_score, value_score, monthly_charges, tenure },
  };
}
