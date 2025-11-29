'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { Wrench, User, Calendar, Clock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import type { WorkOrder } from '@/types';

interface Props {
  sessionId: string | null;
}

export function WorkOrderResults({ sessionId }: Props) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('WorkOrderResults: sessionId =', sessionId);

    if (sessionId) {
      fetchWorkOrder(sessionId);
    } else {
      setWorkOrder(null);
      setLoading(false);
    }

    // Subscribe to work order updates
    const subscription = supabase
      .channel('workorder-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders', filter: sessionId ? `session_id=eq.${sessionId}` : undefined },
        (payload: { new: Record<string, unknown> }) => {
          console.log('WorkOrderResults: received update', payload.new);
          if (payload.new) {
            setWorkOrder(payload.new as unknown as WorkOrder);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  async function fetchWorkOrder(sid: string) {
    console.log('WorkOrderResults: fetching work order for session', sid);
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('session_id', sid)
      .single();

    console.log('WorkOrderResults: fetch result', { data, error });

    if (data) {
      setWorkOrder(data);
    }
    setLoading(false);

    if (data) setWorkOrder(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Planning maintenance schedule...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No Work Order Available</p>
        <p className="text-sm mt-2 opacity-60">Diagnosis must be completed first</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      case 'IN_PROGRESS': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
      case 'APPROVED': return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      case 'PENDING': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      default: return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Order Header */}
      <Card className="glass border border-emerald-500/20">
        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Wrench className="h-5 w-5 text-emerald-400" />
              </div>
              Maintenance Work Order
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                SCHEDULED
              </Badge>
              <Badge variant="outline" className="border-slate-500/50 text-slate-400">
                {workOrder.woNumber}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Work Order Title
                </label>
                <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-white font-medium">{workOrder.title}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Maintenance Type
                </label>
                  <div className="mt-2">
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10">
                      PREDICTIVE
                    </Badge>
                  </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Priority Level
                </label>
                <div className="mt-2">
                  <Badge variant="outline" className={`text-sm ${
                    workOrder.priority === 'URGENT' ? 'border-red-500 text-red-400 bg-red-500/10' :
                    workOrder.priority === 'HIGH' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                    workOrder.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' :
                    'border-blue-500 text-blue-400 bg-blue-500/10'
                  }`}>
                    {workOrder.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Technician
                </label>
                <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">{workOrder.assignedTechnician}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Cost
                </label>
                <div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-white font-medium text-lg">฿{workOrder.estimatedCost?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="border-t border-slate-700 pt-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Maintenance Schedule
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Scheduled Start</span>
                </div>
                <p className="text-white font-medium">
                  {new Date(workOrder.scheduledStart).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Scheduled End</span>
                </div>
                <p className="text-white font-medium">
                  {new Date(workOrder.scheduledEnd).toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          </div>

          {/* Parts Required */}
          {workOrder.partsNeeded && workOrder.partsNeeded.length > 0 && (
            <div className="border-t border-slate-700 pt-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                Required Parts & Materials
              </label>
              <div className="space-y-3">
                {workOrder.partsNeeded.map((part, index) => (
                  <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{part.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{part.partNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">Qty: {part.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Description */}
          <div className="border-t border-slate-700 pt-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Work Description & Instructions
            </label>
            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {workOrder.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
