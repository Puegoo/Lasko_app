# backend/accounts/migrations/0001_initial.py
# Ten plik zostanie wygenerowany automatycznie przez Django
# Ale możemy go stworzyć ręcznie, aby wykorzystać istniejący schemat

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        # Ta migracja nie tworzy tabel, ponieważ już istnieją w bazie
        # Django będzie używać istniejących tabel
        
        # Jeśli chcesz, żeby Django "przejął" istniejące tabele,
        # użyj polecenia: python manage.py migrate --fake-initial
    ]

# backend/management/commands/setup_db.py
from django.core.management.base import BaseCommand
from django.db import connections
from django.conf import settings

class Command(BaseCommand):
    help = 'Sprawdza połączenie z bazą danych i wyświetla informacje o tabelach'

    def handle(self, *args, **options):
        connection = connections['default']
        
        try:
            with connection.cursor() as cursor:
                # Sprawdź połączenie
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                self.stdout.write(
                    self.style.SUCCESS(f'Połączono z PostgreSQL: {version[0]}')
                )
                
                # Wyświetl istniejące tabele
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)
                
                tables = cursor.fetchall()
                self.stdout.write('\nIstniejące tabele:')
                for table in tables:
                    self.stdout.write(f'  - {table[0]}')
                
                # Sprawdź przykładowe dane w auth_accounts
                cursor.execute("SELECT COUNT(*) FROM auth_accounts;")
                count = cursor.fetchone()[0]
                self.stdout.write(f'\nLiczba użytkowników w bazie: {count}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Błąd połączenia z bazą: {e}')
            )