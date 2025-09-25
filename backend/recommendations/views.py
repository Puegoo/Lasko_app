# backend/recommendations/views.py - ZASTĄP CAŁY PLIK
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from accounts.models import UserProfile, AuthAccount
import logging

logger = logging.getLogger(__name__)

# Jeśli engine.py istnieje, użyj go
try:
    from .engine import fetch_user_profile, content_based, collaborative, hybrid, plan_details, explain_match
    HAS_ENGINE = True
    logger.info("✅ [Recommendations] Engine załadowany")
except ImportError:
    HAS_ENGINE = False
    logger.warning("⚠️ [Recommendations] Engine nie znaleziony - używam fallback")

# ============================================================================
# GŁÓWNY ENDPOINT REKOMENDACJI  
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_recommendations(request):
    """
    POST /api/recommendations/
    Headers: Authorization: Bearer <access_token>
    Body: {
        "mode": "product|user|hybrid", 
        "top": 10,
        "preferences": {...}
    }
    """
    try:
        user_id = getattr(getattr(request, 'auth', None), 'payload', {}).get('user_id')
        if not user_id:
            logger.error("❌ [Recommendations] Brak user_id w tokenie")
            return Response({
                "message": "Nieprawidłowy token - brak user_id"
            }, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"🤖 [Recommendations] Żądanie dla user_id: {user_id}")
        logger.info(f"🤖 [Recommendations] Dane: {request.data}")

        # Parametry
        mode = (request.data.get('mode') or '').lower().strip()
        top = int(request.data.get('top', 10))
        preferences = request.data.get('preferences', {})

        logger.info(f"🤖 [Recommendations] mode={mode}, top={top}")

        # Walidacja mode
        if mode not in ('product', 'user', 'hybrid'):
            try:
                user_profile = UserProfile.objects.get(auth_account_id=user_id)
                mode = (user_profile.recommendation_method or 'hybrid').lower()
                logger.info(f"🤖 [Recommendations] Mode z profilu: {mode}")
            except UserProfile.DoesNotExist:
                mode = 'hybrid'
                logger.info(f"🤖 [Recommendations] Mode domyślny: {mode}")

        if HAS_ENGINE:
            # Użyj engine.py jeśli dostępny
            return _generate_with_engine(user_id, mode, top, preferences)
        else:
            # Fallback bez engine.py
            return _generate_fallback(user_id, mode, top, preferences)

    except Exception as e:
        logger.error(f"❌ [Recommendations] Exception: {str(e)}")
        return Response({
            "message": "Błąd serwera podczas generowania rekomendacji",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _generate_with_engine(user_id, mode, top, preferences):
    """Generuj rekomendacje używając engine.py"""
    try:
        # Pobierz profil użytkownika
        profile = fetch_user_profile(user_id)
        if not profile:
            logger.error(f"❌ [Recommendations] Brak profilu dla user_id: {user_id}")
            return Response({
                "message": "Brak profilu użytkownika. Uzupełnij ankietę.",
                "suggestion": "Przejdź do kreatora planów"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"✅ [Recommendations] Profil znaleziony: {profile}")

        # Zastosuj preferencje
        if preferences:
            for key, value in preferences.items():
                if key in profile and value:
                    profile[key] = value

        # Wywołaj algorytm
        if mode == 'product':
            raw_recommendations = content_based(profile)
        elif mode == 'user':
            raw_recommendations = collaborative(user_id)
        else:  # hybrid
            raw_recommendations = hybrid(user_id, profile)

        logger.info(f"✅ [Recommendations] Algorytm zwrócił {len(raw_recommendations)} wyników")

        # Ogranicz wyniki
        top_recommendations = raw_recommendations[:top]
        plan_ids = [r['plan_id'] for r in top_recommendations]

        # Pobierz szczegóły planów
        plan_details_dict = plan_details(plan_ids)
        
        # Wzbogać rekomendacje
        enriched_recommendations = []
        for recommendation in top_recommendations:
            plan_id = recommendation['plan_id']
            plan_detail = plan_details_dict.get(plan_id)
            
            if not plan_detail:
                continue
            
            meta = recommendation.get('meta', {})
            match_reasons = explain_match(
                profile, 
                plan_detail, 
                meta.get('total_users'), 
                meta.get('avg_rating')
            )
            
            enriched_recommendation = {
                "planId": plan_id,
                "name": plan_detail['name'],
                "description": plan_detail['description'],
                "goalType": plan_detail['goal_type'],
                "difficultyLevel": plan_detail['difficulty_level'],
                "trainingDaysPerWeek": plan_detail['training_days_per_week'],
                "equipmentRequired": plan_detail['equipment_required'],
                "score": round(float(recommendation['score']), 2),
                "matchReasons": match_reasons
            }
            
            enriched_recommendations.append(enriched_recommendation)

        response_data = {
            "success": True,
            "mode": mode,
            "recommendations": enriched_recommendations,
            "metadata": {
                "user_id": user_id,
                "algorithm_used": mode,
                "total_found": len(raw_recommendations),
                "returned": len(enriched_recommendations)
            }
        }

        logger.info(f"✅ [Recommendations] Zwracam {len(enriched_recommendations)} rekomendacji")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"❌ [Recommendations] Engine error: {str(e)}")
        return Response({
            "message": "Błąd algorytmu rekomendacji",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _generate_fallback(user_id, mode, top, preferences):
    """Fallback - proste rekomendacje bez engine.py"""
    try:
        logger.info(f"📦 [Recommendations] Używam fallback dla user_id: {user_id}")
        
        # Pobierz profil użytkownika z Django ORM
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
            user_profile = auth_account.userprofile
        except (AuthAccount.DoesNotExist, UserProfile.DoesNotExist):
            return Response({
                "message": "Brak profilu użytkownika. Uzupełnij ankietę.",
            }, status=status.HTTP_400_BAD_REQUEST)

        # Proste zapytanie SQL do planów
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, description, goal_type, difficulty_level, 
                       training_days_per_week, equipment_required
                FROM training_plans 
                WHERE is_active = TRUE
                ORDER BY id
                LIMIT %s
            """, [top])
            
            plans = cursor.fetchall()

        # Przygotuj odpowiedź
        recommendations = []
        for plan in plans:
            recommendations.append({
                "planId": plan[0],
                "name": plan[1],
                "description": plan[2],
                "goalType": plan[3],
                "difficultyLevel": plan[4],
                "trainingDaysPerWeek": plan[5],
                "equipmentRequired": plan[6],
                "score": 1.0,  # Domyślny score
                "matchReasons": ["Plan ogólny"]
            })

        response_data = {
            "success": True,
            "mode": "fallback",
            "recommendations": recommendations,
            "metadata": {
                "user_id": user_id,
                "fallback": True,
                "returned": len(recommendations)
            }
        }

        logger.info(f"✅ [Recommendations] Fallback zwrócił {len(recommendations)} planów")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"❌ [Recommendations] Fallback error: {str(e)}")
        return Response({
            "message": "Błąd fallback rekomendacji",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# AKTYWACJA PLANU
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_plan(request):
    """
    POST /api/recommendations/activate/
    Headers: Authorization: Bearer <access_token>
    Body: {"planId": 123}
    """
    try:
        user_id = getattr(getattr(request, 'auth', None), 'payload', {}).get('user_id')
        if not user_id:
            return Response({
                "message": "Nieprawidłowy token"
            }, status=status.HTTP_401_UNAUTHORIZED)

        plan_id = request.data.get('planId')
        if not plan_id:
            return Response({
                "message": "Wymagane: planId"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"🔄 [ActivatePlan] Plan {plan_id} dla user_id: {user_id}")

        with connection.cursor() as cursor:
            # Sprawdź czy plan istnieje
            cursor.execute("SELECT id, name FROM training_plans WHERE id=%s", [plan_id])
            plan_row = cursor.fetchone()
            if not plan_row:
                return Response({
                    "message": "Plan nie istnieje"
                }, status=status.HTTP_404_NOT_FOUND)

            plan_name = plan_row[1]

            # Zakończ aktywne plany
            cursor.execute("""
                UPDATE user_active_plans
                SET is_completed = TRUE, end_date = CURRENT_DATE
                WHERE auth_account_id=%s AND is_completed=FALSE
            """, [user_id])

            # Aktywuj nowy plan
            cursor.execute("""
                INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
                VALUES (%s, %s, CURRENT_DATE)
            """, [user_id, plan_id])

        logger.info(f"✅ [ActivatePlan] Plan '{plan_name}' aktywowany")

        return Response({
            "success": True,
            "message": f"Plan '{plan_name}' aktywowany pomyślnie",
            "planId": plan_id,
            "planName": plan_name
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"❌ [ActivatePlan] Exception: {str(e)}")
        return Response({
            "message": "Błąd serwera podczas aktywacji planu",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)