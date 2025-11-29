'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import type { Machine, AnomalyScenario } from '@/types';
import { Zap, AlertTriangle, Thermometer, Activity, Gauge, Flame, Loader2 } from 'lucide-react';

const ANOMALY_SCENARIOS: AnomalyScenario[] = [
  {
    id: 'bearing_wear',
    name: '🔴 Bearing Wear (Critical) - Demo Case 1',
    description: 'Vibration สูงมาก + Temperature สูง - ROI: 2,300%',
    values: {
      vib_rms_horizontal: 4.5,
      vib_rms_vertical: 3.8,
      vib_peak_accel: 1.2,
      bearing_temp: 88,
      pressure: 8.5,
      status_flag: 'CRITICAL'
    }
  },
  {
    id: 'overheat',
    name: '🟡 Overheating (Warning) - Demo Case 2',
    description: 'Temperature สูงกว่าปกติ - Gradual failure pattern',
    values: {
      vib_rms_horizontal: 0.6,
      vib_rms_vertical: 0.5,
      vib_peak_accel: 0.15,
      bearing_temp: 78,
      pressure: 8.2,
      status_flag: 'WARNING'
    }
  },
  {
    id: 'vibration_spike',
    name: '🟡 Vibration Spike (Warning) - Demo Case 3',
    description: 'Vibration สูงขึ้นกะทันหัน - Sudden anomaly',
    values: {
      vib_rms_horizontal: 3.2,
      vib_rms_vertical: 2.8,
      vib_peak_accel: 0.8,
      bearing_temp: 65,
      pressure: 8.4,
      status_flag: 'WARNING'
    }
  },
  {
    id: 'pressure_critical',
    name: '🔴 Pressure Critical - Demo Case 4',
    description: 'ความดันสูงผิดปกติ - System integrity issue',
    values: {
      vib_rms_horizontal: 0.5,
      vib_rms_vertical: 0.4,
      vib_peak_accel: 0.12,
      bearing_temp: 63,
      pressure: 11.5,
      status_flag: 'CRITICAL'
    }
  },
  {
    id: 'combined_failure',
    name: '🔴 Combined Failure (Critical) - Demo Case 5',
    description: 'หลายปัจจัยผิดปกติพร้อมกัน - Complex diagnosis',
    values: {
      vib_rms_horizontal: 5.2,
      vib_rms_vertical: 4.5,
      vib_peak_accel: 1.5,
      bearing_temp: 92,
      pressure: 11.8,
      status_flag: 'CRITICAL'
    }
  },
  {
    id: 'multi_machine_critical',
    name: '🚨 Multi-Machine Critical - Demo Case 6',
    description: '3 เครื่องพังพร้อมกัน - Resource optimization demo',
    values: {
      vib_rms_horizontal: 4.8,
      vib_rms_vertical: 4.2,
      vib_peak_accel: 1.3,
      bearing_temp: 89,
      pressure: 9.2,
      status_flag: 'CRITICAL'
    }
  },
  {
    id: 'vision_ai_integration',
    name: '🤖 Vision AI + Sensor - Demo Case 7',
    description: 'รวมกล้อง + sensor data - Comprehensive diagnostics',
    values: {
      vib_rms_horizontal: 3.8,
      vib_rms_vertical: 3.2,
      vib_peak_accel: 0.9,
      bearing_temp: 82,
      pressure: 8.8,
      status_flag: 'WARNING'
    }
  },
  {
    id: 'low_confidence_case',
    name: '❓ Low Confidence Scenario - Demo Case 8',
    description: 'ข้อมูลไม่ชัดเจน - แสดง human-in-the-loop',
    values: {
      vib_rms_horizontal: 1.8,
      vib_rms_vertical: 1.5,
      vib_peak_accel: 0.4,
      bearing_temp: 72,
      pressure: 8.1,
      status_flag: 'WARNING'
    }
  }
];

interface Props {
  onInject: (sessionId: string) => void;
}

