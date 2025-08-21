#!/bin/bash
# selective_migration.sh - Selektywna migracja wybranych tabel

echo "🎯 SELEKTYWNA MIGRACJA DANYCH"
echo "================================"

# Parametry lokalnej bazy (DOSTOSUJ!)
LOCAL_HOST="localhost"
LOCAL_PORT="5432"  # Sprawdź jaki port ma Twoja lokalna baza
LOCAL_DB="LaskoDB"
LOCAL_USER="postgres"

# Sprawdź połączenie z lokalną bazą
echo "🔍 Sprawdzam połączenie z lokalną bazą..."
if ! psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Nie można połączyć się z lokalną bazą!"
    echo "💡 Sprawdź parametry: host=$LOCAL_HOST, port=$LOCAL_PORT"
    exit 1
fi

echo "✅ Połączenie z lokalną bazą OK"

# Sprawdź które tabele z danymi treningowymi istnieją
echo "🔍 Sprawdzam dostępne tabele z danymi..."

TABLES_TO_MIGRATE=""

# Lista ważnych tabel z danymi (nie użytkowników)
CHECK_TABLES=("exercises" "exercise_variants" "equipment" "tags" "exercise_tags" "exercise_equipment" "training_plans" "plan_days" "plan_exercises")

for table in "${CHECK_TABLES[@]}"; do
    COUNT=$(psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    if [ "$COUNT" -gt 0 ]; then
        echo "   📊 $table: $COUNT rekordów"
        TABLES_TO_MIGRATE="$TABLES_TO_MIGRATE -t $table"
    else
        echo "   ⚠️  $table: brak danych lub tabeli"
    fi
done

if [ -z "$TABLES_TO_MIGRATE" ]; then
    echo "❌ Brak tabel z danymi do migracji!"
    exit 1
fi

echo "📤 Eksportuję dane z wybranych tabel..."

# Eksportuj dane
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
    --data-only \
    --no-privileges \
    --no-owner \
    --inserts \
    --on-conflict-do-nothing \
    $TABLES_TO_MIGRATE \
    > migration_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Eksport zakończony: migration_data.sql"
    
    echo "📥 Importuję do bazy Docker..."
    
    # Skopiuj do kontenera
    docker cp migration_data.sql lasko_app-db-1:/tmp/
    
    # Wykonaj import
    docker-compose exec db psql -U postgres -d LaskoDB -f /tmp/migration_data.sql
    
    if [ $? -eq 0 ]; then
        echo "🎉 Migracja zakończona sukcesem!"
        echo "📊 Sprawdź wyniki:"
        docker-compose exec db psql -U postgres -d LaskoDB -c "SELECT 'exercises' as table_name, COUNT(*) FROM exercises UNION ALL SELECT 'training_plans', COUNT(*) FROM training_plans;"
    else
        echo "❌ Błąd podczas importu"
    fi
else
    echo "❌ Błąd podczas eksportu"
fi
