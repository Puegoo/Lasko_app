# backend/recommendations/urls.py
from django.urls import path
from . import views
from . import exercises_views
from . import exercise_views

urlpatterns = [
    # Główny endpoint rekomendacji
    path('', views.generate_recommendations, name='generate_recommendations'),
    
    # Aktywny plan użytkownika
    path('active-plan/', views.get_active_plan, name='get_active_plan'),
    
    # Aktywacja planu  
    path('activate/', views.activate_plan, name='activate_plan'),
    
    # Wszystkie plany treningowe
    path('plans/', views.get_all_plans, name='get_all_plans'),
    
    # Szczegóły planu i aktywacja przez ID (zgodność z frontendem)
    path('plans/<int:plan_id>/detailed/', views.plan_detailed, name='plan_detailed'),
    path('plans/<int:plan_id>/activate/', views.activate_plan_by_path, name='activate_plan_by_path'),
    
    # Aliasy planów (niestandardowe nazwy)
    path('plans/<int:plan_id>/alias/', views.manage_plan_alias, name='manage_plan_alias'),
    path('plans/aliases/', views.get_user_plan_aliases, name='get_user_plan_aliases'),
    
    # Edycja planów
    path('plans/<int:plan_id>/', views.update_plan, name='update_plan'),
    path('plans/<int:plan_id>/days/<int:day_id>/', views.update_plan_day, name='update_plan_day'),
    path('plans/<int:plan_id>/exercises/<int:exercise_id>/', views.update_plan_exercise, name='update_plan_exercise'),
    path('plans/<int:plan_id>/exercises/<int:exercise_id>/delete/', views.delete_plan_exercise, name='delete_plan_exercise'),
    path('plans/<int:plan_id>/exercises/<int:plan_exercise_id>/replace/', views.replace_plan_exercise, name='replace_plan_exercise'),
    path('plans/<int:plan_id>/days/<int:day_id>/exercises/', views.add_plan_exercise, name='add_plan_exercise'),
    
    # 🆕 REKOMENDACJE ĆWICZEŃ I CUSTOM PLANY
    path('exercises/', exercise_views.get_recommended_exercises, name='get_recommended_exercises'),
    path('custom-plans/', exercise_views.manage_custom_plans, name='manage_custom_plans'),  # GET lista / POST create
    path('custom-plans/<int:plan_id>/', exercise_views.get_custom_plan, name='get_custom_plan'),  # GET szczegóły
    path('custom-plans/<int:plan_id>/update/', exercise_views.update_custom_plan, name='update_custom_plan'),  # PUT/PATCH
]

# Exercise catalog URLs (mapped under /api/exercises/)
exercise_urlpatterns = [
    path('', views.get_exercises, name='get_exercises'),
    path('<int:exercise_id>/detail/', exercises_views.get_exercise_detail, name='get_exercise_detail'),
    path('<int:exercise_id>/rate/', exercises_views.rate_exercise, name='rate_exercise'),
    path('<int:exercise_id>/favorite/', exercises_views.toggle_favorite, name='toggle_favorite'),
    path('<int:exercise_id>/statistics/', exercises_views.get_exercise_statistics, name='get_exercise_statistics'),
    path('favorites/', exercises_views.get_favorite_exercises, name='get_favorite_exercises'),
]

# Workout URLs (mapped under /api/workouts/)
workout_urlpatterns = [
    path('today/', views.today_workout, name='today_workout'),
    path('active-session/', views.get_active_session, name='get_active_session'),
    path('sessions/', views.start_workout_session, name='start_workout_session'),
    path('sessions/<int:session_id>/finish/', views.finish_workout_session, name='finish_workout_session'),
]