export function AnomalyInjector({ onInject }: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  useEffect(() => {
    supabase.from('machines').select('*').then(({ data }: { data: Machine[] | null }) => {
      if (data) setMachines(data);
    });
  }, []);
  
  async function injectAnomaly() {
    if (!selectedMachine || !selectedScenario) return;
    
    setIsLoading(true);
    setCurrentStep('กำลัง inject anomaly data...');
    
    try {
      // Step 1: Inject anomaly data
      const injectResponse = await fetch('/api/data/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: selectedMachine,
          scenario: selectedScenario
        })
      });
      
      const { reading } = await injectResponse.json();
      
      if (!reading) {
        throw new Error('Failed to inject data');
      }
      
      setCurrentStep('กำลังเรียก Agent Pipeline...');
      
      // Step 2: Run agent pipeline
      const pipelineResponse = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId: reading.id,
          machineId: selectedMachine
        })
      });
      
      const result = await pipelineResponse.json();
      
      if (result.sessionId) {
        onInject(result.sessionId);
      }
      
      setCurrentStep('');
    } catch (error) {
      console.error('Error:', error);
      setCurrentStep('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }
  
  const selectedScenarioData = ANOMALY_SCENARIOS.find(s => s.id === selectedScenario);
  
  return (
    <Card className="glass border border-rose-500/20 shadow-2xl">
      <CardHeader className="pb-4 border-b border-white/5 bg-rose-500/5">
        <CardTitle className="flex items-center gap-2 text-lg text-white font-bold tracking-tight">
          <div className="p-1.5 rounded bg-rose-500/20 border border-rose-500/30">
            <Zap className="h-5 w-5 text-rose-400" />
          </div>
          System Override Control
        </CardTitle>
        <p className="text-xs text-slate-400 font-mono">
          INJECT ANOMALY TO TRIGGER AGENT RESPONSE
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {/* Machine Selection */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Target System</label>
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:ring-rose-500/50 transition-all">
              <SelectValue placeholder="Select Machine Target..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              {machines.map((m) => (
                <SelectItem key={m.machine_id} value={m.machine_id} className="focus:bg-slate-800 focus:text-white">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${
                      m.criticality === 'CRITICAL' ? 'bg-red-500 text-red-500' :
                      m.criticality === 'HIGH' ? 'bg-orange-500 text-orange-500' : 'bg-emerald-500 text-emerald-500'
                    }`} />
                    {m.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Scenario Selection */}
        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Anomaly Profile</label>
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:ring-rose-500/50 transition-all">
              <SelectValue placeholder="Select Failure Scenario..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              {ANOMALY_SCENARIOS.map((s) => (
                <SelectItem key={s.id} value={s.id} className="focus:bg-slate-800 focus:text-white py-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-slate-500">{s.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Scenario Preview */}
        {selectedScenarioData && (
          <div className="p-4 bg-rose-900/10 rounded-xl space-y-3 border border-rose-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">Injection Parameters</p>
                {selectedScenarioData.values.status_flag === 'CRITICAL' ? (
                    <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 text-[10px] h-5">CRITICAL</Badge>
                ) : (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 text-[10px] h-5">WARNING</Badge>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-black/20">
                <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-blue-400" />
                    <span className="text-slate-400">Vib H</span>
                </div>
                <span className="font-mono font-bold text-white">{selectedScenarioData.values.vib_rms_horizontal}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-black/20">
                <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-indigo-400" />
                    <span className="text-slate-400">Vib V</span>
                </div>
                <span className="font-mono font-bold text-white">{selectedScenarioData.values.vib_rms_vertical}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-black/20">
                <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-orange-400" />
                    <span className="text-slate-400">Temp</span>
                </div>
                <span className="font-mono font-bold text-white">{selectedScenarioData.values.bearing_temp}°C</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-black/20">
                <div className="flex items-center gap-2">
                <Gauge className="h-3 w-3 text-cyan-400" />
                    <span className="text-slate-400">Pres.</span>
                </div>
                <span className="font-mono font-bold text-white">{selectedScenarioData.values.pressure} Bar</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <Button
          onClick={injectAnomaly}
          disabled={!selectedMachine || !selectedScenario || isLoading}
          className="w-full h-12 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] border-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="animate-pulse">{currentStep}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 fill-white" />
              EXECUTE ANOMALY INJECTION
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

