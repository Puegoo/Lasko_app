# backend/accounts/serializers.py
from rest_framework import serializers
from .models import AuthAccount, UserProfile
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
import re

class UserRegistrationSerializer(serializers.Serializer):
    """Serializer do rejestracji użytkownika"""
    
    # Dane konta
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField(max_length=100)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Dane profilu (opcjonalne - mogą być wypełnione później)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    goal = serializers.ChoiceField(
        choices=UserProfile.GOAL_CHOICES, 
        required=False, 
        allow_blank=True
    )
    level = serializers.ChoiceField(
        choices=UserProfile.LEVEL_CHOICES, 
        required=False, 
        allow_blank=True
    )
    training_days_per_week = serializers.IntegerField(
        min_value=1, 
        max_value=7, 
        required=False, 
        allow_null=True
    )
    equipment_preference = serializers.ChoiceField(
        choices=UserProfile.EQUIPMENT_CHOICES, 
        required=False, 
        allow_blank=True
    )
    
    class Meta:
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'date_of_birth', 'goal', 'level', 'training_days_per_week', 
            'equipment_preference'
        ]
    
    def validate_username(self, value):
        """Walidacja nazwy użytkownika"""
        if len(value) < 3:
            raise serializers.ValidationError(
                "Nazwa użytkownika musi mieć co najmniej 3 znaki."
            )
        
        # Sprawdź czy nazwa użytkownika składa się tylko z dozwolonych znaków
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia."
            )
        
        # Sprawdź unikalność
        if AuthAccount.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Użytkownik o tej nazwie już istnieje."
            )
        
        return value
    
    def validate_email(self, value):
        """Walidacja adresu email"""
        # Sprawdź unikalność
        if AuthAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Użytkownik z tym adresem email już istnieje."
            )
        
        return value
    
    def validate_password(self, value):
        """Walidacja hasła"""
        if len(value) < 8:
            raise serializers.ValidationError(
                "Hasło musi mieć co najmniej 8 znaków."
            )
        
        # Sprawdź czy hasło zawiera przynajmniej jedną cyfrę
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Hasło musi zawierać co najmniej jedną cyfrę."
            )
        
        # Sprawdź czy hasło zawiera przynajmniej jedną literę
        if not re.search(r'[a-zA-Z]', value):
            raise serializers.ValidationError(
                "Hasło musi zawierać co najmniej jedną literę."
            )
        
        return value
    
    def validate(self, data):
        """Walidacja całego obiektu"""
        # Sprawdź zgodność haseł
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": "Hasła nie są identyczne."}
            )
        
        return data
    
    def create(self, validated_data):
        """Tworzenie nowego użytkownika z profilem"""
        # Usuń password_confirm z danych (nie jest potrzebne do zapisu)
        password_confirm = validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Wydziel dane profilu
        profile_data = {
            'date_of_birth': validated_data.pop('date_of_birth', None),
            'goal': validated_data.pop('goal', ''),
            'level': validated_data.pop('level', ''),
            'training_days_per_week': validated_data.pop('training_days_per_week', None),
            'equipment_preference': validated_data.pop('equipment_preference', ''),
        }
        
        # Jeśli first_name jest w profilu, skopiuj go też do konta
        if 'first_name' in validated_data:
            profile_data['first_name'] = validated_data['first_name']
        
        with transaction.atomic():
            # Utwórz konto użytkownika
            auth_account = AuthAccount.objects.create(**validated_data)
            auth_account.set_password(password)
            auth_account.save()
            
            # Utwórz profil użytkownika
            profile_data['auth_account'] = auth_account
            user_profile = UserProfile.objects.create(**profile_data)
        
        return {
            'auth_account': auth_account,
            'user_profile': user_profile
        }


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
                auth_account = AuthAccount.objects.get(email=login)
            else:
                auth_account = AuthAccount.objects.get(username=login)
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
    """Serializer do wyświetlania/edycji profilu użytkownika"""
    
    username = serializers.CharField(source='auth_account.username', read_only=True)
    email = serializers.CharField(source='auth_account.email', read_only=True)
    created_at = serializers.DateTimeField(source='auth_account.created_at', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'created_at', 'first_name', 
            'date_of_birth', 'goal', 'level', 'training_days_per_week', 
            'equipment_preference'
        ]