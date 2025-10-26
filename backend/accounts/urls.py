# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', views.refresh_token, name='token-refresh'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='profile-update'),
    path('set-recommendation-method/', views.set_recommendation_method, name='set-reco-method'),
    path('debug-auth/', views.debug_auth, name='debug-auth'),

    # ➜ te dwie linie są kluczowe dla frontu
    path('check-email/', views.check_email, name='check-email'),
    path('check-username/', views.check_username, name='check-username'),
    
    # Harmonogram i powiadomienia
    path('schedule/save/', views.save_schedule, name='save-schedule'),
    path('schedule/get/', views.get_schedule, name='get-schedule'),
]