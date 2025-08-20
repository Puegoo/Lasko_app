# debug_database_local.py - umieść w katalogu backend/
import os
import sys
import django
import traceback
from pathlib import Path

# Ustaw lokalne ścieżki dla rozwoju
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

# Ustaw zmienne środowiskowe dla lokalnego uruchomienia
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DEBUG', '1')
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('DB_HOST', 'localhost')  # Dla lokalnej bazy
os.environ.setdefault('DB_PORT', '5432')

# Utwórz lokalny katalog na logi
logs_dir = backend_path / 'logs'
logs_dir.mkdir(exist_ok=True)

django.setup()

def test_connection_and_structure():
    """Test połączenia i struktury bazy danych"""
    
    print("=" * 60)
    print("🔍 DIAGNOSTYKA BAZY DANYCH (LOKALNE URUCHOMIENIE)")
    print("=" * 60)
    
    # 1. Test połączenia z bazą
    print("\n1. 🔌 TEST POŁĄCZENIA Z BAZĄ:")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"   ✅ Połączenie OK: {version[0]}")
            
            # Sprawdź aktualne ustawienia bazy
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"   📊 Baza: {db_info[0]}, Użytkownik: {db_info[1]}")
            
    except Exception as e:
        print(f"   ❌ Błąd połączenia: {e}")
        print(f"   💡 Upewnij się, że PostgreSQL działa na localhost:5432")
        print(f"   💡 I że baza LaskoDB istnieje z użytkownikiem postgres")
        return False
    
    # 2. Sprawdź istniejące tabele
    print("\n2. 📋 ISTNIEJĄCE TABELE:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name, table_type
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            if tables:
                print(f"   📊 Znaleziono {len(tables)} tabel:")
                for table_name, table_type in tables:
                    print(f"      📋 {table_name} ({table_type})")
            else:
                print("   ❌ Brak tabel w schemacie public")
                print("   💡 Trzeba będzie utworzyć tabele Django")
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania tabel: {e}")
    
    # 3. Sprawdź czy istnieją tabele Django
    print("\n3. 🐍 SPRAWDZENIE TABEL DJANGO:")
    try:
        with connection.cursor() as cursor:
            # Sprawdź czy istnieją tabele accounts
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'auth_accounts'
                );
            """)
            auth_table_exists = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                );
            """)
            profile_table_exists = cursor.fetchone()[0]
            
            print(f"   📊 Tabela auth_accounts: {'✅ istnieje' if auth_table_exists else '❌ nie istnieje'}")
            print(f"   📊 Tabela user_profiles: {'✅ istnieje' if profile_table_exists else '❌ nie istnieje'}")
            
            if not auth_table_exists or not profile_table_exists:
                print("   💡 Tabele Django nie istnieją - trzeba wykonać migracje")
                return False
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania tabel Django: {e}")
    
    # 4. Test modeli Django (tylko jeśli tabele istnieją)
    print("\n4. 🧪 TEST MODELI DJANGO:")
    try:
        from accounts.models import AuthAccount, UserProfile
        
        # Sprawdź liczbę rekordów
        auth_count = AuthAccount.objects.count()
        profile_count = UserProfile.objects.count()
        
        print(f"   👥 Użytkowników w bazie: {auth_count}")
        print(f"   📋 Profili w bazie: {profile_count}")
        
        # Pokaż przykładowych użytkowników
        if auth_count > 0:
            print(f"\n   📝 Przykładowi użytkownicy:")
            for user in AuthAccount.objects.all()[:5]:
                try:
                    profile = user.userprofile
                    print(f"      👤 {user.username} | {user.email} | Profil: ✅")
                except UserProfile.DoesNotExist:
                    print(f"      👤 {user.username} | {user.email} | Profil: ❌")
        
    except Exception as e:
        print(f"   ❌ Błąd modeli Django: {e}")
        print(f"   📋 Szczegóły: {traceback.format_exc()}")
    
    # 5. Test tworzenia użytkownika
    print("\n5. 🆕 TEST TWORZENIA NOWEGO UŻYTKOWNIKA:")
    try:
        from accounts.serializers import UserRegistrationSerializer
        
        # Generuj unikalną nazwę
        import time
        timestamp = int(time.time())
        
        test_data = {
            'username': f'test_debug_{timestamp}',
            'email': f'test_debug_{timestamp}@example.com',
            'password': 'DebugPass123',
            'password_confirm': 'DebugPass123',
            'first_name': 'Debug User',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        print(f"   📝 Tworzę użytkownika: {test_data['username']}")
        
        serializer = UserRegistrationSerializer(data=test_data)
        
        if serializer.is_valid():
            print(f"   ✅ Walidacja przeszła pomyślnie")
            
            # Próba zapisania
            try:
                result = serializer.save()
                user = result['auth_account']
                profile = result['user_profile']
                
                print(f"   🎉 SUKCES! Użytkownik utworzony:")
                print(f"      👤 ID: {user.id}, Username: {user.username}")
                print(f"      📧 Email: {user.email}")
                print(f"      🎯 Cel: {profile.goal}")
                print(f"      📈 Poziom: {profile.level}")
                
                # Sprawdź w bazie
                fresh_count = AuthAccount.objects.count()
                print(f"   📊 Nowa liczba użytkowników: {fresh_count}")
                
                return True
                
            except Exception as e:
                print(f"   ❌ Błąd podczas zapisu: {e}")
                print(f"   📋 Traceback: {traceback.format_exc()}")
                return False
                
        else:
            print(f"   ❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd testu tworzenia: {e}")
        print(f"   📋 Traceback: {traceback.format_exc()}")
        return False
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNOSTYKA ZAKOŃCZONA")
    print("=" * 60)

def show_migration_commands():
    """Pokaż komendy do wykonania migracji"""
    print("\n" + "=" * 60)
    print("🔧 KOMENDY DO WYKONANIA JEŚLI TABELE NIE ISTNIEJĄ:")
    print("=" * 60)
    print("cd backend")
    print("python manage.py makemigrations accounts")
    print("python manage.py migrate")
    print("python debug_database_local.py  # ponów test")
    print("=" * 60)

if __name__ == "__main__":
    success = test_connection_and_structure()
    if not success:
        show_migration_commands()