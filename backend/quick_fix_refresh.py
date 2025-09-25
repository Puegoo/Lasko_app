#!/usr/bin/env python3
# backend/quick_fix_refresh.py - SZYBKA NAPRAWKA REFRESH ENDPOINT

print("🔧 SZYBKA NAPRAWKA REFRESH ENDPOINT")
print("=" * 50)

# 1. Sprawdź obecny plik accounts/views.py
print("1. Sprawdzanie obecnego pliku accounts/views.py...")

try:
    with open('accounts/views.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    print(f"   Plik ma {len(content)} znaków")
    
    # Sprawdź importy
    if 'TokenRefreshSerializer' in content:
        print("   ✅ TokenRefreshSerializer jest zaimportowany")
    else:
        print("   ❌ Brak TokenRefreshSerializer - to powoduje błąd 500!")
        
    # Sprawdź funkcję refresh_token
    if 'def refresh_token(' in content:
        print("   ✅ Funkcja refresh_token istnieje")
    else:
        print("   ❌ Brak funkcji refresh_token")
        
except Exception as e:
    print(f"   ❌ Błąd odczytu: {e}")

# 2. Sprawdź URLs
print("\n2. Sprawdzanie accounts/urls.py...")

try:
    with open('accounts/urls.py', 'r', encoding='utf-8') as f:
        urls_content = f.read()
        
    if "path('refresh/'" in urls_content:
        print("   ✅ Endpoint refresh/ istnieje w URLs")
    else:
        print("   ❌ Brak endpoint refresh/ w URLs")
        
except Exception as e:
    print(f"   ❌ Błąd odczytu URLs: {e}")

# 3. Stwórz prostą naprawkę
print("\n3. Tworzenie prostej naprawki...")

fix_content = '''
# SZYBKA NAPRAWKA - DODAJ TO NA GÓRĘ accounts/views.py

from rest_framework_simplejwt.serializers import TokenRefreshSerializer

# SZYBKA NAPRAWKA - DODAJ TO DO accounts/views.py

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_simple(request):
    """Prosta implementacja refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'message': 'Brak refresh token'}, status=400)
            
        serializer = TokenRefreshSerializer(data=request.data)
        if serializer.is_valid():
            return Response({'access': serializer.validated_data['access']})
        else:
            return Response({'message': 'Nieprawidłowy refresh token'}, status=401)
            
    except Exception as e:
        return Response({'message': f'Błąd: {str(e)}'}, status=500)
'''

print("✅ Naprawka wygenerowana!")
print("\n📝 INSTRUKCJE:")
print("1. Otwórz backend/accounts/views.py")
print("2. Dodaj na górze:")
print("   from rest_framework_simplejwt.serializers import TokenRefreshSerializer")
print("3. Dodaj funkcję refresh_token_simple() na końcu pliku")
print("4. Lub zastąp cały plik według instrukcji")

# 4. Test czy SimpleJWT jest zainstalowany
print("\n4. Sprawdzanie czy SimpleJWT jest dostępny...")

try:
    from rest_framework_simplejwt.serializers import TokenRefreshSerializer
    print("   ✅ TokenRefreshSerializer dostępny")
except ImportError as e:
    print(f"   ❌ Błąd importu: {e}")
    print("   Może trzeba zainstalować: pip install djangorestframework-simplejwt")

print("\n" + "=" * 50)
print("🔧 KONIEC - uruchom ponownie test po naprawie")