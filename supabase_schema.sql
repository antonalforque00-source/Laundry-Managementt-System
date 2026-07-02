-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR LPDMS (Laundry Pickup & Delivery Management System)
-- ====================================================================
-- Copy and run this script directly in your Supabase SQL Editor to create all required tables.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'customer', 'rider', 'staff', 'admin'
  points INTEGER DEFAULT 0,
  address TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 0,
  status TEXT, -- for riders: 'active', 'offline', etc.
  station TEXT -- for laundry staff: 'Washing Hub A', etc.
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'pickup_scheduled', 'received', 'washing', 'ready', 'delivered'
  cost NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  special_instructions TEXT,
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  qr_code_value TEXT,
  address TEXT,
  phone TEXT,
  rider_id TEXT,
  rider_name TEXT,
  rating INTEGER,
  review TEXT
);

-- 3. Create Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL, -- 'L', 'pcs', etc.
  min_limit NUMERIC NOT NULL DEFAULT 0
);

-- 4. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL
);

-- 5. Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  review TEXT,
  type TEXT NOT NULL DEFAULT 'Review'
);

-- Ensure table-level access is ready for public requests (Supabase default setup)
-- This disables Row-Level Security (RLS) altogether to allow direct, instant connections
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- DOUBLE FAIL-SAFE: Create permissive public access policies just in case RLS remains active
-- 1. Users Policies
DROP POLICY IF EXISTS "Allow public select on users" ON users;
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on users" ON users;
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on users" ON users;
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on users" ON users;
CREATE POLICY "Allow public delete on users" ON users FOR DELETE USING (true);

-- 2. Orders Policies
DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on orders" ON orders;
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);

-- 3. Inventory Policies
DROP POLICY IF EXISTS "Allow public select on inventory" ON inventory;
CREATE POLICY "Allow public select on inventory" ON inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on inventory" ON inventory;
CREATE POLICY "Allow public insert on inventory" ON inventory FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on inventory" ON inventory;
CREATE POLICY "Allow public update on inventory" ON inventory FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on inventory" ON inventory;
CREATE POLICY "Allow public delete on inventory" ON inventory FOR DELETE USING (true);

-- 4. Audit Logs Policies
DROP POLICY IF EXISTS "Allow public select on audit_logs" ON audit_logs;
CREATE POLICY "Allow public select on audit_logs" ON audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow public insert on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- 5. Feedbacks Policies
DROP POLICY IF EXISTS "Allow public select on feedbacks" ON feedbacks;
CREATE POLICY "Allow public select on feedbacks" ON feedbacks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on feedbacks" ON feedbacks;
CREATE POLICY "Allow public insert on feedbacks" ON feedbacks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on feedbacks" ON feedbacks;
CREATE POLICY "Allow public update on feedbacks" ON feedbacks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on feedbacks" ON feedbacks;
CREATE POLICY "Allow public delete on feedbacks" ON feedbacks FOR DELETE USING (true);

