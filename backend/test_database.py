# debug_database.py - umieść w katalogu backend/
import os
import sys
import django
import traceback
from pathlib import Path

# Ustaw Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
django.setup()

def test_connection_and_structure():
    """Test połączenia i struktury bazy danych"""
    
    print("=" * 60)
    print("🔍 DIAGNOSTYKA BAZY DANYCH")
    print("=" * 60)
    
    # 1. Test połączenia z bazą
    print("\n1. 🔌 TEST POŁĄCZENIA Z BAZĄ:")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"   ✅ Połączenie OK: {version[0]}")
            
            # Sprawdź aktualne ustawienia bazy
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"   📊 Baza: {db_info[0]}, Użytkownik: {db_info[1]}")
            
    except Exception as e:
        print(f"   ❌ Błąd połączenia: {e}")
        return False
    
    # 2. Sprawdź istniejące tabele
    print("\n2. 📋 ISTNIEJĄCE TABELE:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name, table_type
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            if tables:
                for table_name, table_type in tables:
                    print(f"   📊 {table_name} ({table_type})")
            else:
                print("   ❌ Brak tabel w schemacie public")
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania tabel: {e}")
    
    # 3. Sprawdź tabele Django
    print("\n3. 🐍 TEST MODELI DJANGO:")
    try:
        from accounts.models import AuthAccount, UserProfile
        
        # Sprawdź czy tabele istnieją
        print(f"   📊 AuthAccount tabela: {AuthAccount._meta.db_table}")
        print(f"   📊 UserProfile tabela: {UserProfile._meta.db_table}")
        
        # Sprawdź liczbę rekordów
        auth_count = AuthAccount.objects.count()
        profile_count = UserProfile.objects.count()
        
        print(f"   👥 Użytkowników w bazie: {auth_count}")
        print(f"   📋 Profili w bazie: {profile_count}")
        
        # Pokaż przykładowych użytkowników
        if auth_count > 0:
            print(f"\n   📝 Przykładowi użytkownicy:")
            for user in AuthAccount.objects.all()[:3]:
                print(f"      👤 ID: {user.id}, Username: {user.username}, Email: {user.email}")
        
    except Exception as e:
        print(f"   ❌ Błąd modeli Django: {e}")
        print(f"   📋 Traceback: {traceback.format_exc()}")
    
    # 4. Test migracji Django
    print("\n4. 🔄 STATUS MIGRACJI:")
    try:
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connection
        
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print(f"   ⚠️  Niewykonane migracje:")
            for migration, backwards in plan:
                print(f"      📋 {migration}")
        else:
            print(f"   ✅ Wszystkie migracje wykonane")
            
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania migracji: {e}")
    
    # 5. Sprawdź strukturę tabeli auth_accounts
    print("\n5. 🏗️  STRUKTURA TABELI auth_accounts:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'auth_accounts' 
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            if columns:
                for col_name, data_type, nullable, default in columns:
                    null_str = "NULL" if nullable == "YES" else "NOT NULL"
                    default_str = f", default: {default}" if default else ""
                    print(f"   📝 {col_name}: {data_type} {null_str}{default_str}")
            else:
                print("   ❌ Tabela auth_accounts nie istnieje!")
                
    except Exception as e:
        print(f"   ❌ Błąd sprawdzania struktury: {e}")
    
    # 6. Test tworzenia użytkownika
    print("\n6. 🆕 TEST TWORZENIA UŻYTKOWNIKA:")
    try:
        from accounts.serializers import UserRegistrationSerializer
        
        test_data = {
            'username': f'test_debug_{int(os.urandom(4).hex(), 16)}',
            'email': f'test_debug_{int(os.urandom(4).hex(), 16)}@example.com',
            'password': 'DebugPass123',
            'password_confirm': 'DebugPass123',
            'first_name': 'Debug',
            'goal': 'masa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }
        
        print(f"   📝 Dane testowe: {test_data['username']}, {test_data['email']}")
        
        serializer = UserRegistrationSerializer(data=test_data)
        
        if serializer.is_valid():
            print(f"   ✅ Walidacja przeszła pomyślnie")
            
            # Próba zapisania
            try:
                result = serializer.save()
                user = result['auth_account']
                profile = result['user_profile']
                
                print(f"   🎉 SUKCES! Użytkownik utworzony:")
                print(f"      👤 ID: {user.id}, Username: {user.username}")
                print(f"      📧 Email: {user.email}")
                print(f"      🎯 Cel: {profile.goal}")
                print(f"      📈 Poziom: {profile.level}")
                
                # Sprawdź czy rzeczywiście jest w bazie
                fresh_user = AuthAccount.objects.get(id=user.id)
                fresh_profile = UserProfile.objects.get(auth_account=fresh_user)
                print(f"   ✅ Potwierdzenie: użytkownik istnieje w bazie")
                
                return True
                
            except Exception as e:
                print(f"   ❌ Błąd podczas zapisu: {e}")
                print(f"   📋 Traceback: {traceback.format_exc()}")
                return False
                
        else:
            print(f"   ❌ Błędy walidacji: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"   ❌ Błąd testu tworzenia: {e}")
        print(f"   📋 Traceback: {traceback.format_exc()}")
        return False
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNOSTYKA ZAKOŃCZONA")
    print("=" * 60)

if __name__ == "__main__":
    test_connection_and_structure()