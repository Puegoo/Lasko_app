# backend/accounts/serializers.py - CORRECTED SERIALIZERS
from rest_framework import serializers
from django.db import transaction
import logging

from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration - clean implementation"""
    
    # Account data
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Profile data (optional)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    goal = serializers.CharField(max_length=50, required=False, allow_blank=True)
    level = serializers.CharField(max_length=50, required=False, allow_blank=True)
    training_days_per_week = serializers.IntegerField(required=False, allow_null=True)
    equipment_preference = serializers.CharField(max_length=50, required=False, allow_blank=True)
    preferred_session_duration = serializers.IntegerField(required=False, allow_null=True)
    recommendation_method = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    def validate_username(self, value):
        """Username validation"""
        value = value.lower().strip()
        if AuthAccount.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers and underscore.")
        
        return value
    
    def validate_email(self, value):
        """Email validation"""
        value = value.lower().strip()
        if AuthAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value
    
    def validate_password(self, value):
        """Password validation"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        import re
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        
        return value
    
    def validate_goal(self, value):
        """Goal validation"""
        if value and value not in ['masa', 'redukcja', 'sila', 'wytrzymalosc', 'zdrowie']:
            raise serializers.ValidationError("Invalid training goal.")
        return value
    
    def validate_level(self, value):
        """Level validation"""
        if value and value not in ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']:
            raise serializers.ValidationError("Invalid skill level.")
        return value
    
    def validate_equipment_preference(self, value):
        """Equipment validation"""
        if value and value not in ['silownia', 'dom_hantle', 'dom_masa', 'minimalne', 'dom', 'wolne_ciezary']:
            raise serializers.ValidationError("Invalid equipment preference.")
        return value
    
    def validate_training_days_per_week(self, value):
        """Training days validation"""
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Training days must be between 1 and 7.")
        return value
    
    def validate_recommendation_method(self, value):
        """Recommendation method validation"""
        if value and value not in ['product', 'user', 'hybrid']:
            raise serializers.ValidationError("Invalid recommendation method.")
        return value
    
    def validate(self, data):
        """Cross validation"""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        
        return data
    
    def create(self, validated_data):
        """Create user account with profile using Django ORM"""
        try:
            logger.info(f"Creating user account: {validated_data.get('username')}")
            
            # Remove password confirmation from data
            validated_data.pop('password_confirm', None)
            
            # Separate account and profile data
            account_data = {
                'username': validated_data.pop('username'),
                'email': validated_data.pop('email'),
                'password': validated_data.pop('password'),
                'first_name': validated_data.pop('first_name', ''),
            }
            
            # Profile data - only existing fields
            profile_data = {}
            existing_fields = [
                'first_name', 'date_of_birth', 'goal', 'level', 
                'training_days_per_week', 'equipment_preference',
                'preferred_session_duration', 'recommendation_method'
            ]
            
            for field in existing_fields:
                if field in validated_data and validated_data[field] is not None:
                    # Don't add empty strings
                    if isinstance(validated_data[field], str) and validated_data[field].strip() == '':
                        continue
                    profile_data[field] = validated_data[field]
            
            # Copy first_name from account to profile
            if account_data.get('first_name'):
                profile_data['first_name'] = account_data['first_name']
            
            logger.info(f"Profile data: {profile_data}")
            
            with transaction.atomic():
                # Create account using Django ORM
                auth_account = AuthAccount.objects.create(
                    username=account_data['username'],
                    email=account_data['email'],
                    first_name=account_data.get('first_name', ''),
                    is_admin=False,
                    is_superuser=False,
                    is_staff=False,
                    is_active=True
                )
                
                # Set password using model method
                auth_account.set_password(account_data['password'])
                auth_account.save()
                
                logger.info(f"Account created: ID {auth_account.id}")
                
                # Create profile
                profile_data['auth_account'] = auth_account
                if not profile_data.get('recommendation_method'):
                    profile_data['recommendation_method'] = 'hybrid'
                
                user_profile = UserProfile.objects.create(**profile_data)
                
                logger.info(f"Profile created for: {auth_account.username}")
                
                return {
                    'auth_account': auth_account,
                    'user_profile': user_profile
                }
        
        except Exception as e:
            logger.error(f"Error in create(): {str(e)}")
            raise serializers.ValidationError(f"Error creating account: {str(e)}")


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login - simplified logic"""
    
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    # No validation logic here - move it to views for better error handling


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile - existing fields only"""
    
    class Meta:
        model = UserProfile
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
        if value is not None and (value < 1 or value > 7):
            raise serializers.ValidationError("Training days must be between 1 and 7.")
        return value
    
    def validate_preferred_session_duration(self, value):
        if value is not None and (value < 15 or value > 180):
            raise serializers.ValidationError("Session duration must be between 15 and 180 minutes.")
        return value
    
    def validate_goal(self, value):
        if value and value not in ['masa', 'redukcja', 'sila', 'wytrzymalosc', 'zdrowie']:
            raise serializers.ValidationError("Invalid training goal.")
        return value
    
    def validate_level(self, value):
        if value and value not in ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']:
            raise serializers.ValidationError("Invalid skill level.")
        return value
    
    def validate_equipment_preference(self, value):
        if value and value not in ['silownia', 'dom_hantle', 'dom_masa', 'minimalne', 'dom', 'wolne_ciezary']:
            raise serializers.ValidationError("Invalid equipment preference.")
        return value
    
    def validate_recommendation_method(self, value):
        if value and value not in ['product', 'user', 'hybrid']:
            raise serializers.ValidationError("Invalid recommendation method.")
        return value
    
    def to_representation(self, instance):
        """Convert data to JSON format"""
        data = super().to_representation(instance)
        
        # Ensure array fields are lists (not None)
        if data.get('avoid_exercises') is None:
            data['avoid_exercises'] = []
        if data.get('focus_areas') is None:
            data['focus_areas'] = []
        
        # Set default values
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