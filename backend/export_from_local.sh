# /Users/piotr/Desktop/GitHub/Praca_inzynierska/Lasko_app/backend/export_from_local.sh - Eksport danych z lokalnej bazy
#!/bin/bash


echo "📤 Eksportowanie danych z lokalnej bazy..."

# Ustaw parametry lokalnej bazy
LOCAL_HOST="localhost"
LOCAL_PORT="5433"  # Zmień jeśli inny
LOCAL_DB="LaskoDB"
LOCAL_USER="postgres"

# Eksportuj tylko dane (bez struktury)
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
    --data-only \
    --no-privileges \
    --no-owner \
    --inserts \
    -t exercises \
    -t exercise_variants \
    -t equipment \
    -t tags \
    -t exercise_tags \
    -t exercise_equipment \
    -t training_plans \
    -t plan_days \
    -t plan_exercises \
    > local_data_export.sql

echo "✅ Dane wyeksportowane do local_data_export.sql"
