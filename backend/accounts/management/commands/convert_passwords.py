from django.core.management.base import BaseCommand
from accounts.models import AuthAccount
import hashlib

class Command(BaseCommand):
    help = 'Convert SHA256 passwords to Django format'

    def handle(self, *args, **options):
        """Convert passwords from SHA256 to Django format"""
        
        self.stdout.write('Converting passwords...')
        
        try:
            users = AuthAccount.objects.all()
            
            if not users.exists():
                self.stdout.write('No users found')
                return
            
            converted_count = 0
            test_sha256 = hashlib.sha256('password123'.encode()).hexdigest()
            
            for user in users:
                current_hash = user.password_hash
                
                # Check if it's SHA256 format (64 hex chars)
                if len(current_hash) == 64 and all(c in '0123456789abcdef' for c in current_hash.lower()):
                    if current_hash.lower() == test_sha256.lower():
                        # Convert known password
                        user.set_password('password123')
                        user.save()
                        converted_count += 1
                        self.stdout.write(f'Converted {user.username}: password123')
                    else:
                        # Unknown SHA256, set default
                        user.set_password('password123')
                        user.save()
                        converted_count += 1
                        self.stdout.write(f'Converted {user.username}: unknown -> password123')
                else:
                    # Already Django format
                    self.stdout.write(f'Skipped {user.username}: already Django format')
            
            self.stdout.write(
                self.style.SUCCESS(f'Converted {converted_count} passwords')
            )
            
            # Create test user
            if not AuthAccount.objects.filter(username='testuser').exists():
                test_user = AuthAccount.objects.create(
                    username='testuser',
                    email='test@example.com',
                    first_name='Test User',
                    is_active=True
                )
                test_user.set_password('test123')
                test_user.save()
                
                self.stdout.write('Created test user: testuser / test123')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error converting passwords: {e}')
            )