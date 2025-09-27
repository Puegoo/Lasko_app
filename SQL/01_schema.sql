-- Lasko_app/SQL/01_schema.sql
-- =================================================================
-- KOMPLETNY SCHEMAT BAZY DANYCH LASKO - WERSJA 3.0
-- Zaktualizowany o wszystkie kolumny wymagane przez Django
-- =================================================================

-- ===========================
-- DROP w odwrotnej kolejności
-- ===========================

DROP VIEW  IF EXISTS v_plan_statistics CASCADE;
DROP VIEW  IF EXISTS v_similar_users CASCADE;

DROP TRIGGER IF EXISTS trigger_update_rating_date ON user_active_plans;
DROP FUNCTION IF EXISTS update_rating_date();
DROP FUNCTION IF EXISTS extract_muscle_groups(TEXT, TEXT);

-- Drop wszystkich indeksów
DROP INDEX IF EXISTS idx_recommendation_logs_user_plan;
DROP INDEX IF EXISTS idx_recommendation_logs_created;
DROP INDEX IF EXISTS idx_user_active_plans_rating;
DROP INDEX IF EXISTS idx_user_active_plans_plan_rating;
DROP INDEX IF EXISTS idx_training_plans_filters;
DROP INDEX IF EXISTS idx_exercises_muscle_type;
DROP INDEX IF EXISTS idx_user_profiles_combined;
DROP INDEX IF EXISTS idx_progress_tracking_user_metric;
DROP INDEX IF EXISTS idx_plan_exercises_exercise_plan;
DROP INDEX IF EXISTS idx_logged_sets_session;
DROP INDEX IF EXISTS idx_training_sessions_user;
DROP INDEX IF EXISTS idx_training_plans_attrs;
DROP INDEX IF EXISTS idx_auth_accounts_email;

-- Drop wszystkich tabel
DROP TABLE IF EXISTS recommendation_logs CASCADE;
DROP TABLE IF EXISTS exercise_alternatives CASCADE;
DROP TABLE IF EXISTS user_progress_tracking CASCADE;
DROP TABLE IF EXISTS personal_records CASCADE;
DROP TABLE IF EXISTS completed_plan_days CASCADE;
DROP TABLE IF EXISTS session_exercises CASCADE;
DROP TABLE IF EXISTS logged_sets CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS plan_exercises CASCADE;
DROP TABLE IF EXISTS plan_days CASCADE;
DROP TABLE IF EXISTS exercise_tags CASCADE;
DROP TABLE IF EXISTS exercise_equipment CASCADE;
DROP TABLE IF EXISTS exercise_variants CASCADE;
DROP TABLE IF EXISTS exercise_feedback CASCADE;
DROP TABLE IF EXISTS plan_history CASCADE;
DROP TABLE IF EXISTS user_active_plans CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_measurements CASCADE;
DROP TABLE IF EXISTS user_goals_history CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS auth_accounts CASCADE;

-- ===========================
-- CREATE TABLES
-- ===========================

-- Konta logowania (w pełni zgodne z Django)
CREATE TABLE auth_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- Django hashed password
    first_name VARCHAR(50),
    
    -- Kolumny wymagane przez Django
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    
    -- Dodatkowe kolumny aplikacji
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Opcjonalne kolumny dla zgodności z Django (jako JSONB)
    groups JSONB DEFAULT '[]'::jsonb,
    user_permissions JSONB DEFAULT '[]'::jsonb
);

-- Profile użytkowników
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL UNIQUE,
    first_name VARCHAR(50),
    date_of_birth DATE,
    goal VARCHAR(50),
    level VARCHAR(50),
    training_days_per_week INT,
    equipment_preference VARCHAR(50),
    preferred_session_duration INT DEFAULT 60,
    avoid_exercises TEXT[],
    focus_areas TEXT[],
    recommendation_method VARCHAR(50) DEFAULT 'hybrid',
    last_survey_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Ćwiczenia
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    video_url VARCHAR(255),
    image_url VARCHAR(255),
    muscle_group VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL
);

