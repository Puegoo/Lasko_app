# debug_transaction.py - diagnoza problemów z transakcjami
import os
import sys
import django
from pathlib import Path

# Ustaw środowisko dla Docker
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DB_HOST', 'db')  # Docker używa 'db'
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')

django.setup()

def test_transaction_commit():
    """Test czy transakcje są commitowane"""
    
    print("🔍 DIAGNOZA PROBLEMÓW Z TRANSAKCJAMI")
    print("=" * 50)
    
    from django.db import connection, transaction
    from accounts.models import AuthAccount
    import time
    
    # 1. Test bezpośredniego SQL z manualnym commitem
    print("\n1. 🗄️ TEST BEZPOŚREDNIEGO SQL:")
    try:
        with connection.cursor() as cursor:
            # Sprawdź obecną liczbę
            cursor.execute("SELECT COUNT(*) FROM auth_accounts;")
            count_before = cursor.fetchone()[0]
            print(f"   📊 Użytkowników przed: {count_before}")
            
            # Wstaw bezpośrednio
            timestamp = int(time.time())
            cursor.execute("""
                INSERT INTO auth_accounts (
                    username, email, password, first_name, is_admin, 
                    is_superuser, is_staff, is_active, created_at, date_joined
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id
            """, [
                f'direct_sql_{timestamp}',
                f'direct_{timestamp}@test.com',
                'test_password_hash',
                'Direct SQL Test',
                False, False, False, True
            ])
            
            new_id = cursor.fetchone()[0]
            print(f"   ✅ Wstawiono rekord z ID: {new_id}")
            
            # WAŻNE: Sprawdź czy auto-commit jest włączony
            cursor.execute("SHOW autocommit;")
            autocommit = cursor.fetchone()[0]
            print(f"   🔧 Autocommit: {autocommit}")
            
            # Manualny commit jeśli potrzebny
            connection.commit()
            print(f"   💾 Wykonano manualny commit")
            
            # Sprawdź liczbę po wstawieniu
            cursor.execute("SELECT COUNT(*) FROM auth_accounts;")
            count_after = cursor.fetchone()[0]
            print(f"   📊 Użytkowników po: {count_after}")
            
            if count_after > count_before:
                print(f"   🎉 Bezpośredni SQL działa!")
                
                # Usuń testowy rekord
                cursor.execute("DELETE FROM auth_accounts WHERE id = %s", [new_id])
                connection.commit()
                print(f"   🗑️ Testowy rekord usunięty")
                return True
            else:
                print(f"   ❌ Bezpośredni SQL nie zapisał rekordu")
                return False
                
    except Exception as e:
        print(f"   ❌ Błąd bezpośredniego SQL: {e}")
        return False

def test_django_orm_transaction():
    """Test Django ORM z transakcjami"""
    
    print("\n2. 🐍 TEST DJANGO ORM Z TRANSAKCJAMI:")
    
    try:
        from django.db import transaction
        from accounts.models import AuthAccount
        import time
        
        # Sprawdź liczbę przed
        count_before = AuthAccount.objects.count()
        print(f"   📊 ORM - Użytkowników przed: {count_before}")
        
        timestamp = int(time.time())
        
        # Test z atomic transaction
        with transaction.atomic():
            print(f"   🔄 Rozpoczynam atomic transaction...")
            
            auth_account = AuthAccount(
                username=f'orm_test_{timestamp}',
                email=f'orm_{timestamp}@test.com',
                first_name='ORM Test',
                is_admin=False,
                is_superuser=False,
                is_staff=False,
                is_active=True
            )
            auth_account.set_password('TestPass123')
            auth_account.save()
            
            print(f"   ✅ AuthAccount zapisany z ID: {auth_account.id}")
            
            # Sprawdź czy jest widoczny w tej samej transakcji
            exists_in_transaction = AuthAccount.objects.filter(id=auth_account.id).exists()
            print(f"   🔍 Widoczny w transakcji: {exists_in_transaction}")
        
        # Sprawdź po zakończeniu transakcji
        count_after = AuthAccount.objects.count()
        print(f"   📊 ORM - Użytkowników po: {count_after}")
        
        if count_after > count_before:
            print(f"   🎉 Django ORM transaction działa!")
            
            # Usuń testowy rekord
            auth_account.delete()
            print(f"   🗑️ Testowy rekord usunięty")
            return True
        else:
            print(f"   ❌ Django ORM transaction nie zadziałał")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd Django ORM: {e}")
        import traceback
        print(f"   📋 Traceback: {traceback.format_exc()}")
        return False

