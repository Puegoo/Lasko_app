-- Lasko_app/SQL/06_add_exercise_rating_favorite.sql
-- Rozszerzenie tabeli exercise_feedback o kolumny rating i is_favorite

-- Dodaj kolumnę rating (ocena gwiazdkowa 1-5)
ALTER TABLE exercise_feedback 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Dodaj kolumnę is_favorite (czy ćwiczenie jest ulubione)
ALTER TABLE exercise_feedback 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Dodaj unikalny constraint aby jeden użytkownik mógł mieć tylko jeden feedback dla danego ćwiczenia
ALTER TABLE exercise_feedback 
DROP CONSTRAINT IF EXISTS unique_user_exercise_feedback;

ALTER TABLE exercise_feedback 
ADD CONSTRAINT unique_user_exercise_feedback UNIQUE (auth_account_id, exercise_id);

-- Dodaj indeks dla szybkiego wyszukiwania ulubionych
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_favorite 
ON exercise_feedback(auth_account_id, is_favorite) 
WHERE is_favorite = TRUE;

-- Dodaj indeks dla ocen
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_rating 
ON exercise_feedback(exercise_id, rating) 
WHERE rating IS NOT NULL;

COMMENT ON COLUMN exercise_feedback.rating IS 'Ocena gwiazdkowa ćwiczenia (1-5)';
COMMENT ON COLUMN exercise_feedback.is_favorite IS 'Czy ćwiczenie jest w ulubionych użytkownika';


