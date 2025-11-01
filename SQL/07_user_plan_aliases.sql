-- ============================================================================
-- 07_user_plan_aliases.sql
-- Dodanie tabeli dla niestandardowych nazw planów (aliasów)
-- ============================================================================

-- Tabela do przechowywania niestandardowych nazw planów dla użytkowników
CREATE TABLE IF NOT EXISTS user_plan_aliases (
    id SERIAL PRIMARY KEY,
    auth_account_id INT NOT NULL,
    plan_id INT NOT NULL,
    custom_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Każdy użytkownik może mieć tylko jeden alias dla danego planu
    UNIQUE(auth_account_id, plan_id),
    
    FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

-- Indeks dla szybkiego wyszukiwania aliasów użytkownika
CREATE INDEX IF NOT EXISTS idx_user_plan_aliases_user 
ON user_plan_aliases(auth_account_id);

-- Indeks dla szybkiego wyszukiwania aliasów planu
CREATE INDEX IF NOT EXISTS idx_user_plan_aliases_plan 
ON user_plan_aliases(plan_id);

-- Trigger do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_user_plan_alias_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_plan_alias_timestamp
BEFORE UPDATE ON user_plan_aliases
FOR EACH ROW
EXECUTE FUNCTION update_user_plan_alias_timestamp();

-- Komentarze
COMMENT ON TABLE user_plan_aliases IS 'Niestandardowe nazwy planów nadane przez użytkowników (aliasy)';
COMMENT ON COLUMN user_plan_aliases.custom_name IS 'Nazwa nadana przez użytkownika (widoczna tylko dla niego)';
COMMENT ON COLUMN user_plan_aliases.auth_account_id IS 'ID użytkownika, który nadał alias';
COMMENT ON COLUMN user_plan_aliases.plan_id IS 'ID planu treningowego';

