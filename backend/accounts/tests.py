# backend/accounts/tests.py
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import AuthAccount, UserProfile
import json

class AuthAccountModelTest(TestCase):
    def setUp(self):
        self.account = AuthAccount.objects.create(
            username='testuser',
            email='test@example.com',
            first_name='Test'
        )
        self.account.set_password('testpass123')
        self.account.save()

    def test_password_hashing(self):
        """Test czy hasło jest poprawnie hashowane"""
        self.assertTrue(self.account.check_password('testpass123'))
        self.assertFalse(self.account.check_password('wrongpass'))

    def test_string_representation(self):
        """Test reprezentacji tekstowej modelu"""
        self.assertEqual(str(self.account), 'testuser')


class RegistrationAPITest(APITestCase):
    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.valid_payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123',
            'password_confirm': 'SecurePass123',
            'first_name': 'Jan',
            'goal': 'masa_mięśniowa',
            'level': 'początkujący',
            'training_days_per_week': 3,
            'equipment_preference': 'siłownia'
        }

    def test_successful_registration(self):
        """Test poprawnej rejestracji"""
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        self.assertIn('profile', response.data)
        
        # Sprawdź czy użytkownik został utworzony w bazie
        self.assertTrue(
            AuthAccount.objects.filter(username='newuser').exists()
        )
        self.assertTrue(
            UserProfile.objects.filter(auth_account__username='newuser').exists()
        )

    def test_registration_password_mismatch(self):
        """Test rejestracji z niezgodnymi hasłami"""
        payload = self.valid_payload.copy()
        payload['password_confirm'] = 'DifferentPass123'
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_username(self):
        """Test rejestracji z istniejącą nazwą użytkownika"""
        # Utwórz pierwszego użytkownika
        AuthAccount.objects.create(
            username='newuser',
            email='existing@example.com'
        )
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_invalid_email(self):
        """Test rejestracji z nieprawidłowym emailem"""
        payload = self.valid_payload.copy()
        payload['email'] = 'invalid-email'
        
        response = self.client.post(
            self.register_url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):
    def setUp(self):
        self.login_url = reverse('accounts:login')
        self.account = AuthAccount.objects.create(
            username='testuser',
            email='test@example.com',
            first_name='Test'
        )
        self.account.set_password('testpass123')
        self.account.save()
        
        # Utwórz profil
        UserProfile.objects.create(
            auth_account=self.account,
            goal='masa_mięśniowa',
            level='początkujący'
        )

    def test_successful_login_with_username(self):
        """Test poprawnego logowania z username"""
        payload = {
            'login': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(
            self.login_url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        self.assertIn('profile', response.data)

    def test_successful_login_with_email(self):
        """Test poprawnego logowania z emailem"""
        payload = {
            'login': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(
            self.login_url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials(self):
        """Test logowania z nieprawidłowymi danymi"""
        payload = {
            'login': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post(
            self.login_url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# backend/test_integration.py
"""
Skrypt do testowania integracji z bazą danych
Uruchom: python backend/test_integration.py
"""

import os
import sys
import django
from pathlib import Path

# Dodaj backend do PYTHONPATH
backend_path = Path(__file__).resolve().parent
sys.path.append(str(backend_path))

# Ustaw Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
django.setup()

from accounts.models import AuthAccount, UserProfile

def test_database_connection():
    """Test połączenia z bazą danych"""
    try:
        # Sprawdź czy możemy wykonać podstawowe operacje
        count = AuthAccount.objects.count()
        print(f"✅ Połączenie z bazą OK. Liczba użytkowników: {count}")
        return True
    except Exception as e:
        print(f"❌ Błąd połączenia z bazą: {e}")
        return False

def test_user_creation():
    """Test tworzenia użytkownika"""
    try:
        # Sprawdź czy użytkownik już istnieje
        if AuthAccount.objects.filter(username='test_user_integration').exists():
            print("🔄 Usuwam istniejącego użytkownika testowego")
            AuthAccount.objects.filter(username='test_user_integration').delete()
        
        # Utwórz nowego użytkownika
        account = AuthAccount.objects.create(
            username='test_user_integration',
            email='test@integration.com',
            first_name='Test'
        )
        account.set_password('TestPass123')
        account.save()
        
        # Utwórz profil
        profile = UserProfile.objects.create(
            auth_account=account,
            goal='masa_mięśniowa',
            level='początkujący',
            training_days_per_week=3,
            equipment_preference='siłownia'
        )
        
        print(f"✅ Użytkownik utworzony: {account.username} (ID: {account.id})")
        print(f"✅ Profil utworzony: {profile.goal}, {profile.level}")
        
        # Sprawdź hasło
        if account.check_password('TestPass123'):
            print("✅ Hashowanie hasła działa poprawnie")
        else:
            print("❌ Problem z hashowaniem hasła")
        
        # Usuń użytkownika testowego
        account.delete()
        print("🗑️ Użytkownik testowy usunięty")
        
        return True
    except Exception as e:
        print(f"❌ Błąd tworzenia użytkownika: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Rozpoczynam testy integracji...")
    print("=" * 50)
    
    if test_database_connection():
        if test_user_creation():
            print("\n🎉 Wszystkie testy przeszły pomyślnie!")
        else:
            print("\n❌ Testy nie powiodły się")
    else:
        print("\n❌ Nie można połączyć się z bazą danych")