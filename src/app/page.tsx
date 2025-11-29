'use client';

import { useState } from 'react';
import { FactoryOverview } from '@/components/dashboard/FactoryOverview';
import { AnomalyInjector } from '@/components/controls/AnomalyInjector';
import { AgentActivityLog } from '@/components/agents/AgentActivityLog';
import { AgentPipelineVisualization } from '@/components/agents/AgentPipelineVisualization';
import { DiagnosisResults } from '@/components/results/DiagnosisResults';
import { WorkOrderResults } from '@/components/results/WorkOrderResults';
import { BusinessValueResults } from '@/components/results/BusinessValueResults';
import { BusinessValueSummary } from '@/components/summary/BusinessValueSummary';
import { Factory, Bot, Activity, Cpu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const handleInject = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };
  
  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* Header */}
      <header className="glass border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse-glow">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  RESILIX AI Agent System
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Bot className="h-3 w-3 text-cyan-400" />
                  Predictive Maintenance POC Demo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-200">System Online</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span>LangGraph.js</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Business Value Summary */}
        <section className="mb-8">
          <BusinessValueSummary sessionId={currentSessionId} />
        </section>

        {/* Pipeline Visualization */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
             <Bot className="h-5 w-5 text-cyan-400" />
             <h2 className="text-lg font-semibold text-slate-200">AI Agent Neural Pipeline</h2>
          </div>
          <AgentPipelineVisualization sessionId={currentSessionId} />
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Machine Status */}
          <div className="lg:col-span-2">
            {/* Machine Status */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Activity className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-200">Machine Status Overview</h2>
              </div>
              <FactoryOverview />
            </section>
          </div>

          {/* Right Column - Anomaly Injector */}
          <div className="lg:col-span-1">
             <div className="flex items-center gap-2 mb-4 px-1">
                <Cpu className="h-5 w-5 text-rose-400" />
                <h2 className="text-lg font-semibold text-slate-200">Control Panel</h2>
              </div>
            <AnomalyInjector onInject={handleInject} />
          </div>
        </div>

        {/* Agent Results - Full Width Row */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-6 px-1">
             <Bot className="h-5 w-5 text-emerald-400" />
             <h2 className="text-lg font-semibold text-slate-200">Agent Intelligence Results</h2>
          </div>

          {/* Agent Results Tabs */}
          <div className="glass rounded-xl border border-slate-700/50 p-6">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                  🤖 Agent Logs
                </TabsTrigger>
                <TabsTrigger value="diagnosis" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                  🔍 Diagnosis
                </TabsTrigger>
                <TabsTrigger value="planning" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
                  📋 Work Planning
                </TabsTrigger>
                <TabsTrigger value="business" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                  💰 Business Value
                </TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="mt-6">
          <AgentActivityLog sessionId={currentSessionId || undefined} />
              </TabsContent>

              <TabsContent value="diagnosis" className="mt-6">
                <DiagnosisResults sessionId={currentSessionId} />
              </TabsContent>

              <TabsContent value="planning" className="mt-6">
                <WorkOrderResults sessionId={currentSessionId} />
              </TabsContent>

              <TabsContent value="business" className="mt-6">
                <BusinessValueResults sessionId={currentSessionId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-16 py-8 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-400">RESILIX AI Agent System - Proof of Concept</p>
          <p className="mt-2 text-xs text-slate-600">
            Powered by LangGraph.js • Next.js 14 • Supabase • OpenAI GPT-4
          </p>
        </div>
      </footer>
    </div>
  );
}
