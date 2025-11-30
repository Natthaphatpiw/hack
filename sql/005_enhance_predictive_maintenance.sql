-- =============================================
-- RESILIX POC - Enhanced Predictive Maintenance Schema
-- Migration 005: Add LINE OA, Business Value, and Enhanced PM Features
-- =============================================

-- 1. Add LINE ID to technicians table (safe version)
DO $$
BEGIN
    -- Add employee_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'employee_id') THEN
        ALTER TABLE technicians ADD COLUMN employee_id VARCHAR(20);
        RAISE NOTICE 'Added employee_id column to technicians table';
    END IF;

    -- Add line_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'line_id') THEN
        ALTER TABLE technicians ADD COLUMN line_id VARCHAR(50);
        RAISE NOTICE 'Added line_id column to technicians table';
    END IF;

    -- Add line_registered_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'line_registered_at') THEN
        ALTER TABLE technicians ADD COLUMN line_registered_at TIMESTAMPTZ;
        RAISE NOTICE 'Added line_registered_at column to technicians table';
    END IF;

    -- Add phone column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'phone') THEN
        ALTER TABLE technicians ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column to technicians table';
    END IF;

    -- Add email column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'email') THEN
        ALTER TABLE technicians ADD COLUMN email VARCHAR(100);
        RAISE NOTICE 'Added email column to technicians table';
    END IF;

    -- Add role column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'role') THEN
        ALTER TABLE technicians ADD COLUMN role VARCHAR(50) DEFAULT 'TECHNICIAN';
        RAISE NOTICE 'Added role column to technicians table';
    END IF;

    -- Add department column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'department') THEN
        ALTER TABLE technicians ADD COLUMN department VARCHAR(50);
        RAISE NOTICE 'Added department column to technicians table';
    END IF;

    -- Add shift_preference column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'shift_preference') THEN
        ALTER TABLE technicians ADD COLUMN shift_preference VARCHAR(20) DEFAULT 'MORNING';
        RAISE NOTICE 'Added shift_preference column to technicians table';
    END IF;

    -- Add is_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'is_active') THEN
        ALTER TABLE technicians ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to technicians table';
    END IF;

    RAISE NOTICE 'Technicians table enhancement completed';
END $$;

-- 2. Enhanced diagnoses table with prediction features
DO $$
BEGIN
    -- Add predicted_failure_days column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'predicted_failure_days') THEN
        ALTER TABLE diagnoses ADD COLUMN predicted_failure_days INTEGER;
        RAISE NOTICE 'Added predicted_failure_days column to diagnoses table';
    END IF;

    -- Add confidence_level column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'confidence_level') THEN
        ALTER TABLE diagnoses ADD COLUMN confidence_level DECIMAL(5,2);
        RAISE NOTICE 'Added confidence_level column to diagnoses table';
    END IF;

    -- Add failure_probability column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'failure_probability') THEN
        ALTER TABLE diagnoses ADD COLUMN failure_probability DECIMAL(5,2);
        RAISE NOTICE 'Added failure_probability column to diagnoses table';
    END IF;

    -- Add maintenance_urgency column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'maintenance_urgency') THEN
        ALTER TABLE diagnoses ADD COLUMN maintenance_urgency VARCHAR(20);
        RAISE NOTICE 'Added maintenance_urgency column to diagnoses table';
    END IF;

    -- Add estimated_downtime_hours column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'estimated_downtime_hours') THEN
        ALTER TABLE diagnoses ADD COLUMN estimated_downtime_hours DECIMAL(5,2);
        RAISE NOTICE 'Added estimated_downtime_hours column to diagnoses table';
    END IF;

    -- Add cost_impact column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'cost_impact') THEN
        ALTER TABLE diagnoses ADD COLUMN cost_impact DECIMAL(12,2);
        RAISE NOTICE 'Added cost_impact column to diagnoses table';
    END IF;

    -- Add business_impact_score column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'business_impact_score') THEN
        ALTER TABLE diagnoses ADD COLUMN business_impact_score INTEGER;
        RAISE NOTICE 'Added business_impact_score column to diagnoses table';
    END IF;

    -- Add predictive_model_used column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'predictive_model_used') THEN
        ALTER TABLE diagnoses ADD COLUMN predictive_model_used VARCHAR(100);
        RAISE NOTICE 'Added predictive_model_used column to diagnoses table';
    END IF;

    -- Add historical_pattern_match column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'diagnoses' AND column_name = 'historical_pattern_match') THEN
        ALTER TABLE diagnoses ADD COLUMN historical_pattern_match DECIMAL(5,2);
        RAISE NOTICE 'Added historical_pattern_match column to diagnoses table';
    END IF;

    RAISE NOTICE 'Diagnoses table enhancement completed';
