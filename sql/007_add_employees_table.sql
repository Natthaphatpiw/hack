-- =============================================
-- RESILIX POC - Add Employees Table for LINE OA Integration
-- Migration 007: Create employees table with LINE integration
-- =============================================

-- 1. Create employees table
CREATE TABLE employees (
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

-- 2. Create index for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_line_user_id ON employees(line_user_id);
CREATE INDEX idx_employees_department ON employees(department);

-- 3. Add trigger for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Insert some mock data for demo
INSERT INTO employees (employee_id, name, department, position, email, phone, role) VALUES
('EMP001', 'สมชาย ใจดี', 'Maintenance', 'Senior Technician', 'somchai@factory.com', '081-234-5678', 'TECHNICIAN'),
('EMP002', 'วิชัย รักงาน', 'Maintenance', 'Technician', 'wichai@factory.com', '081-234-5679', 'TECHNICIAN'),
('EMP003', 'นวลพรรณ สวยงาม', 'Operations', 'Plant Manager', 'nawapan@factory.com', '081-234-5680', 'MANAGER'),
('EMP004', 'ประสิทธิ์ ทำงาน', 'Maintenance', 'Maintenance Supervisor', 'prasit@factory.com', '081-234-5681', 'SUPERVISOR'),
('EMP005', 'มานะ พัฒนา', 'Maintenance', 'Junior Technician', 'mana@factory.com', '081-234-5682', 'TECHNICIAN');

-- 5. Update existing technicians to reference employees
-- (This assumes technicians table has employee_id field from previous migration)
UPDATE technicians
SET employee_id = CASE
    WHEN name LIKE '%สมชาย%' THEN 'EMP001'
    WHEN name LIKE '%วิชัย%' THEN 'EMP002'
    WHEN name LIKE '%ประสิทธิ์%' THEN 'EMP004'
    WHEN name LIKE '%มานะ%' THEN 'EMP005'
    ELSE employee_id
END
WHERE employee_id IS NULL;
