// =============================================
// Diagnostician Agent - Enhanced Predictive Diagnosis with Failure Prediction
// =============================================

import { v4 as uuidv4 } from 'uuid';
import { GraphStateType, createThinkingRound, createDecisionPath } from './types';
import { generateWithLLM } from '../llm/client';
import { getSupabaseServer } from '../supabase/server';
import type { AgentLog, ThinkingRound, Diagnosis } from '@/types';

export async function runDiagnosticianAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const startTime = Date.now();
  const thinkingRounds: ThinkingRound[] = [];
  
  // Skip if no anomaly detected
  if (!state.anomalyDetected || !state.anomalyDetails) {
    return {};
  }
  
  await updatePipelineStatus(state.sessionId, 'DIAGNOSTICIAN', 'เริ่มวิเคราะห์สาเหตุ', 25);
  
  // ==========================================
  // ROUND 1: Review Anomaly Data
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    1,
    `รับข้อมูล anomaly จาก Sentinel Agent เพื่อวิเคราะห์หาสาเหตุ`,
    `Anomaly Type: ${state.anomalyDetails.type}
Severity: ${state.anomalyDetails.severity}
Metrics ที่ผิดปกติ:
${state.anomalyDetails.metrics.map(m => `- ${m.metric}: ${m.value} (threshold: ${m.threshold}, deviation: ${m.deviation})`).join('\n')}`,
    'ได้รับข้อมูลครบถ้วน เริ่มวิเคราะห์ pattern'
  ));
  
  await updatePipelineStatus(state.sessionId, 'DIAGNOSTICIAN', 'วิเคราะห์ pattern และ correlation', 30);
  
  // ==========================================
  // ROUND 2: Pattern Analysis
  // ==========================================
  const hasVibrationIssue = state.anomalyDetails.metrics.some(m => 
    m.metric.includes('vib') && (m.severity === 'WARNING' || m.severity === 'CRITICAL')
  );
  const hasTempIssue = state.anomalyDetails.metrics.some(m => 
    m.metric === 'bearing_temp' && (m.severity === 'WARNING' || m.severity === 'CRITICAL')
  );
  const hasPressureIssue = state.anomalyDetails.metrics.some(m => 
    m.metric === 'pressure' && (m.severity === 'WARNING' || m.severity === 'CRITICAL')
  );
  
  thinkingRounds.push(createThinkingRound(
    2,
    'วิเคราะห์ pattern ของ metrics ที่ผิดปกติ',
    `Pattern Analysis:
- Vibration Issue: ${hasVibrationIssue ? 'YES' : 'NO'}
- Temperature Issue: ${hasTempIssue ? 'YES' : 'NO'}
- Pressure Issue: ${hasPressureIssue ? 'YES' : 'NO'}

ความสัมพันธ์ที่พบ:
${hasVibrationIssue && hasTempIssue ? '- Vibration + Temp สูง → น่าจะเป็น Bearing wear หรือ Misalignment' : ''}
${hasVibrationIssue && !hasTempIssue ? '- Vibration สูงอย่างเดียว → น่าจะเป็น Imbalance หรือ Looseness' : ''}
${!hasVibrationIssue && hasTempIssue ? '- Temp สูงอย่างเดียว → น่าจะเป็น Lubrication หรือ Cooling issue' : ''}
${hasPressureIssue ? '- Pressure ผิดปกติ → น่าจะเป็น Valve หรือ Seal issue' : ''}`,
    'มีข้อมูลเพียงพอสำหรับการวินิจฉัยเบื้องต้น'
  ));
  
  await updatePipelineStatus(state.sessionId, 'DIAGNOSTICIAN', 'ปรึกษา AI สำหรับ Root Cause Analysis', 35);
  
  // ==========================================
  // ROUND 3: AI-Powered Root Cause Analysis
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    3,
    'ใช้ AI วิเคราะห์ Root Cause อย่างละเอียด',
    `ส่งข้อมูลให้ LLM:
- Machine Type: ${state.machine.type}
- Anomaly: ${state.anomalyDetails.type}
- Severity: ${state.anomalyDetails.severity}`,
    'รอผลการวิเคราะห์จาก AI...'
  ));
  
  const llmResponse = await generateWithLLM({
    systemPrompt: `คุณคือ Diagnostician Agent - Predictive Maintenance Expert สำหรับโรงงานอุตสาหกรรมไทย

🎯 **ภารกิจหลัก:** วินิจฉัย anomaly พร้อมทำนายระยะเวลาที่ต้องบำรุงรักษา และประเมิน Business Impact

📊 **ฐานความรู้ในการวินิจฉัย (อิงจากงานวิจัยอุตสาหกรรม):**

1. **BEARING_WEAR** (ตลับลูกปืนสึก):
   - สาเหตุ: อายุใช้งาน, หล่อลื่นไม่เพียงพอ, โหลดเกิน, ความสะอาด
   - อาการ: Vibration + Temp สูง, มี harmonics ใน frequency spectrum
   - ⏰ **เวลาก่อนพัง:** 24-72 ชั่วโมง (Critical), 3-7 วัน (Warning)
   - 💰 **Business Impact:** High - เครื่องหยุดเฉียบพลัน, ต้นทุนซ่อมสูง
   - 🔧 **แนะนำ:** เปลี่ยนตลับลูกปืน + ตรวจสอบ alignment

2. **MISALIGNMENT** (จัดศูนย์ผิด):
   - สาเหตุ: ติดตั้งไม่ถูกต้อง, foundation เสื่อม, thermal expansion
   - อาการ: Vibration H/V สูง, มี axial movement
   - ⏰ **เวลาก่อนพัง:** 1-2 สัปดาห์
   - 💰 **Business Impact:** Medium - เครื่องทำงานต่อได้แต่ประสิทธิภาพลด
   - 🔧 **แนะนำ:** Laser alignment + foundation check

3. **IMBALANCE** (ไม่สมดุล):
   - สาเหตุ: ใบพัดสึก, สิ่งสกปรกเกาะ, การติดตั้งไม่สมดุล
   - อาการ: Vibration H สูงกว่า V มาก, 1x line frequency dominant
   - ⏰ **เวลาก่อนพัง:** 3-7 วัน
   - 💰 **Business Impact:** Medium - สร้าง vibration ตลอดระบบ
   - 🔧 **แนะนำ:** Dynamic balancing + clean impeller

4. **LUBRICATION_FAILURE** (หล่อลื่นผิดปกติ):
   - สาเหตุ: น้ำมันหมด/เสื่อม, ปริมาณไม่พอ, คุณภาพน้ำมันต่ำ
   - อาการ: Temp ค่อยๆ สูงขึ้น, vibration เพิ่มขึ้นเล็กน้อย
   - ⏰ **เวลาก่อนพัง:** 1-2 สัปดาห์
   - 💰 **Business Impact:** High - พังกะทันหันถ้าไม่ตรวจ
   - 🔧 **แนะนำ:** เปลี่ยนน้ำมัน + ตรวจสอบระบบหล่อลื่น

5. **VALVE_SEAL_ISSUE** (วาล์ว/ซีลรั่ว):
   - สาเหตุ: ซีลเสื่อม, วาล์วติด, cavitation
   - อาการ: Pressure ผิดปกติ, vibration จาก cavitation
   - ⏰ **เวลาก่อนพัง:** 2-5 วัน
   - 💰 **Business Impact:** Critical - ส่งผลถึงระบบทั้งสายการผลิต
   - 🔧 **แนะนำ:** เปลี่ยนซีล/วาล์ว + ตรวจสอบ pressure system

6. **OVERHEAT** (ร้อนเกิน):
   - สาเหตุ: Cooling ล้มเหลว, environment temp สูง, โหลดเกิน
   - อาการ: Temp สูงผิดปกติ, thermal expansion
   - ⏰ **เวลาก่อนพัง:** 6-24 ชั่วโมง
   - 💰 **Business Impact:** High - thermal damage ถ้าไม่ควบคุม
   - 🔧 **แนะนำ:** ตรวจสอบ cooling system + thermal imaging

🔬 **การคำนวณเวลาพยากรณ์ (Time-to-Failure Prediction):**
- **Base time** จาก severity: CRITICAL=24h, HIGH=72h, MEDIUM=168h, LOW=336h
- **ปรับตาม deviation %:** deviation >50% = ลดเวลา 20-40%
- **ปรับตาม machine criticality:** CRITICAL machine = ลดเวลา 30%
- **ปรับตาม health score:** health <60 = ลดเวลา 25%
- **ปรับตาม historical data:** เครื่องที่มี failure pattern = ลดเวลา 15%

💼 **Business Impact Calculation:**
- **Production Loss:** downtime_hours × production_rate_per_hour
- **Maintenance Cost:** parts_cost + labor_cost + downtime_penalty
- **ROI:** (production_saved - maintenance_cost) / maintenance_cost × 100
- **Risk Score:** 1-10 (10 = เครื่องพังส่งผลรุนแรงมาก)

🎯 **เกณฑ์การตัดสินใจ:**
- **Maintenance Urgency:** ROUTINE (14+ วัน), SCHEDULED (3-14 วัน), URGENT (1-3 วัน), EMERGENCY (<24 ชม.)
- **Confidence Level:** 70-95% (ขึ้นกับข้อมูลและ pattern matching)

ตอบเป็น JSON เท่านั้น`,
    userPrompt: `วิเคราะห์ Predictive Maintenance สำหรับโรงงานอุตสาหกรรมไทย:

🏭 **ข้อมูลเครื่องจักร:**
- Machine: ${state.machine.name} (${state.machine.type})
- Criticality: ${state.machine.criticality}
- Health Score: ${state.machine.health_score}%
- Location: ${state.machine.location}

⚠️ **Anomaly ที่ตรวจพบ:**
- Type: ${state.anomalyDetails.type}
- Severity: ${state.anomalyDetails.severity}

📊 **Metrics ที่ผิดปกติ:**
${state.anomalyDetails.metrics.map(m => `- ${m.metric}: ${m.value} (threshold: ${m.threshold}, deviation: ${m.deviation})`).join('\n')}

📡 **Sensor Values ปัจจุบัน:**
- Vibration H: ${state.currentReading.vib_rms_horizontal} mm/s
- Vibration V: ${state.currentReading.vib_rms_vertical} mm/s
- Vibration Peak: ${state.currentReading.vib_peak_accel} g
- Bearing Temp: ${state.currentReading.bearing_temp}°C
- Pressure: ${state.currentReading.pressure || 'N/A'} Bar

💰 **Business Context (สำหรับคำนวณ ROI):**
- Production Rate: 1,000 THB/ชั่วโมง
- Downtime Cost: 50,000 THB/ชั่วโมง
- Average Maintenance Cost: 15,000 THB/ครั้ง

🎯 **ภารกิจ:** วินิจฉัย + ทำนายเวลา + ประเมิน Business Impact

ตอบใน JSON format พร้อมคำนวณตัวเลขจริง:
{
  "thinking_rounds": [
    {
      "round": 1,
      "thought": "สิ่งที่คิด - วิเคราะห์ข้อมูลเบื้องต้น",
      "observation": "สิ่งที่สังเกตเห็น",
      "conclusion": "ข้อสรุปเบื้องต้น"
    },
    {
      "round": 2,
      "thought": "พิจารณาความเป็นไปได้ต่างๆ",
      "observation": "เปรียบเทียบกับ pattern ที่รู้จัก",
      "conclusion": "สรุปสาเหตุที่น่าจะเป็นไปได้"
    }
  ],
  "possible_causes": [
    {
      "cause": "BEARING_WEAR",
      "description": "ตลับลูกปืนสึกหรอ",
      "confidence": 0, // คำนวณ: base_evidence + pattern_match + severity_bonus - contradicting_penalty
      "supporting_evidence": ["หลักฐานจริงตามข้อมูล"],
      "contradicting_evidence": []
    },
    {
      "cause": "MISALIGNMENT",
      "description": "การจัดศูนย์ผิด",
      "confidence": 0, // คำนวณตามกฎเดียวกัน
      "supporting_evidence": ["หลักฐานจริงตามข้อมูล"],
      "contradicting_evidence": ["หลักฐานที่ขัดแย้งจริง"]
    }
  ],
  "selected_cause": "BEARING_WEAR",
  "root_cause": "ตลับลูกปืนสึกหรอจากการใช้งานต่อเนื่อง",
  "confidence_level": 85.5,

  "prediction": {
    "predicted_failure_days": 3, // คำนวณตามกฎ severity + deviation
    "failure_probability": 0.75, // 0-1 scale
    "maintenance_urgency": "URGENT", // ROUTINE/SCHEDULED/URGENT/EMERGENCY
    "estimated_downtime_hours": 4.5
  },

  "business_impact": {
    "cost_impact": 225000, // downtime_hours × 50000
    "production_value_preserved": 225000, // ถ้าบำรุงก่อนพัง
    "maintenance_cost": 15000,
    "roi_percentage": 1400, // (production_saved - maintenance_cost) / maintenance_cost × 100
    "business_impact_score": 8 // 1-10 scale
  },

  "supporting_evidence": ["Vibration + Temp สูงพร้อมกัน", "Deviation > 50%"],
  "recommended_action": "เปลี่ยนตลับลูกปืน + ตรวจสอบ alignment",
  "reasoning": "อธิบายการวิเคราะห์ภาษาไทยอย่างละเอียด รวมวิธีคำนวณ prediction"
}`
  });
  
  let parsedResponse: {
    thinking_rounds?: Array<{ round: number; thought: string; observation: string; conclusion: string }>;
    possible_causes?: Array<{
      cause: string;
      description: string;
      confidence: number;
      supporting_evidence: string[];
      contradicting_evidence: string[];
    }>;
    selected_cause: string;
    root_cause: string;
    confidence_level: number;
    prediction?: {
      predicted_failure_days: number;
      failure_probability: number;
      maintenance_urgency: string;
      estimated_downtime_hours: number;
    };
    business_impact?: {
      cost_impact: number;
      production_value_preserved: number;
      maintenance_cost: number;
      roi_percentage: number;
      business_impact_score: number;
    };
    supporting_evidence: string[];
    recommended_action: string;
    reasoning: string;
  };
  
  try {
    parsedResponse = JSON.parse(llmResponse);

    // Normalize confidence_level: if it's decimal (0-1), convert to percentage (0-100)
    if (parsedResponse.confidence_level !== undefined && parsedResponse.confidence_level > 0 && parsedResponse.confidence_level < 1) {
      parsedResponse.confidence_level = Math.round(parsedResponse.confidence_level * 100);
    }

    // Ensure prediction defaults
    if (!parsedResponse.prediction) {
      parsedResponse.prediction = {
        predicted_failure_days: 7,
        failure_probability: 0.5,
        maintenance_urgency: 'SCHEDULED',
        estimated_downtime_hours: 2
      };
    }

    // Ensure business_impact defaults
    if (!parsedResponse.business_impact) {
      parsedResponse.business_impact = {
        cost_impact: 100000,
        production_value_preserved: 100000,
        maintenance_cost: 15000,
        roi_percentage: 566.67,
        business_impact_score: 5
      };
    }
  } catch {
    // Fallback
    parsedResponse = {
      selected_cause: 'UNKNOWN',
      root_cause: 'ไม่สามารถระบุสาเหตุได้ชัดเจน - ต้องตรวจสอบเพิ่มเติม',
      confidence_level: 50,
      prediction: {
        predicted_failure_days: 7,
        failure_probability: 0.5,
        maintenance_urgency: 'SCHEDULED',
        estimated_downtime_hours: 2
      },
      business_impact: {
        cost_impact: 100000,
        production_value_preserved: 100000,
        maintenance_cost: 15000,
        roi_percentage: 566.67,
        business_impact_score: 5
      },
      supporting_evidence: ['ค่า sensor เกิน threshold'],
      recommended_action: 'ให้ช่างตรวจสอบเครื่องจักร',
      reasoning: 'ไม่สามารถวิเคราะห์อัตโนมัติได้ ต้องให้ผู้เชี่ยวชาญตรวจสอบ'
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
  
  await updatePipelineStatus(state.sessionId, 'DIAGNOSTICIAN', 'ประเมินและตัดสินใจ', 38);
  
  // ==========================================
  // ROUND 4: Final Diagnosis Decision
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    thinkingRounds.length + 1,
    'สรุปการวินิจฉัยและเลือกสาเหตุหลัก',
    `สาเหตุที่เป็นไปได้:
${parsedResponse.possible_causes?.map(c => `- ${c.cause}: ${c.confidence}% (${c.supporting_evidence.length} หลักฐานสนับสนุน)`).join('\n') || 'N/A'}

สาเหตุที่เลือก: ${parsedResponse.selected_cause}
Confidence: ${parsedResponse.confidence_level}%`,
    `วินิจฉัยว่าเป็น ${parsedResponse.root_cause} (${parsedResponse.confidence_level}% confidence)`
  ));
  
  // Create decision path
  const decisionPath = createDecisionPath(
    'สาเหตุหลักของปัญหาคืออะไร?',
    parsedResponse.possible_causes?.map(c => ({
      option: c.cause,
      description: c.description,
      pros: c.supporting_evidence,
      cons: c.contradicting_evidence,
      score: c.confidence,
      selected: c.cause === parsedResponse.selected_cause,
      reason: c.cause === parsedResponse.selected_cause ? parsedResponse.reasoning : undefined
    })) || [
      {
        option: parsedResponse.selected_cause,
        description: parsedResponse.root_cause,
        pros: parsedResponse.supporting_evidence,
        cons: [],
        score: parsedResponse.confidence_level,
        selected: true,
        reason: parsedResponse.reasoning
      }
    ],
    parsedResponse.selected_cause,
    parsedResponse.reasoning
  );
  
  // Prepare diagnosis
  const diagnosis: Diagnosis = {
    rootCause: parsedResponse.root_cause,
    confidence: parsedResponse.confidence_level,
    supportingEvidence: parsedResponse.supporting_evidence,
    recommendedAction: parsedResponse.recommended_action,
    timeToFailure: `${parsedResponse.prediction?.predicted_failure_days || 7} days`,
    reasoning: parsedResponse.reasoning
  };
  
  // Create agent log
  const agentLog: AgentLog = {
    id: uuidv4(),
    session_id: state.sessionId,
    agent_name: 'DIAGNOSTICIAN',
    machine_id: state.machineId,
    action: 'ROOT_CAUSE_ANALYSIS',
    input_data: { anomalyDetails: state.anomalyDetails },
    output_data: { diagnosis },
    reasoning: parsedResponse.reasoning,
    thinking_rounds: thinkingRounds,
    decision_path: decisionPath,
    confidence: parsedResponse.confidence_level,
    decision: `${parsedResponse.root_cause} (${parsedResponse.confidence_level}% confidence, ${parsedResponse.prediction?.predicted_failure_days}d to failure)`,
    next_agent: parsedResponse.confidence_level >= 70 ? 'ORCHESTRATOR' : 'LIAISON',
    status: 'COMPLETED',
    duration_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  };
  
  await saveAgentLog(agentLog);
  await saveDiagnosis(state.sessionId, state.machineId, diagnosis);
  await updatePipelineStatus(
    state.sessionId, 
    'DIAGNOSTICIAN', 
    `วินิจฉัย: ${parsedResponse.root_cause}`,
    40
  );
  
  return {
    diagnosis,
    currentAgent: 'DIAGNOSTICIAN',
    currentAction: `วินิจฉัย: ${parsedResponse.root_cause}`,
    progress: 40,
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

async function saveDiagnosis(sessionId: string, machineId: string, diagnosis: Diagnosis) {
  console.log('💾 Saving diagnosis to database:', { sessionId, machineId, diagnosis });
  const supabase = getSupabaseServer();
  const result = await supabase.from('diagnoses').insert({
    machine_id: machineId,
    session_id: sessionId,
    root_cause: diagnosis.rootCause,
    confidence: diagnosis.confidence,
    supporting_evidence: diagnosis.supportingEvidence,
    recommended_action: diagnosis.recommendedAction,
    time_to_failure: diagnosis.timeToFailure,
    predicted_failure_days: (diagnosis as any).predictedFailureDays,
    confidence_level: (diagnosis as any).confidenceLevel,
    failure_probability: (diagnosis as any).failureProbability,
    maintenance_urgency: (diagnosis as any).maintenanceUrgency,
    estimated_downtime_hours: (diagnosis as any).estimatedDowntimeHours,
    cost_impact: (diagnosis as any).costImpact,
    business_impact_score: (diagnosis as any).businessImpactScore
  });

  console.log('💾 Diagnosis save result:', result);
}

