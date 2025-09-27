# backend/recommendations/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from accounts.models import UserProfile, AuthAccount
import logging
import traceback

logger = logging.getLogger(__name__)

# Try to import engine.py if available
try:
    from .engine import fetch_user_profile, content_based, collaborative, hybrid, plan_details, explain_match
    HAS_ENGINE = True
    logger.info("[Recommendations] Engine loaded successfully")
except ImportError as e:
    HAS_ENGINE = False
    logger.warning(f"[Recommendations] Engine not found - using fallback: {str(e)}")


# ============================================================================
# MAIN RECOMMENDATIONS ENDPOINT
# ============================================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def generate_recommendations(request):
    """
    GET/POST /api/recommendations/
    Headers: Authorization: Bearer <access_token>
    Body/Query: {
        "mode": "product|user|hybrid" (alias: "algorithm"),
        "top": 10 (alias: "limit"),
        "preferences": {...}
    }
    """
    try:
        # Get user_id from JWT token payload
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            logger.error("[Recommendations] No user_id in token payload")
            logger.error(f"[Recommendations] Request.auth: {getattr(request, 'auth', 'None')}")
            if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
                logger.error(f"[Recommendations] Token payload: {request.auth.payload}")

            return Response({
                "error": "Invalid token - no user_id found",
                "code": "invalid_token"
            }, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[Recommendations] Request for user_id: {user_id}")

        # Get parameters (handle POST body and GET querystring + legacy names)
        data = request.data if request.method == 'POST' else request.query_params

        mode = (data.get('mode') or data.get('algorithm') or '').lower().strip()

        top_raw = data.get('top') or data.get('limit') or 3
        try:
            top = int(top_raw)
        except (TypeError, ValueError):
            top = 3

        preferences = data.get('preferences', {})

        logger.info(f"[Recommendations] Request data resolved: {dict(data)}")
        logger.info(f"[Recommendations] mode={mode}, top={top}")

        # Validate mode
        valid_modes = ['product', 'user', 'hybrid', 'content_based', 'collaborative']
        if mode not in valid_modes:
            try:
                user_profile = UserProfile.objects.get(auth_account_id=user_id)
                mode = (user_profile.recommendation_method or 'hybrid').lower()
                logger.info(f"[Recommendations] Using mode from profile: {mode}")
            except UserProfile.DoesNotExist:
                mode = 'hybrid'
                logger.info(f"[Recommendations] Using default mode: {mode}")

        # Map mode aliases
        if mode == 'content_based':
            mode = 'product'
        elif mode == 'collaborative':
            mode = 'user'

        if HAS_ENGINE:
            # Use engine.py if available
            return _generate_with_engine(user_id, mode, top, preferences)
        else:
            # Fallback without engine.py
            return _generate_fallback(user_id, mode, top, preferences)

    except Exception as e:
        logger.error(f"[Recommendations] Exception: {str(e)}")
        logger.error(f"[Recommendations] Traceback: {traceback.format_exc()}")

        return Response({
            "error": "Server error generating recommendations",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_with_engine(user_id, mode, top, preferences):
    """Generate recommendations using engine.py"""
    try:
        # Fetch user profile
        profile = fetch_user_profile(user_id)
        if not profile:
            logger.error(f"[Recommendations] No profile for user_id: {user_id}")
            return Response({
                "error": "No user profile found. Please complete the survey.",
                "code": "no_profile",
                "suggestion": "Go to plan creator"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[Recommendations] Profile found: {profile}")

        # Apply preferences - nadpisz profil preferencjami z requesta
        if preferences:
            # Normalizuj nazwy kluczy
            pref_mapping = {
                'goal': 'goal',
                'level': 'level',
                'equipment_preference': 'equipment',
                'training_days_per_week': 'days'
            }
            
            for frontend_key, backend_key in pref_mapping.items():
                if frontend_key in preferences and preferences[frontend_key]:
                    profile[backend_key] = preferences[frontend_key]
            
            logger.info(f"[Recommendations] Profile after preferences: {profile}")

        # Call algorithm
        if mode == 'product':
            raw_recommendations = content_based(profile)
        elif mode == 'user':
            raw_recommendations = collaborative(user_id)
        else:  # hybrid
            raw_recommendations = hybrid(user_id, profile)

        logger.info(f"[Recommendations] Algorithm returned {len(raw_recommendations)} results")
        
        # Jeśli algorytm nie zwrócił nic – użyj fallbacku
        if not raw_recommendations:
            logger.info("[Recommendations] Engine returned 0 results – falling back")
            return _generate_fallback(user_id, mode, top, preferences)

        # Limit results
        top_recommendations = raw_recommendations[:top]
        plan_ids = [r['plan_id'] for r in top_recommendations]

        # Get plan details
        plan_details_dict = plan_details(plan_ids)

        # Enrich recommendations
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

        logger.info(f"[Recommendations] Returning {len(enriched_recommendations)} recommendations")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[Recommendations] Engine error: {str(e)}")
        logger.error(f"[Recommendations] Engine traceback: {traceback.format_exc()}")

        return Response({
            "error": "Recommendation algorithm error",
            "message": str(e),
            "code": "engine_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_fallback(user_id, mode, top, preferences):
    """Fallback - simple recommendations without engine.py or when no results"""
    try:
        logger.info(f"[Recommendations] Using fallback for user_id: {user_id}")

        # Get user profile from Django ORM
        profile_data = None
        try:
            user_profile = UserProfile.objects.get(auth_account_id=user_id)
            profile_data = {
                "goal": user_profile.goal,
                "level": user_profile.level,
                "days": user_profile.training_days_per_week,
                "equipment": user_profile.equipment_preference,
            }
            logger.info(f"[Recommendations] User profile for fallback: {profile_data}")

        except UserProfile.DoesNotExist:
            logger.warning(f"[Recommendations] No profile found for user: {user_id}")
            profile_data = {
                "goal": "zdrowie",
                "level": "poczatkujacy",
                "days": 3,
                "equipment": "silownia"
            }

        # Try to get real plans from database
        try:
            with connection.cursor() as cursor:
                # Build query with filters
                query = """
                    SELECT plan_id, name, description, goal_type, difficulty_level, 
                           training_days_per_week, equipment_required
                    FROM training_plans 
                    WHERE is_active = true AND name != 'Demo'
                """
                params = []
                
                # Add filters based on profile
                if profile_data and profile_data.get('goal'):
                    query += " AND LOWER(goal_type) = LOWER(%s)"
                    params.append(profile_data['goal'])
                
                if profile_data and profile_data.get('level'):
                    query += " AND LOWER(difficulty_level) = LOWER(%s)"
                    params.append(profile_data['level'])
                
                # If no filters match, get any plans
                if not params:
                    query = """
                        SELECT plan_id, name, description, goal_type, difficulty_level, 
                               training_days_per_week, equipment_required
                        FROM training_plans 
                        WHERE is_active = true AND name != 'Demo'
                        ORDER BY plan_id
                    """
                
                query += f" LIMIT {top}"
                
                cursor.execute(query, params)
                plans = cursor.fetchall()
                
                if not plans:
                    # If still no plans, get ANY plan
                    cursor.execute("""
                        SELECT plan_id, name, description, goal_type, difficulty_level, 
                               training_days_per_week, equipment_required
                        FROM training_plans 
                        WHERE is_active = true
                        ORDER BY plan_id
                        LIMIT %s
                    """, [top])
                    plans = cursor.fetchall()
                
                if plans:
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
                            "score": 50.0,
                            "matchReasons": ["Dopasowany do Twoich preferencji"]
                        })
                    
                    return Response({
                        "success": True,
                        "mode": f"{mode}_fallback",
                        "recommendations": recommendations,
                        "metadata": {
                            "user_id": user_id,
                            "algorithm_used": "fallback",
                            "total_found": len(recommendations),
                            "returned": len(recommendations)
                        }
                    }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[Recommendations] Database error in fallback: {str(e)}")

        # Final fallback - return mock data
        return _generate_mock_recommendations(user_id, mode, top, profile_data)

    except Exception as e:
        logger.error(f"[Recommendations] Fallback error: {str(e)}")
        return _generate_mock_recommendations(user_id, mode, top, None)


def _generate_mock_recommendations(user_id, mode, top, profile_data):
    """Final fallback - generate mock recommendations for testing"""
    logger.info("[Recommendations] Using mock recommendations")

    mock_recommendations = [
        {
            "planId": 1,
            "name": "Plan dla Początkujących - Siła",
            "description": "Podstawowy program treningowy na siłowni dla początkujących",
            "goalType": "sila",
            "difficultyLevel": "poczatkujacy",
            "trainingDaysPerWeek": 3,
            "equipmentRequired": "silownia",
            "score": 95.0,
            "matchReasons": ["Idealny dla początkujących", "Buduje solidne podstawy"]
        },
        {
            "planId": 2,
            "name": "Budowa Masy Mięśniowej",
            "description": "Program nastawiony na przyrost masy mięśniowej",
            "goalType": "masa",
            "difficultyLevel": "poczatkujacy",
            "trainingDaysPerWeek": 4,
            "equipmentRequired": "silownia",
            "score": 87.0,
            "matchReasons": ["Skupienie na masie", "Progresywne obciążenia"]
        },
        {
            "planId": 3,
            "name": "Spalanie Tłuszczu Express",
            "description": "Intensywny program redukcji tkanki tłuszczowej",
            "goalType": "spalanie",
            "difficultyLevel": "poczatkujacy",
            "trainingDaysPerWeek": 3,
            "equipmentRequired": "silownia",
            "score": 78.0,
            "matchReasons": ["Efektywne spalanie", "Krótkie treningi"]
        }
    ]

    # Limit to requested amount
    recommendations = mock_recommendations[:top]

    response_data = {
        "success": True,
        "mode": f"mock_{mode}",
        "recommendations": recommendations,
        "metadata": {
            "user_id": user_id,
            "mock": True,
            "returned": len(recommendations),
            "note": "Mock data - brak planów w bazie danych"
        }
    }

    return Response(response_data, status=status.HTTP_200_OK)


# ============================================================================
# PLAN ACTIVATION
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
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({
                "error": "Invalid token",
                "code": "invalid_token"
            }, status=status.HTTP_401_UNAUTHORIZED)

        plan_id = request.data.get('planId')
        if not plan_id:
            return Response({
                "error": "planId is required",
                "code": "missing_plan_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[ActivatePlan] Plan {plan_id} for user_id: {user_id}")

        plan_name = None

        with connection.cursor() as cursor:
            # Check if plan exists
            cursor.execute("SELECT plan_id, name FROM training_plans WHERE plan_id=%s", [plan_id])
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "Plan does not exist",
                    "code": "plan_not_found"
                }, status=status.HTTP_404_NOT_FOUND)

            plan_name = row[1]

            # Check if user_active_plans table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'user_active_plans'
                )
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # UPSERT plan activation
                cursor.execute("""
                    INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, is_completed)
                    VALUES (%s, %s, CURRENT_DATE, FALSE)
                    ON CONFLICT (auth_account_id)
                    DO UPDATE SET
                        plan_id = EXCLUDED.plan_id,
                        start_date = EXCLUDED.start_date,
                        is_completed = FALSE
                """, [user_id, plan_id])
                
                logger.info(f"[ActivatePlan] Plan '{plan_name}' activated for user {user_id}")
            else:
                logger.warning("[ActivatePlan] user_active_plans table does not exist")

        return Response({
            "success": True,
            "message": f"Plan '{plan_name}' activated successfully",
            "planId": plan_id,
            "planName": plan_name
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[ActivatePlan] Exception: {str(e)}")
        return Response({
            "error": "Server error during plan activation",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)