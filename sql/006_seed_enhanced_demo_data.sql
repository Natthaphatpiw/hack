-- =============================================
-- RESILIX POC - Enhanced Demo Data
-- Seed data for LINE OA, Business Value Demo
-- =============================================

-- 1. Add LINE IDs to technicians
UPDATE technicians SET
  employee_id = 'EMP001',
  line_id = 'U1234567890abcdef',
  line_registered_at = NOW(),
  phone = '0812345678',
  email = 'somchai@company.com',
  role = 'TECHNICIAN',
  department = 'MAINTENANCE',
  shift_preference = 'MORNING',
  is_active = TRUE
WHERE name = 'สมชาย ใจดี';

UPDATE technicians SET
  employee_id = 'EMP002',
  line_id = 'U2345678901bcdef0',
  line_registered_at = NOW(),
  phone = '0823456789',
  email = 'pravit@company.com',
  role = 'TECHNICIAN',
  department = 'MAINTENANCE',
  shift_preference = 'AFTERNOON',
  is_active = TRUE
WHERE name = 'ประวิตร มั่นคง';

UPDATE technicians SET
  employee_id = 'EMP003',
  line_id = 'U3456789012cdef01',
  line_registered_at = NOW(),
  phone = '0834567890',
  email = 'somsak@company.com',
  role = 'SUPERVISOR',
  department = 'MAINTENANCE',
  shift_preference = 'MORNING',
  is_active = TRUE
WHERE name = 'สมศักดิ์ รักษา';

-- Add more technicians
INSERT INTO technicians (name, skill_level, specializations, is_available, current_shift, employee_id, line_id, phone, email, role, department, shift_preference) VALUES
('นัฐวุฒิ เทคโนโลยี', 5, ARRAY['ELECTRICAL', 'PLC', 'MOTOR'], TRUE, 'MORNING', 'EMP004', 'U4567890123def012', '0845678901', 'natthawut@company.com', 'TECHNICIAN', 'ELECTRICAL', 'MORNING'),
('ศิริพร ตรวจสอบ', 4, ARRAY['BEARING', 'GEARBOX', 'ALIGNMENT'], TRUE, 'AFTERNOON', 'EMP005', 'U5678901234ef0123', '0856789012', 'siriporn@company.com', 'TECHNICIAN', 'MECHANICAL', 'AFTERNOON'),
('อดิศักดิ์ วิเคราะห์', 4, ARRAY['VIBRATION', 'THERMAL', 'ULTRASONIC'], TRUE, 'NIGHT', 'EMP006', 'U6789012345f01234', '0867890123', 'adisak@company.com', 'SPECIALIST', 'DIAGNOSTICS', 'NIGHT');

-- 2. Add machine personality data
INSERT INTO machine_personality (machine_id, total_runtime_hours, total_maintenance_events, average_health_score, failure_patterns, behavioral_profile, risk_profile) VALUES
('BLR-PMP-01', 15420, 3, 87.5, '{"BEARING_WEAR": 2, "OVERHEAT": 1}'::jsonb, '{"peak_hours": "06:00-18:00", "failure_pattern": "gradual_degradation", "maintenance_response": "predictive_better"}'::jsonb, 'MEDIUM'),
('CMP-001', 25680, 5, 82.3, '{"IMBALANCE": 3, "MISALIGNMENT": 2}'::jsonb, '{"load_fluctuation": "high", "environmental_factors": "dusty", "maintenance_response": "condition_based"}'::jsonb, 'HIGH'),
('MTR-002', 32150, 2, 91.7, '{"OVERLOAD": 1, "INSULATION": 1}'::jsonb, '{"power_quality": "unstable", "usage_pattern": "continuous", "maintenance_response": "preventive_scheduled"}'::jsonb, 'LOW');

-- 3. Add demo case studies
INSERT INTO demo_case_studies (case_name, scenario_type, description, mock_sensor_data, expected_anomalies, expected_diagnoses, expected_work_orders, business_impact) VALUES
('Single Machine Bearing Failure', 'SINGLE_MACHINE',
'เครื่องปั๊มน้ำหลักเกิด bearing wear - แสดง predictive maintenance ที่ป้องกัน downtime',
'{"vib_rms_horizontal": 4.5, "vib_rms_vertical": 3.8, "bearing_temp": 88, "pressure": 8.5}'::jsonb,
'[{"machine_id": "BLR-PMP-01", "type": "BEARING_WEAR", "severity": "CRITICAL"}]'::jsonb,
'[{"root_cause": "Bearing wear from continuous operation", "predicted_failure_days": 3, "confidence_level": 85, "business_impact_score": 8}]'::jsonb,
'[{"wo_number": "WO-2024-0015", "maintenance_type": "PREDICTIVE", "priority": "URGENT", "estimated_cost": 9300}]'::jsonb,
'{"avoided_downtime_hours": 4, "cost_savings": 225000, "roi_percentage": 2300}'::jsonb),

