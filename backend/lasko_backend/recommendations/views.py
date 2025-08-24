# backend/lasko_backend/recommendations/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .recommendation_service import RecommendationService
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """
    Endpoint do pobierania rekomendacji planów dla zalogowanego użytkownika.
    
    Query params:
    - mode: 'produkt', 'klient', 'hybrydowo' (default: 'hybrydowo')
    - limit: liczba rekomendacji (default: 5)
    """
    try:
        user_id = request.user.id
        mode = request.GET.get('mode', 'hybrydowo')
        limit = int(request.GET.get('limit', 5))
        
        # Parametry bazy danych z settings
        db_params = {
            'dbname': settings.DATABASES['default']['NAME'],
            'user': settings.DATABASES['default']['USER'],
            'password': settings.DATABASES['default']['PASSWORD'],
            'host': settings.DATABASES['default']['HOST'],
            'port': settings.DATABASES['default']['PORT'],
        }
        
        # Inicjalizuj serwis rekomendacji
        reco_service = RecommendationService(db_params)
        
        if not reco_service.conn:
            return Response(
                {'error': 'Błąd połączenia z bazą danych'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Pobierz rekomendacje
        recommendations = reco_service.get_recommendations(user_id, mode=mode)
        
        if not recommendations:
            return Response(
                {'message': 'Brak rekomendacji. Wypełnij ankietę profilu.', 'recommendations': []},
                status=status.HTTP_200_OK
            )
        
        # Ograniczanie wyników
        limited_recommendations = recommendations[:limit]
        
        # Pobierz szczegóły planów
        plan_ids = [r['plan_id'] for r in limited_recommendations]
        plan_details = reco_service.get_plan_details(plan_ids)
        
        # Przygotuj response z dodatkowymi informacjami
        enriched_recommendations = []
        for reco in limited_recommendations:
            plan_id = reco['plan_id']
            plan = plan_details.get(plan_id, {})
            
            # Oblicz dodatkowe metryki
            popularity = reco_service.get_popularity_score(plan_id)
            match_reasons = reco_service.get_user_match_reasons(user_id, plan_id)
            
            # Mapowanie do responsywnej struktury
            enriched_plan = {
                'id': plan_id,
                'name': plan.get('name', 'Nieznany plan'),
                'description': plan.get('description', ''),
                'goal': plan.get('goal_type', ''),
                'level': plan.get('difficulty_level', ''),
                'daysPerWeek': plan.get('training_days_per_week', 3),
                'equipment': plan.get('equipment_required', ''),
                'compatibility': min(100, int((reco['score'] / 35) * 100)),  # Normalizacja do 0-100%
                'score': round(reco['score'], 2),
                'popularity': popularity,
                'matchReasons': match_reasons,
                'rating': 4.5 + (popularity / 100),  # Symulowana ocena
                'users': popularity,
                'estimatedTime': '45-60 min',  # Można obliczyć z rzeczywistych danych
                'featured': reco['score'] > 25,  # Oznacz jako polecane jeśli wysoki wynik
                'difficulty': plan.get('difficulty_level', '').capitalize(),
                'duration': '8 tygodni'  # Można pobierać z bazy
            }
            
            enriched_recommendations.append(enriched_plan)
        
        # Zamknij połączenie
        reco_service.close_connection()
        
        return Response({
            'mode': mode,
            'total_found': len(recommendations),
            'returned': len(enriched_recommendations),
            'recommendations': enriched_recommendations
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Błąd podczas generowania rekomendacji: {str(e)}")
        return Response(
            {'error': 'Wewnętrzny błąd serwera'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile_recommendations(request):
    """
    Endpoint do pobierania profilu użytkownika i jego rekomendacji.
    Używany po wypełnieniu ankiety.
    """
    try:
        user_id = request.user.id
        
        db_params = {
            'dbname': settings.DATABASES['default']['NAME'],
            'user': settings.DATABASES['default']['USER'],
            'password': settings.DATABASES['default']['PASSWORD'],
            'host': settings.DATABASES['default']['HOST'],
            'port': settings.DATABASES['default']['PORT'],
        }
        
        reco_service = RecommendationService(db_params)
        
        # Pobierz profil użytkownika
        user_profile = reco_service._get_user_profile(user_id)
        
        if not user_profile:
            return Response(
                {'error': 'Nie znaleziono profilu użytkownika. Wypełnij ankietę.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Pobierz top 3 rekomendacje w trybie hybrydowym
        recommendations = reco_service.get_recommendations(user_id, mode='hybrydowo')
        
        response_data = {
            'profile': user_profile,
            'hasProfile': True,
            'recommendations': []
        }
        
        if recommendations:
            # Pobierz szczegóły top 3 planów
            top_plans = recommendations[:3]
            plan_ids = [r['plan_id'] for r in top_plans]
            plan_details = reco_service.get_plan_details(plan_ids)
            
            for reco in top_plans:
                plan_id = reco['plan_id']
                plan = plan_details.get(plan_id, {})
                match_reasons = reco_service.get_user_match_reasons(user_id, plan_id)
                
                response_data['recommendations'].append({
                    'id': plan_id,
                    'name': plan.get('name', 'Nieznany plan'),
                    'description': plan.get('description', ''),
                    'compatibility': min(100, int((reco['score'] / 35) * 100)),
                    'matchReasons': match_reasons,
                    'goal': plan.get('goal_type', ''),
                    'level': plan.get('difficulty_level', ''),
                    'daysPerWeek': plan.get('training_days_per_week', 3)
                })
        
        reco_service.close_connection()
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Błąd podczas pobierania profilu i rekomendacji: {str(e)}")
        return Response(
            {'error': 'Wewnętrzny błąd serwera'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )