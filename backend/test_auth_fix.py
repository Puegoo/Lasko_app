#!/usr/bin/env python3
# backend/test_auth_fix.py - Skrypt diagnostyczny i naprawczy
import os
import sys
import json
import subprocess
from pathlib import Path

# Kolory dla terminala
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

def check_file_for_content(filepath, search_text, description):
    """Sprawdź czy plik zawiera określony tekst"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_text in content:
                print_success(f"{description} - ZNALEZIONO")
                return True
            else:
                print_error(f"{description} - BRAK")
                return False
    except FileNotFoundError:
        print_error(f"Plik {filepath} nie istnieje!")
        return False

def run_django_check():
    """Uruchom Django check"""
    print("\n3. Sprawdzanie Django...")
    try:
        result = subprocess.run(
            ["python", "manage.py", "check"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print_success("Django check - OK")
            return True
        else:
            print_error(f"Django check - BŁĄD:\n{result.stderr}")
            return False
    except Exception as e:
        print_error(f"Błąd podczas Django check: {e}")
        return False

def test_endpoints():
    """Test endpointów API"""
    print("\n4. Testowanie endpointów...")
    
    try:
        import requests
    except ImportError:
        print_warning("Brak biblioteki requests - pomijam test endpointów")
        return None
    
    base_url = "http://localhost:8000/api/auth"
    endpoints = [
        ("POST", "/register", {"username": "test_fix", "email": "test@fix.com", "password": "testpass123", "first_name": "Test"}),
        ("POST", "/login", {"login": "test_fix", "password": "testpass123"}),
        ("POST", "/refresh", {"refresh": "fake_token"})  # Oczekujemy 401, nie 500
    ]
    
    results = {}
    for method, endpoint, data in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            if method == "POST":
                response = requests.post(url, json=data, timeout=5)
            else:
                response = requests.get(url, timeout=5)
            
            # Dla refresh oczekujemy 401 (nieprawidłowy token), nie 500
            if endpoint == "/refresh" and response.status_code == 401:
                print_success(f"{endpoint} - Status {response.status_code} (oczekiwany)")
                results[endpoint] = True
            elif response.status_code in [200, 201, 400, 401]:
                print_success(f"{endpoint} - Status {response.status_code}")
                results[endpoint] = True
            elif response.status_code == 500:
                print_error(f"{endpoint} - Status 500 (BŁĄD SERWERA)")
                results[endpoint] = False
            else:
                print_warning(f"{endpoint} - Status {response.status_code}")
                results[endpoint] = None
                
        except requests.ConnectionError:
            print_error(f"{endpoint} - Brak połączenia (czy serwer działa?)")
            results[endpoint] = False
        except Exception as e:
            print_error(f"{endpoint} - Błąd: {e}")
            results[endpoint] = False
    
    return results

def main():
    print_header("🔧 DIAGNOSTYKA I NAPRAWA AUTORYZACJI")
    
    # Przejdź do katalogu backend
    backend_path = Path(__file__).resolve().parent
    os.chdir(backend_path)
    print(f"📁 Katalog roboczy: {backend_path}")
    
    # 1. Sprawdź kluczowe pliki
    print("\n1. Sprawdzanie plików...")
    
    views_ok = all([
        check_file_for_content(
            "accounts/views.py",
            "from rest_framework_simplejwt.serializers import TokenRefreshSerializer",
            "Import TokenRefreshSerializer"
        ),
        check_file_for_content(
            "accounts/views.py",
            "def refresh_token(request):",
            "Funkcja refresh_token"
        ),
        check_file_for_content(
            "accounts/views.py",
            "from django.utils import timezone",
            "Import timezone"
        )
    ])
    
    # 2. Sprawdź URLs
    print("\n2. Sprawdzanie URLs...")
    urls_ok = check_file_for_content(
        "accounts/urls.py",
        "path('refresh/', views.refresh_token",
        "Endpoint refresh w URLs"
    )
    
    # 3. Django check
    django_ok = run_django_check()
    
    # 4. Test endpointów (jeśli serwer działa)
    endpoints_ok = test_endpoints()
    
    # Podsumowanie
    print_header("📊 PODSUMOWANIE")
    
    if views_ok and urls_ok:
        print_success("Pliki wyglądają dobrze!")
    else:
        print_error("Problemy z plikami - zastąp accounts/views.py według instrukcji")
    
    if django_ok:
        print_success("Django check przeszedł pomyślnie")
    else:
        print_warning("Django check zgłasza problemy")
    
    if endpoints_ok:
        failed = [k for k, v in endpoints_ok.items() if v is False]
        if failed:
            print_error(f"Endpointy z błędami: {', '.join(failed)}")
        else:
            print_success("Wszystkie endpointy działają!")
    
    # Instrukcje naprawcze
    if not (views_ok and urls_ok):
        print_header("🛠️ INSTRUKCJE NAPRAWCZE")
        print("1. Zastąp plik backend/accounts/views.py naprawioną wersją")
        print("2. Zrestartuj serwer Django:")
        print("   - Docker: docker-compose restart backend")
        print("   - Lokalnie: Ctrl+C i python manage.py runserver")
        print("3. Uruchom ponownie ten skrypt: python test_auth_fix.py")

if __name__ == "__main__":
    main()