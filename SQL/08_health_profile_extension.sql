-- ============================================================================
-- 08_health_profile_extension.sql
-- Rozszerzenie profilu użytkownika o dane zdrowotne (BMI, kontuzje, schorzenia)
-- ============================================================================

-- Dodaj kolumny dla wagi i wzrostu (jeśli jeszcze nie istnieją)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='weight_kg') THEN
        ALTER TABLE user_profiles ADD COLUMN weight_kg DECIMAL(5,2);
        COMMENT ON COLUMN user_profiles.weight_kg IS 'Waga użytkownika w kilogramach';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='height_cm') THEN
        ALTER TABLE user_profiles ADD COLUMN height_cm INT;
        COMMENT ON COLUMN user_profiles.height_cm IS 'Wzrost użytkownika w centymetrach';
    END IF;
END $$;

-- Dodaj kolumnę BMI (obliczane automatycznie)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='bmi') THEN
        ALTER TABLE user_profiles ADD COLUMN bmi DECIMAL(4,2) GENERATED ALWAYS AS (
            CASE 
                WHEN height_cm > 0 AND weight_kg > 0 
                THEN ROUND((weight_kg / POWER(height_cm / 100.0, 2))::numeric, 2)
                ELSE NULL
            END
        ) STORED;
        COMMENT ON COLUMN user_profiles.bmi IS 'BMI obliczone automatycznie (waga_kg / (wzrost_m)^2)';
    END IF;
END $$;

-- Dodaj kolumny dla kontuzji i schorzeń
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='injuries') THEN
        ALTER TABLE user_profiles ADD COLUMN injuries JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN user_profiles.injuries IS 'Lista kontuzji: ["knee", "lower_back", "shoulder", ...]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='health_conditions') THEN
        ALTER TABLE user_profiles ADD COLUMN health_conditions JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN user_profiles.health_conditions IS 'Lista schorzeń: ["hypertension", "asthma", "diabetes", ...]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='health_notes') THEN
        ALTER TABLE user_profiles ADD COLUMN health_notes TEXT;
        COMMENT ON COLUMN user_profiles.health_notes IS 'Dodatkowe informacje zdrowotne od użytkownika';
    END IF;
END $$;

-- Dodaj kolumny intensity i plan_type do training_plans (jeśli nie istnieją)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='training_plans' AND column_name='intensity_level') THEN
        ALTER TABLE training_plans ADD COLUMN intensity_level VARCHAR(50) DEFAULT 'umiarkowana';
        COMMENT ON COLUMN training_plans.intensity_level IS 'Poziom intensywności: niska, umiarkowana, wysoka, bardzo_wysoka, hiit';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='training_plans' AND column_name='plan_type') THEN
        ALTER TABLE training_plans ADD COLUMN plan_type VARCHAR(50) DEFAULT 'strength';
        COMMENT ON COLUMN training_plans.plan_type IS 'Typ planu: strength, cardio, hybrid, hiit, crossfit, yoga, etc.';
    END IF;
END $$;

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_user_profiles_bmi ON user_profiles(bmi) WHERE bmi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_injuries ON user_profiles USING GIN(injuries);
CREATE INDEX IF NOT EXISTS idx_user_profiles_health_conditions ON user_profiles USING GIN(health_conditions);
CREATE INDEX IF NOT EXISTS idx_training_plans_intensity ON training_plans(intensity_level);
CREATE INDEX IF NOT EXISTS idx_training_plans_type ON training_plans(plan_type);

-- Zaktualizuj istniejące plany o intensity i type (domyślne wartości)
UPDATE training_plans 
SET intensity_level = CASE 
    WHEN difficulty_level = 'poczatkujacy' THEN 'umiarkowana'
    WHEN difficulty_level = 'sredniozaawansowany' THEN 'wysoka'
    WHEN difficulty_level = 'zaawansowany' THEN 'bardzo_wysoka'
    ELSE 'umiarkowana'
END
WHERE intensity_level IS NULL OR intensity_level = 'umiarkowana';

UPDATE training_plans 
SET plan_type = CASE 
    WHEN goal_type = 'masa' THEN 'strength'
    WHEN goal_type = 'sila' THEN 'strength'
    WHEN goal_type = 'spalanie' THEN 'cardio'
    WHEN goal_type = 'wytrzymalosc' THEN 'cardio'
    ELSE 'hybrid'
END
WHERE plan_type IS NULL OR plan_type = 'strength';

-- Funkcja pomocnicza do obliczania kategorii BMI
CREATE OR REPLACE FUNCTION get_bmi_category(bmi_value DECIMAL)
RETURNS TEXT AS $$
BEGIN
    IF bmi_value IS NULL THEN
        RETURN 'nieznana';
    ELSIF bmi_value < 18.5 THEN
        RETURN 'niedowaga';
    ELSIF bmi_value < 25 THEN
        RETURN 'norma';
    ELSIF bmi_value < 30 THEN
        RETURN 'nadwaga';
    ELSE
        RETURN 'otyłość';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_bmi_category IS 'Zwraca kategorię BMI: niedowaga, norma, nadwaga, otyłość';


