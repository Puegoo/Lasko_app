#!/bin/bash
set -e

echo "🔄 Oczekiwanie na bazę danych..."

# Prostsze sprawdzenie bazy danych
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up!"

echo "🔍 Sprawdzanie struktury bazy danych..."

# Utwórz tabele jeśli nie istnieją
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'EOSQL'
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_accounts') THEN
        CREATE TABLE auth_accounts (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(50),
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE user_profiles (
            id SERIAL PRIMARY KEY,
            auth_account_id INT NOT NULL UNIQUE,
            first_name VARCHAR(50),
            date_of_birth DATE,
            goal VARCHAR(50),
            level VARCHAR(50),
            training_days_per_week INT,
            equipment_preference VARCHAR(50),
            FOREIGN KEY (auth_account_id) REFERENCES auth_accounts(id) ON DELETE CASCADE
        );
        
        CREATE INDEX idx_auth_accounts_email ON auth_accounts(email);
        CREATE INDEX idx_auth_accounts_username ON auth_accounts(username);
        
        RAISE NOTICE 'Tabele zostały utworzone';
    ELSE
        RAISE NOTICE 'Tabele już istnieją';
    END IF;
END
$$;
EOSQL

echo "🔄 Przygotowywanie Django..."
mkdir -p /app/logs

echo "🚀 Uruchamianie serwera Django na 0.0.0.0:8000..."
exec "$@"
