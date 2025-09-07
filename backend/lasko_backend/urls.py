from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Importuj cały moduł views (bezpośrednie importy symboli bywają kruche przy autoreload)
from . import views


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health / root
    path('health/', health_check, name='health'),
    path('', health_check, name='root'),

    # Auth + profile
    path('api/auth/', include('accounts.urls')),

    # Rekomendacje (public, pod kreator/ankietę)
    path('api/reco/<str:mode>/', views.reco_dispatch, name='reco_dispatch'),
    path('api/recommendations/', views.reco_dispatch_default, name='reco_default'),

    # Plany
    path('api/plans/', views.create_custom_plan, name='create_plan'),
    path('api/plans/<int:plan_id>/detailed/', views.get_plan_detailed, name='plan_detailed'),
    path('api/plans/<int:plan_id>/detailed', views.get_plan_detailed),  # tolerujemy brak slasha
    path('api/plans/<int:plan_id>/activate/', views.activate_plan, name='activate_plan'),
    path('api/plans/<int:plan_id>/activate', views.activate_plan),
]