END $$;

-- 3. Enhanced work_orders table
DO $$
BEGIN
    -- Add estimated_downtime_start column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'estimated_downtime_start') THEN
        ALTER TABLE work_orders ADD COLUMN estimated_downtime_start TIMESTAMPTZ;
        RAISE NOTICE 'Added estimated_downtime_start column to work_orders table';
    END IF;

    -- Add estimated_downtime_end column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'estimated_downtime_end') THEN
        ALTER TABLE work_orders ADD COLUMN estimated_downtime_end TIMESTAMPTZ;
        RAISE NOTICE 'Added estimated_downtime_end column to work_orders table';
    END IF;

    -- Add actual_start column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'actual_start') THEN
        ALTER TABLE work_orders ADD COLUMN actual_start TIMESTAMPTZ;
        RAISE NOTICE 'Added actual_start column to work_orders table';
    END IF;

    -- Add actual_end column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'actual_end') THEN
        ALTER TABLE work_orders ADD COLUMN actual_end TIMESTAMPTZ;
        RAISE NOTICE 'Added actual_end column to work_orders table';
    END IF;

    -- Add actual_downtime_hours column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'actual_downtime_hours') THEN
        ALTER TABLE work_orders ADD COLUMN actual_downtime_hours DECIMAL(5,2);
        RAISE NOTICE 'Added actual_downtime_hours column to work_orders table';
    END IF;

    -- Add assigned_technician_line_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'assigned_technician_line_id') THEN
        ALTER TABLE work_orders ADD COLUMN assigned_technician_line_id VARCHAR(50);
        RAISE NOTICE 'Added assigned_technician_line_id column to work_orders table';
    END IF;

    -- Add supervisor_approval column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'supervisor_approval') THEN
        ALTER TABLE work_orders ADD COLUMN supervisor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added supervisor_approval column to work_orders table';
    END IF;

    -- Add supervisor_name column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'supervisor_name') THEN
        ALTER TABLE work_orders ADD COLUMN supervisor_name VARCHAR(100);
        RAISE NOTICE 'Added supervisor_name column to work_orders table';
    END IF;

    -- Add supervisor_line_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'supervisor_line_id') THEN
        ALTER TABLE work_orders ADD COLUMN supervisor_line_id VARCHAR(50);
        RAISE NOTICE 'Added supervisor_line_id column to work_orders table';
    END IF;

    -- Add parts_availability column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'parts_availability') THEN
        ALTER TABLE work_orders ADD COLUMN parts_availability BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added parts_availability column to work_orders table';
    END IF;

    -- Add maintenance_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'maintenance_type') THEN
        ALTER TABLE work_orders ADD COLUMN maintenance_type VARCHAR(50);
        RAISE NOTICE 'Added maintenance_type column to work_orders table';
    END IF;

    -- Add safety_checklist_completed column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'safety_checklist_completed') THEN
        ALTER TABLE work_orders ADD COLUMN safety_checklist_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added safety_checklist_completed column to work_orders table';
    END IF;

    -- Add post_maintenance_health_score column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'post_maintenance_health_score') THEN
        ALTER TABLE work_orders ADD COLUMN post_maintenance_health_score INTEGER;
        RAISE NOTICE 'Added post_maintenance_health_score column to work_orders table';
    END IF;

    -- Add maintenance_effectiveness column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'maintenance_effectiveness') THEN
        ALTER TABLE work_orders ADD COLUMN maintenance_effectiveness DECIMAL(5,2);
        RAISE NOTICE 'Added maintenance_effectiveness column to work_orders table';
    END IF;

    -- Add reasoning column if not exists (used by orchestrator)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'work_orders' AND column_name = 'reasoning') THEN
        ALTER TABLE work_orders ADD COLUMN reasoning TEXT;
        RAISE NOTICE 'Added reasoning column to work_orders table';
    END IF;

    RAISE NOTICE 'Work orders table enhancement completed';
END $$;

