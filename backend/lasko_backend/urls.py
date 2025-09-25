# backend/lasko_backend/urls.py - ZASTĄP CAŁY PLIK  
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "ok", 
        "service": "Lasko Backend",
        "version": "1.0.0"
    })

urlpatterns = [
    # Admin i health
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health'),
    path('', health_check, name='root'),

    # ✅ POPRAWIONY ROUTING
    # Autoryzacja i profil
    path('api/auth/', include('accounts.urls')),
    
    # Rekomendacje - kieruj do recommendations app
    path('api/recommendations/', include('recommendations.urls')),
]