-- ================================================
-- 餐厅预订系统 - 数据库初始化脚本
-- 运行位置: Neon Database SQL Editor
-- ================================================

-- 1. 创建预订表
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER NOT NULL DEFAULT 2,
    table_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, confirmed, cancelled, completed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 创建餐厅表
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(20),
    opening_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建餐桌表
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    table_number VARCHAR(10) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    location VARCHAR(50),  -- window, indoor, outdoor
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 创建用户表 (用于员工和管理员)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff',  -- admin, manager, staff
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 插入测试数据
INSERT INTO restaurants (name, description, address, phone, opening_hours) VALUES
    ('TempahNow Sushi', '正宗日本料理', '123 Main Street', '+60123456789', '11:00 - 22:00'),
    ('TempahNow Pasta', '意大利餐厅', '456 Oak Avenue', '+60123456790', '10:00 - 21:00')
ON CONFLICT DO NOTHING;

INSERT INTO tables (restaurant_id, table_number, capacity, location) VALUES
    (1, 'T1', 2, 'window'),
    (1, 'T2', 4, 'indoor'),
    (1, 'T3', 6, 'private'),
    (2, 'T1', 2, 'outdoor'),
    (2, 'T2', 4, 'indoor'),
    (2, 'T3', 8, 'private')
ON CONFLICT DO NOTHING;

-- 6. 查看所有表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 7. 查看 reservations 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reservations';