('Multi-Machine Critical Alert', 'MULTI_MACHINE',
'3 เครื่องเกิด anomaly พร้อมกัน - แสดง resource optimization และ priority management',
'{"BLR-PMP-01": {"vib_rms_horizontal": 4.5}, "CMP-001": {"vib_rms_vertical": 5.2}, "MTR-002": {"bearing_temp": 95}}'::jsonb,
'[{"machine_id": "BLR-PMP-01", "type": "BEARING_WEAR", "severity": "CRITICAL"}, {"machine_id": "CMP-001", "type": "IMBALANCE", "severity": "HIGH"}, {"machine_id": "MTR-002", "type": "OVERHEAT", "severity": "HIGH"}]'::jsonb,
'[{"machine_id": "BLR-PMP-01", "business_impact_score": 9}, {"machine_id": "CMP-001", "business_impact_score": 7}, {"machine_id": "MTR-002", "business_impact_score": 6}]'::jsonb,
'[{"machine_id": "BLR-PMP-01", "priority": "EMERGENCY"}, {"machine_id": "CMP-001", "priority": "URGENT"}, {"machine_id": "MTR-002", "priority": "HIGH"}]'::jsonb,
'{"total_avoided_downtime": 12, "total_cost_savings": 675000, "resource_optimization_score": 95}'::jsonb),

('Vision AI + Sensor Integration', 'CRITICAL_FAILURE',
'รวมข้อมูลจาก vision AI และ sensors - แสดง comprehensive diagnostics',
'{"sensors": {"vib_rms_horizontal": 3.2, "bearing_temp": 85}, "vision": {"anomaly_type": "LEAK", "confidence": 92}}'::jsonb,
'[{"machine_id": "BLR-PMP-01", "type": "MULTI_MODE_FAILURE", "severity": "CRITICAL"}]'::jsonb,
'[{"root_cause": "Combined bearing wear + seal leak", "predicted_failure_days": 1, "confidence_level": 95}]'::jsonb,
'[{"maintenance_type": "CONDITION_BASED", "parts_needed": ["BEARING", "SEAL", "GASKET"]}]'::jsonb,
'{"preventive_vs_reactive_savings": 400000, "early_detection_value": 150000}'::jsonb);

-- 4. Add business value benchmarks
INSERT INTO business_value_metrics (session_id, machine_id, anomaly_type, avoided_downtime_hours, cost_savings, production_value_preserved, maintenance_cost, roi_percentage) VALUES
('demo-session-001', 'BLR-PMP-01', 'BEARING_WEAR', 4, 225000, 225000, 9300, 2300),
('demo-session-002', 'CMP-001', 'IMBALANCE', 6, 337500, 337500, 12500, 2600),
('demo-session-003', 'MTR-002', 'OVERHEAT', 2, 112500, 112500, 7800, 1340);

-- 5. Add sample vision anomalies
INSERT INTO vision_anomalies (machine_id, session_id, camera_location, anomaly_type, severity, confidence, description, detected_at) VALUES
('BLR-PMP-01', 'vision-session-001', 'PUMP_BASE', 'VISUAL_DAMAGE', 'MEDIUM', 87, 'Minor corrosion on pump base, potential leak precursor', NOW()),
('CMP-001', 'vision-session-002', 'COMPRESSOR_HEAD', 'OVERHEAT_GLOW', 'HIGH', 94, 'Thermal imaging shows abnormal heat pattern around compressor head', NOW() - INTERVAL '1 day'),
('MTR-002', 'vision-session-003', 'MOTOR_COUPLING', 'UNUSUAL_VIBRATION', 'LOW', 76, 'Visual vibration amplitude higher than normal at coupling point', NOW() - INTERVAL '2 days');

-- 6. Add external factors data
INSERT INTO external_factors (machine_id, factor_type, factor_value, unit, impact_score, description) VALUES
('BLR-PMP-01', 'TEMPERATURE', 32.5, '°C', -0.2, 'High ambient temperature increases bearing thermal stress'),
('CMP-001', 'HUMIDITY', 78, '%', -0.15, 'High humidity accelerates corrosion in compressor components'),
('MTR-002', 'POWER_QUALITY', 0.95, 'PF', -0.1, 'Poor power factor indicates electrical stress on motor'),
('BLR-PMP-01', 'LOAD_DEMAND', 85, '%', 0.25, 'High load demand accelerates wear on pump components'),
('CMP-001', 'DUST_LEVEL', 120, 'µg/m³', -0.3, 'High dust concentration affects air intake filters');

-- 7. Add maintenance schedules
INSERT INTO maintenance_schedules (machine_id, scheduled_date, maintenance_type, estimated_duration_hours, assigned_technician_id, status, priority_score, business_impact_score) VALUES
('BLR-PMP-01', NOW() + INTERVAL '2 hours', 'PREDICTIVE', 4, (SELECT id FROM technicians WHERE name = 'สมชาย ใจดี'), 'SCHEDULED', 9, 8),
('CMP-001', NOW() + INTERVAL '4 hours', 'CONDITION_BASED', 6, (SELECT id FROM technicians WHERE name = 'ประวิตร มั่นคง'), 'CONFIRMED', 7, 6),
('MTR-002', NOW() + INTERVAL '1 day', 'PREVENTIVE', 2, (SELECT id FROM technicians WHERE name = 'นัฐวุฒิ เทคโนโลยี'), 'SCHEDULED', 5, 4);
