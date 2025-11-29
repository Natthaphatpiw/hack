// =============================================
// Orchestrator Agent - Enhanced Maintenance Planning & Scheduling
// =============================================

import { v4 as uuidv4 } from 'uuid';
import { GraphStateType, createThinkingRound, createDecisionPath } from './types';
import { generateWithLLM } from '../llm/client';
import { getSupabaseServer } from '../supabase/server';
import type { AgentLog, ThinkingRound, WorkOrder, Technician, Part } from '@/types';

export async function runOrchestratorAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const startTime = Date.now();
  const thinkingRounds: ThinkingRound[] = [];
  
  // Skip if no diagnosis
  if (!state.diagnosis) {
    return {};
  }
  
  await updatePipelineStatus(state.sessionId, 'ORCHESTRATOR', 'เริ่มวางแผนซ่อมบำรุง', 45);
  
  // ==========================================
  // ROUND 1: Gather Available Resources
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    1,
    'ตรวจสอบทรัพยากรที่พร้อมใช้งาน',
    `กำลังดึงข้อมูล:
- รายชื่อช่างที่ว่าง
- อะไหล่ในคลัง
- กำหนดการซ่อมบำรุง`,
    'เริ่มดึงข้อมูลจากระบบ...'
  ));
  
  // Fetch available technicians
  const supabase = getSupabaseServer();
  const { data: technicians } = await supabase
    .from('technicians')
    .select('*')
    .eq('is_available', true);
  
  // Fetch available parts
  const { data: parts } = await supabase
    .from('parts_inventory')
    .select('*')
    .gt('quantity', 0);
  
  await updatePipelineStatus(state.sessionId, 'ORCHESTRATOR', 'วิเคราะห์ทรัพยากร', 50);
  
  // ==========================================
  // ROUND 2: Resource Assessment
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    2,
    'ประเมินทรัพยากรที่มี',
    `ช่างที่ว่าง: ${technicians?.length || 0} คน
${technicians?.map(t => `- ${t.name}: Skill ${t.skill_level}/5, เชี่ยวชาญ: ${t.specializations?.join(', ')}`).join('\n') || 'ไม่มีช่างว่าง'}

อะไหล่ที่มี: ${parts?.length || 0} รายการ
${parts?.slice(0, 5).map(p => `- ${p.name}: ${p.quantity} ชิ้น (฿${p.unit_cost}/ชิ้น)`).join('\n') || 'ไม่มีอะไหล่'}`,
    technicians && technicians.length > 0 
      ? 'มีทรัพยากรเพียงพอสำหรับการซ่อมบำรุง'
      : 'ทรัพยากรจำกัด - ต้องพิจารณาทางเลือกอื่น'
  ));
  
  await updatePipelineStatus(state.sessionId, 'ORCHESTRATOR', 'วางแผนด้วย AI', 55);
  
  // ==========================================
  // ROUND 3: AI-Powered Planning
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    3,
    'ใช้ AI วางแผนการซ่อมบำรุงที่เหมาะสมที่สุด',
    `พิจารณาปัจจัย:
- Root Cause: ${state.diagnosis.rootCause}
- Urgency: ${state.anomalyDetails?.severity}
- Time to Failure: ${state.diagnosis.timeToFailure}
- Machine Criticality: ${state.machine.criticality}`,
    'กำลังคำนวณแผนที่เหมาะสม...'
  ));
  
  const llmResponse = await generateWithLLM({
    systemPrompt: `คุณคือ Orchestrator Agent - Maintenance Planning & Scheduling Expert สำหรับโรงงานอุตสาหกรรม

🎯 **ภารกิจหลัก:** วางแผนซ่อมบำรุงอย่างมีประสิทธิภาพเพื่อลด downtime และเพิ่ม productivity

📋 **หน้าที่ครบถ้วน:**
1. **เลือกช่างที่เหมาะสม** (skill level, specialization, availability)
2. **วิเคราะห์อะไหล่** (availability, cost, lead time)
3. **กำหนดตารางงาน** (optimal timing เพื่อลด business impact)
4. **คำนวณต้นทุน** (labor + parts + downtime penalty)
5. **ประเมิน business impact** (ROI, productivity loss)
6. **วางแผน contingency** (backup plans, risk mitigation)

⏰ **กฎการเลือกช่วงเวลาซ่อม (Business Impact Minimization):**
- **Production Hours:** 08:00-17:00 (จันทร์-เสาร์) - Impact สูงสุด
- **Off-Peak Hours:** 22:00-06:00 - Impact ต่ำสุด (แนะนำ)
- **Maintenance Windows:** 12:00-13:00, 17:00-18:00 - Impact ปานกลาง
- **Emergency:** ทุกเวลา (สำหรับ CRITICAL cases)

🎯 **กฎการจัดลำดับความสำคัญ (Priority Matrix):**
- **EMERGENCY:** Critical machine + <24h to failure + high confidence
- **URGENT:** Critical machine + <72h to failure
- **HIGH:** High criticality machine + medium confidence diagnosis
- **MEDIUM:** Standard maintenance + low business impact
- **LOW:** Routine maintenance + flexible scheduling

👷 **กฎการเลือกช่าง (Resource Optimization):**
- **Primary Match:** skill level 4-5 + exact specialization
- **Secondary Match:** skill level 3-4 + related specialization
- **Backup:** skill level 2-3 + basic training
- **Multi-skill bonus:** ช่างที่มีหลาย specialization ได้ preference
- **Load balancing:** จัดสรรงานให้สม่ำเสมอ ไม่ overload ช่างคนใดคนหนึ่ง

⚙️ **กฎการวิเคราะห์อะไหล่:**
- **Critical Parts:** ต้องมีใน stock 100%
- **Standard Parts:** reorder ถ้าต่ำกว่า 20%
- **Lead Time Impact:** parts ที่ใช้เวลานานต้องสั่งล่วงหน้า
- **Cost Optimization:** เลือก alternative ที่ถูกกว่า แต่ quality เท่าเดิม

💰 **Business Impact Calculation:**
- **Downtime Cost:** hours × production_rate_per_hour × 1.5 (efficiency loss)
- **Labor Cost:** hours × technician_rate_per_hour
- **Parts Cost:** รวม markup และ delivery
- **ROI:** (production_saved - total_cost) / total_cost × 100
- **Risk Score:** 1-10 (10 = very high business impact)

📊 **Optimization Objectives:**
1. **Minimize Production Loss:** เลือกเวลาที่ impact ต่ำสุด
2. **Maximize Resource Utilization:** ใช้ทรัพยากรที่มีอย่างมีประสิทธิภาพ
3. **Minimize Total Cost:** balance ระหว่าง speed และ cost
4. **Maximize Schedule Flexibility:** จัดงานให้ยืดหยุ่นสำหรับ unexpected issues

ตอบเป็น JSON เท่านั้นพร้อมแสดง reasoning ละเอียด`,
    userPrompt: `วางแผน Maintenance Schedule สำหรับโรงงานอุตสาหกรรม:

🏭 **Machine Information:**
- Machine: ${state.machine.name} (${state.machine.type})
- Criticality: ${state.machine.criticality}
- Location: ${state.machine.location}
- Health Score: ${state.machine.health_score}%

🔍 **Diagnosis Details:**
- Root Cause: ${state.diagnosis.rootCause}
- Confidence Level: ${(state.diagnosis as any).confidenceLevel || state.diagnosis.confidence}%
- Recommended Action: ${state.diagnosis.recommendedAction}
- Time to Failure: ${state.diagnosis.timeToFailure}
- Severity: ${state.anomalyDetails?.severity}
- Predicted Failure Days: ${(state.diagnosis as any).predictedFailureDays || 'N/A'}
- Business Impact Score: ${(state.diagnosis as any).businessImpactScore || 5}/10

👷 **Available Technicians:**
${JSON.stringify(technicians?.map(t => ({
  name: t.name,
  skill_level: t.skill_level,
  specializations: t.specializations,
  is_available: t.is_available,
  shift: t.current_shift,
  employee_id: t.employee_id,
  line_id: t.line_id
})), null, 2)}

⚙️ **Available Parts Inventory:**
${JSON.stringify(parts?.map(p => ({
  part_number: p.part_number,
  name: p.name,
  category: p.category,
  quantity: p.quantity,
  unit_cost: p.unit_cost,
  reorder_point: p.reorder_point
})), null, 2)}

📅 **Current Production Schedule:**
- Production Hours: 08:00-17:00 (Mon-Sat) - High Impact
- Maintenance Windows: 12:00-13:00, 17:00-18:00 - Medium Impact
- Off-Peak Hours: 22:00-06:00 - Low Impact
- Emergency: 24/7 (Critical cases only)

💰 **Cost Parameters:**
- Production Rate: 1,000 THB/hour
- Downtime Penalty: 1.5x production rate
- Technician Rate: 200 THB/hour
- Overtime Rate: 300 THB/hour

ตอบใน JSON format พร้อม comprehensive maintenance planning:

{
  "thinking_rounds": [
    {
      "round": 1,
      "thought": "ประเมิน urgency และ business impact",
      "observation": "วิเคราะห์ severity, time-to-failure, machine criticality",
      "conclusion": "กำหนด maintenance priority และ timeline"
    },
    {
      "round": 2,
      "thought": "วิเคราะห์ resource availability และ optimization",
      "observation": "ตรวจสอบ technician skills, parts inventory, schedule conflicts",
      "conclusion": "เลือก optimal resource combination"
    },
    {
      "round": 3,
      "thought": "กำหนด maintenance schedule ที่ minimize business impact",
      "observation": "วิเคราะห์ production schedule และ downtime windows",
      "conclusion": "เลือกเวลาที่เหมาะสมที่สุด"
    }
  ],
  "priority_analysis": {
    "maintenance_urgency": "URGENT", // ROUTINE/SCHEDULED/URGENT/EMERGENCY
    "business_impact_score": 8, // 1-10
    "risk_assessment": "HIGH", // LOW/MEDIUM/HIGH/CRITICAL
    "justification": "อธิบายเหตุผล priority"
  },
  "technician_selection": {
    "candidates": [
      {
        "name": "ชื่อช่าง",
        "employee_id": "EMP001",
        "line_id": "U1234567890abcdef",
        "skill_level": 4,
        "specializations": ["BEARING", "MOTOR"],
        "availability_score": 95,
        "match_score": 90,
        "estimated_travel_time": 15, // นาที
        "workload_today": 6, // ชั่วโมง
        "reasons": ["เหตุผล1", "เหตุผล2"]
      }
    ],
    "selected_technician": {
      "name": "ชื่อช่างที่เลือก",
      "employee_id": "EMP001",
      "line_id": "U1234567890abcdef",
      "confidence_score": 95,
    "selection_reason": "เหตุผลที่เลือก"
  },
    "backup_technicians": ["ช่างสำรอง1", "ช่างสำรอง2"]
  },
  "parts_analysis": {
    "required_parts": [
      {
        "part_number": "BRG-001",
        "name": "ตลับลูกปืน NSK 6308",
        "category": "BEARING",
        "quantity_needed": 1,
        "quantity_available": 5,
        "unit_cost": 2500,
        "lead_time_days": 2,
        "availability_status": "IN_STOCK", // IN_STOCK/LOW_STOCK/OUT_OF_STOCK/ORDER_NEEDED
        "alternative_parts": ["BRG-001-ALT1", "BRG-001-ALT2"],
        "criticality": "HIGH" // LOW/MEDIUM/HIGH/CRITICAL
      }
    ],
    "total_parts_cost": 2500,
    "parts_availability_confidence": 95, // %
    "lead_time_impact": "LOW" // LOW/MEDIUM/HIGH
  },
  "schedule_optimization": {
    "optimal_start_time": "2024-01-15T22:00:00Z", // ISO datetime
    "optimal_end_time": "2024-01-16T02:00:00Z", // ISO datetime
    "business_impact_level": "LOW", // HIGH/MEDIUM/LOW
    "production_downtime_hours": 4,
    "alternative_slots": [
      {
        "start": "2024-01-15T22:00:00Z",
        "end": "2024-01-16T02:00:00Z",
        "impact_score": 2, // 1-10, 1=best
        "reason": "Off-peak hours, minimal production impact"
      },
      {
        "start": "2024-01-16T12:00:00Z",
        "end": "2024-01-16T16:00:00Z",
        "impact_score": 7,
        "reason": "Lunch break window, moderate impact"
      }
    ],
    "contingency_plan": "ถ้าช่างหลักไม่ว่าง ใช้ backup technician หรือ reschedule to next day",
    "risk_mitigation": ["มีช่างสำรอง", "อะไหล่พร้อม", "แผน B สำหรับ downtime"]
  },
  "cost_analysis": {
    "labor_cost": 800, // 4 hours × 200 THB/hour
    "parts_cost": 2500,
    "downtime_cost": 6000, // 4 hours × 1500 THB/hour (production loss)
    "total_estimated_cost": 9300,
    "roi_projection": 1250, // % return on investment
    "cost_breakdown": {
      "preventive_maintenance": 3300,
      "avoided_failure_cost": 25000,
      "production_preservation": 22500
    }
  },
  "work_order": {
    "wo_number": "WO-2024-0015",
    "title": "เปลี่ยนตลับลูกปืนปั๊มน้ำ BLR-PMP-01",
    "description": "วินิจฉัยพบ Bearing wear จาก vibration analysis - วางแผนเปลี่ยนในช่วง off-peak เพื่อลด business impact",
    "maintenance_type": "PREDICTIVE", // PREVENTIVE/PREDICTIVE/CORRECTIVE
    "priority": "URGENT",
    "assigned_technician": "สมชาย ใจดี",
    "assigned_technician_id": "EMP001",
    "assigned_line_id": "U1234567890abcdef",
    "scheduled_start": "2024-01-15T22:00:00Z",
    "scheduled_end": "2024-01-16T02:00:00Z",
    "estimated_downtime_start": "2024-01-15T22:00:00Z",
    "estimated_downtime_end": "2024-01-16T02:00:00Z",
    "parts_needed": [
      {
        "part_number": "BRG-6308-NSK",
        "name": "ตลับลูกปืน NSK 6308ZZ",
        "quantity": 1,
        "unit_cost": 2500
      }
    ],
    "estimated_cost": 9300,
    "safety_requirements": ["Lockout-Tagout procedure", "Personal protective equipment"],
    "quality_checks": ["Vibration test after replacement", "Temperature monitoring"]
  },
  "communication_plan": {
    "notify_technician": {
      "channel": "LINE",
      "priority": "HIGH",
      "message_type": "WORK_ORDER_ASSIGNMENT",
      "deadline_response": "1 hour"
    },
    "notify_supervisor": {
      "channel": "LINE",
      "priority": "MEDIUM",
      "message_type": "MAINTENANCE_SCHEDULE",
      "include_cost_analysis": true
    },
    "escalation_plan": "ถ้าช่างไม่ตอบรับภายใน 1 ชั่วโมง → แจ้ง supervisor → เลื่อน schedule"
  },
  "reasoning": "อธิบายการวางแผนและ optimization ภาษาไทยอย่างละเอียด"
}`
  });
  
  let parsedResponse: {
    thinking_rounds?: Array<{ round: number; thought: string; observation: string; conclusion: string }>;
    priority_analysis?: {
      maintenance_urgency: string;
      business_impact_score: number;
      risk_assessment: string;
      justification: string;
    };
    technician_selection?: {
      candidates: Array<{
        name: string;
        employee_id: string;
        line_id: string;
        skill_level: number;
        specializations: string[];
        availability_score: number;
        match_score: number;
        estimated_travel_time: number;
        workload_today: number;
        reasons: string[];
      }>;
      selected_technician: {
        name: string;
        employee_id: string;
        line_id: string;
        confidence_score: number;
      selection_reason: string;
    };
      backup_technicians: string[];
    };
    parts_analysis?: {
      required_parts: Array<{
        part_number: string;
        name: string;
        category: string;
        quantity_needed: number;
        quantity_available: number;
        unit_cost: number;
        lead_time_days: number;
        availability_status: string;
        alternative_parts: string[];
        criticality: string;
      }>;
      total_parts_cost: number;
      parts_availability_confidence: number;
      lead_time_impact: string;
    };
    schedule_optimization?: {
      optimal_start_time: string;
      optimal_end_time: string;
      business_impact_level: string;
      production_downtime_hours: number;
      alternative_slots: Array<{
        start: string;
        end: string;
        impact_score: number;
        reason: string;
      }>;
      contingency_plan: string;
      risk_mitigation: string[];
    };
    cost_analysis?: {
      labor_cost: number;
      parts_cost: number;
      downtime_cost: number;
      total_estimated_cost: number;
      roi_projection: number;
      cost_breakdown: {
        preventive_maintenance: number;
        avoided_failure_cost: number;
        production_preservation: number;
      };
    };
    work_order?: {
      wo_number: string;
      title: string;
      description: string;
      maintenance_type: string;
      priority: string;
      assigned_technician: string;
      assigned_technician_id: string;
      assigned_line_id: string;
      scheduled_start: string;
      scheduled_end: string;
      estimated_downtime_start: string;
      estimated_downtime_end: string;
      parts_needed: Array<{
        part_number: string;
        name: string;
        quantity: number;
        unit_cost: number;
      }>;
      estimated_cost: number;
      safety_requirements: string[];
      quality_checks: string[];
    };
    communication_plan?: {
      notify_technician: {
        channel: string;
        priority: string;
        message_type: string;
        deadline_response: string;
      };
      notify_supervisor: {
        channel: string;
        priority: string;
        message_type: string;
        include_cost_analysis: boolean;
      };
      escalation_plan: string;
    };
    reasoning: string;
  };
  
  try {
    parsedResponse = JSON.parse(llmResponse);
  } catch {
    // Fallback
    const now = new Date();
    parsedResponse = {
      work_order: {
        title: `ซ่อม ${state.machine.name} - ${state.diagnosis.rootCause}`,
        priority: state.anomalyDetails?.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        assigned_technician: technicians?.[0]?.name || 'Unassigned',
        scheduled_start: now.toISOString(),
        scheduled_end: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        parts_needed: [],
        estimated_cost: 5000
      },
      reasoning: 'แผนเริ่มต้น - ต้องตรวจสอบเพิ่มเติม'
    } as any;
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
  
  await updatePipelineStatus(state.sessionId, 'ORCHESTRATOR', 'สรุปแผนงาน', 58);
  
  // ==========================================
  // ROUND 4: Finalize Work Order
  // ==========================================
  const woNumber = `WO-${Date.now()}`;
  
  thinkingRounds.push(createThinkingRound(
    thinkingRounds.length + 1,
    'สรุปและสร้างใบสั่งงาน',
    `Work Order: ${woNumber}
- Title: ${parsedResponse.work_order?.title || 'Maintenance'}
- Priority: ${parsedResponse.work_order?.priority || 'MEDIUM'}
- Technician: ${parsedResponse.work_order?.assigned_technician || 'Unassigned'}
- Parts: ${parsedResponse.work_order?.parts_needed?.length || 0} รายการ
- Cost: ฿${parsedResponse.work_order?.estimated_cost || parsedResponse.cost_analysis?.total_estimated_cost || 0}`,
    `สร้างใบสั่งงานเรียบร้อย - ส่งต่อให้ Liaison Agent สื่อสาร`
  ));
  
  // Create decision path for technician selection
  const decisionPath = createDecisionPath(
    'ควรมอบหมายงานให้ช่างคนไหน?',
    parsedResponse.technician_selection?.candidates.map(c => ({
      option: c.name,
      description: `Match Score: ${c.match_score}%`,
      pros: c.reasons,
      cons: [],
      score: c.match_score,
      selected: c.name === parsedResponse.technician_selection?.selected_technician?.name,
      reason: c.name === parsedResponse.technician_selection?.selected_technician?.name 
        ? parsedResponse.technician_selection.selected_technician.selection_reason 
        : undefined
    })) || [
      {
        option: parsedResponse.work_order?.assigned_technician || 'Unassigned',
        description: 'ช่างที่ว่าง',
        pros: ['พร้อมรับงาน'],
        cons: [],
        score: 80,
        selected: true,
        reason: parsedResponse.reasoning
      }
    ],
    parsedResponse.work_order?.assigned_technician || 'Unassigned',
    parsedResponse.technician_selection?.selected_technician?.selection_reason || parsedResponse.reasoning
  );
  
  // Prepare work order
  const workOrder: WorkOrder = {
    woNumber,
    title: parsedResponse.work_order?.title || 'Maintenance Work Order',
    description: parsedResponse.work_order?.description || parsedResponse.reasoning,
    priority: parsedResponse.work_order?.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' || 'HIGH',
    assignedTechnician: parsedResponse.work_order?.assigned_technician || parsedResponse.technician_selection?.selected_technician?.name || 'Unassigned',
    scheduledStart: parsedResponse.work_order?.scheduled_start || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: parsedResponse.work_order?.scheduled_end || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    partsNeeded: parsedResponse.work_order?.parts_needed?.map(p => ({
      partNumber: p.part_number,
      name: p.name,
      quantity: p.quantity
    })) || [],
    estimatedCost: parsedResponse.work_order?.estimated_cost || parsedResponse.cost_analysis?.total_estimated_cost || 0,
    reasoning: parsedResponse.reasoning
  };
  
  // Create agent log
  const agentLog: AgentLog = {
    id: uuidv4(),
    session_id: state.sessionId,
    agent_name: 'ORCHESTRATOR',
    machine_id: state.machineId,
    action: 'RESOURCE_PLANNING',
    input_data: { 
      diagnosis: state.diagnosis,
      availableTechnicians: technicians?.length,
      availableParts: parts?.length
    },
    output_data: { workOrder },
    reasoning: parsedResponse.reasoning,
    thinking_rounds: thinkingRounds,
    decision_path: decisionPath,
    decision: `Work Order ${woNumber} - ${parsedResponse.work_order?.assigned_technician || 'Technician Assigned'} - ${parsedResponse.priority_analysis?.maintenance_urgency || 'SCHEDULED'}`,
    next_agent: 'LIAISON',
    status: 'COMPLETED',
    duration_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  };
  
  await saveAgentLog(agentLog);

  // Save work order to database
  await saveWorkOrder(state.sessionId, state.machineId, workOrder);

  // Calculate and save business value metrics
  await saveBusinessValueMetrics(state.sessionId, state.machineId, parsedResponse);

  await updatePipelineStatus(
    state.sessionId,
    'ORCHESTRATOR',
    `สร้าง ${woNumber} - ${parsedResponse.work_order?.priority || 'MEDIUM'}`,
    60
  );

  return {
    workOrder,
    technicians: technicians as Technician[],
    parts: parts as Part[],
    currentAgent: 'ORCHESTRATOR',
    currentAction: `สร้างใบสั่งงาน ${woNumber}`,
    progress: 60,
    agentLogs: [agentLog]
  };
}

