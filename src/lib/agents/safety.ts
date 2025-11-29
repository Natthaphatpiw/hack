// =============================================
// Safety Agent - Validation & Guardrails with Detailed Reasoning
// =============================================

import { v4 as uuidv4 } from 'uuid';
import { GraphStateType, createThinkingRound, createDecisionPath } from './types';
import { generateWithLLM } from '../llm/client';
import { getSupabaseServer } from '../supabase/server';
import type { AgentLog, ThinkingRound, SafetyApproval, SafetyCheck } from '@/types';

// Guardrails configuration
const GUARDRAILS = {
  maxOrderValue: 50000,           // Maximum auto-approve cost
  maxDowntimeHours: 4,            // Maximum auto-approve downtime
  requiresHumanForEmergency: true,
  minConfidenceForAutoApprove: 85,
  criticalMachineRequiresHuman: true
};

export async function runSafetyAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const startTime = Date.now();
  const thinkingRounds: ThinkingRound[] = [];
  const checks: SafetyCheck[] = [];
  
  // Skip if no work order
  if (!state.workOrder) {
    return {};
  }
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'เริ่มตรวจสอบความปลอดภัย', 65);
  
  // ==========================================
  // ROUND 1: Initialize Safety Checks
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    1,
    'เริ่มกระบวนการตรวจสอบความปลอดภัยและ Guardrails',
    `Guardrails Configuration:
- Max Order Value: ฿${GUARDRAILS.maxOrderValue}
- Max Downtime: ${GUARDRAILS.maxDowntimeHours} hours
- Min Confidence for Auto-Approve: ${GUARDRAILS.minConfidenceForAutoApprove}%
- Critical Machine Requires Human: ${GUARDRAILS.criticalMachineRequiresHuman}`,
    'เริ่มทำการตรวจสอบทีละข้อ...'
  ));
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'ตรวจสอบ Cost Limit', 68);
  
  // ==========================================
  // CHECK 1: Cost Limit
  // ==========================================
  const costPassed = state.workOrder.estimatedCost <= GUARDRAILS.maxOrderValue;
  checks.push({
    check: 'COST_LIMIT',
    passed: costPassed,
    note: costPassed 
      ? `✅ ฿${state.workOrder.estimatedCost.toLocaleString()} ≤ ฿${GUARDRAILS.maxOrderValue.toLocaleString()}`
      : `❌ เกิน limit: ฿${state.workOrder.estimatedCost.toLocaleString()} > ฿${GUARDRAILS.maxOrderValue.toLocaleString()}`
  });
  
  thinkingRounds.push(createThinkingRound(
    2,
    'ตรวจสอบ Cost Limit',
    `Work Order Cost: ฿${state.workOrder.estimatedCost.toLocaleString()}
Max Allowed: ฿${GUARDRAILS.maxOrderValue.toLocaleString()}`,
    costPassed 
      ? 'ค่าใช้จ่ายอยู่ในงบประมาณที่อนุมัติอัตโนมัติได้'
      : 'ค่าใช้จ่ายเกินงบ - ต้องขออนุมัติจากผู้จัดการ'
  ));
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'ตรวจสอบ Confidence Level', 72);
  
  // ==========================================
  // CHECK 2: Confidence Level
  // ==========================================
  const diagnosisConfidence = state.diagnosis?.confidence || 0;
  const confidencePassed = diagnosisConfidence >= GUARDRAILS.minConfidenceForAutoApprove;
  checks.push({
    check: 'CONFIDENCE_LEVEL',
    passed: confidencePassed,
    note: confidencePassed
      ? `✅ ${diagnosisConfidence}% ≥ ${GUARDRAILS.minConfidenceForAutoApprove}%`
      : `⚠️ Confidence ต่ำ: ${diagnosisConfidence}% < ${GUARDRAILS.minConfidenceForAutoApprove}%`
  });
  
  thinkingRounds.push(createThinkingRound(
    3,
    'ตรวจสอบ Diagnosis Confidence',
    `Diagnosis Confidence: ${diagnosisConfidence}%
Min Required: ${GUARDRAILS.minConfidenceForAutoApprove}%`,
    confidencePassed
      ? 'การวินิจฉัยมีความมั่นใจเพียงพอ'
      : 'การวินิจฉัยยังไม่แน่ใจ - ต้องให้คนตรวจสอบ'
  ));
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'ตรวจสอบ Emergency Status', 76);
  
  // ==========================================
  // CHECK 3: Emergency Check
  // ==========================================
  const isEmergency = state.anomalyDetails?.severity === 'CRITICAL';
  const isCriticalMachine = state.machine.criticality === 'CRITICAL';
  const emergencyCheck = !(isEmergency && GUARDRAILS.requiresHumanForEmergency && isCriticalMachine);
  
  checks.push({
    check: 'EMERGENCY_CHECK',
    passed: emergencyCheck,
    note: isEmergency && isCriticalMachine
      ? `⚠️ EMERGENCY - เครื่อง CRITICAL + Severity CRITICAL - ต้องการการอนุมัติจากคน`
      : isEmergency 
        ? `⚠️ EMERGENCY - แต่เครื่องไม่ใช่ CRITICAL`
        : `✅ ไม่ใช่ Emergency`
  });
  
  thinkingRounds.push(createThinkingRound(
    4,
    'ตรวจสอบสถานะ Emergency',
    `Severity: ${state.anomalyDetails?.severity || 'N/A'}
Machine Criticality: ${state.machine.criticality}
Is Emergency: ${isEmergency}
Requires Human: ${isEmergency && isCriticalMachine}`,
    isEmergency && isCriticalMachine
      ? 'สถานการณ์ฉุกเฉินสำหรับเครื่องจักรสำคัญ - ต้องมีคนอนุมัติ'
      : 'ไม่ใช่สถานการณ์ฉุกเฉินที่ต้องการคนอนุมัติ'
  ));
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'ตรวจสอบ Logic Validation', 80);
  
  // ==========================================
  // CHECK 4: Logic Validation (AI-powered)
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    5,
    'ใช้ AI ตรวจสอบความสอดคล้องของแผนกับการวินิจฉัย',
    'ส่งข้อมูลให้ AI วิเคราะห์ว่า action สอดคล้องกับ diagnosis หรือไม่',
    'รอผลการวิเคราะห์...'
  ));
  
  const llmResponse = await generateWithLLM({
    systemPrompt: `คุณคือ Safety Agent - ผู้ตรวจสอบความปลอดภัยของการดำเนินการ

หน้าที่:
1. ตรวจสอบว่า action สอดคล้องกับ diagnosis หรือไม่
2. ตรวจสอบว่ามีความเสี่ยงใดที่ถูกมองข้ามไหม
3. ตัดสินใจว่าควร APPROVE, BLOCK, หรือ ESCALATE_HUMAN

กฎการตัดสินใจ:
- ถ้าทุกอย่างสอดคล้องและไม่มีความเสี่ยง → APPROVED
- ถ้า action ไม่ตรงกับ diagnosis → BLOCKED
- ถ้ามีความเสี่ยงที่ต้องให้คนพิจารณา → ESCALATE_HUMAN

ตอบเป็น JSON เท่านั้น`,
    userPrompt: `ตรวจสอบแผนการซ่อม:

Machine: ${state.machine.name}
Machine Criticality: ${state.machine.criticality}

Diagnosis:
- Root Cause: ${state.diagnosis?.rootCause}
- Confidence: ${state.diagnosis?.confidence}%
- Time to Failure: ${state.diagnosis?.timeToFailure}
- Recommended Action: ${state.diagnosis?.recommendedAction}

Work Order:
- Title: ${state.workOrder.title}
- Priority: ${state.workOrder.priority}
- Technician: ${state.workOrder.assignedTechnician}
- Estimated Cost: ฿${state.workOrder.estimatedCost}
- Parts: ${state.workOrder.partsNeeded.map(p => p.name).join(', ') || 'None'}

Safety Checks Performed:
${checks.map(c => `- ${c.check}: ${c.passed ? 'PASS' : 'FAIL'} (${c.note})`).join('\n')}

ตอบในรูปแบบ JSON:
{
  "thinking_rounds": [
    {
      "round": 1,
      "thought": "ตรวจสอบความสอดคล้อง",
      "observation": "สิ่งที่พบ",
      "conclusion": "ข้อสรุป"
    }
  ],
  "logic_check": {
    "action_matches_diagnosis": true,
    "technician_qualified": true,
    "parts_appropriate": true,
    "timing_appropriate": true,
    "explanation": "อธิบาย"
  },
  "additional_risks": [
    {
      "risk": "ความเสี่ยง",
      "severity": "LOW/MEDIUM/HIGH",
      "mitigation": "วิธีลดความเสี่ยง"
    }
  ],
  "decision": {
    "result": "APPROVED/BLOCKED/ESCALATE_HUMAN",
    "reason": "เหตุผล",
    "requires_human": true/false
  },
  "reasoning": "อธิบายการตัดสินใจภาษาไทยอย่างละเอียด"
}`
  });
  
  let parsedResponse: {
    thinking_rounds?: Array<{ round: number; thought: string; observation: string; conclusion: string }>;
    logic_check?: {
      action_matches_diagnosis: boolean;
      technician_qualified: boolean;
      parts_appropriate: boolean;
      timing_appropriate: boolean;
      explanation: string;
    };
    additional_risks?: Array<{
      risk: string;
      severity: string;
      mitigation: string;
    }>;
    decision: {
      result: 'APPROVED' | 'BLOCKED' | 'ESCALATE_HUMAN';
      reason: string;
      requires_human: boolean;
    };
    reasoning: string;
  };
  
  try {
    parsedResponse = JSON.parse(llmResponse);
  } catch {
    // Fallback - conservative approach
    parsedResponse = {
      decision: {
        result: 'ESCALATE_HUMAN',
        reason: 'ไม่สามารถวิเคราะห์อัตโนมัติได้',
        requires_human: true
      },
      reasoning: 'ต้องให้ผู้เชี่ยวชาญตรวจสอบ'
    };
  }
  
  // Add AI thinking rounds
  if (parsedResponse.thinking_rounds) {
    for (const aiRound of parsedResponse.thinking_rounds) {
      thinkingRounds.push(createThinkingRound(
        thinkingRounds.length + 1,
        aiRound.thought,
        aiRound.observation,
        aiRound.conclusion
      ));
    }
  }
  
  // Add logic validation check
  const logicPassed = parsedResponse.logic_check?.action_matches_diagnosis && 
                      parsedResponse.logic_check?.technician_qualified;
  checks.push({
    check: 'LOGIC_VALIDATION',
    passed: logicPassed ?? false,
    note: parsedResponse.logic_check?.explanation || 'AI validation'
  });
  
  await updatePipelineStatus(state.sessionId, 'SAFETY', 'สรุปผลการตรวจสอบ', 85);
  
  // ==========================================
  // FINAL ROUND: Decision
  // ==========================================
  const allChecksPassed = checks.every(c => c.passed);
  const requiresHuman = (isEmergency && isCriticalMachine) || 
                        !confidencePassed || 
                        !costPassed || 
                        parsedResponse.decision.requires_human;
  
  let finalDecision: 'APPROVED' | 'BLOCKED' | 'ESCALATE_HUMAN';
  if (!allChecksPassed && !parsedResponse.decision.requires_human) {
    finalDecision = 'BLOCKED';
  } else if (requiresHuman) {
    finalDecision = 'ESCALATE_HUMAN';
  } else {
    finalDecision = 'APPROVED';
  }
  
  thinkingRounds.push(createThinkingRound(
    thinkingRounds.length + 1,
    'สรุปผลการตรวจสอบและตัดสินใจขั้นสุดท้าย',
    `Check Results:
${checks.map(c => `- ${c.check}: ${c.passed ? '✅ PASS' : '❌ FAIL'}`).join('\n')}

All Passed: ${allChecksPassed}
Requires Human: ${requiresHuman}`,
    `ตัดสินใจ: ${finalDecision}${requiresHuman ? ' - ต้องรอการอนุมัติจากคน' : ''}`
  ));
  
  // Create decision path
  const decisionPath = createDecisionPath(
    'ควรอนุมัติแผนการซ่อมนี้หรือไม่?',
    [
      {
        option: 'APPROVED',
        description: 'อนุมัติอัตโนมัติ - ทุกอย่างผ่าน',
        pros: checks.filter(c => c.passed).map(c => c.note || c.check),
        cons: checks.filter(c => !c.passed).map(c => c.note || c.check),
        score: allChecksPassed && !requiresHuman ? 100 : 0,
        selected: finalDecision === 'APPROVED'
      },
      {
        option: 'ESCALATE_HUMAN',
        description: 'ส่งให้คนอนุมัติ - มีบางข้อต้องพิจารณา',
        pros: ['มีคนตรวจสอบเพิ่มเติม', 'ลดความเสี่ยง'],
        cons: ['ใช้เวลามากขึ้น'],
        score: requiresHuman ? 100 : 0,
        selected: finalDecision === 'ESCALATE_HUMAN',
        reason: requiresHuman ? parsedResponse.decision.reason : undefined
      },
      {
        option: 'BLOCKED',
        description: 'ไม่อนุมัติ - มีปัญหาที่ต้องแก้ไข',
        pros: [],
        cons: checks.filter(c => !c.passed).map(c => c.note || c.check),
        score: !allChecksPassed && !requiresHuman ? 100 : 0,
        selected: finalDecision === 'BLOCKED'
      }
    ],
    finalDecision,
    parsedResponse.reasoning
  );
  
  // Prepare safety approval
  const safetyApproval: SafetyApproval = {
    approved: finalDecision === 'APPROVED',
    decision: finalDecision,
    checks,
    reasoning: parsedResponse.reasoning,
    requiresHumanApproval: requiresHuman
  };
  
  // Create agent log
  const agentLog: AgentLog = {
    id: uuidv4(),
    session_id: state.sessionId,
    agent_name: 'SAFETY',
    machine_id: state.machineId,
    action: 'VALIDATION',
    input_data: { workOrder: state.workOrder, checks },
    output_data: { safetyApproval },
    reasoning: parsedResponse.reasoning,
    thinking_rounds: thinkingRounds,
    decision_path: decisionPath,
    decision: `${finalDecision}${requiresHuman ? ' (Requires Human)' : ''}`,
    next_agent: 'LIAISON',
    status: 'COMPLETED',
    duration_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  };
  
  await saveAgentLog(agentLog);
  
  // Save work order to database
  await saveWorkOrder(state, safetyApproval);
  
  await updatePipelineStatus(
    state.sessionId, 
    'SAFETY', 
    `${finalDecision}${requiresHuman ? ' - รอคนอนุมัติ' : ''}`,
    88
  );
  
  return {
    safetyApproval,
    currentAgent: 'SAFETY',
    currentAction: `ผลการตรวจสอบ: ${finalDecision}`,
    progress: 88,
    agentLogs: [agentLog]
  };
}

