// =============================================
// Main Agent Pipeline - LangGraph.js Implementation
// =============================================

import { StateGraph, END, START } from '@langchain/langgraph';
import { GraphState, GraphStateType } from './types';
import { runSentinelAgent } from './sentinel';
import { runDiagnosticianAgent } from './diagnostician';
import { runOrchestratorAgent } from './orchestrator';
import { runLiaisonAgent } from './liaison';
import { getSupabaseServer } from '../supabase/server';
import type { Machine, SensorReading, Threshold } from '@/types';

// ==========================================
// Node Functions (wrapped for LangGraph)
// ==========================================

async function sentinelNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🔵 [SENTINEL] Starting anomaly detection...');
  return await runSentinelAgent(state);
}

async function diagnosticianNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🟢 [DIAGNOSTICIAN] Starting root cause analysis...');
  return await runDiagnosticianAgent(state);
}

async function orchestratorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🟠 [ORCHESTRATOR] Starting resource planning...');
  return await runOrchestratorAgent(state);
}

async function liaisonNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🟣 [LIAISON] Creating notifications...');
  return await runLiaisonAgent(state);
}

// ==========================================
// Conditional Edge Functions
// ==========================================

function shouldContinueAfterSentinel(state: GraphStateType): 'diagnostician' | 'end' {
  // If anomaly detected, continue to diagnostician
  // Otherwise, end the pipeline
  if (state.anomalyDetected) {
    console.log('📍 Decision: Anomaly detected → Continue to Diagnostician');
    return 'diagnostician';
  }
  console.log('📍 Decision: No anomaly → End pipeline');
  return 'end';
}

function shouldContinueAfterDiagnostician(state: GraphStateType): 'orchestrator' | 'liaison' {
  // If diagnosis confidence is high enough, continue to orchestrator
  // Otherwise, go directly to liaison for human inspection notification
  const confidence = (state.diagnosis as any)?.confidenceLevel || state.diagnosis?.confidence || 0;
  if (confidence >= 70) {
    console.log(`📍 Decision: Confidence ${confidence}% >= 70% → Continue to Orchestrator`);
    return 'orchestrator';
  }
  console.log(`📍 Decision: Confidence ${confidence}% < 70% → Skip to Liaison`);
  return 'liaison';
}

// ==========================================
// Build the Graph
// ==========================================

function buildAgentGraph() {
  const workflow = new StateGraph(GraphState)
    // Add nodes
    .addNode('sentinel', sentinelNode)
    .addNode('diagnostician', diagnosticianNode)
    .addNode('orchestrator', orchestratorNode)
    .addNode('liaison', liaisonNode)

    // Add edges
    .addEdge(START, 'sentinel')

    // Conditional edge after sentinel
    .addConditionalEdges(
      'sentinel',
      shouldContinueAfterSentinel,
      {
        diagnostician: 'diagnostician',
        end: END
      }
    )

    // Conditional edge after diagnostician
    .addConditionalEdges(
      'diagnostician',
      shouldContinueAfterDiagnostician,
      {
        orchestrator: 'orchestrator',
        liaison: 'liaison'
      }
    )

    // Sequential edges for the rest
    .addEdge('orchestrator', 'liaison')
    .addEdge('liaison', END);
  
  return workflow.compile();
}

// ==========================================
// Main Pipeline Execution Function
// ==========================================

export async function runAgentPipeline(
  reading: SensorReading,
  machine: Machine,
  thresholds: Threshold[],
  sessionId: string
): Promise<GraphStateType> {
  console.log('🚀 Starting Agent Pipeline');
  console.log(`   Machine: ${machine.machine_id}`);
  console.log(`   Session: ${sessionId}`);
  
  // Initialize state
  const initialState: GraphStateType = {
    sessionId,
    machineId: machine.machine_id,
    currentReading: reading,
    machine,
    thresholds,
    currentAgent: undefined,
    currentAction: 'Initializing pipeline...',
    progress: 0,
    anomalyDetected: false,
    anomalyDetails: undefined,
    diagnosis: undefined,
    workOrder: undefined,
    safetyApproval: undefined,
    notifications: undefined,
    technicians: undefined,
    parts: undefined,
    agentLogs: [],
    error: undefined
  };
  
  // Build and run the graph
  const app = buildAgentGraph();
  
  try {
    // Stream the execution to see step by step
    const finalState = await app.invoke(initialState);
    
    console.log('✅ Pipeline completed!');
    console.log(`   Anomaly Detected: ${finalState.anomalyDetected}`);
    console.log(`   Total Agent Logs: ${finalState.agentLogs.length}`);
    
    return finalState;
  } catch (error) {
    console.error('❌ Pipeline error:', error);
    
    // Update pipeline session with error
    const supabase = getSupabaseServer();
    await supabase.from('pipeline_sessions').update({
      status: 'FAILED',
      result_summary: { error: String(error) }
    }).eq('id', sessionId);
    
    return {
      ...initialState,
      error: String(error)
    };
  }
}

// ==========================================
// Streaming Pipeline Execution (for real-time updates)
// ==========================================

export async function* streamAgentPipeline(
  reading: SensorReading,
  machine: Machine,
  thresholds: Threshold[],
  sessionId: string
): AsyncGenerator<{
  agent: string;
  action: string;
  progress: number;
  state: Partial<GraphStateType>;
}> {
  console.log('🚀 Starting Streaming Agent Pipeline');
  
  const initialState: GraphStateType = {
    sessionId,
    machineId: machine.machine_id,
    currentReading: reading,
    machine,
    thresholds,
    currentAgent: undefined,
    currentAction: 'Initializing pipeline...',
    progress: 0,
    anomalyDetected: false,
    anomalyDetails: undefined,
    diagnosis: undefined,
    workOrder: undefined,
    safetyApproval: undefined,
    notifications: undefined,
    technicians: undefined,
    parts: undefined,
    agentLogs: [],
    error: undefined
  };
  
  const app = buildAgentGraph();
  
  // Use streamEvents to get real-time updates
  const stream = await app.stream(initialState, {
    streamMode: 'updates'
  });
  
  for await (const event of stream) {
    // Extract the node name and state update
    const nodeName = Object.keys(event)[0];
    const stateUpdate = (event as Record<string, Partial<GraphStateType>>)[nodeName];
    
    yield {
      agent: stateUpdate?.currentAgent || nodeName.toUpperCase(),
      action: stateUpdate?.currentAction || 'Processing...',
      progress: stateUpdate?.progress || 0,
      state: stateUpdate || {}
    };
  }
}

// ==========================================
// Create Pipeline Session
// ==========================================

export async function createPipelineSession(machineId: string, readingId: string): Promise<string> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('pipeline_sessions')
    .insert({
      machine_id: machineId,
      reading_id: readingId,
      status: 'RUNNING',
      current_agent: 'SENTINEL',
      current_action: 'Initializing...',
      progress: 0
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create pipeline session: ${error.message}`);
  }
  
  return data.id;
}

// ==========================================
// Get Pipeline Status
// ==========================================

export async function getPipelineStatus(sessionId: string) {
  const supabase = getSupabaseServer();
  const { data: session } = await supabase
    .from('pipeline_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  const { data: logs } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  return {
    session,
    agentLogs: logs || []
  };
}

