-- Phase 6.86: AI Usage Tracking Schema
-- Enterprise-grade cost and usage monitoring

-- AI Usage Table
CREATE TABLE IF NOT EXISTS "ai_usage" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "endpoint" VARCHAR(100) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10, 6) NOT NULL DEFAULT 0,
    "response_time_ms" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "idx_ai_usage_user_id" ON "ai_usage"("user_id");
CREATE INDEX "idx_ai_usage_created_at" ON "ai_usage"("created_at");
CREATE INDEX "idx_ai_usage_model" ON "ai_usage"("model");
CREATE INDEX "idx_ai_usage_status" ON "ai_usage"("status");

-- AI Budget Limits Table
CREATE TABLE IF NOT EXISTS "ai_budget_limits" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "daily_limit_usd" DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    "monthly_limit_usd" DECIMAL(10, 2) NOT NULL DEFAULT 300.00,
    "alert_threshold" DECIMAL(3, 2) NOT NULL DEFAULT 0.80,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for one budget per user
CREATE UNIQUE INDEX "idx_ai_budget_limits_user_id" ON "ai_budget_limits"("user_id");

-- AI Cache Table (for response caching)
CREATE TABLE IF NOT EXISTS "ai_cache" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "cache_key" VARCHAR(255) NOT NULL UNIQUE,
    "prompt_hash" VARCHAR(64) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "response" JSONB NOT NULL,
    "tokens_saved" INTEGER NOT NULL DEFAULT 0,
    "cost_saved" DECIMAL(10, 6) NOT NULL DEFAULT 0,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cache performance
CREATE INDEX "idx_ai_cache_cache_key" ON "ai_cache"("cache_key");
CREATE INDEX "idx_ai_cache_expires_at" ON "ai_cache"("expires_at");
CREATE INDEX "idx_ai_cache_prompt_hash" ON "ai_cache"("prompt_hash");

-- AI Rate Limits Table
CREATE TABLE IF NOT EXISTS "ai_rate_limits" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "max_requests" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate limiting
CREATE INDEX "idx_ai_rate_limits_user_id" ON "ai_rate_limits"("user_id");
CREATE INDEX "idx_ai_rate_limits_window" ON "ai_rate_limits"("window_start", "window_end");

-- Materialized View for Daily Usage Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS "ai_daily_usage_summary" AS
SELECT 
    user_id,
    DATE(created_at) as usage_date,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
    array_agg(DISTINCT model) as models_used
FROM ai_usage
GROUP BY user_id, DATE(created_at);

-- Index for materialized view
CREATE INDEX "idx_ai_daily_usage_user_date" ON "ai_daily_usage_summary"("user_id", "usage_date");

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_ai_usage_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_daily_usage_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_usage_updated_at BEFORE UPDATE ON "ai_usage"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_budget_limits_updated_at BEFORE UPDATE ON "ai_budget_limits"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_budget_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_rate_limits" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "users_view_own_ai_usage" ON "ai_usage"
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "users_view_own_budget_limits" ON "ai_budget_limits"
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "users_view_own_rate_limits" ON "ai_rate_limits"
    FOR SELECT USING (user_id = current_user_id());

-- Cache is shared but read-only for users
CREATE POLICY "cache_read_all" ON "ai_cache"
    FOR SELECT USING (true);

-- Admin policies (assuming admin role exists)
CREATE POLICY "admin_all_ai_usage" ON "ai_usage"
    FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "admin_all_budget_limits" ON "ai_budget_limits"
    FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "admin_all_cache" ON "ai_cache"
    FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "admin_all_rate_limits" ON "ai_rate_limits"
    FOR ALL USING (current_user_role() = 'admin');