// Helper functions
async function updatePipelineStatus(sessionId: string, agent: string, action: string, progress: number) {
  const supabase = getSupabaseServer();
  await supabase.from('pipeline_sessions').update({
    current_agent: agent,
    current_action: action,
    progress
  }).eq('id', sessionId);
}

async function saveAgentLog(log: AgentLog) {
  const supabase = getSupabaseServer();
  await supabase.from('agent_logs').insert({
    id: log.id,
    session_id: log.session_id,
    agent_name: log.agent_name,
    machine_id: log.machine_id,
    action: log.action,
    input_data: log.input_data,
    output_data: log.output_data,
    reasoning: log.reasoning,
    thinking_rounds: log.thinking_rounds,
    decision_path: log.decision_path,
    confidence: log.confidence,
    decision: log.decision,
    next_agent: log.next_agent,
    status: log.status,
    duration_ms: log.duration_ms,
    created_at: log.created_at
  });
}

async function saveWorkOrder(state: GraphStateType, safetyApproval: SafetyApproval) {
  if (!state.workOrder) return;
  
  const supabase = getSupabaseServer();
  await supabase.from('work_orders').insert({
    wo_number: state.workOrder.woNumber,
    machine_id: state.machineId,
    session_id: state.sessionId,
    title: state.workOrder.title,
    description: state.workOrder.description,
    priority: state.workOrder.priority,
    assigned_technician: state.workOrder.assignedTechnician,
    scheduled_start: state.workOrder.scheduledStart,
    scheduled_end: state.workOrder.scheduledEnd,
    parts_needed: state.workOrder.partsNeeded,
    estimated_cost: state.workOrder.estimatedCost,
    safety_approved: safetyApproval.approved,
    status: safetyApproval.requiresHumanApproval ? 'PENDING' : 
            safetyApproval.approved ? 'APPROVED' : 'PENDING'
  });
}

