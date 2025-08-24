# backend/accounts/serializers.py - FINALNA WERSJA Z OBSŁUGĄ PostgreSQL ARRAYS
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.hashers import make_password
import logging
import traceback
from datetime import datetime

from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer do rejestracji nowego użytkownika - z obsługą PostgreSQL arrays"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    # 🎯 POLA PROFILU - z obsługą array fields
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    goal = serializers.CharField(required=False, allow_blank=True)
    level = serializers.CharField(required=False, allow_blank=True)
    training_days_per_week = serializers.IntegerField(required=False, allow_null=True)
    equipment_preference = serializers.CharField(required=False, allow_blank=True)
    preferred_session_duration = serializers.IntegerField(required=False, allow_null=True)
    
    # 🚨 KLUCZOWE: ListField dla PostgreSQL arrays
    avoid_exercises = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, 
        allow_empty=True,
        allow_null=True
    )
    focus_areas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, 
        allow_empty=True,
        allow_null=True
    )
    
    class Meta:
        model = AuthAccount
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'date_of_birth', 'goal', 'level', 'training_days_per_week', 
            'equipment_preference', 'preferred_session_duration', 
            'avoid_exercises', 'focus_areas'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
        }
    
    def validate(self, data):
        """Walidacja danych rejestracji"""
        logger.info(f"🔍 VALIDATE - otrzymane dane: {list(data.keys())}")
        
        # Sprawdź hasła
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Hasła nie są identyczne."}
            )
        
        # Sprawdź unikalność username
        username = data.get('username', '').lower()
        if AuthAccount.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                {"username": "Użytkownik o tej nazwie już istnieje."}
            )
        
        # Sprawdź unikalność email
        email = data.get('email', '').lower()
        if AuthAccount.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "Konto z tym adresem email już istnieje."}
            )
        
        # Sprawdź wymagane pola
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError(
                    {field: f"Pole {field} jest wymagane."}
                )
        
        # Walidacja list
        avoid_exercises = data.get('avoid_exercises', [])
        if avoid_exercises and len(avoid_exercises) > 20:
            raise serializers.ValidationError(
                {"avoid_exercises": "Maksymalnie 20 ćwiczeń do unikania."}
            )
        
        focus_areas = data.get('focus_areas', [])
        if focus_areas and len(focus_areas) > 10:
            raise serializers.ValidationError(
                {"focus_areas": "Maksymalnie 10 obszarów skupienia."}
            )
        
        logger.info(f"✅ VALIDATE - walidacja przeszła pomyślnie")
        return data
    
    def create(self, validated_data):
        """Tworzy nowe konto użytkownika i powiązany profil z array fields"""
        try:
            logger.info("🏗️ CREATE - Rozpoczynam tworzenie użytkownika z array support")
            
            # Usuń password_confirm i wyciągnij hasło
            password_confirm = validated_data.pop('password_confirm', None)
            password = validated_data.pop('password')
            
            # 🎯 WYDZIEL DANE PROFILU - z obsługą array fields
            profile_data = {
                'date_of_birth': validated_data.pop('date_of_birth', None),
                'goal': validated_data.pop('goal', '') or None,
                'level': validated_data.pop('level', '') or None,
                'training_days_per_week': validated_data.pop('training_days_per_week', None),
                'equipment_preference': validated_data.pop('equipment_preference', '') or None,
                'preferred_session_duration': validated_data.pop('preferred_session_duration', 60),
                'avoid_exercises': validated_data.pop('avoid_exercises', None),
                'focus_areas': validated_data.pop('focus_areas', None),
            }
            
            # Skopiuj first_name do profilu
            if 'first_name' in validated_data:
                profile_data['first_name'] = validated_data['first_name']
            
            # Czyść puste listy (zamień na None dla PostgreSQL)
            if profile_data['avoid_exercises'] == []:
                profile_data['avoid_exercises'] = None
            if profile_data['focus_areas'] == []:
                profile_data['focus_areas'] = None
            
            logger.info(f"📋 Profile data:")
            for key, value in profile_data.items():
                if key in ['avoid_exercises', 'focus_areas'] and value:
                    logger.info(f"   {key}: {len(value)} elementów - {value}")
                else:
                    logger.info(f"   {key}: {value}")
            
            # Użyj transakcji atomowej Django
            with transaction.atomic():
                logger.info("🔄 Rozpoczynam transakcję atomową...")
                
                # Utwórz AuthAccount
                auth_account = AuthAccount(
                    username=validated_data.get('username', '').lower(),
                    email=validated_data.get('email', '').lower(),
                    first_name=validated_data.get('first_name', ''),
                    is_admin=False,
                    is_superuser=False,
                    is_staff=False,
                    is_active=True
                )
                
                # Ustaw hasło
                auth_account.set_password(password)
                auth_account.save()
                
                logger.info(f"✅ AuthAccount utworzone z ID: {auth_account.id}")
                
                # 🚨 UTWÓRZ USERPROFILE z obsługą PostgreSQL arrays
                user_profile = UserProfile(
                    auth_account=auth_account,
                    date_of_birth=profile_data.get('date_of_birth'),
                    goal=profile_data.get('goal'),
                    level=profile_data.get('level'),
                    training_days_per_week=profile_data.get('training_days_per_week'),
                    equipment_preference=profile_data.get('equipment_preference'),
                    preferred_session_duration=profile_data.get('preferred_session_duration', 60),
                    avoid_exercises=profile_data.get('avoid_exercises'),  # PostgreSQL array
                    focus_areas=profile_data.get('focus_areas'),  # PostgreSQL array
                    last_survey_date=datetime.now()
                )
                
                user_profile.save()
                
                logger.info(f"✅ UserProfile utworzone z ID: {user_profile.id}")
                logger.info(f"✅ Profile details:")
                logger.info(f"   goal: {user_profile.goal}")
                logger.info(f"   level: {user_profile.level}")
                logger.info(f"   avoid_exercises: {user_profile.avoid_exercises}")
                logger.info(f"   focus_areas: {user_profile.focus_areas}")
                logger.info("🎉 Transakcja zakończona sukcesem!")
                
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
    """Serializer do profilu użytkownika - z obsługą PostgreSQL arrays"""
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'date_of_birth', 'goal', 'level',
            'training_days_per_week', 'equipment_preference',
            'preferred_session_duration', 'avoid_exercises', 
            'focus_areas', 'last_survey_date'
        ]
    
    def to_representation(self, instance):
        """Konwertuj dane na format JSON"""
        data = super().to_representation(instance)
        
        # Upewnij się że array fields są listami (nie None)
        if data.get('avoid_exercises') is None:
            data['avoid_exercises'] = []
        if data.get('focus_areas') is None:
            data['focus_areas'] = []
            
        return data