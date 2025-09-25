# backend/recommendations/urls.py - ZASTĄP CAŁY PLIK
from django.urls import path
from . import views  # ✅ POPRAWNY IMPORT z tego samego modułu

urlpatterns = [
    # Główny endpoint rekomendacji
    path('', views.generate_recommendations, name='generate_recommendations'),
    
    # Aktywacja planu  
    path('activate/', views.activate_plan, name='activate_plan'),
]