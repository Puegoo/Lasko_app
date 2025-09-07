# backend/recommendations/urls.py
from django.urls import path
from lasko_backend.views import (
    get_recommendations,
    activate_plan,
    create_custom_plan,
)

urlpatterns = [
    path('', get_recommendations, name='get_recommendations'),                       # POST /api/recommendations/
    path('activate/', activate_plan, name='activate_plan'),                          # POST /api/recommendations/activate/
    path('create-custom-plan/', create_custom_plan, name='create_custom_plan'),      # POST /api/recommendations/create-custom-plan/
]
