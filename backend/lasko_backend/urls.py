# backend/lasko_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from recommendations import views as rec_views
from recommendations.urls import workout_urlpatterns, exercise_urlpatterns
from accounts.urls import progress_urlpatterns, feedback_urlpatterns, journal_urlpatterns, statistics_urlpatterns, community_urlpatterns, settings_urlpatterns, calendar_urlpatterns

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
    path('api/exercises/', include(exercise_urlpatterns)),
    path('api/workouts/', include(workout_urlpatterns)),
    path('api/progress/', include(progress_urlpatterns)),
    path('api/feedback/', include(feedback_urlpatterns)),
    path('api/journal/', include(journal_urlpatterns)),
    path('api/statistics/', include(statistics_urlpatterns)),
    path('api/community/', include(community_urlpatterns)),
    path('api/settings/', include(settings_urlpatterns)),
    path('api/calendar/', include(calendar_urlpatterns)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)