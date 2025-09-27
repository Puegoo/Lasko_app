# backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Autoryzacja
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
      
    
    # Profil
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('refresh/', views.refresh_token, name='refresh_token'), # ✅ TO JEST KLUCZOWE
    # Preferencje  
    path('set-recommendation-method/', views.set_recommendation_method, name='set_recommendation_method'),
    
    # Debug
    path('debug/', views.debug_auth, name='debug_auth'),
]