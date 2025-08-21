# migrate_database_structure.py - Migracja struktury bazy danych
import os
import sys
import django
import subprocess
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
django.setup()

def compare_databases():
    """Porównaj struktury dwóch baz danych"""
    
    print("🔍 PORÓWNANIE STRUKTUR BAZ DANYCH")
    print("=" * 50)
    
    from django.db import connection
    
    # 1. Sprawdź strukturę obecnej bazy (Docker)
    print("\n1. 📊 STRUKTURA OBECNEJ BAZY (DOCKER):")
    try:
        with connection.cursor() as cursor:
            # Sprawdź wszystkie tabele
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            docker_tables = [row[0] for row in cursor.fetchall()]
            
            print(f"   Tabele w bazie Docker ({len(docker_tables)}):")
            for table in docker_tables:
                print(f"      📋 {table}")
                
            # Sprawdź liczbę rekordów w kluczowych tabelach
            key_tables = ['auth_accounts', 'user_profiles', 'exercises', 'training_plans']
            print(f"\n   Liczba rekordów:")
            for table in key_tables:
                if table in docker_tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table};")
                    count = cursor.fetchone()[0]
                    print(f"      {table}: {count}")
                else:
                    print(f"      {table}: brak tabeli")
                    
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania bazy Docker: {e}")
        return False
    
    return docker_tables

def get_local_database_info():
    """Pobierz informacje o lokalnej bazie danych"""
    
    print("\n2. 🔍 INFORMACJE O LOKALNEJ BAZIE:")
    print("   Aby sprawdzić lokalną bazę, potrzebuję:")
    print("   - Host lokalnej bazy (np. localhost)")
    print("   - Port lokalnej bazy (np. 5433)")
    print("   - Nazwa bazy (LaskoDB?)")
    print("   - Username/Password")
    print()
    
    # Przykład sprawdzenia lokalnej bazy
    local_connection_example = """
    # Przykład połączenia z lokalną bazą:
    psql -h localhost -p 5433 -U postgres -d LaskoDB
    
    # Sprawdź tabele:
    \\dt
    
    # Sprawdź liczby rekordów:
    SELECT 'exercises' as table_name, COUNT(*) FROM exercises
    UNION ALL
    SELECT 'training_plans', COUNT(*) FROM training_plans
    UNION ALL
    SELECT 'equipment', COUNT(*) FROM equipment;
    """
    
    print(local_connection_example)

def create_migration_scripts():
    """Utwórz skrypty do migracji danych"""
    
    print("\n3. 📝 TWORZENIE SKRYPTÓW MIGRACJI:")
    
    # Skrypt do eksportu z lokalnej bazy
    export_script = """#!/bin/bash
# export_from_local.sh - Eksport danych z lokalnej bazy

echo "📤 Eksportowanie danych z lokalnej bazy..."

# Ustaw parametry lokalnej bazy
LOCAL_HOST="localhost"
LOCAL_PORT="5433"  # Zmień jeśli inny
LOCAL_DB="LaskoDB"
LOCAL_USER="postgres"

# Eksportuj tylko dane (bez struktury)
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \\
    --data-only \\
    --no-privileges \\
    --no-owner \\
    --inserts \\
    -t exercises \\
    -t exercise_variants \\
    -t equipment \\
    -t tags \\
    -t exercise_tags \\
    -t exercise_equipment \\
    -t training_plans \\
    -t plan_days \\
    -t plan_exercises \\
    > local_data_export.sql

echo "✅ Dane wyeksportowane do local_data_export.sql"
"""
    
    # Skrypt do importu do Docker
    import_script = """#!/bin/bash
# import_to_docker.sh - Import danych do bazy Docker

echo "📥 Importowanie danych do bazy Docker..."

# Skopiuj plik do kontenera
docker cp local_data_export.sql lasko_app-db-1:/tmp/

# Wykonaj import
docker-compose exec db psql -U postgres -d LaskoDB -f /tmp/local_data_export.sql

echo "✅ Dane zaimportowane do bazy Docker"
"""
    
    # Zapisz skrypty
    with open('export_from_local.sh', 'w') as f:
        f.write(export_script)
    
    with open('import_to_docker.sh', 'w') as f:
        f.write(import_script)
    
    # Nadaj uprawnienia
    os.chmod('export_from_local.sh', 0o755)
    os.chmod('import_to_docker.sh', 0o755)
    
    print("   ✅ Utworzono skrypty:")
    print("      📤 export_from_local.sh")
    print("      📥 import_to_docker.sh")

def create_selective_migration_script():
    """Utwórz skrypt do selektywnej migracji"""
    
    selective_script = """#!/bin/bash
# selective_migration.sh - Selektywna migracja wybranych tabel

echo "🎯 SELEKTYWNA MIGRACJA DANYCH"
echo "================================"

# Parametry lokalnej bazy (DOSTOSUJ!)
LOCAL_HOST="localhost"
LOCAL_PORT="5433"  # Sprawdź jaki port ma Twoja lokalna baza
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
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \\
    --data-only \\
    --no-privileges \\
    --no-owner \\
    --inserts \\
    --on-conflict-do-nothing \\
    $TABLES_TO_MIGRATE \\
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
"""
    
    with open('selective_migration.sh', 'w') as f:
        f.write(selective_script)
    
    os.chmod('selective_migration.sh', 0o755)
    
    print("   ✅ Utworzono: selective_migration.sh")

def show_migration_options():
    """Pokaż opcje migracji"""
    
    print("\n" + "=" * 50)
    print("🎯 OPCJE MIGRACJI")
    print("=" * 50)
    
    print("1. 🔍 NAJPIERW SPRAWDŹ lokalną bazę:")
    print("   - Jaki port ma lokalna PostgreSQL?")
    print("   - Czy ma dane treningowe (exercises, training_plans)?")
    print("   - Czy chcesz WSZYSTKIE dane czy tylko wybrane tabele?")
    print()
    
    print("2. 📊 TYPY MIGRACJI:")
    print("   A) 🎯 SELEKTYWNA (zalecana):")
    print("      - Tylko dane treningowe (ćwiczenia, plany)")
    print("      - BEZ użytkowników (żeby nie konfliktować)")
    print("      - Użyj: ./selective_migration.sh")
    print()
    
    print("   B) 🔄 PEŁNA MIGRACJA:")
    print("      - Wszystkie dane łącznie z użytkownikami")
    print("      - Może powodować konflikty")
    print("      - Użyj: ./export_from_local.sh + ./import_to_docker.sh")
    print()
    
    print("3. 🛡️ BEZPIECZEŃSTWO:")
    print("   - Przed migracją zrób backup Docker bazy")
    print("   - Test na kopii")
    print("   - Sprawdź konflikty ID")

if __name__ == "__main__":
    docker_tables = compare_databases()
    get_local_database_info()
    create_migration_scripts()
    create_selective_migration_script()
    show_migration_options()
    
    print(f"\n🎯 NASTĘPNE KROKI:")
    print(f"1. Sprawdź parametry lokalnej bazy")
    print(f"2. Dostosuj selective_migration.sh")
    print(f"3. Uruchom: ./selective_migration.sh")
    print(f"4. Sprawdź wyniki w Docker bazie")