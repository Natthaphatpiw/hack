'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import type { Machine, SensorReading } from '@/types';
import { Activity, Thermometer, Gauge, Zap } from 'lucide-react';

interface Props {
  machine: Machine;
}

export function MachineStatusCard({ machine }: Props) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  
  useEffect(() => {
    fetchLatestReading();
    
    // Subscribe to new readings
    const subscription = supabase
      .channel(`readings-${machine.machine_id}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'sensor_readings',
          filter: `machine_id=eq.${machine.machine_id}`
        },
        (payload: { new: Record<string, unknown> }) => {
          setLatestReading(payload.new as unknown as SensorReading);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [machine.machine_id]);
  
  async function fetchLatestReading() {
    const { data } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('machine_id', machine.machine_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setLatestReading(data);
  }
  
  const statusConfig = {
    NORMAL: { color: 'bg-emerald-500', variant: 'success' as const, text: 'ปกติ', border: 'border-l-emerald-500', glow: 'shadow-emerald-500/20' },
    WARNING: { color: 'bg-amber-500', variant: 'warning' as const, text: 'เตือน', border: 'border-l-amber-500', glow: 'shadow-amber-500/20' },
    CRITICAL: { color: 'bg-red-500', variant: 'critical' as const, text: 'วิกฤต', border: 'border-l-red-500', glow: 'shadow-red-500/20' },
    MAINTENANCE: { color: 'bg-blue-500', variant: 'default' as const, text: 'ซ่อมบำรุง', border: 'border-l-blue-500', glow: 'shadow-blue-500/20' }
  };
  
  const status = statusConfig[machine.status] || statusConfig.NORMAL;
  
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${status.glow} border-0 border-l-4 ${status.border} glass`}>
      {/* Status indicator pulse for critical */}
      {machine.status === 'CRITICAL' && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-slate-100 tracking-wide">{machine.name}</CardTitle>
            <p className="text-xs text-cyan-400/80 font-mono mt-1 uppercase tracking-widest">{machine.machine_id}</p>
          </div>
          <Badge variant={status.variant} className="text-xs font-bold shadow-sm">
            {status.text}
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">📍 {machine.location}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {latestReading ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-lg backdrop-blur-sm group hover:bg-slate-800/60 transition-colors">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Vib H</p>
                <p className="text-sm font-mono font-semibold text-slate-200">
                  {latestReading.vib_rms_horizontal?.toFixed(2)} <span className="text-[10px] text-slate-500">mm/s</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-lg backdrop-blur-sm group hover:bg-slate-800/60 transition-colors">
              <div className="p-1.5 rounded-md bg-indigo-500/10">
                <Activity className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Vib V</p>
                <p className="text-sm font-mono font-semibold text-slate-200">
                  {latestReading.vib_rms_vertical?.toFixed(2)} <span className="text-[10px] text-slate-500">mm/s</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-lg backdrop-blur-sm group hover:bg-slate-800/60 transition-colors">
               <div className="p-1.5 rounded-md bg-orange-500/10">
                <Thermometer className="h-4 w-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Bearing</p>
                <p className="text-sm font-mono font-semibold text-slate-200">
                  {latestReading.bearing_temp?.toFixed(1)} <span className="text-[10px] text-slate-500">°C</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-lg backdrop-blur-sm group hover:bg-slate-800/60 transition-colors">
               <div className="p-1.5 rounded-md bg-cyan-500/10">
                <Gauge className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Pressure</p>
                <p className="text-sm font-mono font-semibold text-slate-200">
                  {latestReading.pressure?.toFixed(1) || 'N/A'} <span className="text-[10px] text-slate-500">Bar</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700/50 rounded-lg">
            ไม่มีข้อมูล sensor
          </div>
        )}
        
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Zap className="h-3 w-3 text-yellow-400" /> Health Score
            </span>
            <span className={`text-sm font-bold font-mono ${
              machine.health_score > 80 ? 'text-emerald-400' :
              machine.health_score > 60 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {machine.health_score}%
            </span>
          </div>
          <Progress 
            value={machine.health_score} 
            className={`h-1.5 bg-slate-700/50 ${
              machine.health_score > 80 ? '[&>div]:bg-emerald-500 [&>div]:shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
              machine.health_score > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            }`}
          />
        </div>
        
        {/* Criticality Badge */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-700/30">
          <span className="text-xs text-slate-500 font-medium">Criticality</span>
          <Badge variant="outline" className={`text-[10px] border backdrop-blur-sm ${
            machine.criticality === 'CRITICAL' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
            machine.criticality === 'HIGH' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
            'border-slate-600 text-slate-400 bg-slate-500/10'
          }`}>
            {machine.criticality}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

