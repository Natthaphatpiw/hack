-- =============================================
-- Generate Mock Sensor Data (Normal Operation)
-- Run this to populate historical data
-- =============================================

-- Function to generate mock sensor data
CREATE OR REPLACE FUNCTION generate_mock_sensor_data(
    p_machine_id VARCHAR(50),
    p_start_time TIMESTAMPTZ,
    p_hours INTEGER,
    p_interval_minutes INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
    v_current_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_count INTEGER := 0;
    v_base_vib_h DECIMAL;
    v_base_vib_v DECIMAL;
    v_base_temp DECIMAL;
    v_base_pressure DECIMAL;
    v_machine_type VARCHAR(50);
BEGIN
    -- Get machine type and set base values
    SELECT type INTO v_machine_type FROM machines WHERE machine_id = p_machine_id;
    
    -- Set base values based on machine type
    CASE v_machine_type
        WHEN 'BOILER_PUMP' THEN
            v_base_vib_h := 0.45;
            v_base_vib_v := 0.32;
            v_base_temp := 62;
            v_base_pressure := 8.5;
        WHEN 'COMPRESSOR' THEN
            v_base_vib_h := 0.65;
            v_base_vib_v := 0.48;
            v_base_temp := 68;
            v_base_pressure := 6.8;
        WHEN 'MOTOR' THEN
            v_base_vib_h := 0.38;
            v_base_vib_v := 0.28;
            v_base_temp := 55;
            v_base_pressure := NULL;
        ELSE
            v_base_vib_h := 0.5;
            v_base_vib_v := 0.35;
            v_base_temp := 60;
            v_base_pressure := 7.0;
    END CASE;
    
    v_current_time := p_start_time;
    v_end_time := p_start_time + (p_hours || ' hours')::INTERVAL;
    
    WHILE v_current_time < v_end_time LOOP
        INSERT INTO sensor_readings (
            machine_id,
            timestamp,
            status_flag,
            vib_rms_horizontal,
            vib_rms_vertical,
            vib_peak_accel,
            bearing_temp,
            pressure
        ) VALUES (
            p_machine_id,
            v_current_time,
            'NORMAL',
            v_base_vib_h + (random() * 0.1 - 0.05),  -- ±0.05 variation
            v_base_vib_v + (random() * 0.08 - 0.04), -- ±0.04 variation
            0.12 + (random() * 0.04 - 0.02),         -- ±0.02 variation
            v_base_temp + (random() * 2 - 1),        -- ±1°C variation
            CASE WHEN v_base_pressure IS NOT NULL 
                 THEN v_base_pressure + (random() * 0.4 - 0.2)
                 ELSE NULL END
        );
        
        v_count := v_count + 1;
        v_current_time := v_current_time + (p_interval_minutes || ' minutes')::INTERVAL;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Generate 24 hours of historical data for each machine
-- Starting from 24 hours ago
SELECT generate_mock_sensor_data('BLR-PMP-01', NOW() - INTERVAL '24 hours', 24, 5);
SELECT generate_mock_sensor_data('CMP-001', NOW() - INTERVAL '24 hours', 24, 5);
SELECT generate_mock_sensor_data('MTR-CNV-01', NOW() - INTERVAL '24 hours', 24, 5);

-- Verify data was created
SELECT machine_id, COUNT(*) as readings, MIN(timestamp) as first_reading, MAX(timestamp) as last_reading
FROM sensor_readings
GROUP BY machine_id;

