# fix_migrations.py - uruchom w katalogu backend/
import os
import sys
import django
from pathlib import Path

# Ustaw środowisko
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DB_HOST', 'localhost')  # Lokalna baza
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')

django.setup()

def fix_migrations():
    """Napraw migracje Django"""
    
    print("🔧 NAPRAWA MIGRACJI DJANGO")
    print("=" * 40)
    
    from django.core.management import execute_from_command_line
    from django.db import connection
    
    # 1. Sprawdź czy tabele istnieją
    print("\n1. 📋 Sprawdzanie istniejących tabel...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('auth_accounts', 'user_profiles')
                ORDER BY table_name;
            """)
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            print(f"   Znalezione tabele: {existing_tables}")
            
            if 'auth_accounts' in existing_tables and 'user_profiles' in existing_tables:
                print("   ✅ Tabele SQL istnieją")
                
                # 2. Sprawdź czy Django je rozpoznaje
                try:
                    from accounts.models import AuthAccount
                    count = AuthAccount.objects.count()
                    print(f"   ✅ Django widzi {count} użytkowników")
                    return True  # Wszystko OK
                except Exception as e:
                    print(f"   ❌ Django nie rozpoznaje tabel: {e}")
                    print("   🔧 Trzeba zsynchronizować Django z istniejącymi tabelami")
                    
            else:
                print("   ❌ Brak tabel SQL - trzeba je utworzyć")
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania: {e}")
    
    # 3. Usuń stare migracje
    print("\n2. 🗑️ Usuwanie starych migracji...")
    migrations_dir = backend_path / 'accounts' / 'migrations'
    if migrations_dir.exists():
        for file in migrations_dir.glob('*.py'):
            if file.name != '__init__.py':
                file.unlink()
                print(f"   Usunięto: {file.name}")
    
    # 4. Utwórz nowe migracje
    print("\n3. 🆕 Tworzenie nowych migracji...")
    try:
        execute_from_command_line(['manage.py', 'makemigrations', 'accounts'])
        print("   ✅ Migracje utworzone")
    except Exception as e:
        print(f"   ❌ Błąd tworzenia migracji: {e}")
        return False
    
    # 5. Zastosuj migracje
    print("\n4. 🔄 Stosowanie migracji...")
    try:
        # Jeśli tabele już istnieją, użyj --fake-initial
        if existing_tables:
            execute_from_command_line(['manage.py', 'migrate', '--fake-initial'])
            print("   ✅ Migracje zastosowane (fake-initial)")
        else:
            execute_from_command_line(['manage.py', 'migrate'])
            print("   ✅ Migracje zastosowane")
        
        return True
    except Exception as e:
        print(f"   ❌ Błąd stosowania migracji: {e}")
        return False

def test_after_fix():
    """Test po naprawie"""
    print("\n🧪 TEST PO NAPRAWIE:")
    
    try:
        from accounts.models import AuthAccount, UserProfile
        
        # Test podstawowy
        count = AuthAccount.objects.count()
        print(f"   Django widzi użytkowników: {count}")
        
        # Test tworzenia
        from accounts.serializers import UserRegistrationSerializer
        import time
        
        timestamp = int(time.time())
        test_data = {
            'username': f'test_fix_{timestamp}',
            'email': f'test_fix_{timestamp}@example.com',
            'password': 'TestPass123',
            'password_confirm': 'TestPass123',
            'first_name': 'Test Fix',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        serializer = UserRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            result = serializer.save()
            print(f"   🎉 SUKCES! Użytkownik utworzony: {result['auth_account'].username}")
            return True
        else:
            print(f"   ❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd testu: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Rozpoczynam naprawę migracji...")
    
    if fix_migrations():
        print("\n✅ Migracje naprawione!")
        if test_after_fix():
            print("\n🎉 REJESTRACJA DZIAŁA!")
        else:
            print("\n❌ Nadal są problemy z rejestracją")
    else:
        print("\n❌ Nie udało się naprawić migracji")