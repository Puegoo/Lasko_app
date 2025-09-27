# backend/accounts/models.py - POPRAWIONY MODEL
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField

class AuthAccount(models.Model):
    """Model użytkownika zgodny ze schematem SQL"""
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=255)  # ZMIANA: password zamiast password_hash
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


class UserProfile(models.Model):
    """Profil użytkownika"""
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id'
    )
    first_name = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    goal = models.CharField(max_length=50, blank=True, null=True)
    level = models.CharField(max_length=50, blank=True, null=True)
    training_days_per_week = models.IntegerField(blank=True, null=True)
    equipment_preference = models.CharField(max_length=50, blank=True, null=True)
    preferred_session_duration = models.IntegerField(default=60)

    avoid_exercises = ArrayField(
        base_field=models.CharField(max_length=100),
        blank=True, null=True, default=list
    )
    focus_areas = ArrayField(
        base_field=models.CharField(max_length=50),
        blank=True, null=True, default=list
    )

    recommendation_method = models.CharField(
        max_length=50,
        default='hybrid',
        choices=[
            ('ai', 'AI-based'),
            ('collaborative', 'Collaborative Filtering'),
            ('content_based', 'Content-based'),
            ('hybrid', 'Hybrid')
        ]
    )
    last_survey_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'user_profiles'
        managed = False  # Nie zarządzaj tabelą przez Django
    
    def __str__(self):
        return f"Profile: {self.auth_account.username}"