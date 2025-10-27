-- Dodanie kolumny profile_picture do tabeli user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Dodanie kolumny bio do tabeli user_profiles  
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

