// =============================================
// Sentinel Agent - Anomaly Detection with Detailed Reasoning
// =============================================

import { v4 as uuidv4 } from 'uuid';
import { GraphStateType, createThinkingRound, createDecisionPath } from './types';
import { generateWithLLM } from '../llm/client';
import { getSupabaseServer } from '../supabase/server';
import type { AgentLog, ThinkingRound, DecisionPath, AnomalyDetails, Threshold, SensorReading } from '@/types';

interface ThresholdViolation {
  metric: string;
  value: number;
  threshold: number;
  severity: 'WARNING' | 'CRITICAL';
  deviation: string;
}

// Check thresholds against current reading
function checkThresholds(reading: SensorReading, thresholds: Threshold[]): ThresholdViolation[] {
  const violations: ThresholdViolation[] = [];
  
  for (const threshold of thresholds) {
    let value: number | null = null;
    
    switch (threshold.metric) {
      case 'vib_rms_horizontal':
        value = reading.vib_rms_horizontal;
        break;
      case 'vib_rms_vertical':
        value = reading.vib_rms_vertical;
        break;
      case 'vib_peak_accel':
        value = reading.vib_peak_accel;
        break;
      case 'bearing_temp':
        value = reading.bearing_temp;
        break;
      case 'pressure':
        value = reading.pressure;
        break;
    }
    
    if (value !== null && threshold.critical_high !== null && value > threshold.critical_high) {
      violations.push({
        metric: threshold.metric,
        value,
        threshold: threshold.critical_high,
        severity: 'CRITICAL',
        deviation: `+${((value - threshold.critical_high) / threshold.critical_high * 100).toFixed(1)}%`
      });
    } else if (value !== null && threshold.warning_high !== null && value > threshold.warning_high) {
      violations.push({
        metric: threshold.metric,
        value,
        threshold: threshold.warning_high,
        severity: 'WARNING',
        deviation: `+${((value - threshold.warning_high) / threshold.warning_high * 100).toFixed(1)}%`
      });
    }
  }
  
  return violations;
}

