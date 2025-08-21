# test_final_registration.py - ostateczny test rejestracji
import os
import sys
import django
from pathlib import Path

# Ustaw środowisko
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DB_HOST', 'localhost')
django.setup()

def test_final_registration():
    """Ostateczny test rejestracji z poprawnymi modelami"""
    
    print("🎯 OSTATECZNY TEST REJESTRACJI")
    print("=" * 40)
    
    try:
        from accounts.models import AuthAccount, UserProfile
        from accounts.serializers import UserRegistrationSerializer
        import time
        
        # Sprawdź liczbę przed testem
        count_before = AuthAccount.objects.count()
        print(f"📊 Użytkowników przed testem: {count_before}")
        
        # Przygotuj dane testowe
        timestamp = int(time.time())
        test_data = {
            'username': f'final_test_{timestamp}',
            'email': f'final_{timestamp}@test.com',
            'password': 'FinalTest123',
            'password_confirm': 'FinalTest123',
            'first_name': 'Final Test',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 4,
            'equipment_preference': 'siłownia'
        }
        
        print(f"📝 Tworzę użytkownika: {test_data['username']}")
        
        # Test walidacji
        serializer = UserRegistrationSerializer(data=test_data)
        
        if serializer.is_valid():
            print("✅ Walidacja przeszła pomyślnie")
            
            # Test zapisu
            result = serializer.save()
            auth_account = result['auth_account']
            user_profile = result['user_profile']
            
            print(f"🎉 SUKCES! Użytkownik utworzony:")
            print(f"   👤 AuthAccount ID: {auth_account.id}")
            print(f"   📧 Email: {auth_account.email}")
            print(f"   👥 Username: {auth_account.username}")
            print(f"   📋 UserProfile ID: {user_profile.id}")
            print(f"   🎯 Cel: {user_profile.goal}")
            print(f"   📈 Poziom: {user_profile.level}")
            
            # Sprawdź liczbę po teście
            count_after = AuthAccount.objects.count()
            print(f"📊 Użytkowników po teście: {count_after}")
            
            if count_after > count_before:
                print("🎉 REJESTRACJA DZIAŁA POPRAWNIE!")
                
                # Test hasła
                if auth_account.check_password('FinalTest123'):
                    print("✅ Hashowanie hasła działa")
                else:
                    print("❌ Problem z hashowaniem hasła")
                
                # Sprawdź relację
                try:
                    profile_via_relation = auth_account.userprofile
                    print(f"✅ Relacja AuthAccount -> UserProfile działa")
                except Exception as e:
                    print(f"❌ Problem z relacją: {e}")
                
                # Wyczyść dane testowe
                auth_account.delete()
                print("🗑️ Dane testowe usunięte")
                
                return True
            else:
                print("❌ Użytkownik nie został zapisany do bazy")
                return False
                
        else:
            print(f"❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"❌ Błąd testu: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return False

def test_api_registration():
    """Test rejestracji przez API"""
    print("\n🌐 TEST API REJESTRACJI:")
    
    import requests
    import time
    
    timestamp = int(time.time())
    test_data = {
        'username': f'api_final_{timestamp}',
        'email': f'api_final_{timestamp}@test.com',
        'password': 'APITest123',
        'password_confirm': 'APITest123',
        'first_name': 'API Test',
        'goal': 'siła',
        'level': 'średniozaawansowany',
        'training_days_per_week': 5,
        'equipment_preference': 'wolne_ciezary'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/register/',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📡 Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"🎉 API SUKCES!")
            print(f"   Message: {data.get('message')}")
            print(f"   User ID: {data.get('user', {}).get('id')}")
            print(f"   Username: {data.get('user', {}).get('username')}")
            return True
        else:
            print(f"❌ API error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Serwer nie działa - uruchom: python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ Błąd API: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Rozpoczynam ostateczne testy...")
    
    # Test serializer
    serializer_success = test_final_registration()
    
    # Test API (jeśli serwer działa)
    api_success = test_api_registration()
    
    print("\n📊 PODSUMOWANIE:")
    print("=" * 20)
    print(f"Serializer: {'✅ DZIAŁA' if serializer_success else '❌ NIE DZIAŁA'}")
    print(f"API: {'✅ DZIAŁA' if api_success else '❌ NIE DZIAŁA / SERWER WYŁĄCZONY'}")
    
    if serializer_success:
        print("\n🎉 REJESTRACJA NAPRAWIONA!")
        print("💡 Możesz teraz używać endpointu /api/auth/register/")
    else:
        print("\n❌ Nadal są problemy z rejestracją")
        print("💡 Sprawdź logi powyżej")