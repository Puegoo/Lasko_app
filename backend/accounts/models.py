from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class AuthAccount(models.Model):
    """Model reprezentujący konto użytkownika w tabeli auth_accounts"""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'auth_accounts'
    
    def set_password(self, raw_password):
        """Hashowanie hasła"""
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Sprawdzenie hasła"""
        return check_password(raw_password, self.password_hash)
    
    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """Model reprezentujący profil użytkownika w tabeli user_profiles"""
    
    GOAL_CHOICES = [
        ('masa_mięśniowa', 'Budowanie masy mięśniowej'),
        ('redukcja_tłuszczu', 'Redukcja tłuszczu'),
        ('siła', 'Zwiększenie siły'),
        ('kondycja', 'Poprawa kondycji'),
        ('modelowanie', 'Modelowanie sylwetki'),
    ]
    
    LEVEL_CHOICES = [
        ('początkujący', 'Początkujący'),
        ('średnio_zaawansowany', 'Średnio zaawansowany'),
        ('zaawansowany', 'Zaawansowany'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('siłownia', 'Pełna siłownia'),
        ('hantle', 'Tylko hantle'),
        ('maszyny', 'Maszyny'),
        ('brak', 'Brak sprzętu (własny ciężar)'),
        ('minimalne', 'Minimalne wyposażenie'),
    ]
    
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id',
        related_name='profile'
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