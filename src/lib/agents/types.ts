// =============================================
// Agent Types for LangGraph.js
// =============================================

import { Annotation } from '@langchain/langgraph';
import type { 
  Machine, 
  SensorReading, 
  Threshold, 
  AnomalyDetails, 
  Diagnosis, 
  WorkOrder, 
  SafetyApproval, 
  Notification, 
  AgentLog,
  Technician,
  Part,
  ThinkingRound,
  DecisionPath,
  AgentName
} from '@/types';

// LangGraph State Annotation
export const GraphState = Annotation.Root({
  // Session info
  sessionId: Annotation<string>(),
  machineId: Annotation<string>(),
  
  // Input data
  currentReading: Annotation<SensorReading>(),
  machine: Annotation<Machine>(),
  thresholds: Annotation<Threshold[]>(),
  
  // Pipeline progress tracking
  currentAgent: Annotation<AgentName | undefined>(),
  currentAction: Annotation<string | undefined>(),
  progress: Annotation<number>(),
  
  // Sentinel output
  anomalyDetected: Annotation<boolean>(),
  anomalyDetails: Annotation<AnomalyDetails | undefined>(),
  
  // Diagnostician output
  diagnosis: Annotation<Diagnosis | undefined>(),
  
  // Orchestrator output
  workOrder: Annotation<WorkOrder | undefined>(),
  
  // Safety output
  safetyApproval: Annotation<SafetyApproval | undefined>(),
  
  // Liaison output
  notifications: Annotation<Notification[] | undefined>(),
  
  // Available resources
  technicians: Annotation<Technician[] | undefined>(),
  parts: Annotation<Part[] | undefined>(),
  
  // Agent logs (accumulated)
  agentLogs: Annotation<AgentLog[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  
  // Error handling
  error: Annotation<string | undefined>(),
});

export type GraphStateType = typeof GraphState.State;

// Helper type for agent function
export type AgentFunction = (state: GraphStateType) => Promise<Partial<GraphStateType>>;

// Agent metadata for display
export const AGENT_METADATA: Record<AgentName, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  SENTINEL: {
    icon: '🔵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    label: 'ตรวจจับ',
    description: 'Anomaly Detection Agent - ตรวจสอบค่า sensor และตรวจจับความผิดปกติ'
  },
  DIAGNOSTICIAN: {
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    label: 'วินิจฉัย',
    description: 'Root Cause Analysis Agent - วิเคราะห์สาเหตุของปัญหา'
  },
  ORCHESTRATOR: {
    icon: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    label: 'วางแผน',
    description: 'Resource Planning Agent - จัดสรรทรัพยากรและวางแผนซ่อมบำรุง'
  },
  SAFETY: {
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    label: 'ตรวจสอบ',
    description: 'Validation Agent - ตรวจสอบความปลอดภัยและ guardrails'
  },
  LIAISON: {
    icon: '🟣',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    label: 'แจ้งเตือน',
    description: 'Communication Agent - สร้างการแจ้งเตือนและสื่อสาร'
  }
};

// Helper to create thinking round
export function createThinkingRound(
  round: number,
  thought: string,
  observation: string,
  conclusion: string
): ThinkingRound {
  return {
    round,
    thought,
    observation,
    conclusion,
    timestamp: new Date().toISOString()
  };
}

// Helper to create decision path
export function createDecisionPath(
  question: string,
  choices: Array<{
    option: string;
    description: string;
    pros: string[];
    cons: string[];
    score: number;
    selected: boolean;
    reason?: string;
  }>,
  finalDecision: string,
  reasoning: string
): DecisionPath {
  return {
    question,
    choices,
    finalDecision,
    reasoning
  };
}

