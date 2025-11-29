'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import type { AgentLog, ThinkingRound, DecisionPath } from '@/types';
import { AGENT_METADATA } from '@/lib/agents/metadata';
import { 
  Brain, 
  GitBranch, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Scale
} from 'lucide-react';

interface Props {
  sessionId?: string;
}

export function AgentActivityLog({ sessionId }: Props) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('thinking');
  
  useEffect(() => {
    if (sessionId) {
      fetchLogs(sessionId);
    } else {
      fetchRecentLogs();
    }
    
    // Subscribe to new logs
    const subscription = supabase
      .channel('agent-logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_logs' },
        (payload: { new: Record<string, unknown> }) => {
          if (!sessionId || payload.new.session_id === sessionId) {
            const newLog = payload.new as unknown as AgentLog;
            setLogs((prev) => {
              // Check if log already exists
              if (prev.some(l => l.id === newLog.id)) return prev;
              return [...prev, newLog].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);
  
  async function fetchLogs(sid: string) {
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });
    
    if (data) setLogs(data);
  }
  
  async function fetchRecentLogs() {
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setLogs(data.reverse());
  }
  
  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };
  
  return (
    <Card className="glass border-0 border-t border-white/10 shadow-2xl">
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg text-white font-bold tracking-tight">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
               <Brain className="h-5 w-5 text-blue-400" />
            </div>
            Live Agent Intelligence Log
        </CardTitle>
        {sessionId && (
            <Badge variant="outline" className="text-xs font-mono border-slate-600 text-slate-400 bg-slate-900/50">
              SESSION: {sessionId.slice(0, 8)}
          </Badge>
        )}
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-slate-900/30">
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800/50 rounded-xl mx-4">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No Active Intelligence</p>
                <p className="text-sm mt-2 opacity-60">System is monitoring...</p>
              </div>
            ) : (
              logs.map((log) => {
                const meta = AGENT_METADATA[log.agent_name];
                const isExpanded = expandedLog === log.id;
                
                return (
                  <div
                    key={log.id}
                    className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                        isExpanded 
                        ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] bg-slate-800/60' 
                        : 'border-slate-800 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Header */}
                    <div 
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl drop-shadow-lg filter grayscale-[0.2] hover:grayscale-0 transition-all">{meta?.icon}</span>
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${meta?.bgColor} backdrop-blur-md bg-opacity-20 border border-white/10 text-white font-bold shadow-lg`}>
                                {log.agent_name}
                            </Badge>
                            <span className="text-sm text-slate-300 font-medium">{log.action}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-1 font-mono opacity-80">
                            <span className="text-cyan-500/70">Decision:</span> {log.decision}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-slate-500 font-mono">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="h-3 w-3 text-slate-600" />
                            <span className="text-slate-400">{log.duration_ms}ms</span>
                          </div>
                          <div className="mt-0.5 opacity-60">
                            {new Date(log.created_at).toLocaleTimeString('th-TH')}
                          </div>
                        </div>
                        <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-cyan-500/10 rotate-180' : 'bg-white/5'}`}>
                             <ChevronDown className={`h-5 w-5 ${isExpanded ? 'text-cyan-400' : 'text-slate-500'}`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-white/5 bg-black/20">
                        <Tabs defaultValue="thinking" className="w-full">
                          <TabsList className="w-full justify-start rounded-none border-b border-white/5 bg-transparent h-auto p-0">
                            <TabsTrigger
                              value="thinking"
                              className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-cyan-500/5 data-[state=active]:text-cyan-400 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <Brain className="h-4 w-4 mr-2" />
                              Thinking Process
                            </TabsTrigger>
                            <TabsTrigger
                              value="decision"
                              className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-500/5 data-[state=active]:text-purple-400 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <GitBranch className="h-4 w-4 mr-2" />
                              Decision Tree
                            </TabsTrigger>
                            <TabsTrigger
                              value="summary"
                              className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500/5 data-[state=active]:text-emerald-400 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Executive Summary
                            </TabsTrigger>
                          </TabsList>
                          
                          {/* Thinking Rounds Tab */}
                          <TabsContent value="thinking" className="p-6 space-y-4 m-0 animate-in fade-in slide-in-from-top-2 duration-300">
                            <ThinkingRoundsView rounds={log.thinking_rounds || []} />
                          </TabsContent>
                          
                          {/* Decision Path Tab */}
                          <TabsContent value="decision" className="p-6 m-0 animate-in fade-in slide-in-from-top-2 duration-300">
                            <DecisionPathView path={log.decision_path} />
                          </TabsContent>
                          
                          {/* Summary Tab */}
                          <TabsContent value="summary" className="p-6 space-y-6 m-0 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid gap-6">
                              <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-emerald-500" />
                                  Final Output
                                </h4>
                                <p className="text-base text-white font-medium pl-2 border-l-2 border-emerald-500">
                                  {log.decision}
                                </p>
                              </div>
                              
                              {log.confidence && (
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Confidence Metric
                                  </h4>
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                      <div 
                                        className={`h-full shadow-[0_0_10px_currentColor] ${
                                          log.confidence > 80 ? 'bg-emerald-500 text-emerald-500' :
                                          log.confidence > 60 ? 'bg-yellow-500 text-yellow-500' : 'bg-red-500 text-red-500'
                                        }`}
                                        style={{ width: `${log.confidence}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-mono font-bold text-white">
                                      {log.confidence}%
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                                  Logic & Reasoning
                                </h4>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {log.reasoning}
                                </p>
                              </div>
                              
                              {/* Decision Criteria */}
                              {log.agent_name !== 'LIAISON' && (
                                <div className="pt-4 border-t border-white/5">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Scale className="h-4 w-4" />
                                    Execution Criteria
                                  </h4>
                                  <div className="text-xs text-slate-400 font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                                    {log.agent_name === 'SENTINEL' && (
                                      <span>IF anomaly_detected == TRUE THEN trigger_diagnostician ELSE terminate</span>
                                    )}
                                    {log.agent_name === 'DIAGNOSTICIAN' && (
                                      <span>IF confidence &gt;= 50% THEN trigger_orchestrator ELSE escalate_human</span>
                                    )}
                                    {log.agent_name === 'ORCHESTRATOR' && (
                                      <span>IF wo_created == TRUE THEN trigger_safety ELSE escalate_human</span>
                                    )}
                                    {log.agent_name === 'SAFETY' && (
                                      <span>IF safety_check == PASS THEN notify_liaison ELSE reject_action</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {log.next_agent && (
                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Next Step:</span>
                                  <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800">
                                    {log.next_agent === 'END' ? '🏁 COMPLETE' : `${AGENT_METADATA[log.next_agent]?.icon} ${log.next_agent}`}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Thinking Rounds Component
function ThinkingRoundsView({ rounds }: { rounds: ThinkingRound[] }) {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
        No internal thought process data available.
      </div>
    );
  }
  
  return (
    <div className="relative pl-2">
      {/* Timeline line */}
      <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
      
      <div className="space-y-6">
        {rounds.map((round, index) => (
          <div key={index} className="relative flex gap-6 group">
            {/* Timeline dot */}
            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              index === rounds.length - 1 
                ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'bg-slate-800 border-slate-600 text-slate-400 group-hover:border-slate-500'
            }`}>
              {round.round}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                {/* Thought */}
                <div className="mb-4">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 block">Thought Trace</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{round.thought}</p>
                </div>

                {/* Observation */}
                <div className="mb-4">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1 block">Observation Data</span>
                  <div className="text-xs text-slate-400 font-mono bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                    {round.observation}
                  </div>
                </div>

                {/* Conclusion */}
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1 block">Micro-Conclusion</span>
                  <p className="text-sm text-white font-medium border-l-2 border-emerald-500 pl-3">
                    {round.conclusion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Decision Path Component
function DecisionPathView({ path }: { path: DecisionPath | null }) {
  if (!path) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
        No decision path data recorded.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-slate-800/40 border border-purple-500/20 p-4 rounded-xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Brain className="h-4 w-4" />
          <span className="font-bold text-xs uppercase tracking-widest">Core Decision Vector</span>
        </div>
        <p className="text-base font-medium text-white">{path.question}</p>
      </div>
      
      {/* Choices */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evaluated Options</h4>
        {path.choices.map((choice, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl border transition-all ${
              choice.selected 
                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'border-slate-800 bg-slate-900/20 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {choice.selected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-600" />
                )}
                <span className={`font-bold text-base ${choice.selected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {choice.option}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded text-xs">
                <span className="text-slate-500 uppercase font-bold">Score</span>
                <span className={`font-mono font-bold text-sm ${
                  choice.score > 70 ? 'text-emerald-400' :
                  choice.score > 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {choice.score}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 mb-4 border-l border-slate-700 pl-3">{choice.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {choice.pros.length > 0 && (
                <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-2">Pros</span>
                  <ul className="space-y-1">
                    {choice.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-500 mt-0.5">✓</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {choice.cons.length > 0 && (
                <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                  <span className="text-red-400 font-bold uppercase tracking-wider block mb-2">Cons</span>
                  <ul className="space-y-1">
                    {choice.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                         <span className="text-red-500 mt-0.5">×</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {choice.selected && choice.reason && (
              <div className="mt-4 pt-3 border-t border-emerald-500/20">
                <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Selection Rationale</span>
                <p className="text-sm text-emerald-100/80 mt-1 italic">"{choice.reason}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Final Decision */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-white mb-3">
          <Target className="h-5 w-5 text-cyan-400" />
          <span className="font-bold text-sm uppercase tracking-widest">Final Determination</span>
        </div>
        <p className="text-lg font-bold text-white mb-2">{path.finalDecision}</p>
        <p className="text-sm text-slate-400 border-t border-slate-700 pt-2">{path.reasoning}</p>
      </div>
    </div>
  );
}

