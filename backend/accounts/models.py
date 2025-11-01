# backend/accounts/models.py - POPRAWIONY MODEL BEZ created_at/updated_at
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField


class AuthAccount(models.Model):
    """Model użytkownika zgodny ze schematem SQL"""
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    
    # Pola zgodne z Django
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Dodatkowe pole aplikacji
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Opcjonalne pola JSON
    groups = models.JSONField(default=list, blank=True)
    user_permissions = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'auth_accounts'
        managed = False  # Nie zarządzaj tabelą przez Django (już istnieje w SQL)
    
    def __str__(self):
        return self.username
    
    def set_password(self, raw_password):
        """Hashuj hasło przed zapisaniem"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Sprawdź czy hasło jest poprawne"""
        return check_password(raw_password, self.password)
    
    def save(self, *args, **kwargs):
        """Override save to ensure password is hashed"""
        if not self.pk and self.password and not self.password.startswith(('pbkdf2_', 'bcrypt_', 'argon2')):
            # Nowe konto z niezahashowanym hasłem
            self.set_password(self.password)
        super().save(*args, **kwargs)
    
    @property
    def is_authenticated(self):
        """Zawsze True dla aktywnych użytkowników"""
        return self.is_active
    
    @property
    def is_anonymous(self):
        """Zawsze False dla zalogowanych użytkowników"""
        return False
    
    def has_perm(self, perm, obj=None):
        """Sprawdzanie uprawnień"""
        return self.is_admin or self.is_superuser
    
    def has_module_perms(self, app_label):
        """Sprawdzanie uprawnień do modułu"""
        return self.is_admin or self.is_superuser


class UserProfile(models.Model):
    """Profil użytkownika - BEZ created_at i updated_at"""
    
    GOAL_CHOICES = [
        ('masa', 'Budowa masy'),
        ('sila', 'Siła'),
        ('wytrzymalosc', 'Wytrzymałość'),
        ('spalanie', 'Spalanie tłuszczu'),
        ('zdrowie', 'Ogólne zdrowie'),
    ]
    
    LEVEL_CHOICES = [
        ('poczatkujacy', 'Początkujący'),
        ('sredniozaawansowany', 'Średniozaawansowany'),
        ('zaawansowany', 'Zaawansowany'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('silownia', 'Siłownia'),
        ('dom_podstawowy', 'Dom - podstawowy'),
        ('dom_zaawansowany', 'Dom - zaawansowany'),
        ('masa_ciala', 'Masa ciała'),
        ('minimalne', 'Minimalne'),
    ]
    
    RECOMMENDATION_METHOD_CHOICES = [
        ('ai', 'AI-based'),
        ('collaborative', 'Collaborative Filtering'),
        ('content_based', 'Content-based'),
        ('hybrid', 'Hybrid')
    ]
    
    # Relacja z kontem - primary key zgodnie z SQL
    auth_account = models.OneToOneField(
        AuthAccount,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='auth_account_id',
        related_name='userprofile'
    )
    
    # Dane podstawowe
    first_name = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.CharField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    # Parametry treningowe - WSZYSTKIE MOGĄ BYĆ NULL
    goal = models.CharField(
        max_length=50,
        choices=GOAL_CHOICES,
        blank=True,
        null=True
    )
    level = models.CharField(
        max_length=50,
        choices=LEVEL_CHOICES,
        blank=True,
        null=True
    )
    training_days_per_week = models.IntegerField(
        blank=True,
        null=True
    )
    equipment_preference = models.CharField(
        max_length=50,
        choices=EQUIPMENT_CHOICES,
        blank=True,
        null=True
    )
    preferred_session_duration = models.IntegerField(
        default=60,
        blank=True,
        null=True
    )
    
    # Preferencje użytkownika
    avoid_exercises = ArrayField(
        base_field=models.CharField(max_length=100),
        blank=True,
        null=True,
        default=list
    )
    focus_areas = ArrayField(
        base_field=models.CharField(max_length=50),
        blank=True,
        null=True,
        default=list
    )
    
    # Metoda rekomendacji
    recommendation_method = models.CharField(
        max_length=50,
        choices=RECOMMENDATION_METHOD_CHOICES,
        default='hybrid',
        blank=True
    )
    
    # 🆕 Health data (dodane w migracji 08)
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Waga w kilogramach"
    )
    height_cm = models.IntegerField(
        blank=True,
        null=True,
        help_text="Wzrost w centymetrach"
    )
    # BMI jest GENERATED COLUMN w PostgreSQL
    # NIE DODAWAĆ DO MODELU - Django próbuje go zapisać co powoduje błąd
    # BMI będzie dostępne tylko przez raw SQL queries lub przez serializery (SerializerMethodField)
    injuries = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text="Lista kontuzji: ['knee', 'lower_back', ...]"
    )
    health_conditions = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text="Lista schorzeń: ['hypertension', 'asthma', ...]"
    )
    health_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Dodatkowe informacje zdrowotne"
    )
    
    # Metadata - tylko last_survey_date bo istnieje w bazie
    last_survey_date = models.DateTimeField(default=timezone.now)
    
    # NIE DODAJEMY created_at i updated_at bo ich nie ma w bazie!
    
    class Meta:
        db_table = 'user_profiles'
        managed = False  # Nie zarządzaj tabelą przez Django (już istnieje)
    
    def __str__(self):
        return f"Profile: {self.auth_account.username}"
    
    @property
    def age(self):
        """Oblicz wiek na podstawie daty urodzenia"""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None