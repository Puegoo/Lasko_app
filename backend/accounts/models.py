# backend/accounts/models.py
from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class AuthAccount(models.Model):
    """Model reprezentujący konto użytkownika w tabeli auth_accounts"""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=128)  # Zmienione z password_hash na password - zgodnie z Django
    first_name = models.CharField(max_length=50, null=True, blank=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_accounts'
    
    def set_password(self, raw_password):
        """Hashowanie hasła"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Sprawdzenie hasła"""
        return check_password(raw_password, self.password)
    
    # Property dla kompatybilności z starym kodem
    @property
    def is_admin(self):
        return self.is_superuser
    
    @property
    def created_at(self):
        return self.date_joined
    
    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """Model reprezentujący profil użytkownika w tabeli user_profiles"""
    
    # Zaktualizowane choices zgodnie z tym co wysyła frontend
    GOAL_CHOICES = [
        ('masa', 'Budowanie masy mięśniowej'),
        ('redukcja', 'Redukcja tłuszczu'),
        ('siła', 'Zwiększenie siły'),
        ('kondycja', 'Poprawa kondycji'),
        ('modelowanie', 'Modelowanie sylwetki'),
        ('zdrowie', 'Zdrowie i samopoczucie'),
    ]
    
    LEVEL_CHOICES = [
        ('początkujący', 'Początkujący'),
        ('sredniozaawansowany', 'Średnio zaawansowany'),
        ('zaawansowany', 'Zaawansowany'),
        ('ekspert', 'Ekspert'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('siłownia', 'Pełna siłownia'),
        ('hantle', 'Tylko hantle'),
        ('maszyny', 'Maszyny'),
        ('brak', 'Brak sprzętu (własny ciężar)'),
        ('minimalne', 'Minimalne wyposażenie'),
        ('dom', 'Trening w domu'),
        ('wolne_ciezary', 'Wolne ciężary'),
    ]
    
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id',
        related_name='userprofile'  # Zmienione z 'profile' na 'userprofile'
    )
    first_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    goal = models.CharField(max_length=50, choices=GOAL_CHOICES, null=True, blank=True)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, null=True, blank=True)
    training_days_per_week = models.IntegerField(null=True, blank=True)
    equipment_preference = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profil użytkownika {self.auth_account.username}"