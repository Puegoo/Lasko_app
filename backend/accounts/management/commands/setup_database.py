from django.core.management.base import BaseCommand
from django.core.management import call_command
from accounts.models import AuthAccount, UserProfile
import subprocess
import sys
import os

class Command(BaseCommand):
    help = 'Complete database setup with data seeding'

    def add_arguments(self, parser):
        parser.add_argument(
            '--with-seed',
            action='store_true',
            help='Run Python seed script to populate data',
        )

    def handle(self, *args, **options):
        """Complete database setup"""
        
        self.stdout.write('Starting complete database setup...')
        
        # 1. Check if we already have data
        if AuthAccount.objects.exists():
            self.stdout.write('Users already exist, skipping seed')
            call_command('convert_passwords')
            return
        
        # 2. Run seed script if requested
        if options['with_seed']:
            self.stdout.write('Running Python seed script...')
            try:
                # Update the seed script to use correct database config
                seed_script_path = '/app/SQL/02_insert_data.py'
                if os.path.exists(seed_script_path):
                    # Modify the script to use Docker database config
                    result = subprocess.run([
                        'python', seed_script_path
                    ], 
                    cwd='/app/SQL',
                    env={
                        **os.environ,
                        'DB_HOST': 'db',
                        'DB_PORT': '5432',
                        'DB_NAME': 'LaskoDB',
                        'DB_USER': 'postgres', 
                        'DB_PASS': 'postgres'
                    },
                    capture_output=True,
                    text=True
                    )
                    
                    if result.returncode == 0:
                        self.stdout.write('Seed script completed successfully')
                        # Convert passwords after seeding
                        call_command('convert_passwords')
                    else:
                        self.stdout.write(f'Seed script failed: {result.stderr}')
                        # Create minimal test data
                        self.create_minimal_data()
                else:
                    self.stdout.write('Seed script not found, creating minimal data')
                    self.create_minimal_data()
                    
            except Exception as e:
                self.stdout.write(f'Error running seed script: {e}')
                self.create_minimal_data()
        else:
            self.create_minimal_data()

    def create_minimal_data(self):
        """Create minimal test data"""
        self.stdout.write('Creating minimal test data...')
        
        try:
            # Create admin user
            if not AuthAccount.objects.filter(username='admin').exists():
                admin = AuthAccount.objects.create(
                    username='admin',
                    email='admin@lasko.com',
                    first_name='Admin',
                    is_admin=True,
                    is_superuser=True,
                    is_staff=True,
                    is_active=True
                )
                admin.set_password('admin123')
                admin.save()
                self.stdout.write('Created admin user: admin / admin123')
            
            # Create test users
            test_users = [
                ('testuser1', 'test1@example.com', 'test123'),
                ('testuser2', 'test2@example.com', 'test123'),
                ('demouser', 'demo@lasko.com', 'demo123'),
            ]
            
            for username, email, password in test_users:
                if not AuthAccount.objects.filter(username=username).exists():
                    user = AuthAccount.objects.create(
                        username=username,
                        email=email,
                        first_name=username.title(),
                        is_active=True
                    )
                    user.set_password(password)
                    user.save()
                    
                    # Create profile if possible
                    try:
                        UserProfile.objects.create(
                            auth_account=user,
                            first_name=username.title(),
                            goal='zdrowie',
                            level='poczatkujacy',
                            training_days_per_week=3,
                            equipment_preference='silownia'
                        )
                    except Exception:
                        pass  # Profile creation might fail if columns don't exist
                    
                    self.stdout.write(f'Created user: {username} / {password}')
            
            self.stdout.write('Minimal data creation completed')
            
        except Exception as e:
            self.stdout.write(f'Error creating minimal data: {e}')