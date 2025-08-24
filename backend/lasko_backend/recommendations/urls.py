# backend/lasko_backend/recommendations/urls.py
from django.urls import path
from . import views

app_name = 'recommendations'

urlpatterns = [
    path('get/', views.get_recommendations, name='get_recommendations'),
    path('profile/', views.get_user_profile_recommendations, name='profile_recommendations'),
]

# backend/lasko_backend/urls.py (główny plik URL)
# Dodaj do urlpatterns:
# path('api/recommendations/', include('recommendations.urls')),