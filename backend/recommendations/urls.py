# backend/recommendations/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Główny endpoint rekomendacji
    path('', views.generate_recommendations, name='generate_recommendations'),
    
    # Aktywny plan użytkownika
    path('active-plan/', views.get_active_plan, name='get_active_plan'),
    
    # Aktywacja planu  
    path('activate/', views.activate_plan, name='activate_plan'),
    
    # Szczegóły planu i aktywacja przez ID (zgodność z frontendem)
    path('plans/<int:plan_id>/detailed/', views.plan_detailed, name='plan_detailed'),
    path('plans/<int:plan_id>/activate/', views.activate_plan_by_path, name='activate_plan_by_path'),
    
    # Edycja planów
    path('plans/<int:plan_id>/', views.update_plan, name='update_plan'),
    path('plans/<int:plan_id>/days/<int:day_id>/', views.update_plan_day, name='update_plan_day'),
    path('plans/<int:plan_id>/exercises/<int:exercise_id>/', views.update_plan_exercise, name='update_plan_exercise'),
    path('plans/<int:plan_id>/exercises/<int:exercise_id>/delete/', views.delete_plan_exercise, name='delete_plan_exercise'),
    path('plans/<int:plan_id>/days/<int:day_id>/exercises/', views.add_plan_exercise, name='add_plan_exercise'),
]