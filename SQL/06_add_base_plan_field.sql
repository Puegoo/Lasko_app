-- Lasko_app/SQL/06_add_base_plan_field.sql
-- =================================================================
-- MIGRACJA: Dodanie pola is_base_plan do training_plans
-- Data: 2025-01-XX
-- =================================================================

-- Sprawdź czy kolumna już istnieje przed dodaniem
DO $$ 
BEGIN
    -- Dodaj is_base_plan jeśli nie istnieje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_plans' 
        AND column_name = 'is_base_plan'
    ) THEN
        ALTER TABLE training_plans 
        ADD COLUMN is_base_plan BOOLEAN DEFAULT TRUE;
        
        -- Ustaw wszystkie istniejące plany jako bazowe (jeśli nie mają właściciela)
        UPDATE training_plans 
        SET is_base_plan = CASE 
            WHEN auth_account_id IS NULL THEN TRUE 
            ELSE FALSE 
        END;
        
        RAISE NOTICE 'Kolumna is_base_plan została dodana';
    ELSE
        RAISE NOTICE 'Kolumna is_base_plan już istnieje';
    END IF;

    -- Dodaj base_plan_id jeśli nie istnieje (dla kopii planów)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_plans' 
        AND column_name = 'base_plan_id'
    ) THEN
        ALTER TABLE training_plans 
        ADD COLUMN base_plan_id INT;
        
        ALTER TABLE training_plans
        ADD CONSTRAINT fk_base_plan 
        FOREIGN KEY (base_plan_id) 
        REFERENCES training_plans(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Kolumna base_plan_id została dodana';
    ELSE
        RAISE NOTICE 'Kolumna base_plan_id już istnieje';
    END IF;
END $$;

-- Opcjonalnie: dodaj komentarze do kolumn
COMMENT ON COLUMN training_plans.is_base_plan IS 'Czy plan jest bazowym planem systemowym (TRUE) czy niestandardowym użytkownika (FALSE)';
COMMENT ON COLUMN training_plans.base_plan_id IS 'ID bazowego planu, z którego został skopiowany (NULL dla planów bazowych)';

-- Utwórz indeks dla szybkiego wyszukiwania planów bazowych
CREATE INDEX IF NOT EXISTS idx_training_plans_is_base_plan ON training_plans(is_base_plan) WHERE is_base_plan = TRUE;
CREATE INDEX IF NOT EXISTS idx_training_plans_base_plan_id ON training_plans(base_plan_id) WHERE base_plan_id IS NOT NULL;

