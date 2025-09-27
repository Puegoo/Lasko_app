# backend/recommendations/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Główny endpoint rekomendacji
    path('', views.generate_recommendations, name='generate_recommendations'),
    
    # Aktywacja planu  
    path('activate/', views.activate_plan, name='activate_plan'),
]