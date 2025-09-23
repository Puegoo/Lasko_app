# backend/accounts/serializers.py - NAPRAWIONA WERSJA (TYLKO ISTNIEJĄCE POLA)
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.hashers import check_password
from datetime import date
import logging
import traceback

from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer do rejestracji użytkownika - TYLKO ISTNIEJĄCE POLA"""
    
    # Dane konta
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # TYLKO pola które istnieją w UserProfile
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    goal = serializers.CharField(max_length=50, required=False, allow_blank=True)
    level = serializers.CharField(max_length=50, required=False, allow_blank=True)
    training_days_per_week = serializers.IntegerField(required=False, allow_null=True)
    equipment_preference = serializers.CharField(max_length=50, required=False, allow_blank=True)
    preferred_session_duration = serializers.IntegerField(required=False, allow_null=True)
    recommendation_method = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    # USUNIĘTE: wszystkie pola biometryczne (weight_kg, height_cm, bmi, etc.)
    # bo nie istnieją w rzeczywistym modelu UserProfile
    
    def validate_username(self, value):
        """Walidacja nazwy użytkownika"""
        value = value.lower().strip()
        if AuthAccount.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ta nazwa użytkownika jest już zajęta.")
        
        if len(value) < 3:
            raise serializers.ValidationError("Nazwa użytkownika musi mieć co najmniej 3 znaki.")
        
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Nazwa użytkownika może zawierać tylko litery, cyfry i znak podkreślenia.")
        
        return value
    
    def validate_email(self, value):
        """Walidacja adresu email"""
        value = value.lower().strip()
        if AuthAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ten adres email jest już zarejestrowany.")
        return value
    
    def validate_password(self, value):
        """Walidacja hasła"""
        if len(value) < 8:
            raise serializers.ValidationError("Hasło musi mieć co najmniej 8 znaków.")
        
        # Sprawdź czy zawiera przynajmniej jedną cyfrę i jedną literę
        import re
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError("Hasło musi zawierać przynajmniej jedną literę.")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Hasło musi zawierać przynajmniej jedną cyfrę.")
        
        return value
    
    def validate_goal(self, value):
        """Walidacja celu treningowego - zgodne z GOAL_CHOICES"""
        if value and value not in ['masa', 'redukcja', 'siła', 'wytrzymalosc', 'zdrowie']:
            raise serializers.ValidationError("Nieprawidłowy cel treningowy.")
        return value
    
    def validate_level(self, value):
        """Walidacja poziomu zaawansowania - zgodne z LEVEL_CHOICES"""
        if value and value not in ['początkujący', 'średniozaawansowany', 'zaawansowany']:
            raise serializers.ValidationError("Nieprawidłowy poziom zaawansowania.")
        return value
    
    def validate_equipment_preference(self, value):
        """Walidacja preferencji sprzętu - zgodne z EQUIPMENT_CHOICES"""
        if value and value not in ['siłownia', 'dom_hantle', 'dom_masa', 'minimalne', 'dom', 'wolne_ciezary']:
            raise serializers.ValidationError("Nieprawidłowa preferencja sprzętu.")
        return value
    
    def validate_training_days_per_week(self, value):
        """Walidacja liczby dni treningowych"""
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Liczba dni treningowych musi być między 1 a 7.")
        return value
    
    def validate_recommendation_method(self, value):
        """Walidacja metody rekomendacji"""
        if value and value not in ['product', 'user', 'hybrid']:
            raise serializers.ValidationError("Nieprawidłowa metoda rekomendacji.")
        return value
    
    def validate(self, data):
        """Walidacja krzyżowa"""
        # Sprawdź potwierdzenie hasła
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Hasła nie są identyczne.'
            })
        
        return data
    
    def create(self, validated_data):
        """Tworzenie konta użytkownika z profilem - TYLKO ISTNIEJĄCE POLA"""
        try:
            logger.info(f"🔥 Tworzenie konta użytkownika: {validated_data.get('username')}")
            
            # Usuń potwierdzenie hasła z danych
            validated_data.pop('password_confirm', None)
            
            # Dane do konta
            account_data = {
                'username': validated_data.pop('username'),
                'email': validated_data.pop('email'),
                'password': validated_data.pop('password'),
                'first_name': validated_data.pop('first_name', ''),
            }
            
            # Dane do profilu - TYLKO pola które istnieją w modelu
            profile_data = {}
            existing_fields = [
                'first_name', 'date_of_birth', 'goal', 'level', 
                'training_days_per_week', 'equipment_preference',
                'preferred_session_duration', 'recommendation_method'
            ]
            
            for field in existing_fields:
                if field in validated_data and validated_data[field] is not None:
                    # Nie dodawaj pustych stringów
                    if isinstance(validated_data[field], str) and validated_data[field].strip() == '':
                        continue
                    profile_data[field] = validated_data[field]
            
            # Skopiuj first_name z account do profilu
            if account_data.get('first_name'):
                profile_data['first_name'] = account_data['first_name']
            
            logger.info(f"📋 Dane profilu: {profile_data}")
            
            with transaction.atomic():
                # Utwórz konto
                auth_account = AuthAccount(
                    username=account_data['username'],
                    email=account_data['email'],
                    first_name=account_data['first_name']
                )
                auth_account.set_password(account_data['password'])
                auth_account.save()
                
                logger.info(f"✅ Konto utworzone: ID {auth_account.id}")
                
                # Utwórz profil tylko jeśli są dane
                user_profile = None
                if profile_data:
                    profile_data['auth_account'] = auth_account
                    user_profile = UserProfile.objects.create(**profile_data)
                    logger.info(f"✅ Profil utworzony dla: {auth_account.username}")
                else:
                    # Utwórz podstawowy profil
                    user_profile = UserProfile.objects.create(
                        auth_account=auth_account,
                        recommendation_method='hybrid'
                    )
                    logger.info(f"✅ Podstawowy profil utworzony dla: {auth_account.username}")
                
                return {
                    'auth_account': auth_account,
                    'user_profile': user_profile
                }
        
        except Exception as e:
            logger.error(f"❌ Błąd w create(): {str(e)}")
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(
                f"Błąd podczas tworzenia konta: {str(e)}"
            )


class UserLoginSerializer(serializers.Serializer):
    """Serializer do logowania użytkownika"""
    
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Walidacja danych logowania"""
        login = data['login']
        password = data['password']
        
        try:
            # Sprawdź czy to email czy nazwa użytkownika
            if '@' in login:
                auth_account = AuthAccount.objects.get(email=login.lower())
            else:
                auth_account = AuthAccount.objects.get(username=login.lower())
        except AuthAccount.DoesNotExist:
            raise serializers.ValidationError("Nieprawidłowe dane logowania.")
        
        if not auth_account.check_password(password):
            raise serializers.ValidationError("Nieprawidłowe dane logowania.")
        
        data['auth_account'] = auth_account
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer do profilu użytkownika - TYLKO ISTNIEJĄCE POLA"""
    
    class Meta:
        model = UserProfile
        # TYLKO pola które rzeczywiście istnieją w modelu UserProfile
        fields = [
            'first_name', 'date_of_birth', 'goal', 'level',
            'training_days_per_week', 'equipment_preference',
            'preferred_session_duration', 'avoid_exercises', 
            'focus_areas', 'last_survey_date', 'recommendation_method'
        ]
        
        extra_kwargs = {
            'avoid_exercises': {'required': False},
            'focus_areas': {'required': False},
            'last_survey_date': {'read_only': True},
        }
    
    def validate_training_days_per_week(self, value):
        """Walidacja liczby dni treningowych"""
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Liczba dni treningowych musi być między 1 a 7.")
        return value
    
    def validate_preferred_session_duration(self, value):
        """Walidacja czasu sesji"""
        if value is not None and (value < 15 or value > 180):
            raise serializers.ValidationError("Czas sesji musi być między 15 a 180 minut.")
        return value
    
    def validate_goal(self, value):
        """Walidacja celu"""
        if value and value not in ['masa', 'redukcja', 'siła', 'wytrzymalosc', 'zdrowie']:
            raise serializers.ValidationError("Nieprawidłowy cel treningowy.")
        return value
    
    def validate_level(self, value):
        """Walidacja poziomu"""
        if value and value not in ['początkujący', 'średniozaawansowany', 'zaawansowany']:
            raise serializers.ValidationError("Nieprawidłowy poziom zaawansowania.")
        return value
    
    def validate_equipment_preference(self, value):
        """Walidacja sprzętu"""
        if value and value not in ['siłownia', 'dom_hantle', 'dom_masa', 'minimalne', 'dom', 'wolne_ciezary']:
            raise serializers.ValidationError("Nieprawidłowa preferencja sprzętu.")
        return value
    
    def validate_recommendation_method(self, value):
        """Walidacja metody rekomendacji"""
        if value and value not in ['product', 'user', 'hybrid']:
            raise serializers.ValidationError("Nieprawidłowa metoda rekomendacji.")
        return value
    
    def to_representation(self, instance):
        """Konwertuj dane na format JSON"""
        data = super().to_representation(instance)
        
        # Upewnij się że array fields są listami (nie None)
        if data.get('avoid_exercises') is None:
            data['avoid_exercises'] = []
        if data.get('focus_areas') is None:
            data['focus_areas'] = []
        
        # Ustaw wartości domyślne
        if not data.get('goal'):
            data['goal'] = ''
        if not data.get('level'):
            data['level'] = ''
        if not data.get('equipment_preference'):
            data['equipment_preference'] = ''
        if not data.get('first_name'):
            data['first_name'] = ''
        if not data.get('recommendation_method'):
            data['recommendation_method'] = 'hybrid'
            
        return data