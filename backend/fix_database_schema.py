#!/usr/bin/env python3
# backend/fix_database_schema.py - Naprawa niezgodności struktury bazy danych

import os
import sys
import django
from pathlib import Path

# Kolory
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️ {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️ {text}{RESET}")

# Ustaw środowisko Django
backend_path = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DEBUG', '1')
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5432')

print_header("🔧 NAPRAWA STRUKTURY BAZY DANYCH")

# Inicjalizacja Django
django.setup()

from django.db import connection, transaction
from django.core.management import execute_from_command_line

def check_table_structure():
    """Sprawdź strukturę tabeli auth_accounts"""
    print("\n1. Sprawdzanie struktury tabeli auth_accounts...")
    
    with connection.cursor() as cursor:
        # Pobierz listę kolumn
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'auth_accounts'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        if columns:
            print(f"\n   Znaleziono {len(columns)} kolumn:")
            column_names = []
            for col_name, data_type, nullable, default in columns:
                nullable_text = "NULL" if nullable == 'YES' else "NOT NULL"
                default_text = f" DEFAULT {default}" if default else ""
                print(f"      - {col_name}: {data_type} {nullable_text}{default_text}")
                column_names.append(col_name)
            
            # Sprawdź brakujące kolumny Django
            django_required = ['is_superuser', 'is_staff', 'is_active', 'date_joined', 'last_login']
            missing = []
            for col in django_required:
                if col not in column_names:
                    missing.append(col)
                    print_error(f"   BRAK KOLUMNY: {col}")
                else:
                    print_success(f"   Kolumna {col} istnieje")
            
            return column_names, missing
        else:
            print_error("   Tabela auth_accounts jest pusta lub nie istnieje!")
            return [], []

def add_missing_columns():
    """Dodaj brakujące kolumny do tabeli"""
    print("\n2. Dodawanie brakujących kolumn...")
    
    with connection.cursor() as cursor:
        try:
            # Lista kolumn do dodania z ich typami
            columns_to_add = [
                ("is_superuser", "BOOLEAN DEFAULT FALSE"),
                ("is_staff", "BOOLEAN DEFAULT FALSE"),
                ("is_active", "BOOLEAN DEFAULT TRUE"),
                ("date_joined", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
                ("last_login", "TIMESTAMP WITH TIME ZONE"),
                ("groups", "JSONB DEFAULT '[]'::jsonb"),
                ("user_permissions", "JSONB DEFAULT '[]'::jsonb"),
            ]
            
            for col_name, col_type in columns_to_add:
                # Sprawdź czy kolumna już istnieje
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = 'auth_accounts'
                    AND column_name = %s
                """, [col_name])
                
                if not cursor.fetchone():
                    # Dodaj kolumnę
                    sql = f"ALTER TABLE auth_accounts ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                    cursor.execute(sql)
                    print_success(f"   Dodano kolumnę: {col_name}")
                else:
                    print_info(f"   Kolumna {col_name} już istnieje")
            
            # Commit zmian
            connection.commit()
            print_success("   Wszystkie kolumny zostały dodane!")
            
        except Exception as e:
            print_error(f"   Błąd podczas dodawania kolumn: {e}")
            connection.rollback()
            raise

def update_existing_records():
    """Zaktualizuj istniejące rekordy"""
    print("\n3. Aktualizacja istniejących rekordów...")
    
    with connection.cursor() as cursor:
        try:
            # Ustaw domyślne wartości dla istniejących rekordów
            cursor.execute("""
                UPDATE auth_accounts 
                SET is_superuser = COALESCE(is_admin, FALSE),
                    is_staff = COALESCE(is_admin, FALSE),
                    is_active = TRUE,
                    date_joined = COALESCE(created_at, CURRENT_TIMESTAMP)
                WHERE is_superuser IS NULL OR is_staff IS NULL
            """)
            
            updated = cursor.rowcount
            if updated > 0:
                print_success(f"   Zaktualizowano {updated} rekordów")
            else:
                print_info("   Brak rekordów do aktualizacji")
            
            connection.commit()
            
        except Exception as e:
            print_warning(f"   Błąd aktualizacji (może być OK jeśli brak danych): {e}")
            connection.rollback()

def create_admin_if_missing():
    """Utwórz konto admina jeśli nie istnieje"""
    print("\n4. Sprawdzanie konta administratora...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE username = 'admin'")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print_warning("   Brak konta admin - tworzenie...")
            
            from django.contrib.auth.hashers import make_password
            
            cursor.execute("""
                INSERT INTO auth_accounts 
                (username, email, password, first_name, is_admin, is_superuser, is_staff, is_active, created_at, date_joined)
                VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            """, [
                'admin',
                'admin@example.com',
                make_password('admin123'),
                'Administrator',
                True,  # is_admin
                True,  # is_superuser
                True,  # is_staff
                True,  # is_active
            ])
            
            admin_id = cursor.fetchone()[0]
            connection.commit()
            
            print_success(f"   Utworzono konto admin (ID: {admin_id})")
            print_info("   Login: admin")
            print_info("   Hasło: admin123")
        else:
            print_success("   Konto admin już istnieje")

def test_auth():
    """Test prostego zapytania"""
    print("\n5. Test zapytania do bazy...")
    
    try:
        from accounts.models import AuthAccount
        
        # Spróbuj pobrać użytkownika
        users = AuthAccount.objects.all()[:1]
        if users:
            user = users[0]
            print_success(f"   Pobrano użytkownika: {user.username}")
            print_info(f"      - is_admin: {getattr(user, 'is_admin', 'N/A')}")
            print_info(f"      - is_superuser: {getattr(user, 'is_superuser', 'N/A')}")
            print_info(f"      - is_staff: {getattr(user, 'is_staff', 'N/A')}")
            print_info(f"      - is_active: {getattr(user, 'is_active', 'N/A')}")
        else:
            print_warning("   Brak użytkowników w bazie")
            
    except Exception as e:
        print_error(f"   Błąd podczas testu: {e}")
        import traceback
        print(traceback.format_exc())

# GŁÓWNA LOGIKA
def main():
    try:
        # Sprawdź strukturę
        columns, missing = check_table_structure()
        
        if missing:
            print_warning(f"\n   Brakuje {len(missing)} kolumn: {', '.join(missing)}")
            
            # Pytanie o naprawę
            response = input("\n❓ Czy chcesz automatycznie dodać brakujące kolumny? (t/n): ")
            
            if response.lower() in ['t', 'tak', 'y', 'yes']:
                add_missing_columns()
                update_existing_records()
                create_admin_if_missing()
                test_auth()
                
                print_header("✅ NAPRAWA ZAKOŃCZONA")
                print("\n📋 CO DALEJ:")
                print("1. Zrestartuj serwer Django:")
                print("   python3 manage.py runserver")
                print("")
                print("2. Spróbuj się zalogować:")
                print("   Login: admin")
                print("   Hasło: admin123")
            else:
                print_info("Anulowano naprawę")
                print("\n💡 ALTERNATYWA - Możesz wykonać migracje:")
                print("   python3 manage.py makemigrations accounts")
                print("   python3 manage.py migrate --fake-initial")
        else:
            print_success("\n   Struktura tabeli wygląda dobrze!")
            test_auth()
            
    except Exception as e:
        print_error(f"\nBłąd główny: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()