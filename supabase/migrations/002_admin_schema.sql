-- ============================================================
-- Aurum Hotel OS — Migration 002: Admin & Staff Schema
-- ============================================================

CREATE TABLE roles (
  id          VARCHAR(20) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL, -- references auth.users(id)
  role_id      VARCHAR(20) NOT NULL REFERENCES roles(id),
  first_name   VARCHAR(80) NOT NULL,
  last_name    VARCHAR(80) NOT NULL,
  email        CITEXT UNIQUE NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staff_auth_user_id ON staff(auth_user_id);
CREATE INDEX idx_staff_email ON staff(email);

-- Insert default roles
INSERT INTO roles (id, name, permissions) VALUES
  ('super_admin', 'Super Administrator', '{"all": true}'),
  ('manager', 'Hotel Manager', '{"inventory": true, "pricing": true, "bookings": true}'),
  ('reception', 'Front Desk', '{"inventory": true, "bookings": true, "pricing": false}');

-- Note: In a real system, the first super_admin would be linked to an auth.users ID.
-- We can insert a dummy staff member here for testing if needed, or create an API route to bootstrap.
