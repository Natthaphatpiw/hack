-- =============================================
-- Supabase Functions for Real-time
-- =============================================

-- Function to get latest reading for each machine
CREATE OR REPLACE FUNCTION get_latest_readings()
RETURNS TABLE (
    machine_id VARCHAR(50),
    "timestamp" TIMESTAMPTZ,
    status_flag VARCHAR(20),
    vib_rms_horizontal DECIMAL(10,4),
    vib_rms_vertical DECIMAL(10,4),
    bearing_temp DECIMAL(10,2),
    pressure DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (sr.machine_id)
        sr.machine_id,
        sr.timestamp,
        sr.status_flag,
        sr.vib_rms_horizontal,
        sr.vib_rms_vertical,
        sr.bearing_temp,
        sr.pressure
    FROM sensor_readings sr
    ORDER BY sr.machine_id, sr.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check anomaly based on thresholds
CREATE OR REPLACE FUNCTION check_anomaly(
    p_machine_id VARCHAR(50),
    p_vib_horizontal DECIMAL,
    p_vib_vertical DECIMAL,
    p_bearing_temp DECIMAL,
    p_pressure DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_anomalies JSONB := '[]'::JSONB;
    v_threshold RECORD;
    v_machine_type VARCHAR(50);
BEGIN
    -- Get machine type
    SELECT type INTO v_machine_type FROM machines WHERE machine_id = p_machine_id;
    
    -- Check each threshold
    FOR v_threshold IN 
        SELECT * FROM thresholds WHERE machine_type = v_machine_type
    LOOP
        IF v_threshold.metric = 'vib_rms_horizontal' AND 
           (p_vib_horizontal > v_threshold.critical_high OR p_vib_horizontal > v_threshold.warning_high) THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'metric', 'vib_rms_horizontal',
                'value', p_vib_horizontal,
                'threshold', v_threshold.warning_high,
                'severity', CASE WHEN p_vib_horizontal > v_threshold.critical_high THEN 'CRITICAL' ELSE 'WARNING' END
            );
        END IF;
        
        IF v_threshold.metric = 'bearing_temp' AND 
           (p_bearing_temp > v_threshold.critical_high OR p_bearing_temp > v_threshold.warning_high) THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'metric', 'bearing_temp',
                'value', p_bearing_temp,
                'threshold', v_threshold.warning_high,
                'severity', CASE WHEN p_bearing_temp > v_threshold.critical_high THEN 'CRITICAL' ELSE 'WARNING' END
            );
        END IF;
    END LOOP;
    
    v_result := jsonb_build_object(
        'has_anomaly', jsonb_array_length(v_anomalies) > 0,
        'anomalies', v_anomalies
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update pipeline session status
CREATE OR REPLACE FUNCTION update_pipeline_status(
    p_session_id UUID,
    p_current_agent VARCHAR(50),
    p_current_action VARCHAR(200),
    p_progress INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE pipeline_sessions
    SET 
        current_agent = p_current_agent,
        current_action = p_current_action,
        progress = p_progress
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete pipeline session
CREATE OR REPLACE FUNCTION complete_pipeline_session(
    p_session_id UUID,
    p_status VARCHAR(20),
    p_result_summary JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE pipeline_sessions
    SET 
        status = p_status,
        progress = 100,
        completed_at = NOW(),
        result_summary = p_result_summary
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

