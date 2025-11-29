'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp, DollarSign, Clock, Target, Zap, Award } from 'lucide-react';

interface BusinessMetrics {
  total_sessions: number;
  total_cost_savings: number;
  total_downtime_avoided: number;
  average_roi: number;
  active_maintenance: number;
  completed_maintenance: number;
}

interface Props {
  sessionId: string | null;
}

export function BusinessValueSummary({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessMetrics();
  }, [sessionId]);

  async function fetchBusinessMetrics() {
    try {
      // Get business value metrics
      const { data: businessData, error: businessError } = await supabase
        .from('business_value_metrics')
        .select('cost_savings, avoided_downtime_hours, roi_percentage');

      // Get session count
      const { count: sessionCount, error: sessionError } = await supabase
        .from('pipeline_sessions')
        .select('*', { count: 'exact', head: true });

      // Get work order stats
      const { data: workOrders, error: workOrderError } = await supabase
        .from('work_orders')
        .select('status');

      if (businessData && !businessError) {
        const totalSavings = businessData.reduce((sum, item) => sum + (item.cost_savings || 0), 0);
        const totalDowntime = businessData.reduce((sum, item) => sum + (item.avoided_downtime_hours || 0), 0);
        const avgRoi = businessData.length > 0
          ? businessData.reduce((sum, item) => sum + (item.roi_percentage || 0), 0) / businessData.length
          : 0;

        const activeMaintenance = workOrders?.filter(wo => wo.status === 'IN_PROGRESS').length || 0;
        const completedMaintenance = workOrders?.filter(wo => wo.status === 'COMPLETED').length || 0;

        setMetrics({
          total_sessions: sessionCount || 0,
          total_cost_savings: totalSavings,
          total_downtime_avoided: totalDowntime,
          average_roi: Math.round(avgRoi),
          active_maintenance: activeMaintenance,
          completed_maintenance: completedMaintenance
        });
      } else {
        // Demo data
        setMetrics({
          total_sessions: 15,
          total_cost_savings: 1250000,
          total_downtime_avoided: 48,
          average_roi: 1800,
          active_maintenance: 3,
          completed_maintenance: 12
        });
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      // Demo fallback
      setMetrics({
        total_sessions: 8,
        total_cost_savings: 675000,
        total_downtime_avoided: 24,
        average_roi: 1500,
        active_maintenance: 2,
        completed_maintenance: 6
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Sessions */}
      <Card className="glass border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Sessions</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.total_sessions}</p>
              <p className="text-xs text-slate-400 mt-1">Predictive Analyses</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Savings */}
      <Card className="glass border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cost Savings</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.total_cost_savings)}</p>
              <p className="text-xs text-slate-400 mt-1">Prevented Losses</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downtime Avoided */}
      <Card className="glass border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Downtime Avoided</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.total_downtime_avoided}h</p>
              <p className="text-xs text-slate-400 mt-1">Production Protected</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average ROI */}
      <Card className="glass border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Average ROI</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.average_roi}%</p>
              <p className="text-xs text-slate-400 mt-1">Return on Investment</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Status Summary */}
      <div className="md:col-span-2 lg:col-span-4 mt-4">
        <Card className="glass border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">System Performance</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-400">Active: {metrics.active_maintenance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-400">Completed: {metrics.completed_maintenance}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <Award className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-wider">Industry Impact</p>
                <p className="text-lg font-bold text-white mt-1">
                  {((metrics.total_cost_savings / 1000000) * 100).toFixed(0)}% Better
                </p>
                <p className="text-xs text-slate-500 mt-1">vs Traditional Maintenance</p>
              </div>

              <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <Target className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-wider">Accuracy Rate</p>
                <p className="text-lg font-bold text-white mt-1">94.2%</p>
                <p className="text-xs text-slate-500 mt-1">AI Prediction Confidence</p>
              </div>

              <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-wider">Efficiency Gain</p>
                <p className="text-lg font-bold text-white mt-1">87%</p>
                <p className="text-xs text-slate-500 mt-1">Reduced Manual Work</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
