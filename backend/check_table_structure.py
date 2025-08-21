# check_table_structure.py - sprawdź rzeczywistą strukturę tabeli
import os
import sys
import django
from pathlib import Path

# Ustaw środowisko
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')

django.setup()

def check_table_structure():
    """Sprawdź rzeczywistą strukturę tabel w bazie"""
    
    print("🔍 SPRAWDZANIE RZECZYWISTEJ STRUKTURY TABEL")
    print("=" * 50)
    
    from django.db import connection
    
    # 1. Sprawdź strukturę auth_accounts
    print("\n1. 📋 STRUKTURA TABELI auth_accounts:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'auth_accounts' 
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            if columns:
                print("   Kolumny w tabeli:")
                for col_name, data_type, nullable, default in columns:
                    null_str = "NULL" if nullable == "YES" else "NOT NULL"
                    default_str = f" DEFAULT {default}" if default else ""
                    print(f"      📝 {col_name}: {data_type} {null_str}{default_str}")
            else:
                print("   ❌ Tabela auth_accounts nie istnieje!")
                return False
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania auth_accounts: {e}")
        return False
    
    # 2. Sprawdź strukturę user_profiles
    print("\n2. 📋 STRUKTURA TABELI user_profiles:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user_profiles' 
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            if columns:
                print("   Kolumny w tabeli:")
                for col_name, data_type, nullable, default in columns:
                    null_str = "NULL" if nullable == "YES" else "NOT NULL"
                    default_str = f" DEFAULT {default}" if default else ""
                    print(f"      📝 {col_name}: {data_type} {null_str}{default_str}")
            else:
                print("   ❌ Tabela user_profiles nie istnieje!")
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania user_profiles: {e}")
    
    # 3. Sprawdź przykładowe dane
    print("\n3. 📊 PRZYKŁADOWE DANE:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM auth_accounts LIMIT 3;")
            rows = cursor.fetchall()
            
            if rows:
                # Pobierz nazwy kolumn
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'auth_accounts' 
                    ORDER BY ordinal_position;
                """)
                column_names = [row[0] for row in cursor.fetchall()]
                
                print("   Przykładowe rekordy:")
                for i, row in enumerate(rows):
                    print(f"      📋 Rekord {i+1}:")
                    for col_name, value in zip(column_names, row):
                        # Ukryj hasła
                        if 'password' in col_name.lower():
                            value = "***HIDDEN***"
                        print(f"         {col_name}: {value}")
                    print()
                    
    except Exception as e:
        print(f"   ❌ Błąd pobierania danych: {e}")
    
    return True

def suggest_fixes():
    """Zaproponuj rozwiązania"""
    print("\n🔧 ROZWIĄZANIA:")
    print("=" * 30)
    
    print("Na podstawie błędu, prawdopodobnie:")
    print("1. 🔍 Tabela ma kolumnę 'password' zamiast 'password_hash'")
    print("2. 🔍 Lub tabela ma inną strukturę niż zakładana")
    print("3. 🔍 Trzeba dopasować model Django do rzeczywistej struktury")
    print()
    print("Następne kroki:")
    print("1. Sprawdź wyniki powyżej")
    print("2. Dostosuj model AuthAccount do rzeczywistej struktury")
    print("3. Popraw serializer żeby używał właściwych nazw kolumn")

if __name__ == "__main__":
    if check_table_structure():
        suggest_fixes()