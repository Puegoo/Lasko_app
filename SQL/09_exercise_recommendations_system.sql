-- =================================================================
-- SYSTEM REKOMENDACJI ĆWICZEŃ I CUSTOM PLANÓW
-- =================================================================
-- Ten plik dodaje wsparcie dla rekomendacji na poziomie ćwiczeń
-- oraz możliwość tworzenia własnych planów treningowych

-- ===========================
-- 1. CUSTOM PLANS (własne plany użytkowników)
-- ===========================

CREATE TABLE IF NOT EXISTS user_custom_plans (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50),
    difficulty_level VARCHAR(50),
    training_days_per_week INT,
    equipment_required VARCHAR(50),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_custom_plans_user ON user_custom_plans(auth_account_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_plans_active ON user_custom_plans(auth_account_id, is_active) WHERE is_active = TRUE;

-- ===========================
-- 2. CUSTOM PLAN DAYS (dni w custom planie)
-- ===========================

CREATE TABLE IF NOT EXISTS user_custom_plan_days (
    id SERIAL PRIMARY KEY,
    custom_plan_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    day_order INT NOT NULL,
    FOREIGN KEY (custom_plan_id) REFERENCES user_custom_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_plan_days_plan ON user_custom_plan_days(custom_plan_id);

-- ===========================
-- 3. CUSTOM PLAN EXERCISES (ćwiczenia w dniach)
-- ===========================

CREATE TABLE IF NOT EXISTS user_custom_plan_exercises (
    id SERIAL PRIMARY KEY,
    plan_day_id INT NOT NULL,
    exercise_id INT NOT NULL,
    target_sets VARCHAR(10),
    target_reps VARCHAR(20),
    rest_seconds INT,
    exercise_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (plan_day_id) REFERENCES user_custom_plan_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_plan_exercises_day ON user_custom_plan_exercises(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_custom_plan_exercises_exercise ON user_custom_plan_exercises(exercise_id);

-- ===========================
-- 4. EXERCISE RECOMMENDATIONS (cache rekomendacji)
-- ===========================

CREATE TABLE IF NOT EXISTS exercise_recommendations (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    exercise_id INT NOT NULL,
    score FLOAT NOT NULL,
    reason TEXT,
    algorithm_type VARCHAR(50), -- 'content_based', 'collaborative', 'hybrid'
    score_breakdown JSONB, -- Szczegółowy breakdown punktów
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ, -- Cache expiration (np. 24h)
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    UNIQUE(auth_account_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_user ON exercise_recommendations(auth_account_id);
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_score ON exercise_recommendations(auth_account_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_expires ON exercise_recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- ===========================
-- 5. ROZSZERZENIE user_active_plans (obsługa custom planów)
-- ===========================

-- Dodaj kolumnę custom_plan_id (opcjonalna - jeśli NULL, to używa plan_id)
ALTER TABLE user_active_plans 
ADD COLUMN IF NOT EXISTS custom_plan_id INT REFERENCES user_custom_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_active_plans_custom ON user_active_plans(custom_plan_id) WHERE custom_plan_id IS NOT NULL;

-- ===========================
-- 6. TRIGGER dla updated_at w user_custom_plans
-- ===========================

CREATE OR REPLACE FUNCTION update_custom_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_custom_plan_timestamp ON user_custom_plans;
CREATE TRIGGER trigger_update_custom_plan_timestamp
    BEFORE UPDATE ON user_custom_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_plan_timestamp();

-- ===========================
-- 7. WIDOK dla łatwego pobierania custom planów z ćwiczeniami
-- ===========================

CREATE OR REPLACE VIEW v_user_custom_plans_detailed AS
SELECT 
    ucp.id,
    ucp.auth_account_id,
    ucp.name,
    ucp.description,
    ucp.goal_type,
    ucp.difficulty_level,
    ucp.training_days_per_week,
    ucp.equipment_required,
    ucp.is_active,
    ucp.created_at,
    ucp.updated_at,
    jsonb_agg(
        jsonb_build_object(
            'id', ucpd.id,
            'name', ucpd.name,
            'day_order', ucpd.day_order,
            'exercises', COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ucpe.id,
                        'exercise_id', ucpe.exercise_id,
                        'exercise_name', e.name,
                        'muscle_group', e.muscle_group,
                        'type', e.type,
                        'target_sets', ucpe.target_sets,
                        'target_reps', ucpe.target_reps,
                        'rest_seconds', ucpe.rest_seconds,
                        'exercise_order', ucpe.exercise_order
                    ) ORDER BY ucpe.exercise_order
                )
                FROM user_custom_plan_exercises ucpe
                JOIN exercises e ON ucpe.exercise_id = e.id
                WHERE ucpe.plan_day_id = ucpd.id),
                '[]'::jsonb
            )
        ) ORDER BY ucpd.day_order
    ) FILTER (WHERE ucpd.id IS NOT NULL) as days
FROM user_custom_plans ucp
LEFT JOIN user_custom_plan_days ucpd ON ucp.id = ucpd.custom_plan_id
GROUP BY ucp.id, ucp.auth_account_id, ucp.name, ucp.description, 
         ucp.goal_type, ucp.difficulty_level, ucp.training_days_per_week,
         ucp.equipment_required, ucp.is_active, ucp.created_at, ucp.updated_at;

-- ===========================
-- KONIEC
-- ===========================




