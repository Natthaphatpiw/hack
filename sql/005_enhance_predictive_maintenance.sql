-- =============================================
-- RESILIX POC - Enhanced Predictive Maintenance Schema
-- Migration 005: Add LINE OA, Business Value, and Enhanced PM Features
-- =============================================

-- 1. Add LINE ID to technicians table
ALTER TABLE technicians
ADD COLUMN employee_id VARCHAR(20) UNIQUE,
ADD COLUMN line_id VARCHAR(50) UNIQUE,
ADD COLUMN line_registered_at TIMESTAMPTZ,
ADD COLUMN phone VARCHAR(20),
ADD COLUMN email VARCHAR(100),
ADD COLUMN role VARCHAR(50) DEFAULT 'TECHNICIAN',
ADD COLUMN department VARCHAR(50),
ADD COLUMN shift_preference VARCHAR(20) DEFAULT 'MORNING',
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 2. Enhanced diagnoses table with prediction features
ALTER TABLE diagnoses
ADD COLUMN predicted_failure_days INTEGER,
ADD COLUMN confidence_level DECIMAL(5,2),
ADD COLUMN failure_probability DECIMAL(5,2),
ADD COLUMN maintenance_urgency VARCHAR(20), -- 'ROUTINE', 'SCHEDULED', 'URGENT', 'EMERGENCY'
ADD COLUMN estimated_downtime_hours DECIMAL(5,2),
ADD COLUMN cost_impact DECIMAL(12,2),
ADD COLUMN business_impact_score INTEGER, -- 1-10 scale
ADD COLUMN predictive_model_used VARCHAR(100),
ADD COLUMN historical_pattern_match DECIMAL(5,2);

-- 3. Enhanced work_orders table
ALTER TABLE work_orders
ADD COLUMN estimated_downtime_start TIMESTAMPTZ,
ADD COLUMN estimated_downtime_end TIMESTAMPTZ,
ADD COLUMN actual_start TIMESTAMPTZ,
ADD COLUMN actual_end TIMESTAMPTZ,
ADD COLUMN actual_downtime_hours DECIMAL(5,2),
ADD COLUMN assigned_technician_line_id VARCHAR(50),
ADD COLUMN supervisor_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN supervisor_name VARCHAR(100),
ADD COLUMN supervisor_line_id VARCHAR(50),
ADD COLUMN parts_availability BOOLEAN DEFAULT TRUE,
ADD COLUMN maintenance_type VARCHAR(50), -- 'PREVENTIVE', 'PREDICTIVE', 'CORRECTIVE', 'CONDITION_BASED'
ADD COLUMN safety_checklist_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN post_maintenance_health_score INTEGER,
ADD COLUMN maintenance_effectiveness DECIMAL(5,2);

-- 4. Business value tracking table
CREATE TABLE business_value_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    machine_id VARCHAR(50),
    anomaly_type VARCHAR(100),
    avoided_downtime_hours DECIMAL(5,2),
    cost_savings DECIMAL(12,2),
    production_value_preserved DECIMAL(12,2),
    maintenance_cost DECIMAL(12,2),
    roi_percentage DECIMAL(5,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Maintenance schedules table
CREATE TABLE maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50),
    diagnosis_id UUID REFERENCES diagnoses(id),
    scheduled_date TIMESTAMPTZ,
    maintenance_type VARCHAR(50),
    estimated_duration_hours DECIMAL(5,2),
    assigned_technician_id UUID REFERENCES technicians(id),
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    priority_score INTEGER DEFAULT 1, -- 1-10
    business_impact_score INTEGER DEFAULT 1, -- 1-10
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enhanced notifications with LINE OA details
ALTER TABLE notifications
ADD COLUMN line_card_data JSONB,
ADD COLUMN line_message_id VARCHAR(100),
ADD COLUMN recipient_line_id VARCHAR(50),
ADD COLUMN action_required VARCHAR(100),
ADD COLUMN action_deadline TIMESTAMPTZ,
ADD COLUMN action_taken BOOLEAN DEFAULT FALSE,
ADD COLUMN action_taken_at TIMESTAMPTZ,
ADD COLUMN action_taken_by VARCHAR(100);

-- 7. Machine personality/history tracking
CREATE TABLE machine_personality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) UNIQUE,
    total_runtime_hours DECIMAL(10,2) DEFAULT 0,
    total_maintenance_events INTEGER DEFAULT 0,
    average_health_score DECIMAL(5,2) DEFAULT 100,
    failure_patterns JSONB, -- Store common failure types and frequencies
    maintenance_history JSONB, -- Store maintenance effectiveness over time
    behavioral_profile JSONB, -- Store machine behavior patterns
    risk_profile VARCHAR(20) DEFAULT 'LOW', -- 'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vision AI anomaly detection (for external inspection)
CREATE TABLE vision_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50),
    session_id UUID,
    camera_location VARCHAR(100),
    anomaly_type VARCHAR(100), -- 'VISUAL_DAMAGE', 'LEAK', 'OVERHEAT_GLOW', 'UNUSUAL_VIBRATION'
    severity VARCHAR(20),
    confidence DECIMAL(5,2),
    bounding_box JSONB, -- x, y, width, height
    description TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    image_url VARCHAR(500)
);

-- 9. External factors table
CREATE TABLE external_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50),
    factor_type VARCHAR(50), -- 'TEMPERATURE', 'HUMIDITY', 'POWER_QUALITY', 'LOAD_DEMAND'
    factor_value DECIMAL(10,4),
    unit VARCHAR(20),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    impact_score DECIMAL(5,2), -- -1 to 1 (negative = bad, positive = good)
    description TEXT
);

-- 10. Demo case studies table
CREATE TABLE demo_case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_name VARCHAR(200),
    scenario_type VARCHAR(50), -- 'SINGLE_MACHINE', 'MULTI_MACHINE', 'CRITICAL_FAILURE'
    description TEXT,
    mock_sensor_data JSONB,
    expected_anomalies JSONB,
    expected_diagnoses JSONB,
    expected_work_orders JSONB,
    business_impact JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Add indexes for performance
CREATE INDEX idx_technicians_line_id ON technicians(line_id);
CREATE INDEX idx_technicians_employee_id ON technicians(employee_id);
CREATE INDEX idx_diagnoses_machine_id ON diagnoses(machine_id);
CREATE INDEX idx_work_orders_assigned_technician ON work_orders(assigned_technician);
CREATE INDEX idx_maintenance_schedules_machine_id ON maintenance_schedules(machine_id);
CREATE INDEX idx_maintenance_schedules_scheduled_date ON maintenance_schedules(scheduled_date);
CREATE INDEX idx_notifications_recipient_line_id ON notifications(recipient_line_id);
CREATE INDEX idx_vision_anomalies_machine_id ON vision_anomalies(machine_id);
CREATE INDEX idx_external_factors_machine_id ON external_factors(machine_id);
CREATE INDEX idx_external_factors_timestamp ON external_factors(timestamp DESC);

-- 12. Update triggers
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
