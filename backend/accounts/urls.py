# backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),

    # Profil
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),

    # Preferencje rekomendacji
    path('set-recommendation-method/', views.set_recommendation_method, name='set_recommendation_method'),

    # (opcjonalnie) JWT-chroniony endpoint rekomendacji – zwraca taki sam format jak /api/recommendations/
    path('generate-recommendations/', views.generate_recommendations, name='generate_recommendations'),
]