def test_serializer_with_debug():
    """Test serializera z debugowaniem"""
    
    print("\n3. 📝 TEST SERIALIZERA Z DEBUGOWANIEM:")
    
    try:
        from accounts.serializers import UserRegistrationSerializer
        from accounts.models import AuthAccount
        import time
        
        # Sprawdź liczbę przed
        count_before = AuthAccount.objects.count()
        print(f"   📊 Serializer - Użytkowników przed: {count_before}")
        
        timestamp = int(time.time())
        test_data = {
            'username': f'serializer_debug_{timestamp}',
            'email': f'serializer_debug_{timestamp}@test.com',
            'password': 'SerializerTest123',
            'password_confirm': 'SerializerTest123',
            'first_name': 'Serializer Debug',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        print(f"   📝 Tworzę: {test_data['username']}")
        
        serializer = UserRegistrationSerializer(data=test_data)
        
        if serializer.is_valid():
            print(f"   ✅ Walidacja OK")
            
            # Tutaj jest kluczowe - czy save() rzeczywiście commituje
            result = serializer.save()
            auth_account = result['auth_account']
            
            print(f"   📝 Serializer zwrócił ID: {auth_account.id}")
            
            # Sprawdź czy widać w bazie NATYCHMIAST po save()
            fresh_count = AuthAccount.objects.count()
            print(f"   📊 Liczba po save(): {fresh_count}")
            
            # Sprawdź bezpośrednio w SQL
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE username = %s", [test_data['username']])
                sql_count = cursor.fetchone()[0]
                print(f"   🗄️ SQL widzi rekordów z tym username: {sql_count}")
                
                if sql_count == 0:
                    print(f"   ❌ PROBLEM: Serializer zapisał, ale SQL nie widzi!")
                    print(f"   💡 To wskazuje na problem z commitem transakcji")
                else:
                    print(f"   ✅ SQL potwierdza istnienie rekordu")
            
            return fresh_count > count_before
            
        else:
            print(f"   ❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd serializera: {e}")
        import traceback
        print(f"   📋 Traceback: {traceback.format_exc()}")
        return False

def check_database_settings():
    """Sprawdź ustawienia bazy danych"""
    
    print("\n4. ⚙️ SPRAWDZENIE USTAWIEŃ BAZY:")
    
    try:
        from django.db import connection
        from django.conf import settings
        
        print(f"   🔧 Django DATABASES config:")
        db_config = settings.DATABASES['default']
        for key, value in db_config.items():
            if key == 'PASSWORD':
                value = '***'
            print(f"      {key}: {value}")
        
        with connection.cursor() as cursor:
            # Sprawdź ustawienia PostgreSQL
            cursor.execute("SHOW autocommit;")
            autocommit = cursor.fetchone()[0]
            print(f"   🔧 PostgreSQL autocommit: {autocommit}")
            
            cursor.execute("SHOW transaction_isolation;")
            isolation = cursor.fetchone()[0]
            print(f"   🔧 Transaction isolation: {isolation}")
            
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"   🔧 Connected to: {db_info[0]} as {db_info[1]}")
            
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania ustawień: {e}")

def main():
    """Główna funkcja diagnostyczna"""
    
    results = {}
    
    # Sprawdź ustawienia
    check_database_settings()
    
    # Uruchom testy
    results['direct_sql'] = test_transaction_commit()
    results['django_orm'] = test_django_orm_transaction()
    results['serializer'] = test_serializer_with_debug()
    
    # Podsumowanie
    print("\n📊 DIAGNOZA:")
    print("=" * 30)
    
    for test_name, success in results.items():
        status = "✅ DZIAŁA" if success else "❌ NIE DZIAŁA"
        print(f"   {test_name.upper()}: {status}")
    
    # Analiza problemów
    print(f"\n🔍 ANALIZA:")
    if results['direct_sql'] and not results['serializer']:
        print("   💡 Problem jest w serializerze - transakcja nie jest commitowana")
        print("   🔧 Rozwiązanie: Dodaj connection.commit() lub sprawdź atomic()")
    elif not results['direct_sql']:
        print("   💡 Problem z bazą danych - brak autocommit")
        print("   🔧 Rozwiązanie: Sprawdź konfigurację PostgreSQL")
    elif all(results.values()):
        print("   🎉 Wszystko działa - problem może być gdzie indziej")
    else:
        print("   ❌ Mieszane wyniki - potrzebna głębsza analiza")

if __name__ == "__main__":
    main()