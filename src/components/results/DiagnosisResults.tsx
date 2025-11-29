'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { Activity, Thermometer, Gauge, Zap, AlertTriangle, Clock } from 'lucide-react';
import type { Diagnosis } from '@/types';

interface Props {
  sessionId: string | null;
}

export function DiagnosisResults({ sessionId }: Props) {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchDiagnosis(sessionId);
    } else {
      setDiagnosis(null);
      setLoading(false);
    }

    // Subscribe to diagnosis updates
    const subscription = supabase
      .channel('diagnosis-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'diagnoses', filter: `session_id=eq.${sessionId}` },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new) {
            setDiagnosis(payload.new as unknown as Diagnosis);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  async function fetchDiagnosis(sid: string) {
    const { data } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('session_id', sid)
      .single();

    if (data) setDiagnosis(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing diagnosis...</p>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No Diagnosis Available</p>
        <p className="text-sm mt-2 opacity-60">Run anomaly injection to see diagnosis results</p>
      </div>
    );
  }

  const confidenceColor = diagnosis.confidence > 80 ? 'text-emerald-400' :
                         diagnosis.confidence > 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Diagnosis Summary */}
      <Card className="glass border border-purple-500/20">
        <CardHeader className="bg-purple-500/5 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              Predictive Diagnosis Results
            </CardTitle>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              Session: {sessionId?.slice(0, 8)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Root Cause */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Root Cause Analysis
                </label>
                <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-white font-medium text-lg">{diagnosis.rootCause}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  AI Confidence Level
                </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={confidenceColor}>Confidence: {diagnosis.confidence}%</span>
                    </div>
                    <Progress
                      value={diagnosis.confidence}
                      className="h-2 bg-slate-700"
                    />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Time to Failure Prediction
                </label>
                <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    <span className="text-white font-medium text-lg">{diagnosis.timeToFailure}</span>
                  </div>
                </div>
              </div>

              {(diagnosis as any).failureProbability && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Failure Probability
                  </label>
                  <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <span className={`text-lg font-bold ${(diagnosis as any).failureProbability > 0.7 ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round((diagnosis as any).failureProbability * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Impact */}
          {(diagnosis as any).businessImpactScore && (
            <div className="border-t border-slate-700 pt-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                Business Impact Assessment
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Impact Score</div>
                  <div className={`text-2xl font-bold ${(diagnosis as any).businessImpactScore > 7 ? 'text-red-400' : 'text-amber-400'}`}>
                    {(diagnosis as any).businessImpactScore}/10
                  </div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Estimated Cost Impact</div>
                  <div className="text-lg font-bold text-red-400">
                    ฿{(diagnosis as any).costImpact?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Maintenance Urgency</div>
                  <Badge variant="outline" className={`text-sm ${
                    (diagnosis as any).maintenanceUrgency === 'EMERGENCY' ? 'border-red-500 text-red-400' :
                    (diagnosis as any).maintenanceUrgency === 'URGENT' ? 'border-orange-500 text-orange-400' :
                    'border-blue-500 text-blue-400'
                  }`}>
                    {(diagnosis as any).maintenanceUrgency || 'SCHEDULED'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Evidence */}
          <div className="border-t border-slate-700 pt-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Supporting Evidence & Reasoning
            </label>
            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {diagnosis.reasoning}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
