from django.core.management.base import BaseCommand
from django.db import connection
from django.db.utils import OperationalError
import time
import sys

class Command(BaseCommand):
    help = 'Check if database is ready'

    def handle(self, *args, **options):
        """Wait for database to be ready"""
        
        self.stdout.write('Waiting for database...')
        db_up = False
        
        for i in range(30):  # Try for 30 seconds
            try:
                with connection.cursor() as cursor:
                    cursor.execute('SELECT 1')
                db_up = True
                break
            except OperationalError:
                self.stdout.write(f'Database unavailable, waiting 1 second... ({i+1}/30)')
                time.sleep(1)
        
        if db_up:
            self.stdout.write(
                self.style.SUCCESS('Database available!')
            )
        else:
            self.stdout.write(
                self.style.ERROR('Database unavailable after 30 seconds')
            )
            sys.exit(1)