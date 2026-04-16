/**
 * useHistory — localStorage-based recommendation history tracker.
 * Zero backend dependency. Works offline.
 */
import { useState, useCallback } from 'react';

const KEY     = 'planiq_history_v4';
const MAX_LEN = 30;

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d.slice(0,MAX_LEN))); } catch {} };

export default function useHistory() {
  const [history, setHistory] = useState(load);

  const addEntry = useCallback((result, inputs) => {
    const entry = {
      id:             result.prediction_id || `local_${Date.now()}`,
      ts:             new Date().toISOString(),
      plan_id:        result.best_plan_id || result.recommendation?.plan_id,
      plan_name:      result.top_recommendations?.[0]?.name || result.recommendation?.name,
      confidence:     result.model_confidence || result.recommendation?.confidence,
      monthly_charges:inputs?.monthly_charges,
      data_score:     inputs?.data_score,
      call_score:     inputs?.call_score,
      persona:        result.persona?.name,
      overpaying:     result.cost_analysis?.overpaying || result.recommendation?.overpayment_analysis?.overpaying,
      savings:        result.cost_analysis?.monthly_saving > 0
                        ? result.cost_analysis.monthly_saving
                        : result.cost_analysis?.amount || result.recommendation?.overpayment_analysis?.amount || 0,
    };
    setHistory(prev => {
      const next = [entry, ...prev.filter(e => e.id !== entry.id)].slice(0, MAX_LEN);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => { save([]); setHistory([]); }, []);

  const planFreq = history.reduce((a, e) => { if (e.plan_name) a[e.plan_name]=(a[e.plan_name]||0)+1; return a; }, {});
  const mostCommon = Object.keys(planFreq).length
    ? Object.entries(planFreq).sort((a,b)=>b[1]-a[1])[0][0] : null;

  return { history, addEntry, clearHistory, planFreq, mostCommon };
}
