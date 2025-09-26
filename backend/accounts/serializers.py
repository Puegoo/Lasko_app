# backend/accounts/serializers.py - NAPRAWIONA WERSJA
import logging
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer do rejestracji użytkowników - NAPRAWIONA WERSJA
    Używa tylko Django ORM, bez bezpośrednich zapytań SQL
    """
    
    # Account fields
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField(max_length=100)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Profile fields
    goal = serializers.ChoiceField(
        choices=UserProfile.GOAL_CHOICES, 
        default='zdrowie'
    )
    level = serializers.ChoiceField(
        choices=UserProfile.LEVEL_CHOICES, 
        default='poczatkujacy'
    )
    training_days_per_week = serializers.IntegerField(
        min_value=1, 
        max_value=7, 
        default=3
    )
    equipment_preference = serializers.ChoiceField(
        choices=UserProfile.EQUIPMENT_CHOICES, 
        default='silownia'
    )
    recommendation_method = serializers.ChoiceField(
        choices=UserProfile.RECO_CHOICES, 
        default='hybrid'
    )
    
    # Optional profile fields
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    preferred_session_duration = serializers.IntegerField(
        min_value=15, 
        max_value=180, 
        required=False, 
        allow_null=True
    )
    avoid_exercises = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    focus_areas = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    
    def validate(self, data):
        """Walidacja całego obiektu"""
        
        # 1. Sprawdź zgodność haseł
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Hasła nie są zgodne'
            })
        
        # 2. Walidacja hasła Django
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return data
    
    def validate_username(self, value):
        """Walidacja username - unikalność"""
        if AuthAccount.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                'Użytkownik o tej nazwie już istnieje'
            )
        return value
    
    def validate_email(self, value):
        """Walidacja email - unikalność"""
        if AuthAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'Konto z tym emailem już istnieje'
            )
        return value.lower()
    
    def create(self, validated_data):
        """
        Utwórz konto użytkownika i profil
        NAPRAWIONA WERSJA - tylko Django ORM
        """
        try:
            logger.info(f"[Registration] Tworzenie konta: {validated_data['username']}")
            
            # Usuń password_confirm z danych
            password_confirm = validated_data.pop('password_confirm', None)
            
            # Podziel dane na konto i profil
            account_fields = ['username', 'email', 'password', 'first_name']
            profile_fields = [
                'goal', 'level', 'training_days_per_week', 'equipment_preference',
                'recommendation_method', 'date_of_birth', 'preferred_session_duration',
                'avoid_exercises', 'focus_areas'
            ]
            
            account_data = {key: validated_data[key] for key in account_fields if key in validated_data}
            profile_data = {key: validated_data[key] for key in profile_fields if key in validated_data}
            
            # Kopiuj first_name do profilu jeśli istnieje
            if account_data.get('first_name'):
                profile_data['first_name'] = account_data['first_name']
            
            logger.info(f"[Registration] Account data: {list(account_data.keys())}")
            logger.info(f"[Registration] Profile data: {list(profile_data.keys())}")
            
            # Transakcja atomowa
            with transaction.atomic():
                
                # 1. Utwórz konto używając Django ORM
                auth_account = AuthAccount.objects.create(
                    username=account_data['username'],
                    email=account_data['email'],
                    first_name=account_data.get('first_name', ''),
                    is_admin=False,
                    is_superuser=False,
                    is_staff=False,
                    is_active=True
                )
                
                # 2. Ustaw hasło używając metody modelu (automatyczne hashowanie)
                auth_account.set_password(account_data['password'])
                auth_account.save()
                
                logger.info(f"[Registration] Konto utworzone: ID {auth_account.id}")
                
                # 3. Utwórz profil
                profile_data['auth_account'] = auth_account
                
                # Ustaw domyślne wartości jeśli brakuje
                profile_defaults = {
                    'goal': 'zdrowie',
                    'level': 'poczatkujacy',
                    'training_days_per_week': 3,
                    'equipment_preference': 'silownia',
                    'recommendation_method': 'hybrid'
                }
                
                for key, default_value in profile_defaults.items():
                    if key not in profile_data or profile_data[key] is None:
                        profile_data[key] = default_value
                
                user_profile = UserProfile.objects.create(**profile_data)
                
                logger.info(f"[Registration] Profil utworzony dla: {auth_account.username}")
                
                return {
                    'auth_account': auth_account,
                    'user_profile': user_profile
                }
        
        except Exception as e:
            logger.error(f"[Registration] Error in create(): {str(e)}")
            import traceback
            logger.error(f"[Registration] Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(f"Błąd podczas tworzenia konta: {str(e)}")


class UserLoginSerializer(serializers.Serializer):
    """Serializer do logowania użytkowników"""
    
    login = serializers.CharField(help_text="Username lub email")
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Podstawowa walidacja - logika autoryzacji w views"""
        login = data.get('login', '').strip()
        password = data.get('password', '')
        
        if not login or not password:
            raise serializers.ValidationError(
                'Login i hasło są wymagane'
            )
        
        return {
            'login': login.lower(),
            'password': password
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer do profilu użytkownika"""
    
    # Dodatkowe pola tylko do odczytu
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'date_of_birth', 'age', 'goal', 'level',
            'training_days_per_week', 'equipment_preference',
            'preferred_session_duration', 'avoid_exercises', 
            'focus_areas', 'last_survey_date', 'recommendation_method'
        ]
        
        extra_kwargs = {
            'avoid_exercises': {'required': False, 'allow_null': True},
            'focus_areas': {'required': False, 'allow_null': True},
            'last_survey_date': {'read_only': True},
        }
    
    def get_age(self, obj):
        """Oblicz wiek na podstawie daty urodzenia"""
        if obj.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def validate_training_days_per_week(self, value):
        """Walidacja dni treningowych"""
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Dni treningowe muszą być między 1 a 7.")
        return value
    
    def validate_preferred_session_duration(self, value):
        """Walidacja czasu trwania sesji"""
        if value is not None and (value < 15 or value > 180):
            raise serializers.ValidationError("Czas sesji musi być między 15 a 180 minut.")
        return value


# ============================================================================
# INNE SERIALIZERY
# ============================================================================

class AuthAccountSerializer(serializers.ModelSerializer):
    """Serializer dla danych konta (bez hasła)"""
    
    class Meta:
        model = AuthAccount
        fields = [
            'id', 'username', 'email', 'first_name', 
            'is_admin', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer do aktualizacji profilu"""
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'date_of_birth', 'goal', 'level',
            'training_days_per_week', 'equipment_preference',
            'preferred_session_duration', 'avoid_exercises', 
            'focus_areas', 'recommendation_method'
        ]
        
        extra_kwargs = {
            'avoid_exercises': {'required': False, 'allow_null': True},
            'focus_areas': {'required': False, 'allow_null': True},
        }
    
    def validate_training_days_per_week(self, value):
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Training days must be between 1 and 7.")
        return value