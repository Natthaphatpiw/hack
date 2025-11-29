// =============================================
// Liaison Agent - LINE OA Communication & Action Tracking
// =============================================

import { v4 as uuidv4 } from 'uuid';
import { GraphStateType, createThinkingRound, createDecisionPath } from './types';
import { generateWithLLM } from '../llm/client';
import { getSupabaseServer } from '../supabase/server';
import type { AgentLog, ThinkingRound, Notification } from '@/types';

// Helper function to create work order card message
function createWorkOrderCard(workOrder: any) {
  const workOrderId = workOrder.id;
  const machineName = workOrder.machine_id || 'Unknown Machine';
  const priority = workOrder.priority || 'MEDIUM';
  const scheduledTime = workOrder.scheduled_start ?
    new Date(workOrder.scheduled_start).toLocaleString('th-TH') : 'ไม่ระบุ';

  const priorityColor = {
    'LOW': '#10B981',      // Green
    'MEDIUM': '#F59E0B',   // Yellow
    'HIGH': '#EF4444',     // Red
    'URGENT': '#DC2626'    // Dark Red
  };

  return {
    type: 'flex',
    altText: `งานซ่อมเครื่องจักร: ${machineName}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔧 งานซ่อมเครื่องจักร',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#1E293B',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'เครื่องจักร:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: machineName,
                size: 'sm',
                color: '#FFFFFF',
                weight: 'bold',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'ความสำคัญ:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: priority,
                size: 'sm',
                color: priorityColor[priority as keyof typeof priorityColor] || '#64748B',
                weight: 'bold',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'กำหนดเวลา:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: scheduledTime,
                size: 'sm',
                color: '#FFFFFF',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: workOrder.description || 'กรุณาดำเนินการซ่อมเครื่องจักรตามแผนงาน',
            size: 'sm',
            color: '#E2E8F0',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: 'รับงาน',
                  data: `accept_work:${workOrderId}`,
                  displayText: 'ฉันรับงานนี้แล้ว'
                },
                color: '#10B981',
                style: 'primary',
                margin: 'sm'
              },
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: 'ซ่อมเสร็จ',
                  data: `complete_work:${workOrderId}`,
                  displayText: 'งานซ่อมเสร็จแล้ว'
                },
                color: '#3B82F6',
                style: 'secondary',
                margin: 'sm'
              }
            ],
            spacing: 'sm'
          }
        ],
        backgroundColor: '#0F172A'
      },
      styles: {
        hero: {
          backgroundColor: '#1E293B'
        },
        body: {
          backgroundColor: '#0F172A'
        },
        footer: {
          backgroundColor: '#0F172A'
        }
      }
    }
  };
}

// Helper function to create manager notification card
function createManagerNotificationCard(notification: any) {
  const timestamp = new Date().toLocaleString('th-TH');

  return {
    type: 'flex',
    altText: `แจ้งเตือน: ${notification.title}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 แจ้งเตือนจากระบบ',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#1E293B',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: notification.title,
            weight: 'bold',
            size: 'md',
            color: '#FFFFFF',
            margin: 'md'
          },
          {
            type: 'text',
            text: notification.content,
            size: 'sm',
            color: '#E2E8F0',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'เวลา:',
                size: 'xs',
                color: '#64748B',
                flex: 1
              },
              {
                type: 'text',
                text: timestamp,
                size: 'xs',
                color: '#94A3B8',
                flex: 2
              }
            ],
            margin: 'md'
          }
        ]
      },
      styles: {
        hero: {
          backgroundColor: '#1E293B'
        },
        body: {
          backgroundColor: '#0F172A'
        }
      }
    }
  };
}

