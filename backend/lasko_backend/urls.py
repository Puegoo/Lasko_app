from django.contrib import admin
from django.urls import path, include
from . import views

# API endpoints dla systemu rejestracji i rekomendacji
api_patterns = [
    path('register/', views.register_user, name='register_user'),
    path('recommendations/', views.get_recommendations, name='get_recommendations'),
    path('activate-plan/', views.activate_plan, name='activate_plan'),
    path('create-plan/', views.create_custom_plan, name='create_custom_plan'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_patterns)),
]