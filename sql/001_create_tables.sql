-- =============================================
-- RESILIX POC - Database Schema
-- =============================================

-- 1. Machines Table (เครื่องจักร)
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'BLR-PMP-01'
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,               -- 'BOILER_PUMP', 'COMPRESSOR', 'MOTOR'
    location VARCHAR(100),
    criticality VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) DEFAULT 'NORMAL',      -- 'NORMAL', 'WARNING', 'CRITICAL', 'MAINTENANCE'
    health_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sensor Readings Table (ข้อมูล Sensor)
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) REFERENCES machines(machine_id),
    timestamp TIMESTAMPTZ NOT NULL,
    status_flag VARCHAR(20) DEFAULT 'NORMAL',  -- 'NORMAL', 'WARNING', 'CRITICAL'
    vib_rms_horizontal DECIMAL(10,4),          -- mm/s
    vib_rms_vertical DECIMAL(10,4),            -- mm/s
    vib_peak_accel DECIMAL(10,4),              -- g
    bearing_temp DECIMAL(10,2),                -- Celsius
    motor_temp DECIMAL(10,2),                  -- Celsius (optional)
    pressure DECIMAL(10,2),                    -- Bar
    current_amp DECIMAL(10,2),                 -- Ampere (optional)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agent Logs Table (Log การทำงานของ Agent) - Enhanced for detailed reasoning
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,                  -- Group logs by session
    agent_name VARCHAR(50) NOT NULL,           -- 'SENTINEL', 'DIAGNOSTICIAN', etc.
    machine_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    reasoning TEXT,                            -- AI's reasoning explanation
    thinking_rounds JSONB,                     -- Array of thinking steps
    decision_path JSONB,                       -- Decision tree with choices
    confidence DECIMAL(5,2),
    decision VARCHAR(100),
    next_agent VARCHAR(50),                    -- Which agent to go next
    status VARCHAR(20) DEFAULT 'COMPLETED',    -- 'PROCESSING', 'COMPLETED', 'FAILED'
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pipeline Sessions Table (Track pipeline execution)
CREATE TABLE pipeline_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) REFERENCES machines(machine_id),
    reading_id UUID,
    status VARCHAR(20) DEFAULT 'RUNNING',      -- 'RUNNING', 'COMPLETED', 'FAILED'
    current_agent VARCHAR(50),                 -- Current active agent
    current_action VARCHAR(200),               -- What the agent is doing now
    progress INTEGER DEFAULT 0,                -- 0-100 percentage
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result_summary JSONB
);

-- 5. Anomalies Table (Anomaly ที่ตรวจพบ)
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) REFERENCES machines(machine_id),
    session_id UUID,
    reading_id UUID REFERENCES sensor_readings(id),
    anomaly_type VARCHAR(100),                 -- 'BEARING_WEAR', 'OVERHEAT', etc.
    severity VARCHAR(20),                      -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'OPEN',         -- 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'
    resolved_at TIMESTAMPTZ
);

-- 6. Diagnoses Table (ผลวินิจฉัย)
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomaly_id UUID REFERENCES anomalies(id),
    machine_id VARCHAR(50),
    session_id UUID,
    root_cause VARCHAR(200),
    confidence DECIMAL(5,2),
    supporting_evidence JSONB,
    recommended_action TEXT,
    time_to_failure VARCHAR(50),               -- e.g., '24-48 hours'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Work Orders Table (ใบงานซ่อม)
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wo_number VARCHAR(50) UNIQUE,
    diagnosis_id UUID REFERENCES diagnoses(id),
    machine_id VARCHAR(50),
    session_id UUID,
    title VARCHAR(200),
    description TEXT,
    priority VARCHAR(20),                      -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    status VARCHAR(20) DEFAULT 'PENDING',      -- 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'
    assigned_technician VARCHAR(100),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    parts_needed JSONB,
    estimated_cost DECIMAL(12,2),
    safety_approved BOOLEAN DEFAULT FALSE,
    human_approved BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications Table (การแจ้งเตือน)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    machine_id VARCHAR(50),
    recipient_type VARCHAR(50),                -- 'PLANT_MANAGER', 'TECHNICIAN', etc.
    recipient_name VARCHAR(100),
    channel VARCHAR(20),                       -- 'LINE', 'EMAIL', 'DASHBOARD'
    message_type VARCHAR(50),                  -- 'ALERT', 'WORK_ORDER', 'STATUS_UPDATE'
    title VARCHAR(200),
    content TEXT,
    priority VARCHAR(20),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 9. Mock Resources (สำหรับ Orchestrator)
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    skill_level INTEGER DEFAULT 3,             -- 1-5
    specializations TEXT[],                    -- ['BEARING', 'PUMP', 'MOTOR']
    is_available BOOLEAN DEFAULT TRUE,
    current_shift VARCHAR(20)                  -- 'MORNING', 'AFTERNOON', 'NIGHT'
);

CREATE TABLE parts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number VARCHAR(50) UNIQUE,
    name VARCHAR(200),
    category VARCHAR(50),
    quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(12,2),
    reorder_point INTEGER DEFAULT 2
);

-- 10. Thresholds Configuration
CREATE TABLE thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_type VARCHAR(50),
    metric VARCHAR(50),                        -- 'vib_rms_horizontal', 'bearing_temp', etc.
    warning_low DECIMAL(10,4),
    warning_high DECIMAL(10,4),
    critical_low DECIMAL(10,4),
    critical_high DECIMAL(10,4),
    unit VARCHAR(20)
);

-- Create indexes for better performance
CREATE INDEX idx_sensor_readings_machine_id ON sensor_readings(machine_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_agent_logs_session_id ON agent_logs(session_id);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX idx_anomalies_machine_id ON anomalies(machine_id);
CREATE INDEX idx_pipeline_sessions_status ON pipeline_sessions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

