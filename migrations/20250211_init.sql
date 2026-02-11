-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'analyst' CHECK (role IN ('analyst', 'journalist', 'researcher', 'admin')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('legislative', 'executive', 'appointment')),
    raw_data JSONB NOT NULL,
    source VARCHAR(100) NOT NULL,
    confidence_score FLOAT DEFAULT 0.0,
    event_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_confidence ON events(confidence_score DESC);

-- Workflow Templates Table
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('legislative', 'executive', 'appointment')),
    node_structure JSONB NOT NULL,
    transition_rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON workflow_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON workflow_templates(is_active);

-- Processes Table
CREATE TABLE IF NOT EXISTS processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    template_id UUID NOT NULL REFERENCES workflow_templates(id),
    current_node VARCHAR(100) NOT NULL,
    current_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processes_event ON processes(event_id);
CREATE INDEX IF NOT EXISTS idx_processes_template ON processes(template_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_current_node ON processes(current_node);

-- Status History Table
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID NOT NULL REFERENCES processes(id),
    from_node VARCHAR(100),
    to_node VARCHAR(100) NOT NULL,
    transition_data JSONB DEFAULT '{}',
    transition_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_process ON status_history(process_id);
CREATE INDEX IF NOT EXISTS idx_history_transition_time ON status_history(transition_time DESC);

-- Permissions and RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Grant permissions (Adjusting for Supabase roles)
GRANT SELECT ON users TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON workflow_templates TO anon;
GRANT SELECT ON processes TO anon;
GRANT SELECT ON status_history TO anon;

GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON events TO authenticated;
GRANT ALL PRIVILEGES ON workflow_templates TO authenticated;
GRANT ALL PRIVILEGES ON processes TO authenticated;
GRANT ALL PRIVILEGES ON status_history TO authenticated;

-- Policies
-- Note: 'auth.uid()' works if using Supabase Auth or properly signed JWTs
CREATE POLICY users_read_policy ON users FOR SELECT USING (
    auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
);
