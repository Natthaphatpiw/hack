// =============================================
// Agent Metadata - Client-safe (no server dependencies)
// =============================================

import type { AgentName } from '@/types';

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

