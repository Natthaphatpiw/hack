// =============================================
// RESILIX POC - Type Definitions
// =============================================

// Machine Types
export interface Machine {
  id: string;
  machine_id: string;
  name: string;
  type: 'BOILER_PUMP' | 'COMPRESSOR' | 'MOTOR';
  location: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  health_score: number;
  created_at: string;
  updated_at: string;
}

// Sensor Reading Types
export interface SensorReading {
  id: string;
  machine_id: string;
  timestamp: string;
  status_flag: 'NORMAL' | 'WARNING' | 'CRITICAL';
  vib_rms_horizontal: number;
  vib_rms_vertical: number;
  vib_peak_accel: number;
  bearing_temp: number;
  motor_temp?: number;
  pressure: number | null;
  current_amp?: number;
  created_at: string;
}

// Threshold Types
export interface Threshold {
  id: string;
  machine_type: string;
  metric: string;
  warning_low: number | null;
  warning_high: number | null;
  critical_low: number | null;
  critical_high: number | null;
  unit: string;
}

// Technician Types
export interface Technician {
  id: string;
  name: string;
  skill_level: number;
  specializations: string[];
  is_available: boolean;
  current_shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
}

// Parts Inventory Types
export interface Part {
  id: string;
  part_number: string;
  name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  reorder_point: number;
}

// Agent State Types
export type AgentName = 'SENTINEL' | 'DIAGNOSTICIAN' | 'ORCHESTRATOR' | 'SAFETY' | 'LIAISON';

// Thinking Round - Each step of agent's reasoning
export interface ThinkingRound {
  round: number;
  thought: string;
  observation: string;
  conclusion: string;
  timestamp: string;
}

// Decision Path - Shows what choices were considered
export interface DecisionChoice {
  option: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
  selected: boolean;
  reason?: string;
}

export interface DecisionPath {
  question: string;
  choices: DecisionChoice[];
  finalDecision: string;
  reasoning: string;
}

// Anomaly Details
export interface AnomalyMetric {
  metric: string;
  value: number;
  threshold: number;
  severity: 'WARNING' | 'CRITICAL';
  deviation: string;
}

export interface AnomalyDetails {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metrics: AnomalyMetric[];
  reasoning: string;
}

// Diagnosis
export interface Diagnosis {
  rootCause: string;
  confidence: number;
  supportingEvidence: string[];
  recommendedAction: string;
  timeToFailure: string;
  reasoning: string;
}

// Work Order
export interface WorkOrder {
  woNumber: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTechnician: string;
  scheduledStart: string;
  scheduledEnd: string;
  partsNeeded: { partNumber: string; name: string; quantity: number }[];
  estimatedCost: number;
  reasoning: string;
}

// Safety Approval
export interface SafetyCheck {
  check: string;
  passed: boolean;
  note?: string;
}

export interface SafetyApproval {
  approved: boolean;
  decision: 'APPROVED' | 'BLOCKED' | 'ESCALATE_HUMAN';
  checks: SafetyCheck[];
  reasoning: string;
  requiresHumanApproval: boolean;
}

// Notification
export interface Notification {
  recipientType: 'PLANT_MANAGER' | 'TECHNICIAN' | 'MAINTENANCE_HEAD';
  recipientName: string;
  channel: 'LINE' | 'EMAIL' | 'DASHBOARD';
  messageType: 'ALERT' | 'WORK_ORDER' | 'STATUS_UPDATE';
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// Agent Log - Enhanced with detailed reasoning
export interface AgentLog {
  id: string;
  session_id: string;
  agent_name: AgentName;
  machine_id?: string;
  action: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  reasoning: string;
  thinking_rounds: ThinkingRound[];
  decision_path: DecisionPath | null;
  confidence?: number;
  decision: string;
  next_agent?: AgentName | 'END';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  duration_ms: number;
  created_at: string;
}

// Pipeline Session
export interface PipelineSession {
  id: string;
  machine_id: string;
  reading_id?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  current_agent?: AgentName;
  current_action?: string;
  progress: number;
  started_at: string;
  completed_at?: string;
  result_summary?: Record<string, unknown>;
}

// Agent State (for LangGraph)
export interface AgentState {
  sessionId: string;
  machineId: string;
  currentReading: SensorReading;
  machine: Machine;
  thresholds: Threshold[];
  
  // Pipeline progress
  currentAgent?: AgentName;
  currentAction?: string;
  progress: number;
  
  // Sentinel output
  anomalyDetected: boolean;
  anomalyDetails?: AnomalyDetails;
  
  // Diagnostician output
  diagnosis?: Diagnosis;
  
  // Orchestrator output
  workOrder?: WorkOrder;
  
  // Safety output
  safetyApproval?: SafetyApproval;
  
  // Liaison output
  notifications?: Notification[];
  
  // Available resources (for Orchestrator)
  technicians?: Technician[];
  parts?: Part[];
  
  // Agent logs (accumulated)
  agentLogs: AgentLog[];
  
  // Error handling
  error?: string;
}

// Anomaly Scenario (for demo injection)
export interface AnomalyScenario {
  id: string;
  name: string;
  description: string;
  values: {
    vib_rms_horizontal: number;
    vib_rms_vertical: number;
    vib_peak_accel: number;
    bearing_temp: number;
    pressure?: number;
    status_flag: 'WARNING' | 'CRITICAL';
  };
}

// Real-time Pipeline Update
export interface PipelineUpdate {
  sessionId: string;
  agent: AgentName;
  action: string;
  status: 'STARTED' | 'THINKING' | 'DECIDING' | 'COMPLETED';
  progress: number;
  thinkingRound?: ThinkingRound;
  decision?: DecisionPath;
  timestamp: string;
}

