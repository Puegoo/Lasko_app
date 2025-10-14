# backend/recommendations/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Główny endpoint rekomendacji
    path('', views.generate_recommendations, name='generate_recommendations'),
    
    # Aktywacja planu  
    path('activate/', views.activate_plan, name='activate_plan'),
    
    # Szczegóły planu i aktywacja przez ID (zgodność z frontendem)
    path('plans/<int:plan_id>/detailed/', views.plan_detailed, name='plan_detailed'),
    path('plans/<int:plan_id>/activate/', views.activate_plan_by_path, name='activate_plan_by_path'),
]