// Helper functions
async function saveWorkOrder(sessionId: string, machineId: string, workOrder: WorkOrder) {
  console.log('💾 Saving work order to database:', { sessionId, machineId, workOrder });
  const supabase = getSupabaseServer();
  const result = await supabase.from('work_orders').insert({
    wo_number: workOrder.woNumber,
    machine_id: machineId,
    session_id: sessionId,
    title: workOrder.title,
    description: workOrder.description,
    priority: workOrder.priority,
    assigned_technician: workOrder.assignedTechnician,
    scheduled_start: workOrder.scheduledStart,
    scheduled_end: workOrder.scheduledEnd,
    parts_needed: workOrder.partsNeeded.map(p => ({
      part_number: p.partNumber,
      name: p.name,
      quantity: p.quantity
    })),
    estimated_cost: workOrder.estimatedCost,
    reasoning: workOrder.reasoning
  });

  console.log('💾 Work order save result:', result);
}

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

async function saveBusinessValueMetrics(sessionId: string, machineId: string, planningResult: any) {
  const supabase = getSupabaseServer();

  // Extract values from planning result
  const costAnalysis = planningResult.cost_analysis || {};
  const schedule = planningResult.schedule_optimization || {};
  const workOrder = planningResult.work_order || {};

  const businessMetrics = {
    session_id: sessionId,
    machine_id: machineId,
    anomaly_type: 'BEARING_WEAR', // Default for demo
    avoided_downtime_hours: schedule.production_downtime_hours || costAnalysis.labor_cost ? Math.floor(costAnalysis.labor_cost / 200) : 4,
    cost_savings: costAnalysis.cost_breakdown?.production_preservation || costAnalysis.total_estimated_cost * 2.5,
    production_value_preserved: costAnalysis.cost_breakdown?.production_preservation || costAnalysis.total_estimated_cost * 2.5,
    maintenance_cost: workOrder.estimated_cost || costAnalysis.total_estimated_cost || 15000,
    roi_percentage: costAnalysis.roi_projection || Math.round((costAnalysis.cost_breakdown?.production_preservation / costAnalysis.total_estimated_cost) * 100) || 1400
  };

  await supabase.from('business_value_metrics').insert(businessMetrics);
}

