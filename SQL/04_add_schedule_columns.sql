-- Lasko_app/SQL/04_add_schedule_columns.sql
-- =================================================================
-- MIGRACJA: Dodanie kolumn harmonogramu do user_active_plans
-- Data: 2025-10-26
-- =================================================================

-- Sprawdź czy kolumny już istnieją przed dodaniem
DO $$ 
BEGIN
    -- Dodaj training_schedule jeśli nie istnieje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_active_plans' 
        AND column_name = 'training_schedule'
    ) THEN
        ALTER TABLE user_active_plans 
        ADD COLUMN training_schedule JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Kolumna training_schedule została dodana';
    ELSE
        RAISE NOTICE 'Kolumna training_schedule już istnieje';
    END IF;

    -- Dodaj notifications_enabled jeśli nie istnieje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_active_plans' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE user_active_plans 
        ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
        
        RAISE NOTICE 'Kolumna notifications_enabled została dodana';
    ELSE
        RAISE NOTICE 'Kolumna notifications_enabled już istnieje';
    END IF;
END $$;

-- Opcjonalnie: dodaj komentarze do kolumn
COMMENT ON COLUMN user_active_plans.training_schedule IS 'Harmonogram treningowy użytkownika - tablica dni tygodnia w formacie ["Poniedziałek", "Środa", "Piątek"]';
COMMENT ON COLUMN user_active_plans.notifications_enabled IS 'Czy użytkownik chce otrzymywać powiadomienia o treningach';

-- Wyświetl strukturę tabeli po zmianach
\d user_active_plans

