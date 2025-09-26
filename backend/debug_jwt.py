# backend/debug_jwt.py - UTWÓRZ TEN PLIK
import os
import sys
import django
from pathlib import Path

# Dodaj backend do PYTHONPATH
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

# Ustaw Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
django.setup()

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from accounts.models import AuthAccount
import jwt
import json
from datetime import datetime

def create_test_token():
    """Utwórz testowy token JWT"""
    print("\n" + "="*60)
    print("🔧 TWORZENIE TESTOWEGO TOKENA JWT")
    print("="*60)
    
    try:
        # Znajdź użytkownika lub utwórz testowego
        try:
            user = AuthAccount.objects.first()
            if not user:
                user = AuthAccount.objects.create(
                    username='test_jwt',
                    email='test_jwt@example.com',
                    first_name='Test JWT'
                )
                user.set_password('testpass123')
                user.save()
                print(f"✅ Utworzono testowego użytkownika: {user.username}")
            else:
                print(f"✅ Użyto istniejącego użytkownika: {user.username}")
        except Exception as e:
            print(f"❌ Błąd tworzenia użytkownika: {e}")
            return None
        
        # Utwórz token
        refresh = RefreshToken()
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        print(f"\n📋 DANE TESTOWEGO TOKENA:")
        print(f"User ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Access Token: {access_token[:50]}...")
        print(f"Refresh Token: {refresh_token[:50]}...")
        
        # Zapisz do pliku
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "created_at": datetime.now().isoformat()
        }
        
        with open('test_tokens.json', 'w') as f:
            json.dump(token_data, f, indent=2)
        
        print(f"✅ Tokeny zapisane do test_tokens.json")
        return access_token
        
    except Exception as e:
        print(f"❌ Błąd tworzenia tokena: {e}")
        import traceback
        traceback.print_exc()
        return None

def decode_token(token_string):
    """Zdekoduj token JWT"""
    print("\n" + "="*60)
    print("🔍 DEKODOWANIE TOKENA JWT")
    print("="*60)
    
    try:
        # Zdekoduj bez weryfikacji podpisu (do debugowania)
        decoded_unverified = jwt.decode(
            token_string, 
            options={"verify_signature": False}
        )
        
        print(f"📋 ZAWARTOŚĆ TOKENA (bez weryfikacji):")
        for key, value in decoded_unverified.items():
            if key == 'exp':
                exp_date = datetime.fromtimestamp(value)
                print(f"  {key}: {value} ({exp_date})")
            else:
                print(f"  {key}: {value}")
        
        # Sprawdź czy token wygasł
        exp_timestamp = decoded_unverified.get('exp', 0)
        current_timestamp = datetime.now().timestamp()
        
        if exp_timestamp < current_timestamp:
            print(f"⚠️ TOKEN WYGASŁ!")
            print(f"Wygasł: {datetime.fromtimestamp(exp_timestamp)}")
            print(f"Teraz: {datetime.fromtimestamp(current_timestamp)}")
        else:
            print(f"✅ Token jeszcze ważny")
            time_left = exp_timestamp - current_timestamp
            print(f"Zostało: {int(time_left/60)} minut")
        
        # Próba weryfikacji z podpisem
        try:
            decoded_verified = jwt.decode(
                token_string,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            print(f"✅ Token prawidłowo zweryfikowany")
            return decoded_verified
            
        except jwt.ExpiredSignatureError:
            print(f"❌ Token wygasł")
            return None
        except jwt.InvalidSignatureError:
            print(f"❌ Nieprawidłowy podpis tokena")
            return None
        except Exception as e:
            print(f"❌ Błąd weryfikacji: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Błąd dekodowania tokena: {e}")
        return None

def test_jwt_authentication(token_string):
    """Przetestuj autoryzację JWT"""
    print("\n" + "="*60)
    print("🧪 TEST AUTORYZACJI JWT")
    print("="*60)
    
    try:
        from django.test import RequestFactory
        from rest_framework.request import Request
        
        # Utwórz mock request z tokenem
        factory = RequestFactory()
        mock_request = factory.get('/api/test/', HTTP_AUTHORIZATION=f'Bearer {token_string}')
        request = Request(mock_request)
        
        # Użyj JWTAuthentication
        jwt_auth = JWTAuthentication()
        
        try:
            result = jwt_auth.authenticate(request)
            
            if result:
                user, token = result
                print(f"✅ AUTORYZACJA UDANA!")
                print(f"User: {user}")
                print(f"Token payload: {token.payload}")
                print(f"User ID z tokena: {token.payload.get('user_id')}")
                return True
            else:
                print(f"❌ Autoryzacja nieudana - brak wyniku")
                return False
                
        except InvalidToken as e:
            print(f"❌ Nieprawidłowy token: {e}")
            return False
        except TokenError as e:
            print(f"❌ Błąd tokena: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Błąd testu autoryzacji: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🔧 NARZĘDZIE DEBUGOWANIA JWT")
    print("="*60)
    print("1. Tworzenie testowego tokena")
    print("2. Dekodowanie istniejącego tokena")
    print("3. Test pełnej autoryzacji")
    print("4. Wszystko powyżej")
    
    choice = input("\nWybierz opcję (1-4): ").strip()
    
    if choice == "1":
        create_test_token()
    elif choice == "2":
        token = input("Podaj token do zdekodowania: ").strip()
        if token:
            decode_token(token)
        else:
            print("❌ Nie podano tokena")
    elif choice == "3":
        token = input("Podaj token do przetestowania: ").strip()
        if token:
            test_jwt_authentication(token)
        else:
            print("❌ Nie podano tokena")
    elif choice == "4":
        print("\n🔄 Wykonuję wszystkie testy...")
        token = create_test_token()
        if token:
            decode_token(token)
            test_jwt_authentication(token)
    else:
        print("❌ Nieprawidłowy wybór")

if __name__ == "__main__":
    main()