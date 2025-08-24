# backend/accounts/models.py - FINALNA WERSJA ZGODNA Z RZECZYWISTYM SCHEMATEM
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.postgres.fields import ArrayField  # KLUCZOWY IMPORT dla PostgreSQL arrays

class AuthAccount(models.Model):
    """Model konta użytkownika - zgodny z schematem bazy"""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)  # Poprawna nazwa kolumny
    
    first_name = models.CharField(max_length=50, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Dodatkowe kolumny Django User
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
    """Model profilu użytkownika - ZGODNY Z RZECZYWISTYM SCHEMATEM BAZY"""
    
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
    
    # 🎯 KOLUMNY DOKŁADNIE ZGODNE Z SCHEMATEM BAZY DANYCH:
    auth_account = models.OneToOneField(
        AuthAccount, 
        on_delete=models.CASCADE,
        db_column='auth_account_id',
        related_name='userprofile'
    )
    
    # Podstawowe kolumny profilu
    first_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    goal = models.CharField(max_length=50, choices=GOAL_CHOICES, null=True, blank=True)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, null=True, blank=True)
    training_days_per_week = models.IntegerField(null=True, blank=True)
    equipment_preference = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES, null=True, blank=True)
    
    # 🚨 KLUCZOWA POPRAWKA: ARRAY FIELDS zgodne z PostgreSQL schema
    preferred_session_duration = models.IntegerField(default=60, null=True, blank=True)
    avoid_exercises = ArrayField(
        models.CharField(max_length=100),
        size=20,  # maksymalnie 20 elementów
        null=True,
        blank=True,
        help_text="Lista problemowych ćwiczeń/kategorii do unikania"
    )
    focus_areas = ArrayField(
        models.CharField(max_length=100), 
        size=10,  # maksymalnie 10 obszarów
        null=True,
        blank=True,
        help_text="Lista obszarów skupienia treningu"
    )
    last_survey_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profil użytkownika {self.auth_account.username}"
    
    def get_focus_areas_display(self):
        """Zwróć focus_areas jako czytelny tekst"""
        if self.focus_areas:
            return ", ".join(self.focus_areas)
        return "Brak"
    
    def get_avoid_exercises_display(self):
        """Zwróć avoid_exercises jako czytelny tekst"""
        if self.avoid_exercises:
            return ", ".join(self.avoid_exercises)
        return "Brak"
    
    def add_focus_area(self, area):
        """Dodaj obszar skupienia"""
        if not self.focus_areas:
            self.focus_areas = []
        if area not in self.focus_areas:
            self.focus_areas.append(area)
    
    def remove_focus_area(self, area):
        """Usuń obszar skupienia"""
        if self.focus_areas and area in self.focus_areas:
            self.focus_areas.remove(area)
    
    def add_avoid_exercise(self, exercise):
        """Dodaj ćwiczenie do unikania"""
        if not self.avoid_exercises:
            self.avoid_exercises = []
        if exercise not in self.avoid_exercises:
            self.avoid_exercises.append(exercise)
    
    def remove_avoid_exercise(self, exercise):
        """Usuń ćwiczenie z listy do unikania"""
        if self.avoid_exercises and exercise in self.avoid_exercises:
            self.avoid_exercises.remove(exercise)