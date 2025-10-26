# backend/lasko_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from recommendations import views as rec_views
from recommendations.urls import workout_urlpatterns

@csrf_exempt
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'message': 'Lasko Backend API is running'
    })

@csrf_exempt 
def api_root(request):
    """API root endpoint with available endpoints"""
    return JsonResponse({
        'message': 'Lasko Backend API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'recommendations': '/api/recommendations/',
            'admin': '/admin/',
            'health': '/health/'
        }
    })

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', health_check, name='health_check'),
    path('', health_check, name='root'),  # Root endpoint
    
    # API endpoints
    path('api/', api_root, name='api_root'),
    path('api/auth/', include('accounts.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    path('api/workouts/', include(workout_urlpatterns)),
]