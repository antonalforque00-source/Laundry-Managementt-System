-- ============================================================
-- Laundry Pickup & Delivery Management System (LPDMS)
-- Supabase PostgreSQL Schema
-- TEXT Primary Keys Version
-- ============================================================

-- ===========================
-- DROP OLD TABLES (Optional)
-- ===========================

DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('customer','rider','staff','admin')
    ),
    points INTEGER DEFAULT 0,
    address TEXT,
    phone TEXT,
    rating NUMERIC DEFAULT 0,
    status TEXT,
    station TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    rider_id TEXT,
    customer_name TEXT,
    rider_name TEXT,
    service TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    cost NUMERIC DEFAULT 0,
    weight NUMERIC DEFAULT 0,
    payment_method TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    qr_code_value TEXT,
    address TEXT,
    phone TEXT,
    rating INTEGER,
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rider
        FOREIGN KEY (rider_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    unit TEXT NOT NULL,
    min_limit NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- FEEDBACKS
-- ============================================================

CREATE TABLE feedbacks (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    order_id TEXT,
    customer_name TEXT,
    rating INTEGER NOT NULL,
    review TEXT,
    type TEXT DEFAULT 'Review',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_feedback_customer
        FOREIGN KEY(customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_order
        FOREIGN KEY(order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_orders_customer
ON orders(customer_id);

CREATE INDEX idx_orders_rider
ON orders(rider_id);

CREATE INDEX idx_feedback_customer
ON feedbacks(customer_id);

CREATE INDEX idx_feedback_order
ON feedbacks(order_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

-- ============================================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_inventory_updated
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DISABLE RLS
-- ============================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANT ACCESS
-- ============================================================

GRANT ALL ON TABLE users TO anon, authenticated;
GRANT ALL ON TABLE orders TO anon, authenticated;
GRANT ALL ON TABLE inventory TO anon, authenticated;
GRANT ALL ON TABLE audit_logs TO anon, authenticated;
GRANT ALL ON TABLE feedbacks TO anon, authenticated;

-- ============================================================
-- RELATIONSHIPS
-- ============================================================

-- users.id ---------> orders.customer_id
-- users.id ---------> orders.rider_id
-- users.id ---------> audit_logs.user_id
-- users.id ---------> feedbacks.customer_id
-- orders.id --------> feedbacks.order_id

-- ============================================================
-- END
-- ============================================================