export async function runLiaisonAgent(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const startTime = Date.now();
  const thinkingRounds: ThinkingRound[] = [];
  
  await updatePipelineStatus(state.sessionId, 'LIAISON', 'เริ่มสร้างการแจ้งเตือน', 90);
  
  // ==========================================
  // ROUND 1: Assess Communication Needs
  // ==========================================
  const hasAnomaly = state.anomalyDetected;
  const hasDiagnosis = !!state.diagnosis;
  const hasWorkOrder = !!state.workOrder;
  const requiresHumanApproval = state.safetyApproval?.requiresHumanApproval;
  const severity = state.anomalyDetails?.severity || 'LOW';
  
  thinkingRounds.push(createThinkingRound(
    1,
    'ประเมินความต้องการในการสื่อสาร',
    `สถานะปัจจุบัน:
- Anomaly Detected: ${hasAnomaly}
- Diagnosis Available: ${hasDiagnosis}
- Work Order Created: ${hasWorkOrder}
- Requires Human Approval: ${requiresHumanApproval}
- Severity: ${severity}`,
    `ต้องแจ้งเตือน ${requiresHumanApproval ? 'เร่งด่วน - รอการอนุมัติ' : 'ตามปกติ'}`
  ));
  
  await updatePipelineStatus(state.sessionId, 'LIAISON', 'กำหนดผู้รับและช่องทาง', 92);
  
  // ==========================================
  // ROUND 2: Determine Recipients
  // ==========================================
  const recipients: Array<{ type: string; priority: string; channels: string[] }> = [];
  
  // Determine who needs to be notified based on severity and approval status
  if (severity === 'CRITICAL' || requiresHumanApproval) {
    recipients.push({
      type: 'PLANT_MANAGER',
      priority: 'URGENT',
      channels: ['LINE', 'DASHBOARD']
    });
  }
  
  if (hasWorkOrder) {
    recipients.push({
      type: 'TECHNICIAN',
      priority: state.workOrder?.priority || 'HIGH',
      channels: ['LINE', 'DASHBOARD']
    });
    recipients.push({
      type: 'MAINTENANCE_HEAD',
      priority: state.workOrder?.priority || 'HIGH',
      channels: ['DASHBOARD', 'EMAIL']
    });
  }
  
  thinkingRounds.push(createThinkingRound(
    2,
    'กำหนดผู้รับการแจ้งเตือน',
    `ผู้ที่ต้องแจ้ง:
${recipients.map(r => `- ${r.type}: Priority ${r.priority}, Channels: ${r.channels.join(', ')}`).join('\n')}`,
    `จะส่งการแจ้งเตือนถึง ${recipients.length} กลุ่ม`
  ));
  
  await updatePipelineStatus(state.sessionId, 'LIAISON', 'สร้างข้อความด้วย AI', 94);
  
  // ==========================================
  // ROUND 3: AI-Powered Message Generation
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    3,
    'ใช้ AI สร้างข้อความที่เหมาะสมสำหรับแต่ละผู้รับ',
    `Context:
- Machine: ${state.machine.name}
- Anomaly: ${state.anomalyDetails?.type || 'N/A'}
- Root Cause: ${state.diagnosis?.rootCause || 'N/A'}
- Work Order: ${state.workOrder?.woNumber || 'N/A'}
- Safety Decision: ${state.safetyApproval?.decision || 'N/A'}`,
    'กำลังสร้างข้อความ...'
  ));
  
  const llmResponse = await generateWithLLM({
    systemPrompt: `คุณคือ Liaison Agent - LINE OA Communication Specialist สำหรับ Predictive Maintenance

🎯 **ภารกิจหลัก:** สร้าง LINE Card Messages ที่สวยงาม ทันสมัย และส่งถึงผู้เกี่ยวข้องอย่างมีประสิทธิภาพ

📱 **LINE OA Features:**
- **Rich Cards:** ใช้รูปภาพ, ปุ่ม, และ interactive elements
- **Personalization:** ส่งให้คนที่เหมาะสมตาม line_id
- **Action Tracking:** ติดตามการตอบรับและการดำเนินการ
- **Business Value:** แสดง ROI และ impact ที่ชัดเจน

👥 **Segmentation & Personalization:**
- **Technicians:** LINE OA สำหรับช่าง → แสดง work order details, parts needed, schedule
- **Supervisors/Managers:** LINE OA สำหรับผู้บริหาร → แสดง business impact, cost analysis, ROI
- **Multi-language:** ไทย + Technical terms ที่เข้าใจง่าย

🎨 **Card Design Principles:**
- **Visual Hierarchy:** ใช้สีเพื่อแสดง priority (🔴 Critical, 🟡 Warning, 🟢 Normal)
- **Action Buttons:** Accept/Reject, Confirm Schedule, Report Progress
- **Data Visualization:** แสดง metrics, costs, timeline ในรูปแบบ card
- **Progressive Disclosure:** ข้อมูลสำคัญก่อน, รายละเอียดเพิ่มเติมใน expansion

💼 **Business Value Communication:**
- **ROI Calculation:** แสดงเงินที่ประหยัดได้จากการ predictive maintenance
- **Downtime Prevention:** อธิบาย impact ถ้าไม่ซ่อม
- **Cost Breakdown:** แยก labor, parts, downtime costs
- **Success Metrics:** แสดง % confidence และ risk reduction

📊 **Message Types:**
1. **Work Order Assignment** → ช่าง: รายละเอียดงาน, อะไหล่, schedule
2. **Maintenance Alert** → ผู้บริหาร: Business impact, cost analysis
3. **Progress Update** → ผู้บริหาร: สถานะงาน, completion status
4. **Completion Report** → ผู้บริหาร: Results, ROI achieved

🎯 **Action Tracking:**
- **Response Deadline:** กำหนดเวลาตอบรับ (1-24 ชั่วโมง)
- **Escalation:** ถ้าไม่ตอบ → ส่ง supervisor
- **Confirmation:** Track acceptance และ completion

ตอบเป็น JSON เท่านั้นพร้อม LINE card specifications`,
    userPrompt: `สร้างการแจ้งเตือน:

Machine: ${state.machine.name} (${state.machine.machine_id})
Location: ${state.machine.location}
Criticality: ${state.machine.criticality}

${state.anomalyDetected ? `Anomaly Detected:
- Type: ${state.anomalyDetails?.type}
- Severity: ${state.anomalyDetails?.severity}` : 'No anomaly detected'}

${state.diagnosis ? `Diagnosis:
- Root Cause: ${state.diagnosis.rootCause}
- Confidence: ${state.diagnosis.confidence}%
- Time to Failure: ${state.diagnosis.timeToFailure}
- Recommended Action: ${state.diagnosis.recommendedAction}` : ''}

${state.workOrder ? `Work Order:
- Number: ${state.workOrder.woNumber}
- Title: ${state.workOrder.title}
- Priority: ${state.workOrder.priority}
- Technician: ${state.workOrder.assignedTechnician}
- Scheduled: ${state.workOrder.scheduledStart}
- Estimated Cost: ฿${state.workOrder.estimatedCost}` : ''}

${state.safetyApproval ? `Safety Decision:
- Decision: ${state.safetyApproval.decision}
- Requires Human Approval: ${state.safetyApproval.requiresHumanApproval}` : ''}

Recipients to notify:
${recipients.map(r => `- ${r.type}: Priority ${r.priority}`).join('\n')}

${state.workOrder ? `แจ้งเตือนผู้บริหาร:
- แจ้งการวางแผนงานซ่อมให้ช่าง ${state.workOrder.assignedTechnician}
- แสดง business impact และ ROI
- ติดตาม progress จนกว่าจะเสร็จสิ้น` : ''}

ตอบในรูปแบบ JSON พร้อม LINE card specifications:

{
  "thinking_rounds": [
    {
      "round": 1,
      "thought": "วิเคราะห์ audience และ business impact",
      "observation": "ข้อมูลสำหรับ personalization และ ROI calculation",
      "conclusion": "กำหนด communication strategy ที่ optimize engagement"
    }
  ],
  "line_communications": [
    {
      "message_id": "WO-ASSIGN-001",
      "recipient_type": "TECHNICIAN",
      "recipient_line_id": "U1234567890abcdef",
      "recipient_name": "สมชาย ใจดี",
      "message_type": "WORK_ORDER_ASSIGNMENT",
      "priority": "HIGH",
      "card_design": {
        "header_color": "#FF6B6B",
        "icon": "🔧",
        "title": "🎯 งานซ่อมด่วน: เปลี่ยนตลับลูกปืนปั๊มน้ำ",
        "subtitle": "BLR-PMP-01 • ระดับ Critical • เริ่ม 22:00 น.",
        "image_url": "https://example.com/pump-maintenance.jpg"
      },
      "content_sections": [
        {
          "type": "metrics",
          "title": "📊 สถานะเครื่องจักร",
          "data": {
            "Vibration H": "4.5 mm/s 🔴",
            "Vibration V": "3.8 mm/s 🟡",
            "Bearing Temp": "88°C 🔴",
            "Time to Failure": "24 ชั่วโมง ⚠️"
          }
        },
        {
          "type": "work_details",
          "title": "🔧 รายละเอียดงาน",
          "data": {
            "อะไหล่ที่ต้องใช้": "ตลับลูกปืน NSK 6308ZZ × 1",
            "เวลาโดยประมาณ": "4 ชั่วโมง",
            "ความยาก": "Medium",
            "Safety Requirements": "Lockout-Tagout, PPE"
          }
        },
        {
          "type": "schedule",
          "title": "⏰ ตารางงาน",
          "data": {
            "เริ่มงาน": "22:00 น. วันนี้",
            "เสร็จสิ้น": "02:00 น. พรุ่งนี้",
            "Business Impact": "ลด downtime 4 ชั่วโมง",
            "Production Saved": "6,000 THB"
          }
    },
    {
      "message_id": "WO-PLANNED-001",
      "recipient_type": "PLANT_MANAGER",
      "recipient_line_id": "U987654321fedcba",
      "recipient_name": "นวลพรรณ สวยงาม",
      "message_type": "WORK_ORDER_PLANNED",
      "priority": "MEDIUM",
      "card_design": {
        "header_color": "#2196F3",
        "icon": "📋",
        "title": "📋 วางแผนงานซ่อม: เปลี่ยนตลับลูกปืนปั๊มน้ำ",
        "subtitle": "BLR-PMP-01 • มอบหมายให้ช่าง สมชาย ใจดี",
        "image_url": null
      },
      "content_sections": [
        {
          "type": "work_summary",
          "title": "🔧 สรุปงานซ่อม",
          "data": {
            "ช่างผู้รับผิดชอบ": "สมชาย ใจดี",
            "กำหนดเริ่มงาน": "22:00 น. วันนี้",
            "เวลาโดยประมาณ": "4 ชั่วโมง",
            "ค่าซ่อมโดยประมาณ": "5,000 THB"
          }
        },
        {
          "type": "business_impact",
          "title": "💰 ผลกระทบทางธุรกิจ",
          "data": {
            "ป้องกัน downtime": "4 ชั่วโมง",
            "มูลค่าการผลิตที่รักษา": "6,000 THB",
            "ROI จากการซ่อมล่วงหน้า": "120%",
            "ความเสี่ยงถ้าไม่ซ่อม": "Critical Failure"
          }
        }
      ],
      "action_buttons": [
        {
          "label": "✅ อนุมัติแผนงาน",
          "action": "APPROVE_WORK_ORDER",
          "color": "#4CAF50"
        },
        {
          "label": "🔄 ปรับแผนงาน",
          "action": "MODIFY_WORK_ORDER",
          "color": "#FF9800"
        }
      ]
    }
  ],
      "action_buttons": [
        {
          "label": "✅ ยอมรับงาน",
          "action": "ACCEPT_WORK_ORDER",
          "color": "#4CAF50",
          "deadline_hours": 1
        },
        {
          "label": "❌ ปฏิเสธ",
          "action": "REJECT_WORK_ORDER",
          "color": "#F44336",
          "reason_required": true
        },
    {
          "label": "📞 ติดต่อ Supervisor",
          "action": "CONTACT_SUPERVISOR",
          "color": "#2196F3"
        }
      ],
      "escalation_rules": {
        "no_response_deadline": "1 ชั่วโมง",
        "escalate_to": "SUPERVISOR",
        "auto_reassign": true
      }
    },
    {
      "message_id": "EXECUTIVE-ALERT-001",
      "recipient_type": "PLANT_MANAGER",
      "recipient_line_id": "U987654321fedcba",
      "recipient_name": "นายดำรงค์ วิชาชีพ",
      "message_type": "EXECUTIVE_ALERT",
      "priority": "HIGH",
      "card_design": {
        "header_color": "#FF9800",
        "icon": "💰",
        "title": "🚨 Predictive Maintenance Alert",
        "subtitle": "Potential Cost Savings: 225,000 THB",
        "image_url": "https://example.com/roi-chart.jpg"
      },
      "content_sections": [
        {
          "type": "business_impact",
          "title": "💼 Business Impact Summary",
          "data": {
            "Machine": "BLR-PMP-01 (Critical Asset)",
            "Issue": "Bearing Wear Detected",
            "Confidence": "85% AI Prediction",
            "Time to Failure": "24 ชั่วโมง"
          }
        },
        {
          "type": "cost_analysis",
          "title": "💰 Cost-Benefit Analysis",
          "data": {
            "Preventive Cost": "9,300 THB",
            "Avoided Downtime": "225,000 THB",
            "ROI": "2,400%",
            "Payback Period": "Immediate"
          }
        },
        {
          "type": "action_required",
          "title": "🎯 Required Actions",
          "data": {
            "Technician Assigned": "สมชาย ใจดี",
            "Scheduled Time": "22:00 น. วันนี้",
            "Approval Needed": "Work Order Confirmation",
            "Monitoring": "Real-time Progress Tracking"
          }
        }
      ],
      "action_buttons": [
        {
          "label": "📋 ดูรายละเอียด",
          "action": "VIEW_DETAILS",
          "color": "#2196F3"
        },
        {
          "label": "✅ อนุมัติ",
          "action": "APPROVE_WORK_ORDER",
          "color": "#4CAF50"
        },
        {
          "label": "⏰ เลื่อนกำหนด",
          "action": "RESCHEDULE",
          "color": "#FF9800",
          "reason_required": true
        }
      ]
    }
  ],
  "communication_strategy": {
    "segmentation_logic": "ส่ง work order ให้ technician, business impact ให้ executives",
    "personalization_level": "High - ใช้ชื่อ, line_id, และ role-specific content",
    "urgency_optimization": "Critical issues = immediate notification, Routine = scheduled summary",
    "engagement_maximization": "ใช้ visual elements, clear CTAs, และ time-sensitive deadlines",
    "fallback_procedures": "LINE failed → SMS, SMS failed → Email, Email failed → Phone call"
  },
  "expected_outcomes": {
    "technician_response_rate": "95% within 1 hour",
    "work_completion_rate": "90% on schedule",
    "cost_savings_realized": "200,000+ THB",
    "system_adoption_rate": "85% of maintenance activities"
  },
  "reasoning": "อธิบายกลยุทธ์การสื่อสารและ ROI expectations อย่างละเอียด"
}`
  });
  
  let parsedResponse: {
    thinking_rounds?: Array<{ round: number; thought: string; observation: string; conclusion: string }>;
    line_communications?: Array<any>;
    notifications?: Array<{
      recipientType: 'PLANT_MANAGER' | 'TECHNICIAN' | 'MAINTENANCE_HEAD';
      recipientName: string;
      channel: 'LINE' | 'EMAIL' | 'DASHBOARD';
      messageType: 'ALERT' | 'WORK_ORDER' | 'STATUS_UPDATE';
      title: string;
      content: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }>;
    communication_strategy?: {
      primary_message: string;
      urgency_level: string;
      expected_actions: string[];
    };
    reasoning: string;
  };
  
  try {
    parsedResponse = JSON.parse(llmResponse);
  } catch {
    // Fallback LINE communications
    parsedResponse = {
      line_communications: [{
        message_id: 'FALLBACK-ALERT-001',
        recipient_type: 'PLANT_MANAGER',
        recipient_line_id: 'U987654321fedcba',
        recipient_name: 'ผู้จัดการโรงงาน',
        message_type: 'EXECUTIVE_ALERT',
        priority: severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        card_design: {
          header_color: severity === 'CRITICAL' ? '#FF6B6B' : '#FF9800',
          icon: '⚠️',
          title: `แจ้งเตือน: ${state.machine.name}`,
          subtitle: state.anomalyDetails?.type || 'ระบบตรวจสอบ',
          image_url: null
        },
        content_sections: [{
          type: 'alert',
          title: 'System Alert',
          data: {
            machine: state.machine.name,
            status: state.anomalyDetected ? 'ANOMALY_DETECTED' : 'NORMAL',
            severity: severity,
            time: new Date().toLocaleString('th-TH')
          }
        }],
        action_buttons: [{
          label: 'ดูรายละเอียด',
          action: 'VIEW_DETAILS',
          color: '#2196F3'
        }],
        reasoning: 'Fallback LINE card created due to AI processing error'
      }],
      reasoning: 'Fallback LINE communication created'
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
  
  await updatePipelineStatus(state.sessionId, 'LIAISON', 'ส่งการแจ้งเตือน', 96);
  
  // ==========================================
  // ROUND 4: Final Summary
  // ==========================================
  thinkingRounds.push(createThinkingRound(
    thinkingRounds.length + 1,
    'สรุปการสร้างและส่งการแจ้งเตือน',
    `จำนวนการแจ้งเตือน: ${parsedResponse.line_communications?.length || 0}
${parsedResponse.line_communications?.map((n: any) => `- ${n.recipient_type}: LINE (${n.priority})`).join('\n') || ''}`,
    `ส่งการแจ้งเตือนเรียบร้อย ${parsedResponse.line_communications?.length || 0} รายการ`
  ));
  
  // Create decision path
  const decisionPath = createDecisionPath(
    'ควรแจ้งเตือนใครบ้างและผ่านช่องทางไหน?',
    (parsedResponse.line_communications || []).map((n: any) => ({
      option: `${n.recipient_type} via LINE`,
      description: n.card_design?.title || n.message_id,
      pros: [`Priority: ${n.priority}`, `Message Type: ${n.message_type}`],
      cons: [],
      score: n.priority === 'URGENT' ? 100 : n.priority === 'HIGH' ? 80 : 60,
      selected: true,
      reason: parsedResponse.communication_strategy?.primary_message
    })),
    `ส่ง ${parsedResponse.line_communications?.length || 0} การแจ้งเตือน`,
    parsedResponse.reasoning
  );
  
  const notifications: any[] = parsedResponse.line_communications || [];
  
  // Create agent log
  const agentLog: AgentLog = {
    id: uuidv4(),
    session_id: state.sessionId,
    agent_name: 'LIAISON',
    machine_id: state.machineId,
    action: 'CREATE_NOTIFICATIONS',
    input_data: { 
      safetyApproval: state.safetyApproval,
      workOrder: state.workOrder?.woNumber
    },
    output_data: { 
      notificationCount: notifications.length,
      recipients: notifications.map((n: any) => n.recipient_type)
    },
    reasoning: parsedResponse.reasoning,
    thinking_rounds: thinkingRounds,
    decision_path: decisionPath,
    decision: `Created ${notifications.length} notification(s) - ${notifications.map(n => n.recipientType).join(', ')}`,
    next_agent: 'END',
    status: 'COMPLETED',
    duration_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  };
  
  await saveAgentLog(agentLog);
  await saveNotifications(state.sessionId, state.machineId, notifications, state.workOrder);
  await updatePipelineStatus(
    state.sessionId, 
    'LIAISON', 
    `ส่งการแจ้งเตือน ${notifications.length} รายการ`,
    100
  );
  
  // Mark pipeline as completed
  await completePipeline(state);
  
  return {
    notifications,
    currentAgent: 'LIAISON',
    currentAction: `ส่งการแจ้งเตือน ${notifications.length} รายการ`,
    progress: 100,
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

async function saveNotifications(sessionId: string, machineId: string, lineCommunications: any[], workOrder?: any) {
  const supabase = getSupabaseServer();

  // Get employee line IDs from employees table
  const { data: employees } = await supabase
    .from('employees')
    .select('name, line_user_id, role');

  const employeeMap = new Map(employees?.map(e => [e.name, {
    lineId: e.line_user_id,
    role: e.role
  }]) || []);

  for (const comm of lineCommunications) {
    let recipientLineId = null;
    let recipientName = comm.recipient_name;

    // Map recipient to line ID from employees table
    if (comm.recipient_type === 'TECHNICIAN') {
      const empInfo = employeeMap.get(comm.recipient_name);
      recipientLineId = empInfo?.lineId;
    } else if (comm.recipient_type === 'PLANT_MANAGER' || comm.recipient_type === 'MAINTENANCE_HEAD') {
      // Find manager/supervisor from employees
      const managers = employees?.filter(e =>
        e.role === 'MANAGER' || e.role === 'SUPERVISOR'
      ) || [];
      if (managers.length > 0) {
        recipientLineId = managers[0].line_user_id;
        recipientName = managers[0].name;
      } else {
        // Fallback mock ID for demo
        recipientLineId = 'U987654321fedcba';
      }
    }

    // Save notification to database
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        session_id: sessionId,
        machine_id: machineId,
        recipient_type: comm.recipient_type,
        recipient_name: recipientName,
        recipient_line_id: recipientLineId,
        channel: 'LINE',
        message_type: comm.message_type,
        title: comm.card_design?.title || comm.message_id,
        content: comm.card_design?.content || `LINE Card Message: ${comm.card_design?.title}`,
        priority: comm.priority,
        line_card_data: comm,
        action_required: comm.action_buttons?.length > 0,
        action_deadline: comm.action_buttons?.find((btn: any) => btn.deadline_hours)
          ? new Date(Date.now() + (comm.action_buttons.find((btn: any) => btn.deadline_hours).deadline_hours * 60 * 60 * 1000)).toISOString()
          : null
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error saving notification:', notifError);
      continue;
    }

    // Send LINE message if we have a valid line ID
    if (recipientLineId && recipientLineId !== 'U987654321fedcba') {
      try {
        let messageContent;

        // Create appropriate message based on recipient type
        if (comm.recipient_type === 'TECHNICIAN' && comm.message_type === 'WORK_ORDER') {
          // Create work order card for technician using actual work order
          const actualWorkOrder = workOrder || {
            id: `wo-${Date.now()}`, // Fallback if no work order
            machine_id: machineId,
            priority: comm.priority,
            scheduled_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            description: comm.card_design?.content || 'กรุณาดำเนินการซ่อมเครื่องจักร'
          };
          messageContent = createWorkOrderCard(actualWorkOrder);
        } else {
          // Create general notification card for managers
          messageContent = createManagerNotificationCard({
            title: comm.card_design?.title || comm.message_id,
            content: comm.card_design?.content || comm.message_id,
            priority: comm.priority
          });
        }

        // Send via LINE API
        const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/line/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: recipientLineId,
            messages: [messageContent]
          })
        });

        if (sendResponse.ok) {
          const sendResult = await sendResponse.json();
          console.log('LINE message sent successfully:', sendResult);

          // Update notification with message ID
          await supabase
            .from('notifications')
            .update({
              line_message_id: sendResult.messageId,
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);
        } else {
          console.error('Failed to send LINE message:', await sendResponse.text());
        }
      } catch (error) {
        console.error('Error sending LINE message:', error);
      }
    }
  }
}

async function completePipeline(state: GraphStateType) {
  const supabase = getSupabaseServer();
  await supabase.from('pipeline_sessions').update({
    status: 'COMPLETED',
    progress: 100,
    completed_at: new Date().toISOString(),
    result_summary: {
      anomalyDetected: state.anomalyDetected,
      anomalyType: state.anomalyDetails?.type,
      severity: state.anomalyDetails?.severity,
      rootCause: state.diagnosis?.rootCause,
      workOrder: state.workOrder?.woNumber,
      safetyDecision: state.safetyApproval?.decision,
      notificationCount: state.notifications?.length || 0
    }
  }).eq('id', state.sessionId);
}

