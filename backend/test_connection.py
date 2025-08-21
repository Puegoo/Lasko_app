# test_connection.py - uruchom w katalogu backend/
import os
import sys
import django
from pathlib import Path

# Ustaw ścieżki
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

# Ustaw zmienne środowiskowe dla lokalnej bazy
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DEBUG', '1')
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('DB_HOST', 'localhost')  # WAŻNE: localhost zamiast 'db'
os.environ.setdefault('DB_PORT', '5432')

django.setup()

def test_database_and_registration():
    print("🔍 TEST POŁĄCZENIA I REJESTRACJI")
    print("=" * 50)
    
    # 1. Test połączenia
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"✅ Połączenie OK: baza={db_info[0]}, user={db_info[1]}")
    except Exception as e:
        print(f"❌ Błąd połączenia: {e}")
        return False
    
    # 2. Sprawdź tabele
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM auth_accounts;")
            auth_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM user_profiles;")
            profile_count = cursor.fetchone()[0]
            print(f"📊 Użytkowników: {auth_count}, Profili: {profile_count}")
    except Exception as e:
        print(f"❌ Błąd tabel: {e}")
        print("💡 Możliwe że tabele nie istnieją lub Django ich nie widzi")
        return False
    
    # 3. Test modeli Django
    try:
        from accounts.models import AuthAccount, UserProfile
        django_count = AuthAccount.objects.count()
        print(f"🐍 Django widzi użytkowników: {django_count}")
        
        if django_count != auth_count:
            print(f"⚠️  PROBLEM: SQL widzi {auth_count}, Django widzi {django_count}")
            print("💡 Django prawdopodobnie nie rozpoznaje tabel")
            
    except Exception as e:
        print(f"❌ Błąd Django ORM: {e}")
        return False
    
    # 4. Test rejestracji
    print("\n🧪 TEST REJESTRACJI:")
    try:
        from accounts.serializers import UserRegistrationSerializer
        import time
        
        timestamp = int(time.time())
        test_data = {
            'username': f'test_user_{timestamp}',
            'email': f'test_{timestamp}@example.com',
            'password': 'TestPass123',
            'password_confirm': 'TestPass123',
            'first_name': 'Test',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        print(f"📝 Próba utworzenia: {test_data['username']}")
        
        serializer = UserRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ Walidacja OK")
            
            # Sprawdź przed zapisem
            before_count = AuthAccount.objects.count()
            print(f"📊 Przed zapisem: {before_count} użytkowników")
            
            # Spróbuj zapisać
            result = serializer.save()
            
            # Sprawdź po zapisie
            after_count = AuthAccount.objects.count()
            print(f"📊 Po zapisie: {after_count} użytkowników")
            
            if after_count > before_count:
                print("🎉 SUKCES! Użytkownik został utworzony!")
                user = result['auth_account']
                print(f"👤 ID: {user.id}, Username: {user.username}")
                return True
            else:
                print("❌ PROBLEM: Użytkownik nie został zapisany do bazy")
                return False
                
        else:
            print(f"❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"❌ Błąd testu rejestracji: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_database_and_registration()
    
    if not success:
        print("\n🔧 ROZWIĄZANIA:")
        print("1. Sprawdź czy PostgreSQL działa: sudo systemctl status postgresql")
        print("2. Sprawdź czy baza LaskoDB istnieje")
        print("3. Wykonaj migracje: python manage.py migrate --fake-initial")
        print("4. Albo przebuduj tabele Django")