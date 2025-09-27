# backend/recommendations/views.py - CLEAN VERSION WITHOUT POLISH CHARACTERS
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from accounts.models import UserProfile, AuthAccount
import logging


logger = logging.getLogger(__name__)


# Try to import engine.py if available
try:
    from .engine import fetch_user_profile, content_based, collaborative, hybrid, plan_details, explain_match
    HAS_ENGINE = True
    logger.info("[Recommendations] Engine loaded successfully")
except ImportError:
    HAS_ENGINE = False
    logger.warning("[Recommendations] Engine not found - using fallback")


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
        if mode not in ('product', 'user', 'hybrid'):
            try:
                user_profile = UserProfile.objects.get(auth_account_id=user_id)
                mode = (user_profile.recommendation_method or 'hybrid').lower()
                logger.info(f"[Recommendations] Using mode from profile: {mode}")
            except UserProfile.DoesNotExist:
                mode = 'hybrid'
                logger.info(f"[Recommendations] Using default mode: {mode}")

        if HAS_ENGINE:
            # Use engine.py if available
            return _generate_with_engine(user_id, mode, top, preferences)
        else:
            # Fallback without engine.py
            return _generate_fallback(user_id, mode, top, preferences)

    except Exception as e:
        logger.error(f"[Recommendations] Exception: {str(e)}")
        import traceback
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

        # Apply preferences
        if preferences:
            for key, value in preferences.items():
                if key in profile and value:
                    profile[key] = value

        # Call algorithm
        if mode == 'product':
            raw_recommendations = content_based(profile)
        elif mode == 'user':
            raw_recommendations = collaborative(user_id)
        else:  # hybrid
            raw_recommendations = hybrid(user_id, profile)

        logger.info(f"[Recommendations] Algorithm returned {len(raw_recommendations)} results")
        # Jeśli algorytm nie zwrócił nic – spadnij do prostego fallbacku
        if not raw_recommendations:
            logger.info("[Recommendations] Engine returned 0 results – falling back to simple DB-based recommendations")
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
        import traceback
        logger.error(f"[Recommendations] Engine traceback: {traceback.format_exc()}")

        return Response({
            "error": "Recommendation algorithm error",
            "message": str(e),
            "code": "engine_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_fallback(user_id, mode, top, preferences):
    """Fallback - simple recommendations without engine.py"""
    try:
        logger.info(f"[Recommendations] Using fallback for user_id: {user_id}")

        # Get user profile from Django ORM
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
            user_profile = auth_account.userprofile

            profile_data = {
                "goal": user_profile.goal,
                "level": user_profile.level,
                "training_days_per_week": user_profile.training_days_per_week,
                "equipment_preference": user_profile.equipment_preference,
            }
            logger.info(f"[Recommendations] User profile: {profile_data}")

        except (AuthAccount.DoesNotExist, UserProfile.DoesNotExist):
            logger.warning(f"[Recommendations] No profile found for user: {user_id}")
            profile_data = None

        # Check if training_plans table exists
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'training_plans'
                    )
                """)
                table_exists = cursor.fetchone()[0]

                if not table_exists:
                    logger.warning("[Recommendations] training_plans table does not exist")
                    return _generate_mock_recommendations(user_id, mode, top, profile_data)

                # Try to get real plans
                cursor.execute("""
                    SELECT id, name, description, goal_type, difficulty_level, 
                           training_days_per_week, equipment_required
                    FROM training_plans 
                    WHERE is_active = TRUE
                    ORDER BY id
                    LIMIT %s
                """, [top])

                plans = cursor.fetchall()

                if not plans:
                    logger.warning("[Recommendations] No active training plans found")
                    return _generate_mock_recommendations(user_id, mode, top, profile_data)

        except Exception as e:
            logger.error(f"[Recommendations] Database error: {str(e)}")
            return _generate_mock_recommendations(user_id, mode, top, profile_data)

        # Prepare response with real plans
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
                "score": 1.0,  # Default score
                "matchReasons": ["General plan"]
            })

        response_data = {
            "success": True,
            "mode": "fallback",
            "recommendations": recommendations,
            "user_profile": profile_data,
            "metadata": {
                "user_id": user_id,
                "fallback": True,
                "returned": len(recommendations)
            }
        }

        logger.info(f"[Recommendations] Fallback returned {len(recommendations)} plans")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[Recommendations] Fallback error: {str(e)}")
        import traceback
        logger.error(f"[Recommendations] Fallback traceback: {traceback.format_exc()}")

        # Final fallback - return mock data
        return _generate_mock_recommendations(user_id, mode, top, None)


def _generate_mock_recommendations(user_id, mode, top, profile_data):
    """Final fallback - generate mock recommendations for testing"""
    logger.info("[Recommendations] Using mock recommendations")

    mock_recommendations = [
        {
            "planId": 1,
            "name": "Beginner Full Body Workout",
            "description": "A comprehensive workout plan for beginners focusing on all major muscle groups",
            "goalType": "health",
            "difficultyLevel": "beginner",
            "trainingDaysPerWeek": 3,
            "equipmentRequired": "gym",
            "score": 0.95,
            "matchReasons": ["Good for beginners", "Full body coverage", "Manageable schedule"]
        },
        {
            "planId": 2,
            "name": "Strength Building Program",
            "description": "Focus on building strength and muscle mass with progressive overload",
            "goalType": "strength",
            "difficultyLevel": "intermediate",
            "trainingDaysPerWeek": 4,
            "equipmentRequired": "gym",
            "score": 0.87,
            "matchReasons": ["Strength focused", "Progressive training", "Proven methods"]
        },
        {
            "planId": 3,
            "name": "Home Bodyweight Training",
            "description": "No equipment needed - bodyweight exercises you can do anywhere",
            "goalType": "fitness",
            "difficultyLevel": "beginner",
            "trainingDaysPerWeek": 3,
            "equipmentRequired": "none",
            "score": 0.78,
            "matchReasons": ["No equipment needed", "Convenient", "Flexible timing"]
        }
    ]

    # Limit to requested amount
    recommendations = mock_recommendations[:top]

    response_data = {
        "success": True,
        "mode": f"mock_{mode}",
        "recommendations": recommendations,
        "user_profile": profile_data,
        "metadata": {
            "user_id": user_id,
            "mock": True,
            "returned": len(recommendations),
            "note": "Mock data for testing - no database connection to training_plans"
        }
    }

    return Response(response_data, status=status.HTTP_200_OK)


# ============================================================================
# PLAN ACTIVATION
# ============================================================================
@api_view(['POST'])  # GET nie ma sensu, zostawmy POST
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

        plan_name = None  # ← zabezpieczenie przed UnboundLocalError

        with connection.cursor() as cursor:
            # 1) Czy plan istnieje?
            cursor.execute("SELECT id, name FROM training_plans WHERE id=%s", [plan_id])
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "Plan does not exist",
                    "code": "plan_not_found"
                }, status=status.HTTP_404_NOT_FOUND)

            plan_name = row[1]

            # 2) Czy istnieje tabela user_active_plans?
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'user_active_plans'
                )
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # 3) UPSERT (rozwiązuje konflikt UNIQUE na auth_account_id)
                cursor.execute("""
                    INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, is_completed, end_date, rating, rating_date, feedback_text)
                    VALUES (%s, %s, CURRENT_DATE, FALSE, NULL, NULL, NULL, NULL)
                    ON CONFLICT (auth_account_id)
                    DO UPDATE SET
                        plan_id = EXCLUDED.plan_id,
                        start_date = EXCLUDED.start_date,
                        end_date = NULL,
                        is_completed = FALSE,
                        rating = NULL,
                        rating_date = NULL,
                        feedback_text = NULL
                """, [user_id, plan_id])
            else:
                logger.warning("[ActivatePlan] user_active_plans table does not exist")

        logger.info(f"[ActivatePlan] Plan '{plan_name}' activated")

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