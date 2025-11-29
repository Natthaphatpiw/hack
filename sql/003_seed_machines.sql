-- =============================================
-- Seed Initial Data - Machines & Configuration
-- =============================================

-- Insert 3 machines for POC
INSERT INTO machines (machine_id, name, type, location, criticality, status, health_score) VALUES
('BLR-PMP-01', 'Boiler Feed Pump #1', 'BOILER_PUMP', 'Building A, Floor 1', 'CRITICAL', 'NORMAL', 95),
('CMP-001', 'Air Compressor #1', 'COMPRESSOR', 'Building A, Floor 1', 'HIGH', 'NORMAL', 88),
('MTR-CNV-01', 'Conveyor Motor #1', 'MOTOR', 'Building B, Floor 1', 'MEDIUM', 'NORMAL', 92);

-- Insert thresholds for each machine type
INSERT INTO thresholds (machine_type, metric, warning_low, warning_high, critical_low, critical_high, unit) VALUES
-- Boiler Pump thresholds
('BOILER_PUMP', 'vib_rms_horizontal', NULL, 2.5, NULL, 4.0, 'mm/s'),
('BOILER_PUMP', 'vib_rms_vertical', NULL, 2.0, NULL, 3.5, 'mm/s'),
('BOILER_PUMP', 'vib_peak_accel', NULL, 0.5, NULL, 1.0, 'g'),
('BOILER_PUMP', 'bearing_temp', NULL, 70, NULL, 85, 'C'),
('BOILER_PUMP', 'pressure', 6.0, 10.0, 5.0, 12.0, 'Bar'),
-- Compressor thresholds
('COMPRESSOR', 'vib_rms_horizontal', NULL, 3.0, NULL, 5.0, 'mm/s'),
('COMPRESSOR', 'vib_rms_vertical', NULL, 2.5, NULL, 4.0, 'mm/s'),
('COMPRESSOR', 'vib_peak_accel', NULL, 0.6, NULL, 1.2, 'g'),
('COMPRESSOR', 'bearing_temp', NULL, 75, NULL, 90, 'C'),
('COMPRESSOR', 'pressure', 5.0, 8.0, 4.0, 10.0, 'Bar'),
-- Motor thresholds
('MOTOR', 'vib_rms_horizontal', NULL, 2.0, NULL, 3.5, 'mm/s'),
('MOTOR', 'vib_rms_vertical', NULL, 1.8, NULL, 3.0, 'mm/s'),
('MOTOR', 'vib_peak_accel', NULL, 0.4, NULL, 0.8, 'g'),
('MOTOR', 'bearing_temp', NULL, 65, NULL, 80, 'C'),
('MOTOR', 'pressure', NULL, NULL, NULL, NULL, 'Bar');  -- N/A for motor

-- Insert mock technicians
INSERT INTO technicians (name, skill_level, specializations, is_available, current_shift) VALUES
('สมชาย มั่นคง', 4, ARRAY['BEARING', 'PUMP', 'SEAL'], TRUE, 'MORNING'),
('สมหมาย ใจดี', 3, ARRAY['MOTOR', 'CONVEYOR', 'BELT'], TRUE, 'MORNING'),
('สมศักดิ์ เก่งมาก', 5, ARRAY['COMPRESSOR', 'VALVE', 'BEARING'], TRUE, 'AFTERNOON');

-- Insert mock parts inventory
INSERT INTO parts_inventory (part_number, name, category, quantity, unit_cost, reorder_point) VALUES
('BRG-SKF-6205', 'Bearing SKF-6205-2RS', 'BEARING', 5, 2500, 2),
('BRG-SKF-6305', 'Bearing SKF-6305-2RS', 'BEARING', 3, 3200, 2),
('SEAL-PUMP-01', 'Mechanical Seal Type A', 'SEAL', 8, 4500, 3),
('BELT-V-M12', 'V-Belt M12', 'BELT', 12, 850, 5),
('VALVE-CHK-25', 'Check Valve 25mm', 'VALVE', 4, 6500, 2);

