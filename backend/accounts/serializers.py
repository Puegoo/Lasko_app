# backend/accounts/serializers.py
from rest_framework import serializers
from .models import AuthAccount, UserProfile
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
import re
import unicodedata
import logging  # DODANO: Import logging
import traceback  # DODANO: Import traceback

logger = logging.getLogger(__name__)  # DODANO: Logger

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
    goal = serializers.CharField(max_length=50, required=False, allow_blank=True)
    level = serializers.CharField(max_length=50, required=False, allow_blank=True)
    training_days_per_week = serializers.IntegerField(
        min_value=1, 
        max_value=7, 
        required=False, 
        allow_null=True
    )
    equipment_preference = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    class Meta:
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'date_of_birth', 'goal', 'level', 'training_days_per_week', 
            'equipment_preference'
        ]
    
    def normalize_username(self, value):
        """Normalizuje username usuwając polskie znaki diakrytyczne"""
        if not value:
            return ''
        
        # Usuń diakrytyki z polskich znaków
        normalized = unicodedata.normalize('NFD', value)
        ascii_value = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
        
        # Usuń wszystkie niealfanumeryczne znaki oprócz podkreślenia
        clean_value = re.sub(r'[^a-zA-Z0-9_]', '', ascii_value)
        
        return clean_value.lower()
    
    def normalize_choice_values(self, data):
        """Normalizuje wartości choices z frontendu na odpowiedniki w modelu"""
        
        # Mapowanie dla goal - DOKŁADNIE takie jakie wysyła frontend
        goal_mapping = {
            'masa': 'masa',  # Frontend wysyła 'masa', model ma 'masa'
            'redukcja': 'redukcja',
            'siła': 'siła', 
            'kondycja': 'kondycja',
            'modelowanie': 'modelowanie',
            'zdrowie': 'zdrowie',
            # Dodatkowe mapowania dla kompatybilności
            'masa_mięśniowa': 'masa',
            'masa_miesniowa': 'masa',
        }
        
        # Mapowanie dla level - Frontend wysyła różne warianty
        level_mapping = {
            'początkujący': 'początkujący',
            'poczatkujacy': 'początkujący',
            'sredniozaawansowany': 'sredniozaawansowany',
            'średnio_zaawansowany': 'sredniozaawansowany',
            'srednio_zaawansowany': 'sredniozaawansowany',
            'zaawansowany': 'zaawansowany',
            'ekspert': 'ekspert',
        }
        
        # Mapowanie dla equipment_preference
        equipment_mapping = {
            'siłownia': 'siłownia',
            'silownia': 'siłownia',
            'hantle': 'hantle',
            'maszyny': 'maszyny', 
            'brak': 'brak',
            'minimalne': 'minimalne',
            'dom': 'dom',
            'wolne_ciezary': 'wolne_ciezary',
            'wolne_ciężary': 'wolne_ciezary',
            'bez_sprzętu': 'brak',
            'bez_sprzetu': 'brak',
        }
        
        # Zastosuj mapowania
        if 'goal' in data and data['goal']:
            original_goal = data['goal']
            mapped_goal = goal_mapping.get(data['goal'], data['goal'])
            data['goal'] = mapped_goal
            logger.info(f"Goal mapping: {original_goal} -> {mapped_goal}")
            
        if 'level' in data and data['level']:
            original_level = data['level']
            mapped_level = level_mapping.get(data['level'], data['level'])
            data['level'] = mapped_level
            logger.info(f"Level mapping: {original_level} -> {mapped_level}")
            
        if 'equipment_preference' in data and data['equipment_preference']:
            original_equipment = data['equipment_preference']
            mapped_equipment = equipment_mapping.get(data['equipment_preference'], data['equipment_preference'])
            data['equipment_preference'] = mapped_equipment
            logger.info(f"Equipment mapping: {original_equipment} -> {mapped_equipment}")
        
        return data
    
    def validate_username(self, value):
        """Walidacja nazwy użytkownika"""
        # Normalizuj username
        normalized_username = self.normalize_username(value)
        
        if len(normalized_username) < 3:
            raise serializers.ValidationError(
                "Nazwa użytkownika musi mieć co najmniej 3 znaki po normalizacji."
            )
        
        if len(normalized_username) > 30:
            raise serializers.ValidationError(
                "Nazwa użytkownika nie może być dłuższa niż 30 znaków."
            )
        
        # Sprawdź czy znormalizowana nazwa składa się tylko z dozwolonych znaków
        if not re.match(r'^[a-zA-Z0-9_]+$', normalized_username):
            raise serializers.ValidationError(
                "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia."
            )
        
        # Sprawdź unikalność znormalizowanej nazwy
        if AuthAccount.objects.filter(username=normalized_username).exists():
            raise serializers.ValidationError(
                "Użytkownik o tej nazwie już istnieje."
            )
        
        return normalized_username  # Zwróć znormalizowaną wartość
    
    def validate_email(self, value):
        """Walidacja adresu email - UPROSZCZONA"""
        if not value:
            raise serializers.ValidationError("Email jest wymagany.")
        
        # PODSTAWOWA walidacja email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise serializers.ValidationError("Podaj poprawny adres e-mail.")
        
        # Sprawdź unikalność
        if AuthAccount.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "Użytkownik z tym adresem email już istnieje."
            )
        
        return value.lower()  # Zwróć email w małych literach
    
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
    
    def validate_first_name(self, value):
        """Walidacja imienia"""
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Imię musi mieć co najmniej 2 znaki."
            )
        
        return value.strip() if value else ''
    
    def validate_goal(self, value):
        """Walidacja celu - po mapowaniu"""
        if not value:
            return value
            
        valid_choices = [choice[0] for choice in UserProfile.GOAL_CHOICES]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"'{value}' nie jest poprawnym wyborem. Dostępne opcje: {', '.join(valid_choices)}"
            )
        return value
    
    def validate_level(self, value):
        """Walidacja poziomu - po mapowaniu"""
        if not value:
            return value
            
        valid_choices = [choice[0] for choice in UserProfile.LEVEL_CHOICES]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"'{value}' nie jest poprawnym wyborem. Dostępne opcje: {', '.join(valid_choices)}"
            )
        return value
    
    def validate_equipment_preference(self, value):
        """Walidacja preferencji sprzętu - po mapowaniu"""
        if not value:
            return value
            
        valid_choices = [choice[0] for choice in UserProfile.EQUIPMENT_CHOICES]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"'{value}' nie jest poprawnym wyborem. Dostępne opcje: {', '.join(valid_choices)}"
            )
        return value
    
    def validate(self, data):
        """Walidacja całego obiektu"""
        # NAJPIERW normalizuj wartości choices
        data = self.normalize_choice_values(data)
        
        # Sprawdź zgodność haseł
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Hasła nie są identyczne."}
            )
        
        # Sprawdź czy wszystkie wymagane pola są wypełnione
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError(
                    {field: f"Pole {field} jest wymagane."}
                )
        
        return data
    
    def create(self, validated_data):
        """Tworzenie nowego użytkownika z profilem"""
        try:
            logger.info(f"🏗️ CREATE - Rozpoczynam tworzenie użytkownika")
            logger.info(f"📝 Validated data: {validated_data}")
            
            # Usuń password_confirm z danych (nie jest potrzebne do zapisu)
            password_confirm = validated_data.pop('password_confirm', None)
            password = validated_data.pop('password')
            logger.info(f"🔑 Password extracted, confirm removed")
            
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
            
            logger.info(f"📋 Profile data: {profile_data}")
            logger.info(f"👤 Auth account data: {validated_data}")
            
            with transaction.atomic():
                logger.info(f"🔄 Rozpoczynam transakcję...")
                
                # Utwórz konto użytkownika
                logger.info(f"🏗️ Tworzę AuthAccount...")
                auth_account = AuthAccount.objects.create(**validated_data)
                logger.info(f"✅ AuthAccount utworzone: ID={auth_account.id}, username={auth_account.username}")
                
                logger.info(f"🔑 Ustawiam hasło...")
                auth_account.set_password(password)
                auth_account.save()
                logger.info(f"✅ Hasło ustawione i zapisane")
                
                # Utwórz profil użytkownika
                logger.info(f"📋 Tworzę UserProfile...")
                profile_data['auth_account'] = auth_account
                user_profile = UserProfile.objects.create(**profile_data)
                logger.info(f"✅ UserProfile utworzone: ID={user_profile.id}")
            
            logger.info(f"🎉 Transakcja zakończona sukcesem!")
            return {
                'auth_account': auth_account,
                'user_profile': user_profile
            }
        
        except Exception as e:
            logger.error(f"❌ Błąd w create(): {str(e)}")
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            logger.error(f"❌ Validated data at error: {validated_data}")
            if 'profile_data' in locals():
                logger.error(f"❌ Profile data at error: {profile_data}")
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
        
        # USUNIĘTE sprawdzanie is_active - korzystamy z property które zawsze zwraca True
        
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
        # Wszystkie pola są edytowalne