# backend/accounts/tests.py
from django.test import TestCase, TransactionTestCase
from django.db import connection
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from .models import AuthAccount, UserProfile
import json

def create_test_tables():
    """Pomocnicza funkcja do tworzenia tabel testowych"""
    with connection.cursor() as cursor:
        # Sprawdź czy tabela auth_accounts istnieje
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'auth_accounts'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            # Utwórz tabelę auth_accounts
            cursor.execute("""
                CREATE TABLE auth_accounts (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    first_name VARCHAR(50),
                    is_superuser BOOLEAN DEFAULT FALSE,
                    is_staff BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    groups JSONB DEFAULT '[]',
                    user_permissions JSONB DEFAULT '[]'
                );
            """)
        
        # Sprawdź czy tabela user_profiles istnieje
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_profiles'
            );
        """)
        profile_table_exists = cursor.fetchone()[0]
        
        if not profile_table_exists:
            # Utwórz tabelę user_profiles
            cursor.execute("""
                CREATE TABLE user_profiles (
                    auth_account_id INTEGER PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
                    first_name VARCHAR(50),
                    date_of_birth DATE,
                    profile_picture VARCHAR(500),
                    bio TEXT,
                    goal VARCHAR(50),
                    level VARCHAR(50),
                    training_days_per_week INTEGER,
                    equipment_preference VARCHAR(50),
                    preferred_session_duration INTEGER DEFAULT 60,
                    avoid_exercises TEXT[],
                    focus_areas TEXT[],
                    recommendation_method VARCHAR(50) DEFAULT 'hybrid',
                    weight_kg DECIMAL(5,2),
                    height_cm INTEGER,
                    injuries JSONB DEFAULT '[]',
                    health_conditions JSONB DEFAULT '[]',
                    health_notes TEXT,
                    last_survey_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
    # W TransactionTestCase zmiany są commitowane automatycznie


class AuthAccountModelTest(TransactionTestCase):
    """Testy modelu AuthAccount - używa TransactionTestCase bo model ma managed=False"""
    
    def setUp(self):
        # Utwórz tabele ręcznie w testowej bazie danych
        create_test_tables()
        
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


class RegistrationAPITest(TransactionTestCase):
    """Testy API rejestracji - używa TransactionTestCase bo model ma managed=False"""
    def setUp(self):
        self.client = APIClient()  # Dodaj APIClient dla TransactionTestCase
        # Utwórz tabele jeśli nie istnieją
        create_test_tables()
        
        # Użyj pełnej ścieżki URL zamiast reverse z namespace (namespace nie istnieje)
        self.register_url = '/api/auth/register/'
        self.valid_payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123',
            'password_confirm': 'SecurePass123',
            'first_name': 'Jan',
            'goal': 'masa',  # Poprawna wartość z GOAL_CHOICES
            'level': 'poczatkujacy',  # Poprawna wartość z LEVEL_CHOICES
            'training_days_per_week': 3,
            'equipment_preference': 'silownia'  # Poprawna wartość z EQUIPMENT_CHOICES
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
        existing_account = AuthAccount.objects.create(
            username='newuser',
            email='existing@example.com',
            first_name='Existing'
        )
        existing_account.set_password('ExistingPass123')
        existing_account.save()
        
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


class LoginAPITest(TransactionTestCase):
    """Testy API logowania - używa TransactionTestCase bo model ma managed=False"""
    def setUp(self):
        self.client = APIClient()  # Dodaj APIClient dla TransactionTestCase
        # Utwórz tabele jeśli nie istnieją
        create_test_tables()
        
        # Użyj pełnej ścieżki URL zamiast reverse z namespace
        self.login_url = '/api/auth/login/'
        
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
            goal='masa',  # Poprawna wartość
            level='poczatkujacy'  # Poprawna wartość
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
