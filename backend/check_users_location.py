# check_users_location.py - sprawdź gdzie są zapisywani użytkownicy
import os
import sys
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
django.setup()

def check_users_in_database():
    """Sprawdź użytkowników w bazie i pokaż szczegóły połączenia"""
    
    print("🔍 SPRAWDZANIE LOKALIZACJI UŻYTKOWNIKÓW")
    print("=" * 50)
    
    from django.db import connection
    from accounts.models import AuthAccount
    
    # 1. Pokaż szczegóły połączenia
    print("\n1. 🔗 SZCZEGÓŁY POŁĄCZENIA:")
    db_settings = connection.settings_dict
    print(f"   Host: {db_settings['HOST']}")
    print(f"   Port: {db_settings['PORT']}")
    print(f"   Baza: {db_settings['NAME']}")
    print(f"   User: {db_settings['USER']}")
    
    # 2. Sprawdź użytkowników przez Django ORM
    print("\n2. 👥 UŻYTKOWNICY PRZEZ DJANGO ORM:")
    try:
        users = AuthAccount.objects.all().order_by('-id')[:10]
        print(f"   Całkowita liczba: {AuthAccount.objects.count()}")
        print(f"   Ostatnich 10 użytkowników:")
        
        for user in users:
            created_str = user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'brak'
            print(f"      ID: {user.id} | {user.username} | {user.email} | {created_str}")
            
    except Exception as e:
        print(f"   ❌ Błąd Django ORM: {e}")
        return False
    
    # 3. Sprawdź użytkowników przez bezpośredni SQL
    print("\n3. 🗄️ UŻYTKOWNICY PRZEZ BEZPOŚREDNI SQL:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, username, email, created_at 
                FROM auth_accounts 
                ORDER BY id DESC 
                LIMIT 10
            """)
            rows = cursor.fetchall()
            
            print(f"   SQL zwrócił {len(rows)} rekordów:")
            for row in rows:
                print(f"      ID: {row[0]} | {row[1]} | {row[2]} | {row[3]}")
                
    except Exception as e:
        print(f"   ❌ Błąd SQL: {e}")
        return False
    
    # 4. Utwórz nowego użytkownika testowego
    print("\n4. 🆕 TWORZENIE TESTOWEGO UŻYTKOWNIKA:")
    try:
        from accounts.serializers import UserRegistrationSerializer
        
        timestamp = int(time.time())
        test_data = {
            'username': f'location_test_{timestamp}',
            'email': f'location_test_{timestamp}@test.com',
            'password': 'LocationTest123',
            'password_confirm': 'LocationTest123',
            'first_name': 'Location Test',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        print(f"   📝 Tworzę użytkownika: {test_data['username']}")
        
        count_before = AuthAccount.objects.count()
        print(f"   📊 Użytkowników przed: {count_before}")
        
        serializer = UserRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            result = serializer.save()
            user = result['auth_account']
            
            count_after = AuthAccount.objects.count()
            print(f"   📊 Użytkowników po: {count_after}")
            print(f"   ✅ Nowy użytkownik ID: {user.id}")
            
            # Sprawdź czy widać w SQL
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) FROM auth_accounts 
                    WHERE username = %s
                """, [test_data['username']])
                sql_count = cursor.fetchone()[0]
                print(f"   🗄️ SQL potwierdza: {sql_count} rekord(ów)")
                
                # Pokaż dokładne dane
                cursor.execute("""
                    SELECT id, username, email, created_at, is_active
                    FROM auth_accounts 
                    WHERE username = %s
                """, [test_data['username']])
                row = cursor.fetchone()
                if row:
                    print(f"   📋 Szczegóły: ID={row[0]}, active={row[4]}, created={row[3]}")
            
            return True
        else:
            print(f"   ❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd tworzenia: {e}")
        return False

def show_connection_info():
    """Pokaż informacje o tym jak się połączyć z bazą Docker"""
    
    print("\n" + "=" * 50)
    print("🔗 JAK POŁĄCZYĆ SIĘ Z BAZĄ DOCKER:")
    print("=" * 50)
    
    print("1. 🐳 Przez Docker (baza w kontenerze):")
    print("   Host: localhost")
    print("   Port: 5432")
    print("   Database: LaskoDB")
    print("   Username: postgres")
    print("   Password: postgres")
    print()
    
    print("2. 📊 Sprawdź w pgAdmin:")
    print("   - Czy masz serwer połączony z localhost:5432?")
    print("   - Czy wybrana jest baza LaskoDB?")
    print("   - Czy odświeżyłeś widok tabel (F5)?")
    print()
    
    print("3. 🔄 Alternatywnie - sprawdź przez psql:")
    print("   docker-compose exec db psql -U postgres -d LaskoDB")
    print("   \\dt                           # pokaż tabele")
    print("   SELECT COUNT(*) FROM auth_accounts;")
    print("   SELECT username, email FROM auth_accounts ORDER BY id DESC LIMIT 5;")

if __name__ == "__main__":
    success = check_users_in_database()
    show_connection_info()
    
    if success:
        print(f"\n🎉 Rejestracja działa poprawnie!")
        print(f"💡 Sprawdź połączenie pgAdmin z localhost:5432")
        print(f"💡 Możliwe że pgAdmin łączy się z inną bazą")
    else:
        print(f"\n❌ Są problemy z rejestracją")