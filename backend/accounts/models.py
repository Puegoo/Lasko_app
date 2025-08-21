# backend/accounts/models.py (POPRAWIONE WEDŁUG RZECZYWISTEJ STRUKTURY)
from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class AuthAccount(models.Model):
    """Model konta użytkownika - zgodny z rzeczywistą tabelą"""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    
    # POPRAWKA: Kolumna nazywa się 'password', nie 'password_hash'
    password = models.CharField(max_length=255)
    
    first_name = models.CharField(max_length=50, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Dodatkowe kolumny Django User (wykryte w bazie)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_accounts'
    
    def set_password(self, raw_password):
        """Ustaw hasło (hashowane)"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Sprawdź hasło"""
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.username

class UserProfile(models.Model):
    """Model profilu użytkownika"""
    
    GOAL_CHOICES = [
        ('masa', 'Masa mięśniowa'),
        ('redukcja', 'Redukcja tkanki tłuszczowej'),
        ('siła', 'Zwiększenie siły'),
        ('wytrzymalosc', 'Wytrzymałość'),
        ('zdrowie', 'Zdrowie ogólne'),
    ]
    
    LEVEL_CHOICES = [
        ('początkujący', 'Początkujący'),
        ('średniozaawansowany', 'Średniozaawansowany'),
        ('zaawansowany', 'Zaawansowany'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('siłownia', 'Pełna siłownia'),
        ('dom_hantle', 'Dom (hantle + ławka)'),
        ('dom_masa', 'Dom (masa własna ciała)'),
        ('minimalne', 'Minimalne wyposażenie'),
        ('dom', 'Trening w domu'),
        ('wolne_ciezary', 'Wolne ciężary'),
    ]
    
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id',
        related_name='userprofile'
    )
    first_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    goal = models.CharField(max_length=50, choices=GOAL_CHOICES, null=True, blank=True)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, null=True, blank=True)
    training_days_per_week = models.IntegerField(null=True, blank=True)
    equipment_preference = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES, null=True, blank=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profil użytkownika {self.auth_account.username}"