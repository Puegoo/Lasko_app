#!/usr/bin/env python3
# backend/fix_migration.py
"""
Skrypt do naprawy problemów z migracjami Django
Uruchamianie: cd backend && python3 fix_migration.py
"""

import os
import sys
import django
import subprocess
from pathlib import Path

# Ustaw ścieżki
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

# Konfiguracja Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
os.environ.setdefault('DEBUG', '1')
os.environ.setdefault('POSTGRES_DB', 'LaskoDB')
os.environ.setdefault('POSTGRES_USER', 'postgres')
os.environ.setdefault('POSTGRES_PASSWORD', 'postgres')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5432')

django.setup()

from django.core.management import execute_from_command_line
from django.db import connection
from django.conf import settings


def run_command(command, description):
    """Wykonaj komendę i pokaż wynik"""
    print(f"\n🔧 {description}")
    print(f"💻 Komenda: {' '.join(command)}")
    
    try:
        result = subprocess.run(
            command,
            cwd=backend_path,
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.stdout:
            print(f"✅ Output:\n{result.stdout}")
        
        if result.stderr and result.returncode != 0:
            print(f"❌ Error:\n{result.stderr}")
            return False
        elif result.stderr:
            print(f"⚠️ Warnings:\n{result.stderr}")
        
        if result.returncode == 0:
            print(f"✅ Komenda wykonana pomyślnie")
            return True
        else:
            print(f"❌ Komenda zakończona z kodem: {result.returncode}")
            return False
            
    except Exception as e:
        print(f"❌ Błąd wykonywania komendy: {e}")
        return False


def check_database_connection():
    """Sprawdź połączenie z bazą danych"""
    print("\n" + "="*60)
    print("🔍 SPRAWDZANIE POŁĄCZENIA Z BAZĄ DANYCH")
    print("="*60)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✅ Połączenie z bazą OK")
            print(f"📊 Wersja PostgreSQL: {version}")
            
            cursor.execute("SELECT current_database(), current_user;")
            db_info = cursor.fetchone()
            print(f"📊 Baza: {db_info[0]}, Użytkownik: {db_info[1]}")
            
            return True
            
    except Exception as e:
        print(f"❌ Błąd połączenia z bazą: {e}")
        print("\n💡 ROZWIĄZANIA:")
        print("   1. Sprawdź czy PostgreSQL działa: pg_ctl status")
        print("   2. Sprawdź czy baza LaskoDB istnieje")
        print("   3. Sprawdź hasło i uprawnienia użytkownika postgres")
        print("   4. Sprawdź zmienne środowiskowe DB_HOST, DB_PORT, etc.")
        return False


def check_migration_status():
    """Sprawdź status migracji"""
    print("\n" + "="*60)
    print("📋 SPRAWDZANIE STATUSU MIGRACJI")
    print("="*60)
    
    return run_command(
        ['python3', 'manage.py', 'showmigrations', 'accounts'],
        "Pokazywanie statusu migracji accounts"
    )


def reset_migrations():
    """Resetuj migracje - OSTROŻNIE!"""
    print("\n" + "="*60)
    print("🔄 RESET MIGRACJI (USUWA DANE!)")
    print("="*60)
    
    response = input("⚠️  UWAGA: To usunie wszystkie dane z tabel accounts!\n"
                    "Czy chcesz kontynuować? (tak/nie): ").lower()
    
    if response not in ['tak', 'yes', 'y']:
        print("❌ Anulowano reset migracji")
        return False
    
    print("\n🔄 Resetowanie migracji accounts...")
    
    # 1. Cofnij migracje accounts
    success = run_command(
        ['python3', 'manage.py', 'migrate', 'accounts', 'zero'],
        "Cofanie migracji accounts do zera"
    )
    
    if not success:
        return False
    
    # 2. Usuń pliki migracji (oprócz __init__.py)
    migrations_dir = backend_path / 'accounts' / 'migrations'
    if migrations_dir.exists():
        for file in migrations_dir.glob('*.py'):
            if file.name != '__init__.py':
                print(f"🗑️ Usuwanie {file.name}")
                file.unlink()
    
    return True


def create_fresh_migrations():
    """Utwórz nowe migracje"""
    print("\n" + "="*60)
    print("🆕 TWORZENIE NOWYCH MIGRACJI")
    print("="*60)
    
    # 1. Utwórz migracje
    success = run_command(
        ['python3', 'manage.py', 'makemigrations', 'accounts'],
        "Tworzenie nowych migracji accounts"
    )
    
    if not success:
        return False
    
    # 2. Zastosuj migracje
    success = run_command(
        ['python3', 'manage.py', 'migrate', 'accounts'],
        "Stosowanie migracji accounts"
    )
    
    return success


def apply_existing_migrations():
    """Zastosuj istniejące migracje"""
    print("\n" + "="*60)
    print("▶️ STOSOWANIE ISTNIEJĄCYCH MIGRACJI")
    print("="*60)
    
    return run_command(
        ['python3', 'manage.py', 'migrate', 'accounts'],
        "Stosowanie migracji accounts"
    )


def create_test_user():
    """Utwórz testowego użytkownika"""
    print("\n" + "="*60)
    print("👤 TWORZENIE TESTOWEGO UŻYTKOWNIKA")
    print("="*60)
    
    try:
        from accounts.models import AuthAccount, UserProfile
        import time
        
        timestamp = int(time.time())
        username = f'test_user_{timestamp}'
        email = f'test_{timestamp}@example.com'
        password = 'TestPass123'
        
        print(f"👤 Tworzenie użytkownika: {username}")
        
        # Utwórz konto
        auth_account = AuthAccount.objects.create(
            username=username,
            email=email,
            first_name='Test User',
            is_admin=False,
            is_active=True
        )
        
        # Ustaw hasło
        auth_account.set_password(password)
        auth_account.save()
        
        print(f"✅ Konto utworzone: ID {auth_account.id}")
        
        # Utwórz profil
        user_profile = UserProfile.objects.create(
            auth_account=auth_account,
            goal='zdrowie',
            level='poczatkujacy',
            training_days_per_week=3,
            equipment_preference='silownia',
            recommendation_method='hybrid'
        )
        
        print(f"✅ Profil utworzony")
        print(f"\n🔑 DANE TESTOWEGO UŻYTKOWNIKA:")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Hasło: {password}")
        print(f"\n💡 Użyj tych danych do testowania logowania!")
        
        return True
        
    except Exception as e:
        print(f"❌ Błąd tworzenia testowego użytkownika: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return False


def main():
    """Główna funkcja naprawcza"""
    print("🔧" * 30)
    print("🔧 SKRYPT NAPRAWCZY MIGRACJI DJANGO 🔧")
    print("🔧" * 30)
    
    # 1. Sprawdź połączenie z bazą
    if not check_database_connection():
        print("\n❌ Nie można kontynuować bez połączenia z bazą")
        return False
    
    # 2. Sprawdź status migracji
    check_migration_status()
    
    # 3. Menu wyboru
    print("\n" + "🎯" * 20 + " OPCJE NAPRAWY " + "🎯" * 20)
    print("\n1. 📁 Zastosuj istniejące migracje (bezpieczne)")
    print("2. 🔄 Reset i nowe migracje (USUWA DANE!)")
    print("3. 👤 Tylko utwórz testowego użytkownika") 
    print("4. 🚪 Wyjście")
    
    choice = input("\nWybierz opcję (1-4): ").strip()
    
    if choice == '1':
        print("\n✅ Wybrano: Zastosowanie istniejących migracji")
        if apply_existing_migrations():
            print("\n🎉 Migracje zastosowane pomyślnie!")
            create_test_user()
        else:
            print("\n❌ Błąd stosowania migracji")
            return False
    
    elif choice == '2':
        print("\n⚠️  Wybrano: Reset i nowe migracje")
        if reset_migrations():
            if create_fresh_migrations():
                print("\n🎉 Nowe migracje utworzone pomyślnie!")
                create_test_user()
            else:
                print("\n❌ Błąd tworzenia nowych migracji")
                return False
        else:
            print("\n❌ Błąd resetowania migracji")
            return False
    
    elif choice == '3':
        print("\n👤 Wybrano: Tylko testowy użytkownik")
        create_test_user()
    
    elif choice == '4':
        print("\n👋 Do widzenia!")
        return True
    
    else:
        print("\n❌ Nieprawidłowy wybór")
        return False
    
    # Podsumowanie
    print("\n" + "🎉" * 20 + " ZAKOŃCZENIE " + "🎉" * 20)
    print("\n✅ Skrypt zakończony pomyślnie!")
    print("\n💡 KOLEJNE KROKI:")
    print("   1. Uruchom serwer Django: python3 manage.py runserver")
    print("   2. Przetestuj logowanie na froncie")
    print("   3. Sprawdź logi w logs/django.log")
    print("\n🔍 DIAGNOSTYKA:")
    print("   - python3 check_table_structure.py")
    print("   - python3 debug_database_local.py")
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Przerwano przez użytkownika")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Nieoczekiwany błąd: {e}")
        sys.exit(1)