-- 4. Business value tracking table
CREATE TABLE IF NOT EXISTS business_value_metrics (
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
CREATE TABLE IF NOT EXISTS maintenance_schedules (
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
DO $$
BEGIN
    -- Add line_card_data column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_card_data') THEN
        ALTER TABLE notifications ADD COLUMN line_card_data JSONB;
        RAISE NOTICE 'Added line_card_data column to notifications table';
    END IF;

    -- Add line_message_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_message_id') THEN
        ALTER TABLE notifications ADD COLUMN line_message_id VARCHAR(100);
        RAISE NOTICE 'Added line_message_id column to notifications table';
    END IF;

    -- Add recipient_line_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'recipient_line_id') THEN
        ALTER TABLE notifications ADD COLUMN recipient_line_id VARCHAR(50);
        RAISE NOTICE 'Added recipient_line_id column to notifications table';
    END IF;

    -- Add action_required column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_required') THEN
        ALTER TABLE notifications ADD COLUMN action_required VARCHAR(100);
        RAISE NOTICE 'Added action_required column to notifications table';
    END IF;

    -- Add action_deadline column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_deadline') THEN
        ALTER TABLE notifications ADD COLUMN action_deadline TIMESTAMPTZ;
        RAISE NOTICE 'Added action_deadline column to notifications table';
    END IF;

    -- Add action_taken column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken') THEN
        ALTER TABLE notifications ADD COLUMN action_taken BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added action_taken column to notifications table';
    END IF;

    -- Add action_taken_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_at') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_at TIMESTAMPTZ;
        RAISE NOTICE 'Added action_taken_at column to notifications table';
    END IF;

    -- Add action_taken_by column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_by') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_by VARCHAR(100);
        RAISE NOTICE 'Added action_taken_by column to notifications table';
    END IF;

    RAISE NOTICE 'Notifications table enhancement completed';
END $$;

-- 7. Machine personality/history tracking
CREATE TABLE IF NOT EXISTS machine_personality (
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
CREATE TABLE IF NOT EXISTS vision_anomalies (
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
CREATE TABLE IF NOT EXISTS external_factors (
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
CREATE TABLE IF NOT EXISTS demo_case_studies (
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

-- 11. Add indexes for performance (safe version)
DO $$
BEGIN
    -- Create indexes only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'technicians' AND indexname = 'idx_technicians_line_id') THEN
        CREATE INDEX idx_technicians_line_id ON technicians(line_id);
        RAISE NOTICE 'Created idx_technicians_line_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'technicians' AND indexname = 'idx_technicians_employee_id') THEN
        CREATE INDEX idx_technicians_employee_id ON technicians(employee_id);
        RAISE NOTICE 'Created idx_technicians_employee_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'diagnoses' AND indexname = 'idx_diagnoses_machine_id') THEN
        CREATE INDEX idx_diagnoses_machine_id ON diagnoses(machine_id);
        RAISE NOTICE 'Created idx_diagnoses_machine_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'work_orders' AND indexname = 'idx_work_orders_assigned_technician') THEN
        CREATE INDEX idx_work_orders_assigned_technician ON work_orders(assigned_technician);
        RAISE NOTICE 'Created idx_work_orders_assigned_technician index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'maintenance_schedules' AND indexname = 'idx_maintenance_schedules_machine_id') THEN
        CREATE INDEX idx_maintenance_schedules_machine_id ON maintenance_schedules(machine_id);
        RAISE NOTICE 'Created idx_maintenance_schedules_machine_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'maintenance_schedules' AND indexname = 'idx_maintenance_schedules_scheduled_date') THEN
        CREATE INDEX idx_maintenance_schedules_scheduled_date ON maintenance_schedules(scheduled_date);
        RAISE NOTICE 'Created idx_maintenance_schedules_scheduled_date index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'idx_notifications_recipient_line_id') THEN
        CREATE INDEX idx_notifications_recipient_line_id ON notifications(recipient_line_id);
        RAISE NOTICE 'Created idx_notifications_recipient_line_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'vision_anomalies' AND indexname = 'idx_vision_anomalies_machine_id') THEN
        CREATE INDEX idx_vision_anomalies_machine_id ON vision_anomalies(machine_id);
        RAISE NOTICE 'Created idx_vision_anomalies_machine_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'external_factors' AND indexname = 'idx_external_factors_machine_id') THEN
        CREATE INDEX idx_external_factors_machine_id ON external_factors(machine_id);
        RAISE NOTICE 'Created idx_external_factors_machine_id index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'external_factors' AND indexname = 'idx_external_factors_timestamp') THEN
        CREATE INDEX idx_external_factors_timestamp ON external_factors(timestamp DESC);
        RAISE NOTICE 'Created idx_external_factors_timestamp index';
    END IF;

    RAISE NOTICE 'Index creation completed';
END $$;

-- 12. Update triggers (safe version)
DO $$
BEGIN
    -- Create trigger only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_maintenance_schedules_updated_at') THEN
        CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_maintenance_schedules_updated_at trigger';
    END IF;

    RAISE NOTICE 'Trigger creation completed';
END $$;
