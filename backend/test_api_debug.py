# test_api_debug.py - test rejestracji API z debugowaniem
import requests
import json

def test_registration_api():
    """Test API rejestracji z szczegółowym debugowaniem"""
    
    print("=" * 60)
    print("🧪 TEST API REJESTRACJI")
    print("=" * 60)
    
    # URL API
    url = "http://localhost:8000/api/auth/register/"
    
    # Dane testowe
    test_data = {
        "username": "testapi456",
        "email": "testapi456@example.com",
        "password": "TestPass123",
        "password_confirm": "TestPass123",
        "first_name": "Test API",
        "goal": "masa",
        "level": "początkujący",
        "training_days_per_week": 3,
        "equipment_preference": "siłownia"
    }
    
    print(f"📝 Wysyłam dane:")
    print(json.dumps(test_data, indent=2, ensure_ascii=False))
    
    try:
        # Wyślij żądanie
        response = requests.post(
            url, 
            json=test_data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=30
        )
        
        print(f"\n📊 Status odpowiedzi: {response.status_code}")
        print(f"📋 Nagłówki odpowiedzi:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")
        
        print(f"\n📄 Treść odpowiedzi:")
        try:
            response_data = response.json()
            print(json.dumps(response_data, indent=2, ensure_ascii=False))
        except:
            print(f"Raw response: {response.text}")
        
        if response.status_code == 201:
            print(f"\n✅ SUKCES! Rejestracja przebiegła pomyślnie")
        elif response.status_code == 400:
            print(f"\n⚠️ BŁĘDY WALIDACJI - sprawdź dane wejściowe")
        elif response.status_code == 500:
            print(f"\n❌ BŁĄD SERWERA - sprawdź logi Django")
        else:
            print(f"\n❓ NIEOCZEKIWANY STATUS: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ BŁĄD POŁĄCZENIA - czy Django działa na localhost:8000?")
    except requests.exceptions.Timeout:
        print(f"\n❌ TIMEOUT - serwer nie odpowiada")
    except Exception as e:
        print(f"\n❌ NIEOCZEKIWANY BŁĄD: {e}")

def test_simple_endpoint():
    """Test prostego endpointu do sprawdzenia czy Django w ogóle działa"""
    
    print(f"\n" + "=" * 60)
    print("🔍 TEST PROSTEGO ENDPOINTU")
    print("=" * 60)
    
    try:
        # Test głównej strony Django
        response = requests.get("http://localhost:8000/", timeout=10)
        print(f"📊 Status głównej strony: {response.status_code}")
        
        # Test API base
        response = requests.get("http://localhost:8000/api/", timeout=10)
        print(f"📊 Status API base: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Błąd testowania endpointów: {e}")

if __name__ == "__main__":
    test_simple_endpoint()
    test_registration_api()