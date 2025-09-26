# backend/accounts/models.py - CORRECTED MODELS
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.postgres.fields import ArrayField

class AuthAccount(models.Model):
    """User account model - aligned with database schema"""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)  # Correct field name: password (not password_hash)
    
    first_name = models.CharField(max_length=50, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Additional Django User fields (for compatibility)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_accounts'
    
    def set_password(self, raw_password):
        """Set hashed password"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check password"""
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """User profile model - aligned with database schema"""
    
    GOAL_CHOICES = [
        ('masa', 'Muscle Mass'),
        ('redukcja', 'Fat Loss'),
        ('sila', 'Strength'),
        ('wytrzymalosc', 'Endurance'),
        ('zdrowie', 'General Health'),
    ]
    
    LEVEL_CHOICES = [
        ('poczatkujacy', 'Beginner'),
        ('sredniozaawansowany', 'Intermediate'),
        ('zaawansowany', 'Advanced'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('silownia', 'Full Gym'),
        ('dom_hantle', 'Home (Dumbbells + Bench)'),
        ('dom_masa', 'Home (Bodyweight)'),
        ('minimalne', 'Minimal Equipment'),
        ('dom', 'Home Training'),
        ('wolne_ciezary', 'Free Weights'),
    ]
    
    RECO_CHOICES = [
        ('product', 'Product (content-based)'),
        ('user', 'User (collaborative)'),
        ('hybrid', 'Hybrid')
    ]
    
    # Foreign key to account
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id',
        related_name='userprofile'
    )
    
    # Basic profile fields
    first_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    goal = models.CharField(max_length=50, choices=GOAL_CHOICES, null=True, blank=True)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, null=True, blank=True)
    training_days_per_week = models.IntegerField(null=True, blank=True)
    equipment_preference = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES, null=True, blank=True)
    preferred_session_duration = models.IntegerField(default=60, null=True, blank=True)
    
    # Array fields for PostgreSQL
    avoid_exercises = ArrayField(
        models.CharField(max_length=100),
        size=20,
        null=True,
        blank=True,
        help_text="List of exercises to avoid"
    )
    focus_areas = ArrayField(
        models.CharField(max_length=100), 
        size=10,
        null=True,
        blank=True,
        help_text="List of focus areas for training"
    )
    
    last_survey_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    recommendation_method = models.CharField(
        max_length=10,
        choices=RECO_CHOICES,
        null=True,
        blank=True,
        default='hybrid'
    )
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile of {self.auth_account.username}"
    
    def get_focus_areas_display(self):
        if self.focus_areas:
            return ", ".join(self.focus_areas)
        return "None"
    
    def get_avoid_exercises_display(self):
        if self.avoid_exercises:
            return ", ".join(self.avoid_exercises)
        return "None"