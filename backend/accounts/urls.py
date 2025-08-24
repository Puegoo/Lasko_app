# backend/accounts/urls.py (ZAKTUALIZOWANE Z NOWYMI ENDPOINTAMI)
from django.urls import path
from . import views

urlpatterns = [
    # Podstawowe endpointy autoryzacji
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    
    # Nowe endpointy dla rekomendacji
    path('set-recommendation-method/', views.set_recommendation_method, name='set_recommendation_method'),
    path('generate-recommendations/', views.generate_recommendations, name='generate_recommendations'),
]