-- Warianty ćwiczeń
CREATE TABLE exercise_variants (
    id SERIAL PRIMARY KEY,
    exercise_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes TEXT,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Tagi
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE exercise_tags (
    exercise_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (exercise_id, tag_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Sprzęt
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE exercise_equipment (
    exercise_id INT NOT NULL,
    equipment_id INT NOT NULL,
    PRIMARY KEY (exercise_id, equipment_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Plany treningowe
CREATE TABLE training_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    auth_account_id INT,
    goal_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(50) NOT NULL,
    training_days_per_week INT NOT NULL,
    equipment_required VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE SET NULL
);

-- Historia planów
CREATE TABLE plan_history (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    changed_by INT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    changes JSONB,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES auth_accounts(id) ON DELETE SET NULL
);

-- Dni planu
CREATE TABLE plan_days (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    day_order INT NOT NULL,
    day_of_week VARCHAR(10),
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

-- Ćwiczenia w dniu
CREATE TABLE plan_exercises (
    id SERIAL PRIMARY KEY,
    plan_day_id INT NOT NULL,
    exercise_id INT NOT NULL,
    target_sets VARCHAR(10),
    target_reps VARCHAR(20),
    rest_seconds INT,
    superset_group INT,
    FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Aktywne plany użytkowników
CREATE TABLE user_active_plans (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL UNIQUE,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_date TIMESTAMPTZ,
    feedback_text TEXT,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

-- Sesje treningowe
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    plan_id INT,
    session_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    notes TEXT,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE SET NULL
);

-- Ćwiczenia w sesji
CREATE TABLE session_exercises (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    plan_exercise_id INT,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_exercise_id) REFERENCES plan_exercises(id) ON DELETE SET NULL
);

-- Serie
CREATE TABLE logged_sets (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NOT NULL,
    set_order INT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    reps INT NOT NULL,
    notes VARCHAR(255),
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Wykonane dni
CREATE TABLE completed_plan_days (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    plan_day_id INT,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE SET NULL
);

-- Pomiary
CREATE TABLE user_measurements (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg NUMERIC(5,2),
    body_fat_percentage NUMERIC(4,2),
    notes TEXT,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    UNIQUE (auth_account_id, measurement_date)
);

-- Rekordy osobiste
CREATE TABLE personal_records (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    exercise_id INT NOT NULL,
    reps INT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    record_date DATE NOT NULL,
    source_logged_set_id INT UNIQUE,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (source_logged_set_id) REFERENCES logged_sets(id) ON DELETE SET NULL,
    UNIQUE (auth_account_id, exercise_id, reps)
);

-- Historia celów
CREATE TABLE user_goals_history (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    old_goal VARCHAR(50),
    new_goal VARCHAR(50),
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Notatki użytkownika
CREATE TABLE user_notes (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    note_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Feedback ćwiczeń
CREATE TABLE exercise_feedback (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    exercise_id INT NOT NULL,
    difficulty_rating INT,
    subjective_notes TEXT,
    feedback_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Powiadomienia
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    notify_at TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- ===========================
-- Tabele rekomendacji
-- ===========================

CREATE TABLE recommendation_logs (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    plan_id INT NOT NULL,
    recommendation_score DECIMAL(5,2),
    survey_data JSONB,
    algorithm_version VARCHAR(20) DEFAULT '3.0',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

CREATE TABLE exercise_alternatives (
    id SERIAL PRIMARY KEY,
    exercise_id INT NOT NULL,
    alternative_exercise_id INT NOT NULL,
    similarity_score DECIMAL(3,2) DEFAULT 0.8,
    replacement_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    UNIQUE(exercise_id, alternative_exercise_id)
);

CREATE TABLE user_progress_tracking (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    plan_id INT,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(8,2),
    measurement_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE SET NULL
);

-- ===========================
-- Indeksy dla wydajności
-- ===========================

CREATE INDEX idx_auth_accounts_email ON auth_accounts(email);
CREATE INDEX idx_auth_accounts_username ON auth_accounts(username);
CREATE INDEX idx_training_sessions_user ON training_sessions(auth_account_id, session_date DESC);
CREATE INDEX idx_logged_sets_session ON logged_sets(session_id);
CREATE INDEX idx_recommendation_logs_user_plan ON recommendation_logs(auth_account_id, plan_id);
CREATE INDEX idx_recommendation_logs_created ON recommendation_logs(created_at);
CREATE INDEX idx_user_active_plans_rating ON user_active_plans(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_user_active_plans_plan_rating ON user_active_plans(plan_id, rating);
CREATE INDEX idx_training_plans_filters ON training_plans(goal_type, difficulty_level, training_days_per_week, equipment_required) WHERE is_active = true;
CREATE INDEX idx_exercises_muscle_type ON exercises(muscle_group, type);
CREATE INDEX idx_user_profiles_combined ON user_profiles(goal, level, training_days_per_week, equipment_preference);
CREATE INDEX idx_progress_tracking_user_metric ON user_progress_tracking(auth_account_id, metric_name, measurement_date);
CREATE INDEX idx_plan_exercises_exercise_plan ON plan_exercises(exercise_id, plan_day_id);

-- ===========================
-- Widoki statystyczne
-- ===========================

CREATE VIEW v_plan_statistics AS
SELECT 
    tp.id as plan_id,
    tp.name,
    tp.goal_type,
    tp.difficulty_level,
    tp.training_days_per_week,
    tp.equipment_required,
    tp.is_active,
    COUNT(DISTINCT uap.auth_account_id) as total_users,
    AVG(uap.rating) as avg_rating,
    COUNT(CASE WHEN uap.rating >= 4 THEN 1 END) as positive_ratings,
    COUNT(DISTINCT ts.id) as total_sessions,
    AVG(ts.duration_minutes) as avg_session_duration,
    COUNT(DISTINCT pd.id) as total_days,
    COUNT(DISTINCT pe.id) as total_exercises,
    tp.created_at
FROM training_plans tp
LEFT JOIN user_active_plans uap ON tp.id = uap.plan_id
LEFT JOIN training_sessions ts ON tp.id = ts.plan_id
LEFT JOIN plan_days pd ON tp.id = pd.plan_id
LEFT JOIN plan_exercises pe ON pd.id = pe.plan_day_id
WHERE tp.is_active = true
GROUP BY tp.id, tp.name, tp.goal_type, tp.difficulty_level, 
         tp.training_days_per_week, tp.equipment_required, 
         tp.is_active, tp.created_at;

CREATE VIEW v_similar_users AS
SELECT * FROM (
    SELECT 
        up1.auth_account_id as user_id,
        up2.auth_account_id as similar_user_id,
        (
            (CASE WHEN up1.goal = up2.goal THEN 25 ELSE 0 END) +
            (CASE WHEN up1.level = up2.level THEN 20 ELSE 0 END) +
            (CASE WHEN up1.training_days_per_week = up2.training_days_per_week THEN 15 ELSE 0 END) +
            (CASE WHEN up1.equipment_preference = up2.equipment_preference THEN 20 ELSE 0 END) +
            (CASE WHEN ABS(COALESCE(up1.preferred_session_duration, 60) - COALESCE(up2.preferred_session_duration, 60)) <= 15 THEN 10 ELSE 0 END)
        ) AS similarity_score
    FROM user_profiles up1
    JOIN user_profiles up2 ON up1.auth_account_id <> up2.auth_account_id
) s
WHERE s.similarity_score >= 50;

-- ===========================
-- Funkcje pomocnicze
-- ===========================

CREATE OR REPLACE FUNCTION extract_muscle_groups(exercise_name TEXT, muscle_group TEXT)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY[
        CASE 
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%squat%', '%lunge%', '%leg%']) 
                 OR LOWER(muscle_group) LIKE '%leg%' THEN 'legs'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%press%', '%push%', '%chest%']) 
                 OR LOWER(muscle_group) LIKE '%chest%' THEN 'chest'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%pull%', '%row%', '%back%']) 
                 OR LOWER(muscle_group) LIKE '%back%' THEN 'back'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%shoulder%', '%raise%']) 
                 OR LOWER(muscle_group) LIKE '%shoulder%' THEN 'shoulders'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%curl%', '%bicep%']) 
                 OR LOWER(muscle_group) LIKE '%bicep%' THEN 'biceps'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%dip%', '%tricep%']) 
                 OR LOWER(muscle_group) LIKE '%tricep%' THEN 'triceps'
            WHEN LOWER(exercise_name) LIKE ANY(ARRAY['%core%', '%plank%', '%abs%']) 
                 OR LOWER(muscle_group) LIKE '%core%' THEN 'core'
            ELSE 'other'
        END
    ];
END;
$$ LANGUAGE plpgsql;

-- Trigger dla automatycznej aktualizacji rating_date
CREATE OR REPLACE FUNCTION update_rating_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL OR NEW.rating <> OLD.rating) THEN
        NEW.rating_date = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating_date
    BEFORE UPDATE ON user_active_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_rating_date();

-- ===========================
-- Dane początkowe (ćwiczenia, tagi, sprzęt)
-- ===========================

-- Podstawowy sprzęt
INSERT INTO equipment (name) VALUES 
    ('barbell'),
    ('dumbbells'),
    ('pull-up bar'),
    ('bench'),
    ('cables'),
    ('kettlebell'),
    ('resistance bands'),
    ('bodyweight'),
    ('machine')
ON CONFLICT (name) DO NOTHING;

-- Podstawowe tagi
INSERT INTO tags (name) VALUES 
    ('compound'),
    ('isolation'),
    ('beginner-friendly'),
    ('advanced'),
    ('cardio'),
    ('strength'),
    ('flexibility'),
    ('power'),
    ('endurance')
ON CONFLICT (name) DO NOTHING;

-- Przykładowe ćwiczenia
INSERT INTO exercises (name, description, muscle_group, type) VALUES
    ('Barbell Squat', 'Compound leg exercise', 'legs', 'strength'),
    ('Bench Press', 'Compound chest exercise', 'chest', 'strength'),
    ('Deadlift', 'Full body compound exercise', 'back', 'strength'),
    ('Pull-up', 'Compound back exercise', 'back', 'strength'),
    ('Overhead Press', 'Compound shoulder exercise', 'shoulders', 'strength')
ON CONFLICT (name) DO NOTHING;

-- ===========================
-- Komentarz końcowy
-- ===========================
-- Schemat gotowy do użycia z Django
-- Wszystkie kolumny wymagane przez Django są obecne
-- Dane początkowe zostaną dodane przez skrypt 02_insert_data.py