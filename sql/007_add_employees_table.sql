-- =============================================
-- RESILIX POC - Complete LINE OA Integration Setup
-- Migration 007: Create employees table and ensure technicians table compatibility
-- =============================================

-- 1. Ensure technicians table has required columns for LINE integration
DO $$
BEGIN
    -- Add employee_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'employee_id') THEN
        ALTER TABLE technicians ADD COLUMN employee_id VARCHAR(20);
    END IF;

    -- Add line_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'line_id') THEN
        ALTER TABLE technicians ADD COLUMN line_id VARCHAR(50);
    END IF;

    -- Add other LINE-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'line_registered_at') THEN
        ALTER TABLE technicians ADD COLUMN line_registered_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'phone') THEN
        ALTER TABLE technicians ADD COLUMN phone VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'email') THEN
        ALTER TABLE technicians ADD COLUMN email VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'role') THEN
        ALTER TABLE technicians ADD COLUMN role VARCHAR(50) DEFAULT 'TECHNICIAN';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'department') THEN
        ALTER TABLE technicians ADD COLUMN department VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'shift_preference') THEN
        ALTER TABLE technicians ADD COLUMN shift_preference VARCHAR(20) DEFAULT 'MORNING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'technicians' AND column_name = 'is_active') THEN
        ALTER TABLE technicians ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 1.5. Ensure notifications table has required columns for LINE integration
DO $$
BEGIN
    -- Add LINE-related columns to notifications table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_card_data') THEN
        ALTER TABLE notifications ADD COLUMN line_card_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_message_id') THEN
        ALTER TABLE notifications ADD COLUMN line_message_id VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'recipient_line_id') THEN
        ALTER TABLE notifications ADD COLUMN recipient_line_id VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_required') THEN
        ALTER TABLE notifications ADD COLUMN action_required VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_deadline') THEN
        ALTER TABLE notifications ADD COLUMN action_deadline TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken') THEN
        ALTER TABLE notifications ADD COLUMN action_taken BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_at') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_by') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_by VARCHAR(100);
    END IF;
END $$;

-- 2. Create employees table (only if not exists)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,     -- รหัสพนักงาน เช่น 'EMP001'
    name VARCHAR(100) NOT NULL,                  -- ชื่อพนักงาน
    department VARCHAR(50),                      -- แผนก
    position VARCHAR(50),                        -- ตำแหน่ง
    email VARCHAR(100),
    phone VARCHAR(20),
    line_user_id VARCHAR(50) UNIQUE,             -- LINE User ID จาก LIFF
    line_display_name VARCHAR(100),              -- ชื่อใน LINE
    line_picture_url VARCHAR(500),               -- รูปโปรไฟล์ LINE
    line_registered_at TIMESTAMPTZ,              -- วันที่ลงทะเบียน LINE
    role VARCHAR(50) DEFAULT 'EMPLOYEE',         -- 'MANAGER', 'TECHNICIAN', 'SUPERVISOR', 'EMPLOYEE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes (only if not exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_employee_id') THEN
        CREATE INDEX idx_employees_employee_id ON employees(employee_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_line_user_id') THEN
        CREATE INDEX idx_employees_line_user_id ON employees(line_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_department') THEN
        CREATE INDEX idx_employees_department ON employees(department);
    END IF;
END $$;

-- 4. Add trigger for updated_at (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
        CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Insert mock data for demo (only if not exists)
INSERT INTO employees (employee_id, name, department, position, email, phone, role, line_user_id)
VALUES
('EMP001', 'สมชาย ใจดี', 'Maintenance', 'Senior Technician', 'somchai@factory.com', '081-234-5678', 'TECHNICIAN', 'Ud4e5f6g7h8i9j0k1l2m3n4o5p6q'),
('EMP002', 'วิชัย รักงาน', 'Maintenance', 'Technician', 'wichai@factory.com', '081-234-5679', 'TECHNICIAN', 'Ue6f7g8h9i0j1k2l3m4n5o6p7q8'),
('EMP003', 'นวลพรรณ สวยงาม', 'Operations', 'Plant Manager', 'nawapan@factory.com', '081-234-5680', 'MANAGER', 'Uf7g8h9i0j1k2l3m4n5o6p7q8r9'),
('EMP004', 'ประสิทธิ์ ทำงาน', 'Maintenance', 'Maintenance Supervisor', 'prasit@factory.com', '081-234-5681', 'SUPERVISOR', 'Ug8h9i0j1k2l3m4n5o6p7q8r9s0'),
('EMP005', 'มานะ พัฒนา', 'Maintenance', 'Junior Technician', 'mana@factory.com', '081-234-5682', 'TECHNICIAN', 'Uh9i0j1k2l3m4n5o6p7q8r9s0t1')
ON CONFLICT (employee_id) DO UPDATE SET
    line_user_id = EXCLUDED.line_user_id
WHERE employees.line_user_id IS NULL;

-- 6. Update existing technicians to reference employees (only if employee_id is null)
UPDATE technicians
SET employee_id = CASE
    WHEN name LIKE '%สมชาย%' THEN 'EMP001'
    WHEN name LIKE '%วิชัย%' THEN 'EMP002'
    WHEN name LIKE '%ประสิทธิ์%' THEN 'EMP004'
    WHEN name LIKE '%มานะ%' THEN 'EMP005'
    ELSE employee_id
END
WHERE employee_id IS NULL OR employee_id = '';