export async function runSentinelAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const startTime = Date.now();
  const thinkingRounds: ThinkingRound[] = [];
  
  // Update pipeline status
  await updatePipelineStatus(state.sessionId, 'SENTINEL', 'เริ่มตรวจสอบข้อมูล sensor', 10);
  
  // ==========================================
  // ROUND 1: Initial Data Assessment
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    1,
    `กำลังตรวจสอบข้อมูล sensor ของเครื่อง ${state.machine.name} (${state.machine.machine_id})`,
    `ค่าที่อ่านได้:
    - Vibration Horizontal: ${state.currentReading.vib_rms_horizontal} mm/s
    - Vibration Vertical: ${state.currentReading.vib_rms_vertical} mm/s
    - Vibration Peak Accel: ${state.currentReading.vib_peak_accel} g
    - Bearing Temp: ${state.currentReading.bearing_temp}°C
    - Pressure: ${state.currentReading.pressure || 'N/A'} Bar`,
    'ได้รับข้อมูล sensor ครบถ้วน พร้อมเริ่มการวิเคราะห์'
  ));
  
  await updatePipelineStatus(state.sessionId, 'SENTINEL', 'วิเคราะห์ค่า threshold', 15);
  
  // ==========================================
  // ROUND 2: Threshold Analysis
  // ==========================================
  const violations = checkThresholds(state.currentReading, state.thresholds);
  
  thinkingRounds.push(createThinkingRound(
    2,
    `เปรียบเทียบค่าที่อ่านได้กับ threshold ของเครื่องประเภท ${state.machine.type}`,
    violations.length > 0 
      ? `พบค่าที่เกิน threshold ${violations.length} รายการ:\n${violations.map(v => 
          `- ${v.metric}: ${v.value} (threshold: ${v.threshold}, severity: ${v.severity}, deviation: ${v.deviation})`
        ).join('\n')}`
      : 'ค่าทั้งหมดอยู่ในเกณฑ์ปกติ ไม่มีค่าใดเกิน threshold',
    violations.length > 0 
      ? `ต้องวิเคราะห์เพิ่มเติมว่าเป็น anomaly จริงหรือไม่`
      : 'ไม่พบความผิดปกติจาก rule-based check'
  ));
  
  // If no violations, early exit
  if (violations.length === 0) {
    const decisionPath = createDecisionPath(
      'มีความผิดปกติที่ต้อง alert หรือไม่?',
      [
        {
          option: 'NO_ANOMALY',
          description: 'ไม่พบความผิดปกติ - ค่าทั้งหมดอยู่ในเกณฑ์ปกติ',
          pros: ['ค่าทั้งหมดต่ำกว่า warning threshold', 'เครื่องทำงานปกติ'],
          cons: [],
          score: 100,
          selected: true,
          reason: 'ค่าทั้งหมดอยู่ในเกณฑ์ที่กำหนด'
        },
        {
          option: 'ANOMALY',
          description: 'พบความผิดปกติ',
          pros: [],
          cons: ['ไม่มีค่าใดเกิน threshold'],
          score: 0,
          selected: false
        }
      ],
      'NO_ANOMALY',
      'ไม่พบค่าใดเกิน threshold ที่กำหนด ระบบทำงานปกติ'
    );
    
    const agentLog: AgentLog = {
      id: uuidv4(),
      session_id: state.sessionId,
      agent_name: 'SENTINEL',
      machine_id: state.machineId,
      action: 'ANOMALY_DETECTION',
      input_data: { reading: state.currentReading },
      output_data: { anomalyDetected: false },
      reasoning: 'ตรวจสอบค่า sensor ทั้งหมดแล้ว ค่าทั้งหมดอยู่ในเกณฑ์ปกติ ไม่พบ anomaly',
      thinking_rounds: thinkingRounds,
      decision_path: decisionPath,
      decision: 'NO_ANOMALY - ค่าทั้งหมดปกติ',
      next_agent: 'END',
      status: 'COMPLETED',
      duration_ms: Date.now() - startTime,
      created_at: new Date().toISOString()
    };
    
    await saveAgentLog(agentLog);
    await updatePipelineStatus(state.sessionId, 'SENTINEL', 'เสร็จสิ้น - ไม่พบ anomaly', 20);
    
    return {
      anomalyDetected: false,
      anomalyDetails: undefined,
      currentAgent: 'SENTINEL',
      currentAction: 'เสร็จสิ้น - ไม่พบความผิดปกติ',
      progress: 20,
      agentLogs: [agentLog]
    };
  }
  
  await updatePipelineStatus(state.sessionId, 'SENTINEL', 'วิเคราะห์ด้วย AI เพื่อยืนยัน anomaly', 18);
  
  // ==========================================
  // ROUND 3: AI-Powered Context Analysis
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    3,
    'ใช้ AI วิเคราะห์บริบทเพิ่มเติมเพื่อยืนยันว่าเป็น anomaly จริงหรือไม่',
    `กำลังส่งข้อมูลให้ LLM วิเคราะห์:
    - Machine: ${state.machine.name} (${state.machine.type})
    - Criticality: ${state.machine.criticality}
    - Violations found: ${violations.length}`,
    'รอผลการวิเคราะห์จาก AI...'
  ));
  
  // Call LLM for context-aware analysis
  const llmResponse = await generateWithLLM({
    systemPrompt: `คุณคือ Sentinel Agent สำหรับระบบ Predictive Maintenance ในโรงงาน
คุณต้องวิเคราะห์ข้อมูล sensor และตัดสินใจว่าเป็น anomaly จริงหรือไม่

กฎการตัดสินใจ:
1. ถ้าค่าเกิน critical threshold → ANOMALY แน่นอน (confidence: 90-100%)
2. ถ้าค่าเกิน warning threshold หลายตัว → น่าจะเป็น ANOMALY (confidence: 70-90%)
3. ถ้า vibration และ temp สูงพร้อมกัน → สัญญาณ BEARING_WEAR (confidence: 80-95%)
4. ถ้า vibration สูงอย่างเดียว → อาจเป็น IMBALANCE หรือ LOOSENESS (confidence: 60-80%)
5. ถ้า temp สูงอย่างเดียว → อาจเป็น LUBRICATION หรือ COOLING issue (confidence: 60-80%)
6. ถ้า pressure ผิดปกติ → อาจเป็น VALVE หรือ SEAL issue (confidence: 50-70%)

กฎการคำนวณ confidence score:
- Base confidence จาก severity: CRITICAL=95%, HIGH=80%, MEDIUM=65%, LOW=50%
- เพิ่ม confidence ถ้ามี violations หลายตัว: +5-15% ต่อ violation
- เพิ่ม confidence ถ้า deviation สูง: +5-20% ตาม % deviation
- ลด confidence ถ้าเป็นเครื่อง criticality ต่ำ: -10-20%
- ปรับตาม health score ปัจจุบัน: health score ต่ำ = confidence สูงขึ้น

คำนวณ score แบบ dynamic ตามข้อมูลจริง ไม่ใช่ค่าคงที่จาก examples

คุณต้องแสดงกระบวนการคิดอย่างละเอียดใน JSON response

ตอบเป็น JSON เท่านั้น`,
    userPrompt: `วิเคราะห์ข้อมูล sensor นี้:

Machine: ${state.machine.name} (${state.machine.type})
Criticality: ${state.machine.criticality}
Health Score: ${state.machine.health_score}%

Current Reading:
- Vibration Horizontal: ${state.currentReading.vib_rms_horizontal} mm/s
- Vibration Vertical: ${state.currentReading.vib_rms_vertical} mm/s
- Vibration Peak Accel: ${state.currentReading.vib_peak_accel} g
- Bearing Temp: ${state.currentReading.bearing_temp}°C
- Pressure: ${state.currentReading.pressure || 'N/A'} Bar

Thresholds Exceeded:
${JSON.stringify(violations, null, 2)}

คำนวณ confidence score แบบ dynamic ตามกฎด้านบน และตอบในรูปแบบ JSON:

ตัวอย่างการคำนวณ confidence (สำหรับ reference เท่านั้น - คำนวณตามข้อมูลจริง):
- Critical violation + high deviation + multiple violations = 90-100%
- Warning violation + single parameter + low criticality = 50-70%

{
  "thinking_rounds": [
    {
      "round": 1,
      "thought": "วิเคราะห์ข้อมูล sensor และเปรียบเทียบกับ threshold",
      "observation": "พบ violations และ deviation ที่มีนัยสำคัญ",
      "conclusion": "มีหลักฐานเพียงพอที่จะตัดสินใจ"
    }
  ],
  "decision_analysis": {
    "options_considered": [
      {
        "option": "ANOMALY",
        "pros": ["มี violations ชัดเจน", "deviation สูง", "ตรงกับ pattern ที่รู้จัก"],
        "cons": ["อาจเป็น noise ชั่วคราว"],
        "score": 0 // คำนวณตามกฎ: base_severity + violations_bonus + deviation_bonus - criticality_penalty
      },
      {
        "option": "FALSE_POSITIVE",
        "pros": ["อาจเป็นค่าปกติที่แปรผัน", "health score ยังสูง"],
        "cons": ["violations ชัดเจน", "deviation สูง"],
        "score": 0 // คำนวณตามกฎ: 100 - anomaly_score
      }
    ],
    "selected_option": "ANOMALY",
    "selection_reason": "หลักฐานหนักแน่นกว่าความเป็นไปได้ของ false positive"
  },
  "isAnomaly": true,
  "severity": "CRITICAL",
  "anomalyType": "BEARING_WEAR",
  "reasoning": "อธิบายเหตุผลภาษาไทยแบบละเอียด รวมถึงวิธีคำนวณ confidence score",
  "shouldAlert": true
}`
  });
  
  let parsedResponse: {
    thinking_rounds?: Array<{ round: number; thought: string; observation: string; conclusion: string }>;
    decision_analysis?: {
      options_considered: Array<{ option: string; pros: string[]; cons: string[]; score: number }>;
      selected_option: string;
      selection_reason: string;
    };
    isAnomaly: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    anomalyType: string;
    reasoning: string;
    shouldAlert: boolean;
  };
  
  try {
    parsedResponse = JSON.parse(llmResponse);
  } catch {
    // Fallback if JSON parsing fails
    parsedResponse = {
      isAnomaly: true,
      severity: violations.some(v => v.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
      anomalyType: 'THRESHOLD_EXCEEDED',
      reasoning: 'ค่า sensor เกิน threshold ที่กำหนด ต้องตรวจสอบเพิ่มเติม',
      shouldAlert: true
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
  
  // ==========================================
  // ROUND 4: Final Decision
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    thinkingRounds.length + 1,
    'สรุปผลการวิเคราะห์และตัดสินใจขั้นสุดท้าย',
    `ผลจาก AI Analysis:
    - Is Anomaly: ${parsedResponse.isAnomaly}
    - Anomaly Type: ${parsedResponse.anomalyType}
    - Severity: ${parsedResponse.severity}`,
    parsedResponse.isAnomaly 
      ? `ยืนยันเป็น ${parsedResponse.anomalyType} ระดับ ${parsedResponse.severity} - ต้องส่งต่อให้ Diagnostician วิเคราะห์`
      : 'ไม่ใช่ anomaly - อาจเป็น false positive'
  ));
  
  // Create decision path
  const decisionPath = createDecisionPath(
    'มีความผิดปกติที่ต้อง alert และส่งต่อให้วินิจฉัยหรือไม่?',
    [
      {
        option: 'ANOMALY_DETECTED',
        description: `ตรวจพบ ${parsedResponse.anomalyType} - ต้องวินิจฉัยเพิ่มเติม`,
        pros: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'ANOMALY')?.pros || 
          ['ค่าเกิน threshold ที่กำหนด', 'สอดคล้องกับ pattern ความผิดปกติ'],
        cons: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'ANOMALY')?.cons || [],
        score: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'ANOMALY')?.score || 85,
        selected: parsedResponse.isAnomaly,
        reason: parsedResponse.decision_analysis?.selection_reason
      },
      {
        option: 'FALSE_POSITIVE',
        description: 'อาจเป็น false positive - ค่าเกินชั่วคราว',
        pros: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'FALSE_POSITIVE')?.pros || [],
        cons: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'FALSE_POSITIVE')?.cons || 
          ['ค่าเกิน threshold จริง'],
        score: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'FALSE_POSITIVE')?.score || 15,
        selected: !parsedResponse.isAnomaly
      }
    ],
    parsedResponse.isAnomaly ? 'ANOMALY_DETECTED' : 'FALSE_POSITIVE',
    parsedResponse.reasoning
  );
  
  // Prepare anomaly details
  const anomalyDetails: AnomalyDetails | undefined = parsedResponse.isAnomaly ? {
    type: parsedResponse.anomalyType,
    severity: parsedResponse.severity,
    metrics: violations.map(v => ({
      metric: v.metric,
      value: v.value,
      threshold: v.threshold,
      severity: v.severity,
      deviation: v.deviation
    })),
    reasoning: parsedResponse.reasoning
  } : undefined;
  
  // Create agent log
  const agentLog: AgentLog = {
    id: uuidv4(),
    session_id: state.sessionId,
    agent_name: 'SENTINEL',
    machine_id: state.machineId,
    action: 'ANOMALY_DETECTION',
    input_data: { 
      reading: state.currentReading,
      violations 
    },
    output_data: { 
      anomalyDetected: parsedResponse.isAnomaly,
      anomalyDetails
    },
    reasoning: parsedResponse.reasoning,
    thinking_rounds: thinkingRounds,
    decision_path: decisionPath,
    confidence: parsedResponse.decision_analysis?.options_considered.find(o => o.option === 'ANOMALY')?.score,
    decision: parsedResponse.isAnomaly 
      ? `ANOMALY_DETECTED: ${parsedResponse.anomalyType} (${parsedResponse.severity})`
      : 'FALSE_POSITIVE',
    next_agent: parsedResponse.isAnomaly ? 'DIAGNOSTICIAN' : 'END',
    status: 'COMPLETED',
    duration_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  };
  
  await saveAgentLog(agentLog);
  await updatePipelineStatus(
    state.sessionId, 
    'SENTINEL', 
    parsedResponse.isAnomaly ? `พบ ${parsedResponse.anomalyType} - ส่งต่อวินิจฉัย` : 'เสร็จสิ้น',
    20
  );
  
  // Save anomaly to database if detected
  if (parsedResponse.isAnomaly && anomalyDetails) {
    const supabase = getSupabaseServer();
    await supabase.from('anomalies').insert({
      machine_id: state.machineId,
      session_id: state.sessionId,
      anomaly_type: anomalyDetails.type,
      severity: anomalyDetails.severity,
      description: anomalyDetails.reasoning
    });
  }
  
  return {
    anomalyDetected: parsedResponse.isAnomaly,
    anomalyDetails,
    currentAgent: 'SENTINEL',
    currentAction: parsedResponse.isAnomaly ? `พบ ${parsedResponse.anomalyType}` : 'ไม่พบ anomaly',
    progress: 20,
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

