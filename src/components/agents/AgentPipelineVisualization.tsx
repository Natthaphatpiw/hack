'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AGENT_METADATA } from '@/lib/agents/metadata';
import type { AgentName, PipelineSession } from '@/types';
import { 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Circle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';

interface Props {
  sessionId: string | null;
}

const AGENTS_ORDER: AgentName[] = ['SENTINEL', 'DIAGNOSTICIAN', 'ORCHESTRATOR', 'SAFETY', 'LIAISON'];

export function AgentPipelineVisualization({ sessionId }: Props) {
  const [session, setSession] = useState<PipelineSession | null>(null);
  const [completedAgents, setCompletedAgents] = useState<Set<AgentName>>(new Set());
  
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setCompletedAgents(new Set());
      return;
    }
    
    // Initial fetch
    fetchSession();
    
    // Subscribe to session updates
    const subscription = supabase
      .channel(`pipeline-${sessionId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pipeline_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload: { new: Record<string, unknown> }) => {
          setSession(payload.new as unknown as PipelineSession);
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_logs',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: { new: Record<string, unknown> }) => {
          const agentName = payload.new.agent_name as AgentName;
          setCompletedAgents(prev => new Set([...prev, agentName]));
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);
  
  async function fetchSession() {
    if (!sessionId) return;
    
    const { data: sessionData } = await supabase
      .from('pipeline_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionData) {
      setSession(sessionData);
    }
    
    // Fetch completed agents
    const { data: logs } = await supabase
      .from('agent_logs')
      .select('agent_name')
      .eq('session_id', sessionId);
    
    if (logs) {
      setCompletedAgents(new Set(logs.map((l: { agent_name: string }) => l.agent_name as AgentName)));
    }
  }
  
  const getAgentStatus = (agentName: AgentName) => {
    if (completedAgents.has(agentName)) return 'completed';
    if (session?.current_agent === agentName) return 'running';
    
    const currentIndex = AGENTS_ORDER.indexOf(session?.current_agent as AgentName);
    const agentIndex = AGENTS_ORDER.indexOf(agentName);
    
    if (currentIndex >= 0 && agentIndex < currentIndex) return 'completed';
    return 'pending';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'running': return 'bg-amber-500';
      case 'pending': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };
  
  return (
    <div className="glass rounded-2xl p-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Agent Neural Pipeline</h3>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Graph-based Execution Engine
            </p>
          </div>
        </div>
        
        {session && (
          <div className="flex items-center gap-4 bg-slate-800/40 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur-md">
            <Badge 
              variant="outline" 
              className={`text-xs px-3 py-1 border ${
                session.status === 'RUNNING' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                session.status === 'COMPLETED' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                'border-red-500/50 text-red-400 bg-red-500/10'
              }`}
            >
              {session.status === 'RUNNING' && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              {session.status}
            </Badge>
            <span className="text-xs text-slate-400 font-mono border-l border-slate-700 pl-4">
              ID: {session.id.slice(0, 8)}
            </span>
          </div>
        )}
      </div>
      
      {/* Pipeline Progress */}
      {session && (
        <div className="mb-10 relative z-10">
          <div className="flex justify-between text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
            <span>System Progress</span>
            <span className="text-cyan-400">{session.progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
             <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ width: `${session.progress}%` }}
             />
          </div>
        </div>
      )}
      
      {/* Agent Nodes */}
      <div className="flex items-center justify-between relative z-10 px-4">
        {AGENTS_ORDER.map((agentName, index) => {
          const meta = AGENT_METADATA[agentName];
          const status = getAgentStatus(agentName);
          const isCurrentAgent = session?.current_agent === agentName;
          
          return (
            <div key={agentName} className="flex items-center group">
              {/* Agent Node */}
              <div className="flex flex-col items-center relative">
                <div className={`relative transition-all duration-500 ${
                  isCurrentAgent ? 'scale-110' : 'scale-100'
                }`}>
                  {/* Outer ring/Glow for running state */}
                  {status === 'running' && (
                    <>
                       <div className="absolute inset-0 -m-3 rounded-full border border-cyan-500/30 animate-[spin_3s_linear_infinite]" />
                       <div className="absolute inset-0 -m-3 rounded-full border border-transparent border-t-cyan-400 animate-[spin_2s_linear_infinite_reverse]" />
                    </>
                  )}
                  
                  {/* Main node */}
                  <div className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center text-3xl
                    transition-all duration-500 relative border
                    ${status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                      status === 'running' ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]' :
                      'bg-slate-800/50 border-slate-700 shadow-none opacity-60'}
                  `}>
                    <div className={`transition-all duration-300 ${isCurrentAgent ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : status === 'completed' ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {meta.icon}
                    </div>
                    
                    {/* Status indicator badge */}
                    <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900 ${
                      status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' :
                      status === 'running' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' :
                      'bg-slate-700'
                    }`}>
                      {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-white" />}
                      {status === 'running' && <Loader2 className="h-4 w-4 text-white animate-spin" />}
                      {status === 'pending' && <Circle className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </div>
                
                {/* Agent Label */}
                <div className="mt-4 text-center transition-all duration-300">
                    <span className={`block text-xs font-bold uppercase tracking-wider ${
                  status === 'completed' ? 'text-emerald-400' :
                    status === 'running' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]' :
                    'text-slate-600'
                }`}>
                  {meta.label}
                </span>
                    <span className={`block text-[10px] mt-1 font-mono ${
                    status === 'completed' ? 'text-emerald-500/50' :
                    status === 'running' ? 'text-cyan-500/70' :
                    'text-slate-700'
                }`}>
                  {agentName}
                </span>
                </div>
              </div>
              
              {/* Connector Arrow */}
              {index < AGENTS_ORDER.length - 1 && (
                <div className="flex items-center mx-4 relative">
                  <div className={`w-12 h-0.5 transition-all duration-500 relative overflow-hidden ${
                    status === 'completed' ? 'bg-emerald-500/50' :
                    'bg-slate-800'
                  }`}>
                      {status === 'running' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-1/2 animate-[shimmer_1s_infinite]" />
                      )}
                  </div>
                  <ArrowRight className={`h-4 w-4 -ml-2 transition-colors duration-300 ${
                    status === 'completed' ? 'text-emerald-500' :
                    status === 'running' ? 'text-cyan-400' :
                    'text-slate-700'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current Action Display */}
      {session && session.current_action && session.status === 'RUNNING' && (
        <div className="mt-10 relative z-10">
             <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-900/80 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400 rounded-full blur opacity-40 animate-pulse"></div>
                    <Loader2 className="h-5 w-5 text-cyan-400 animate-spin relative z-10" />
                </div>
                <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider mb-0.5">System Activity</span>
                    <span className="text-sm text-cyan-100 font-medium">{session.current_action}</span>
                </div>
          </div>
        </div>
      )}

      {/* Flow Explanation */}
      {session && (
        <div className="mt-8 p-5 bg-slate-900/40 rounded-xl border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group hover:border-slate-600/50 transition-colors">
           <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 opacity-70" />
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Logic Flow Analysis</span>
          </div>
          <div className="space-y-3 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span><span className="text-slate-500">Completed:</span> {Array.from(completedAgents).join(', ') || 'None'}</span>
            </div>

            {session.current_agent && (
              <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                <span><span className="text-slate-500">Processing:</span> <span className="text-cyan-300">{session.current_agent}</span></span>
              </div>
            )}

            {completedAgents.size < AGENTS_ORDER.length && session.status === 'COMPLETED' && (
              <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span><span className="text-slate-500">Skipped:</span> {
                  AGENTS_ORDER.slice(AGENTS_ORDER.indexOf(Array.from(completedAgents)[completedAgents.size - 1] as AgentName) + 1)
                    .filter(agent => !completedAgents.has(agent))
                    .join(', ') || 'None'
                }</span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <span className="text-slate-400 block mb-2 font-sans font-semibold">Decision Logic:</span>
              <div className="text-slate-300 pl-2 border-l-2 border-slate-600 ml-1">
                {completedAgents.has('DIAGNOSTICIAN') && !completedAgents.has('ORCHESTRATOR') ? (
                  <span>🔀 Low Confidence from Diagnostician → Escalate to Liaison (Human Review)</span>
                ) : completedAgents.has('ORCHESTRATOR') && !completedAgents.has('SAFETY') ? (
                  <span>🔀 Orchestrator confidence low / No Resources → Escalate to Liaison (Manual WO)</span>
                ) : completedAgents.size === AGENTS_ORDER.length ? (
                  <span>✅ Standard Protocol: Full Pipeline Execution</span>
                ) : (
                  <span>➡️ Nominal Flow: Sentinel → Diagnostician → Orchestrator → Safety → Liaison</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Result Summary for Completed */}
      {session?.status === 'COMPLETED' && session.result_summary && (
        <div className="mt-6 p-5 bg-emerald-900/20 rounded-xl border border-emerald-500/30 backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-base font-bold text-emerald-400">Execution Complete</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Anomaly Type</span>
              <p className="text-white font-semibold mt-1 text-sm">
                {(session.result_summary as Record<string, unknown>).anomalyDetected ? 
                  String((session.result_summary as Record<string, unknown>).anomalyType) : 'None'}
              </p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Severity Level</span>
              <p className={`font-semibold mt-1 text-sm ${
                (session.result_summary as Record<string, unknown>).severity === 'CRITICAL' ? 'text-red-400 drop-shadow-md' :
                (session.result_summary as Record<string, unknown>).severity === 'HIGH' ? 'text-orange-400' :
                'text-slate-400'
              }`}>
                {String((session.result_summary as Record<string, unknown>).severity || 'N/A')}
              </p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Work Order</span>
              <p className="text-white font-semibold mt-1 text-sm">
                {String((session.result_summary as Record<string, unknown>).workOrder || 'N/A')}
              </p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Safety Check</span>
              <p className={`font-semibold mt-1 text-sm ${
                (session.result_summary as Record<string, unknown>).safetyDecision === 'APPROVED' ? 'text-emerald-400' :
                (session.result_summary as Record<string, unknown>).safetyDecision === 'ESCALATE_HUMAN' ? 'text-amber-400' :
                'text-slate-400'
              }`}>
                {String((session.result_summary as Record<string, unknown>).safetyDecision || 'N/A')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* No Session State */}
      {!session && (
        <div className="mt-12 text-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-30 animate-pulse" />
          <p className="text-base font-medium text-slate-400">Waiting for System Trigger</p>
          <p className="text-xs mt-2 text-slate-500 uppercase tracking-wider">Inject anomaly to initialize pipeline</p>
        </div>
      )}
    </div>
  );
}

