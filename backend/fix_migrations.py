# backend/fix_migrations.py - SKRYPT DO NAPRAWY MIGRACJI
#!/usr/bin/env python3
"""
Skrypt do naprawy migracji Django po zmianie modeli.
Uruchom: python fix_migrations.py
"""

import os
import sys
import shutil
from pathlib import Path

def main():
    print("🔧 NAPRAWIANIE MIGRACJI DJANGO")
    print("=" * 50)
    
    backend_path = Path(__file__).parent
    migrations_path = backend_path / "accounts" / "migrations"
    
    # 1. Usuń stare migracje (oprócz __init__.py)
    print("\n1. 🗑️ Usuwanie starych migracji...")
    if migrations_path.exists():
        for file in migrations_path.iterdir():
            if file.name != "__init__.py" and file.name != "__pycache__":
                print(f"   🗑️ Usuwam: {file.name}")
                if file.is_file():
                    file.unlink()
                elif file.is_dir():
                    shutil.rmtree(file)
    
    # 2. Usuń __pycache__ w migrations
    pycache_path = migrations_path / "__pycache__"
    if pycache_path.exists():
        print("   🗑️ Usuwam __pycache__")
        shutil.rmtree(pycache_path)
    
    # 3. Pokaż komendy do wykonania
    print("\n2. 📝 WYKONAJ TE KOMENDY W KONTENERZE DOCKERA:")
    print("=" * 50)
    print("# W nowym terminalu:")
    print("docker-compose exec backend bash")
    print("")
    print("# W kontenerze:")
    print("python manage.py makemigrations accounts")
    print("python manage.py migrate")
    print("")
    print("# Sprawdź czy działa:")
    print("python manage.py shell")
    print(">>> from accounts.models import AuthAccount")
    print(">>> AuthAccount.objects.count()")
    print("")
    
    # 4. Utwórz __init__.py jeśli nie istnieje
    init_file = migrations_path / "__init__.py"
    if not init_file.exists():
        migrations_path.mkdir(exist_ok=True)
        init_file.write_text("# Django migrations\n")
        print(f"   ✅ Utworzono: {init_file}")
    
    print("3. ⚠️ WAŻNE:")
    print("=" * 50)
    print("Przed uruchomieniem sprawdź czy kontener backend działa:")
    print("docker-compose ps")
    print("")
    print("Jeśli kontenery nie działają, uruchom:")
    print("docker-compose up -d")
    print("")
    
    print("✅ Przygotowanie zakończone!")
    print("Teraz wykonaj komendy z punktu 2.")

if __name__ == "__main__":
    main()