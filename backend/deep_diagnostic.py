#!/usr/bin/env python3
# backend/deep_diagnostic.py - Głęboka diagnostyka błędów 500
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

# Ustawienia bazy danych - dopasuj do swojego środowiska
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('DB_HOST', 'localhost')  # lub 'db' dla Dockera
os.environ.setdefault('DB_PORT', '5432')

print_header("🔬 GŁĘBOKA DIAGNOSTYKA BŁĘDÓW 500")

# 1. Sprawdź importy w settings.py
print("\n1. Sprawdzanie settings.py...")
try:
    with open('lasko_backend/settings.py', 'r') as f:
        settings_content = f.read()
        
    if 'from datetime import timedelta' in settings_content:
        print_success("Import timedelta w settings.py - OK")
    else:
        print_error("BRAK importu timedelta w settings.py - TO JEST PROBLEM!")
        print_warning("Dodaj na początku settings.py: from datetime import timedelta")
except Exception as e:
    print_error(f"Błąd odczytu settings.py: {e}")

# 2. Próba zainicjowania Django
print("\n2. Inicjalizacja Django...")
try:
    django.setup()
    print_success("Django setup - OK")
except Exception as e:
    print_error(f"Django setup FAILED: {e}")
    print_warning("To jest główny problem - Django nie może się zainicjować")
    import traceback
    print(f"\n{RED}Pełny traceback:{RESET}")
    print(traceback.format_exc())
    sys.exit(1)

# 3. Test importów kluczowych modułów
print("\n3. Test importów...")
modules_to_test = [
    ('rest_framework_simplejwt.tokens', 'RefreshToken'),
    ('rest_framework_simplejwt.serializers', 'TokenRefreshSerializer'),
    ('accounts.models', 'AuthAccount'),
    ('accounts.serializers', 'UserRegistrationSerializer'),
]

for module_name, class_name in modules_to_test:
    try:
        module = __import__(module_name, fromlist=[class_name])
        getattr(module, class_name)
        print_success(f"{module_name}.{class_name} - OK")
    except ImportError as e:
        print_error(f"{module_name}.{class_name} - IMPORT ERROR: {e}")
    except AttributeError as e:
        print_error(f"{module_name}.{class_name} - ATTRIBUTE ERROR: {e}")

# 4. Test połączenia z bazą danych
print("\n4. Test połączenia z bazą danych...")
try:
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print_success(f"PostgreSQL połączenie OK - {version}")
        
        # Sprawdź czy tabele istnieją
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('auth_accounts', 'user_profiles')
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        if tables:
            for table in tables:
                print_success(f"Tabela {table[0]} istnieje")
        else:
            print_error("Brak tabel auth_accounts i user_profiles!")
            print_warning("Uruchom migracje: python3 manage.py migrate")
            
except Exception as e:
    print_error(f"Błąd połączenia z bazą: {e}")
    print_warning("Sprawdź czy PostgreSQL działa i dane dostępowe są poprawne")

# 5. Test samego importu views
print("\n5. Test importu accounts/views.py...")
try:
    from accounts import views
    
    # Sprawdź czy wszystkie funkcje istnieją
    required_functions = ['register', 'login', 'logout', 'refresh_token', 'profile']
    for func_name in required_functions:
        if hasattr(views, func_name):
            print_success(f"Funkcja {func_name} - OK")
        else:
            print_error(f"Brak funkcji {func_name}!")
            
except Exception as e:
    print_error(f"Błąd importu views: {e}")
    import traceback
    print(f"\n{RED}Traceback:{RESET}")
    print(traceback.format_exc())

# 6. Symulacja requestu
print("\n6. Test symulowanego requestu...")
try:
    from rest_framework.test import APIRequestFactory
    from accounts.views import login
    
    factory = APIRequestFactory()
    request = factory.post('/api/auth/login', {
        'login': 'test_user',
        'password': 'test_pass'
    }, format='json')
    
    # Próba wywołania funkcji
    response = login(request)
    print_info(f"Response status: {response.status_code}")
    
    if response.status_code == 500:
        print_error("Nadal błąd 500 w symulacji")
        if hasattr(response, 'data'):
            print(f"Response data: {response.data}")
    elif response.status_code in [400, 401]:
        print_success("Funkcja login działa (zwróciła 400/401 dla nieprawidłowych danych)")
    else:
        print_warning(f"Nieoczekiwany status: {response.status_code}")
        
except Exception as e:
    print_error(f"Błąd symulacji: {e}")
    import traceback
    print(f"\n{RED}Traceback:{RESET}")
    print(traceback.format_exc())

# 7. Sprawdź logi Django
print("\n7. Sprawdzanie logów...")
log_file = backend_path / 'logs' / 'django.log'
if log_file.exists():
    try:
        with open(log_file, 'r') as f:
            lines = f.readlines()
            # Pokaż ostatnie 20 linii z błędami
            error_lines = [l for l in lines[-100:] if 'ERROR' in l or 'CRITICAL' in l]
            if error_lines:
                print_warning(f"Znaleziono {len(error_lines)} błędów w logach:")
                for line in error_lines[-5:]:  # Ostatnie 5 błędów
                    print(f"  {line.strip()}")
            else:
                print_info("Brak ostatnich błędów w logach")
    except Exception as e:
        print_error(f"Błąd odczytu logów: {e}")
else:
    print_info(f"Brak pliku logów: {log_file}")

# PODSUMOWANIE
print_header("📊 PODSUMOWANIE DIAGNOSTYKI")

print("\n🔧 NAJCZĘSTSZE PRZYCZYNY BŁĘDU 500:")
print("1. Brak 'from datetime import timedelta' w settings.py")
print("2. Brak tabel w bazie danych (nie uruchomiono migracji)")
print("3. Nieprawidłowe dane dostępowe do bazy danych")
print("4. Brak wymaganych pakietów (djangorestframework-simplejwt)")

print("\n💡 ROZWIĄZANIA:")
print("1. Dodaj na początku lasko_backend/settings.py:")
print("   from datetime import timedelta")
print("")
print("2. Uruchom migracje:")
print("   python3 manage.py migrate")
print("")
print("3. Sprawdź czy PostgreSQL działa:")
print("   pg_ctl status  # lub")
print("   docker-compose ps  # jeśli używasz Dockera")
print("")
print("4. Zainstaluj brakujące pakiety:")
print("   pip install -r requirements.txt")