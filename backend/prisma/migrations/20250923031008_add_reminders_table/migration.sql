-- CreateTable
CREATE TABLE "GridConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "rangeMin" INTEGER NOT NULL DEFAULT -3,
    "rangeMax" INTEGER NOT NULL DEFAULT 3,
    "columns" JSONB NOT NULL,
    "symmetry" BOOLEAN NOT NULL DEFAULT true,
    "totalCells" INTEGER NOT NULL,
    "distribution" TEXT NOT NULL DEFAULT 'bell',
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GridConfiguration_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stimulus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnail" TEXT,
    "metadata" JSONB,
    "position" INTEGER,
    "category" TEXT,
    "tags" JSONB,
    "uploadStatus" TEXT NOT NULL DEFAULT 'pending',
    "uploadedBy" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "virusScanStatus" TEXT NOT NULL DEFAULT 'pending',
    "virusScanDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stimulus_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "response_time_ms" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_budget_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "daily_limit_usd" REAL NOT NULL DEFAULT 10.00,
    "monthly_limit_usd" REAL NOT NULL DEFAULT 300.00,
    "alert_threshold" REAL NOT NULL DEFAULT 0.80,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_budget_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cache_key" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokens_saved" INTEGER NOT NULL DEFAULT 0,
    "cost_saved" REAL NOT NULL DEFAULT 0,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_rate_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "window_start" DATETIME NOT NULL,
    "window_end" DATETIME NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "max_requests" INTEGER NOT NULL DEFAULT 10,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_collaborators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "permissions" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "invited_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" DATETIME,
    "last_active_at" DATETIME,
    CONSTRAINT "study_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "section_id" TEXT,
    "parent_id" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "study_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "study_comments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "tags" TEXT,
    "notes" TEXT,
    "custom_fields" TEXT,
    "invited_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" DATETIME,
    "completed_at" DATETIME
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "scheduled_start" DATETIME NOT NULL,
    "scheduled_end" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "type" TEXT NOT NULL DEFAULT 'online',
    "location" TEXT,
    "meeting_url" TEXT,
    "notes" TEXT,
    "reminders_sent" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "scheduled_for" DATETIME NOT NULL,
    "sent_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" DATETIME,
    "error_message" TEXT,
    CONSTRAINT "reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compensations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "paid_at" DATETIME,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compensations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "compensations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "study_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "slot_duration" INTEGER NOT NULL DEFAULT 60,
    "buffer_time" INTEGER NOT NULL DEFAULT 15,
    "max_participants_per_slot" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "GridConfiguration_surveyId_key" ON "GridConfiguration"("surveyId");

-- CreateIndex
CREATE INDEX "GridConfiguration_surveyId_idx" ON "GridConfiguration"("surveyId");

-- CreateIndex
CREATE INDEX "Stimulus_surveyId_idx" ON "Stimulus"("surveyId");

-- CreateIndex
CREATE INDEX "Stimulus_type_idx" ON "Stimulus"("type");

-- CreateIndex
CREATE INDEX "Stimulus_uploadStatus_idx" ON "Stimulus"("uploadStatus");

-- CreateIndex
CREATE INDEX "Stimulus_virusScanStatus_idx" ON "Stimulus"("virusScanStatus");

-- CreateIndex
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage"("user_id");

-- CreateIndex
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage"("created_at");

-- CreateIndex
CREATE INDEX "ai_usage_model_idx" ON "ai_usage"("model");

-- CreateIndex
CREATE INDEX "ai_usage_status_idx" ON "ai_usage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_budget_limits_user_id_key" ON "ai_budget_limits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_cache_key_key" ON "ai_cache"("cache_key");

-- CreateIndex
CREATE INDEX "ai_cache_cache_key_idx" ON "ai_cache"("cache_key");

-- CreateIndex
CREATE INDEX "ai_cache_expires_at_idx" ON "ai_cache"("expires_at");

-- CreateIndex
CREATE INDEX "ai_cache_prompt_hash_idx" ON "ai_cache"("prompt_hash");

-- CreateIndex
CREATE INDEX "ai_rate_limits_user_id_idx" ON "ai_rate_limits"("user_id");

-- CreateIndex
CREATE INDEX "ai_rate_limits_window_start_window_end_idx" ON "ai_rate_limits"("window_start", "window_end");

-- CreateIndex
CREATE INDEX "study_collaborators_study_id_idx" ON "study_collaborators"("study_id");

-- CreateIndex
CREATE INDEX "study_collaborators_user_id_idx" ON "study_collaborators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_collaborators_study_id_user_id_key" ON "study_collaborators"("study_id", "user_id");

-- CreateIndex
CREATE INDEX "study_comments_study_id_idx" ON "study_comments"("study_id");

-- CreateIndex
CREATE INDEX "study_comments_user_id_idx" ON "study_comments"("user_id");

-- CreateIndex
CREATE INDEX "study_comments_parent_id_idx" ON "study_comments"("parent_id");

-- CreateIndex
CREATE INDEX "study_activity_logs_study_id_idx" ON "study_activity_logs"("study_id");

-- CreateIndex
CREATE INDEX "study_activity_logs_user_id_idx" ON "study_activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "study_activity_logs_action_idx" ON "study_activity_logs"("action");

-- CreateIndex
CREATE INDEX "study_activity_logs_timestamp_idx" ON "study_activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "participants_study_id_idx" ON "participants"("study_id");

-- CreateIndex
CREATE INDEX "participants_email_idx" ON "participants"("email");

-- CreateIndex
CREATE INDEX "participants_status_idx" ON "participants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "participants_study_id_email_key" ON "participants"("study_id", "email");

-- CreateIndex
CREATE INDEX "appointments_study_id_idx" ON "appointments"("study_id");

-- CreateIndex
CREATE INDEX "appointments_participant_id_idx" ON "appointments"("participant_id");

-- CreateIndex
CREATE INDEX "appointments_scheduled_start_idx" ON "appointments"("scheduled_start");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "reminders_appointment_id_idx" ON "reminders"("appointment_id");

-- CreateIndex
CREATE INDEX "reminders_scheduled_for_idx" ON "reminders"("scheduled_for");

-- CreateIndex
CREATE INDEX "reminders_status_idx" ON "reminders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "compensations_appointment_id_key" ON "compensations"("appointment_id");

-- CreateIndex
CREATE INDEX "compensations_participant_id_idx" ON "compensations"("participant_id");

-- CreateIndex
CREATE INDEX "compensations_status_idx" ON "compensations"("status");

-- CreateIndex
CREATE INDEX "study_availability_study_id_idx" ON "study_availability"("study_id");

-- CreateIndex
CREATE INDEX "study_availability_day_of_week_idx" ON "study_availability"("day_of_week");
