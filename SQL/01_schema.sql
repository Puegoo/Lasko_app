-- =================================================================
-- USUWANIE OBIEKTÓW BAZY DANYCH (W ODWROTNEJ KOLEJNOŚCI ZALEŻNOŚCI)
-- =================================================================

-- Usuwanie indeksów (kolejność nie ma znaczenia)
DROP INDEX IF EXISTS idx_logged_sets_session;
DROP INDEX IF EXISTS idx_training_sessions_user;
DROP INDEX IF EXISTS idx_training_plans_attrs;
DROP INDEX IF EXISTS idx_auth_accounts_email;

-- Usuwanie tabel z największą liczbą zależności lub na końcu łańcucha zależności
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS completed_plan_days;
DROP TABLE IF EXISTS session_exercises;
DROP TABLE IF EXISTS logged_sets;

-- Usuwanie tabel, od których zależą powyższe
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS plan_exercises;
DROP TABLE IF EXISTS plan_days;

-- Usuwanie tabel pomocniczych i historii
DROP TABLE IF EXISTS exercise_tags;
DROP TABLE IF EXISTS exercise_equipment;
DROP TABLE IF EXISTS exercise_variants;
DROP TABLE IF EXISTS exercise_feedback;
DROP TABLE IF EXISTS plan_history;
DROP TABLE IF EXISTS user_active_plans;

-- Usuwanie tabel głównych, od których zależą powyższe
DROP TABLE IF EXISTS training_plans;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS exercises;

-- Usuwanie tabel bezpośrednio powiązanych z kontem użytkownika
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_measurements;
DROP TABLE IF EXISTS user_goals_history;
DROP TABLE IF EXISTS user_notes;
DROP TABLE IF EXISTS notifications;

-- Usuwanie głównej tabeli kont użytkowników (na samym końcu)
DROP TABLE IF EXISTS auth_accounts;


-- =================================================================
-- TWORZENIE OBIEKTÓW BAZY DANYCH
-- =================================================================

-- Tabela: Konta logowania
CREATE TABLE auth_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Profile użytkowników
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL UNIQUE,
    first_name VARCHAR(50),
    date_of_birth DATE, -- nowa kolumna: data urodzenia
    goal VARCHAR(50),
    level VARCHAR(50),
    training_days_per_week INT,
    equipment_preference VARCHAR(50),
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Tabela: Ćwiczenia
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

-- Tagi ćwiczeń
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
    auth_account_id INT, -- twórca planu
    goal_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(50) NOT NULL,
    training_days_per_week INT NOT NULL,
    equipment_required VARCHAR(50) NOT NULL,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE SET NULL
);

-- Historia zmian planów
CREATE TABLE plan_history (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changes JSONB,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES auth_accounts(id) ON DELETE SET NULL
);

-- Dni w planie
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
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

-- Sesje treningowe
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    plan_id INT,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    weight_kg DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    notes VARCHAR(255),
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Wykonane dni planu
CREATE TABLE completed_plan_days (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    plan_day_id INT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE SET NULL
);

-- Pomiary użytkownika
CREATE TABLE user_measurements (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
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
    weight_kg DECIMAL(6,2) NOT NULL,
    record_date DATE NOT NULL,
    source_logged_set_id INT UNIQUE,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (source_logged_set_id) REFERENCES logged_sets(id) ON DELETE SET NULL,
    UNIQUE (auth_account_id, exercise_id, reps)
);

-- Historia celów użytkownika
CREATE TABLE user_goals_history (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    old_goal VARCHAR(50),
    new_goal VARCHAR(50),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Notatki użytkownika
CREATE TABLE user_notes (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    note_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Feedback do ćwiczeń
CREATE TABLE exercise_feedback (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    exercise_id INT NOT NULL,
    difficulty_rating INT,
    subjective_notes TEXT,
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Powiadomienia
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    notify_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
);

-- Indeksy
CREATE INDEX idx_auth_accounts_email ON auth_accounts(email);
CREATE INDEX idx_training_plans_attrs ON training_plans(goal_type, difficulty_level, training_days_per_week, equipment_required);
CREATE INDEX idx_training_sessions_user ON training_sessions(auth_account_id, session_date DESC);
CREATE INDEX idx_logged_sets_session ON logged_sets(session_id);