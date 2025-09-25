#!/usr/bin/env python3
# backend/quick_test_login.py - SZYBKI TEST LOGOWANIA

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def log_message(message, status="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def test_quick_auth():
    """Szybki test autoryzacji"""
    
    print("🧪 SZYBKI TEST AUTORYZACJI")
    print("=" * 40)
    
    # Test 1: Health check
    log_message("🏥 Sprawdzanie health check...")
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        if response.status_code == 200:
            log_message("✅ Health check OK")
            data = response.json()
            log_message(f"   Service: {data.get('service', 'Unknown')}")
        else:
            log_message(f"❌ Health check failed: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        log_message(f"❌ Health check error: {str(e)}", "ERROR")
        return False
    
    # Test 2: Sprawdź czy endpoint logowania istnieje
    log_message("🔑 Testowanie endpoint logowania...")
    try:
        test_data = {
            "login": "nonexistent@test.com",
            "password": "test123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json=test_data,
            timeout=10
        )
        
        log_message(f"   Status code: {response.status_code}")
        
        if response.status_code == 401:
            log_message("✅ Endpoint logowania działa (401 oczekiwany dla nieistniejącego użytkownika)")
        elif response.status_code == 400:
            log_message("✅ Endpoint logowania działa (400 błąd walidacji)")
        elif response.status_code == 404:
            log_message("❌ Endpoint logowania nie znaleziony", "ERROR")
            return False
        elif response.status_code == 500:
            log_message("❌ Błąd serwera w endpoint logowania", "ERROR")
            try:
                error_data = response.json()
                log_message(f"   Błąd: {error_data.get('message', 'Unknown')}")
                log_message(f"   Error: {error_data.get('error', 'No details')}")
            except:
                log_message(f"   Raw response: {response.text[:200]}...")
            return False
        else:
            log_message(f"⚠️ Nieoczekiwany status code: {response.status_code}", "WARNING")
            
    except Exception as e:
        log_message(f"❌ Błąd testu logowania: {str(e)}", "ERROR")
        return False
    
    # Test 3: Test endpoint rekomendacji (bez tokenu)
    log_message("🤖 Testowanie endpoint rekomendacji...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/recommendations/",
            json={"mode": "hybrid", "top": 3},
            timeout=10
        )
        
        log_message(f"   Status code: {response.status_code}")
        
        if response.status_code == 401:
            log_message("✅ Endpoint rekomendacji działa (401 oczekiwany bez tokenu)")
        elif response.status_code == 404:
            log_message("❌ Endpoint rekomendacji nie znaleziony", "ERROR")
            return False
        elif response.status_code == 500:
            log_message("❌ Błąd serwera w endpoint rekomendacji", "ERROR")
            try:
                error_data = response.json()
                log_message(f"   Błąd: {error_data.get('message', 'Unknown')}")
            except:
                pass
            return False
        else:
            log_message(f"⚠️ Nieoczekiwany status code: {response.status_code}", "WARNING")
            
    except Exception as e:
        log_message(f"❌ Błąd testu rekomendacji: {str(e)}", "ERROR")
        return False
    
    # Test 4: Sprawdź refresh endpoint
    log_message("🔄 Testowanie endpoint refresh...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/refresh/",
            json={"refresh": "fake_token"},
            timeout=10
        )
        
        log_message(f"   Status code: {response.status_code}")
        
        if response.status_code == 401:
            log_message("✅ Endpoint refresh działa (401 oczekiwany dla fake tokenu)")
        elif response.status_code == 404:
            log_message("❌ Endpoint refresh nie znaleziony", "ERROR")
            return False
        elif response.status_code == 500:
            log_message("❌ Błąd serwera w endpoint refresh", "ERROR")
            return False
        else:
            log_message(f"⚠️ Nieoczekiwany status code: {response.status_code}", "WARNING")
            
    except Exception as e:
        log_message(f"❌ Błąd testu refresh: {str(e)}", "ERROR")
        return False
    
    print("\n" + "=" * 40)
    log_message("🎉 Wszystkie podstawowe testy przeszły pomyślnie!")
    print("\n💡 NASTĘPNE KROKI:")
    print("1. Zastąp pliki według instrukcji")  
    print("2. Uruchom: python backend/test_auth_debug.py")
    print("3. Otwórz frontend/lasko-frontend/public/auth-test.html")
    
    return True

if __name__ == "__main__":
    success = test_quick_auth()
    sys.exit(0 if success else 1)