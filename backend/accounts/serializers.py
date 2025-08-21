# backend/accounts/serializers.py (POPRAWIONE WEDŁUG STRUKTURY)
from rest_framework import serializers
from django.db import transaction, connection
from django.contrib.auth.hashers import make_password
import logging
import traceback

from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer do rejestracji nowego użytkownika"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    # Pola profilu
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    goal = serializers.CharField(required=False, allow_blank=True)
    level = serializers.CharField(required=False, allow_blank=True)
    training_days_per_week = serializers.IntegerField(required=False, allow_null=True)
    equipment_preference = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = AuthAccount
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'date_of_birth', 'goal', 'level', 'training_days_per_week', 'equipment_preference'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
        }
    
    def validate(self, data):
        """Walidacja danych rejestracji"""
        logger.info(f"🔍 VALIDATE - otrzymane dane: {data}")
        
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
        
        logger.info(f"✅ VALIDATE - walidacja przeszła pomyślnie")
        return data
    
    def create(self, validated_data):
        """Tworzenie nowego użytkownika z profilem"""
        logger.info(f"🏗️ CREATE - Rozpoczynam tworzenie użytkownika")
        
        try:
            # Usuń dane które nie należą do AuthAccount
            password_confirm = validated_data.pop('password_confirm', None)
            password = validated_data.pop('password')
            
            # Wydziel dane profilu
            profile_data = {
                'date_of_birth': validated_data.pop('date_of_birth', None),
                'goal': validated_data.pop('goal', ''),
                'level': validated_data.pop('level', ''),
                'training_days_per_week': validated_data.pop('training_days_per_week', None),
                'equipment_preference': validated_data.pop('equipment_preference', ''),
            }
            
            # Skopiuj first_name do profilu
            if 'first_name' in validated_data:
                profile_data['first_name'] = validated_data['first_name']
            
            logger.info(f"📋 Profile data: {profile_data}")
            logger.info(f"👤 Auth account data: {validated_data}")
            
            # Użyj transakcji atomowej
            with transaction.atomic():
                logger.info(f"🔄 Rozpoczynam transakcję atomową...")
                
                # POPRAWNE SQL zgodne z rzeczywistą strukturą
                with connection.cursor() as cursor:
                    logger.info(f"🗄️ Wstawiam rekord do auth_accounts...")
                    
                    # Hash hasła
                    password_hash = make_password(password)
                    
                    # SQL z właściwą nazwą kolumny 'password' (nie 'password_hash')
                    cursor.execute("""
                        INSERT INTO auth_accounts (
                            username, email, password, first_name, is_admin, 
                            is_superuser, is_staff, is_active, created_at, date_joined
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()) 
                        RETURNING id
                    """, [
                        validated_data['username'],
                        validated_data['email'],
                        password_hash,  # Używamy 'password', nie 'password_hash'
                        validated_data.get('first_name', ''),
                        False,  # is_admin
                        False,  # is_superuser
                        False,  # is_staff
                        True    # is_active
                    ])
                    
                    auth_account_id = cursor.fetchone()[0]
                    logger.info(f"✅ AuthAccount utworzone z ID: {auth_account_id}")
                    
                    # Wstaw do user_profiles
                    cursor.execute("""
                        INSERT INTO user_profiles (
                            auth_account_id, first_name, date_of_birth, goal, 
                            level, training_days_per_week, equipment_preference
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, [
                        auth_account_id,
                        profile_data.get('first_name', ''),
                        profile_data.get('date_of_birth'),
                        profile_data.get('goal', ''),
                        profile_data.get('level', ''),
                        profile_data.get('training_days_per_week'),
                        profile_data.get('equipment_preference', '')
                    ])
                    
                    profile_id = cursor.fetchone()[0]
                    logger.info(f"✅ UserProfile utworzone z ID: {profile_id}")
                
                # Pobierz utworzone obiekty za pomocą Django ORM
                auth_account = AuthAccount.objects.get(id=auth_account_id)
                user_profile = UserProfile.objects.get(id=profile_id)
                
                logger.info(f"🎉 Transakcja zakończona sukcesem!")
                logger.info(f"👤 Utworzono użytkownika: {auth_account.username}")
                
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
    
    login = serializers.CharField()  # Może być username lub email
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Walidacja danych logowania"""
        login = data['login']
        password = data['password']
        
        # Sprawdź czy login to email czy username
        try:
            if '@' in login:
                auth_account = AuthAccount.objects.get(email=login.lower())
            else:
                auth_account = AuthAccount.objects.get(username=login.lower())
        except AuthAccount.DoesNotExist:
            raise serializers.ValidationError(
                "Nieprawidłowe dane logowania."
            )
        
        # Sprawdź hasło
        if not auth_account.check_password(password):
            raise serializers.ValidationError(
                "Nieprawidłowe dane logowania."
            )
        
        data['auth_account'] = auth_account
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer do profilu użytkownika"""
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 
            'date_of_birth', 
            'goal', 
            'level',
            'training_days_per_week', 
            'equipment_preference'
        ]