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
        
        # 🆕 Sprawdź czy użytkownik pominął ankietę
        try:
            user_profile_obj = UserProfile.objects.get(auth_account_id=user_id)
            # Jeśli profil jest całkowicie pusty (wszystkie NULL), to znaczy że pominął ankietę
            profile_empty = not any([
                user_profile_obj.goal,
                user_profile_obj.level,
                user_profile_obj.training_days_per_week,
                user_profile_obj.equipment_preference
            ])
            
            if profile_empty and not preferences:
                logger.warning(f"[Recommendations] User {user_id} has empty profile (skipped survey)")
                return Response({
                    "error": "Profile incomplete. Please complete the survey first.",
                    "code": "empty_profile",
                    "suggestion": "Complete the survey to get personalized recommendations",
                    "action_url": "/enhanced-plan-creator"
                }, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
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
                'training_days_per_week': 'days',
                'weight_kg': 'weight_kg',  # 🆕
                'height_cm': 'height_cm',  # 🆕
                'bmi': 'bmi',  # 🆕
                'injuries': 'injuries',  # 🆕
                'health_conditions': 'health_conditions',  # 🆕
            }
            
            for frontend_key, backend_key in pref_mapping.items():
                if frontend_key in preferences and preferences[frontend_key] is not None:
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
            
            # 🆕 COLD START: Dodaj informację jeśli profil był uzupełniony
            if meta.get('profile_enhanced'):
                completeness_pct = int(meta.get('profile_completeness', 0) * 100)
                source = meta.get('enhancement_source', 'unknown')
                if source == 'statistics':
                    match_reasons.append(f"✨ Rekomendacja oparta na popularnych wyborach (profil {completeness_pct}% kompletny)")
                else:
                    match_reasons.append(f"✨ Rekomendacja oparta na bezpiecznych wartościach (profil {completeness_pct}% kompletny)")
            
            # 🆕 ADAPTIVE WEIGHTS: Dodaj informację o wagach algorytmów (jeśli hybrid)
            if mode == 'hybrid' and meta.get('cb_weight') is not None:
                cb_pct = int(meta.get('cb_weight', 0.75) * 100)
                cf_pct = int(meta.get('cf_weight', 0.25) * 100)
                if cb_pct >= 70:
                    match_reasons.append(f"🎯 Bazuje głównie na Twoich preferencjach ({cb_pct}% treść, {cf_pct}% społeczność)")
                elif cf_pct >= 40:
                    match_reasons.append(f"👥 Bazuje na społeczności i preferencjach ({cb_pct}% treść, {cf_pct}% społeczność)")
                else:
                    match_reasons.append(f"⚖️ Równowaga między treścią a społecznością ({cb_pct}/{cf_pct})")

            # Użyj nazwy z ankiety jeśli dostępna, w przeciwnym razie nazwa z bazy
            plan_name = preferences.get('plan_name') or plan_detail['name']
            original_name = plan_detail['name']  # 🆕 Oryginalna nazwa z bazy
            
            enriched_recommendation = {
                "planId": plan_id,
                "name": plan_name,
                "originalName": original_name,  # 🆕 Oryginalna nazwa z bazy (bez custom name)
                "description": plan_detail['description'],
                "goalType": plan_detail['goal_type'],
                "difficultyLevel": plan_detail['difficulty_level'],
                "trainingDaysPerWeek": plan_detail['training_days_per_week'],
                "equipmentRequired": plan_detail['equipment_required'],
                "intensityLevel": meta.get('intensity'),  # 🆕 Intensity
                "planType": meta.get('plan_type'),  # 🆕 Plan type
                "score": round(float(recommendation['score']), 2),
                "matchReasons": match_reasons,
                "scoreBreakdown": meta.get('score_breakdown'),  # 🆕 Szczegółowy breakdown punktów
                "cbWeight": meta.get('cb_weight'),  # 🆕 Wagi dla modalu
                "cfWeight": meta.get('cf_weight'),
                "cbScore": meta.get('cb_score'),  # 🆕 CB score w %
                "cfScore": meta.get('cf_score'),  # 🆕 CF score w %
                "wasBoosted": meta.get('was_boosted', False),  # 🆕 Czy został boostowany (ochrona przed zbyt niskim CF)
                "healthWarnings": meta.get('health_warnings', []),  # 🆕 Health warnings
            }
            
            logger.info(f"[Recommendations] Enriched recommendation #{len(enriched_recommendations)}: planId={plan_id}, keys={list(enriched_recommendation.keys())}")

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
        logger.info(f"[Recommendations] First recommendation sample: {enriched_recommendations[0] if enriched_recommendations else 'N/A'}")
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
            
            # Jeśli profil jest pusty, użyj preferencji z requesta
            if not profile_data["goal"] and preferences.get("goal"):
                profile_data["goal"] = preferences.get("goal")
                logger.info(f"[Recommendations] Using goal from preferences: {profile_data['goal']}")
            if not profile_data["level"] and preferences.get("level"):
                profile_data["level"] = preferences.get("level")
                logger.info(f"[Recommendations] Using level from preferences: {profile_data['level']}")
            if not profile_data["equipment"] and preferences.get("equipment_preference"):
                profile_data["equipment"] = preferences.get("equipment_preference")
                logger.info(f"[Recommendations] Using equipment from preferences: {profile_data['equipment']}")

        except UserProfile.DoesNotExist:
            logger.warning(f"[Recommendations] No profile found for user: {user_id}")
            profile_data = {
                "goal": preferences.get("goal", "zdrowie"),
                "level": preferences.get("level", "poczatkujacy"),
                "days": preferences.get("training_days_per_week", 3),
                "equipment": preferences.get("equipment_preference", "silownia")
            }
            logger.info(f"[Recommendations] Using profile from preferences: {profile_data}")

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
                    logger.warning(f"[Recommendations] No plans found with filters, getting any active plans")
                    cursor.execute("""
                        SELECT plan_id, name, description, goal_type, difficulty_level, 
                               training_days_per_week, equipment_required
                        FROM training_plans 
                        WHERE is_active = true
                        ORDER BY plan_id
                        LIMIT %s
                    """, [top])
                    plans = cursor.fetchall()
                    logger.info(f"[Recommendations] Found {len(plans)} plans without filters")
                
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_plan(request):
    """
    GET /api/recommendations/active-plan/
    Zwraca aktywny plan użytkownika
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

        logger.info(f"[GetActivePlan] Getting active plan for user_id: {user_id}")

        with connection.cursor() as cursor:
            # Sprawdź czy użytkownik ma aktywny custom plan
            cursor.execute("""
                SELECT 
                    uap.custom_plan_id, uap.plan_id, uap.start_date, uap.rating
                FROM user_active_plans uap
                WHERE uap.auth_account_id = %s AND uap.is_completed = FALSE
            """, [user_id])
            active_row = cursor.fetchone()

            if not active_row:
                return Response({
                    "success": True,
                    "has_active_plan": False,
                    "plan": None
                }, status=status.HTTP_200_OK)

            custom_plan_id = active_row[0]
            plan_id = active_row[1]
            start_date = active_row[2]
            rating = active_row[3]

            # Jeśli custom_plan_id jest ustawiony, pobierz custom plan
            if custom_plan_id:
                cursor.execute("""
                    SELECT 
                        id, name, description, goal_type, difficulty_level,
                        training_days_per_week, equipment_required
                    FROM user_custom_plans
                    WHERE id = %s AND auth_account_id = %s
                """, [custom_plan_id, user_id])
                custom_row = cursor.fetchone()
                
                if custom_row:
                    plan_data = {
                        "planId": custom_row[0],
                        "id": custom_row[0],
                        "customPlanId": custom_row[0],  # 🆕 Oznaczenie że to custom plan
                        "isCustomPlan": True,  # 🆕 Flaga custom planu
                        "name": custom_row[1],
                        "description": custom_row[2],
                        "goalType": custom_row[3],
                        "difficultyLevel": custom_row[4],
                        "trainingDaysPerWeek": custom_row[5],
                        "equipmentRequired": custom_row[6],
                        "startDate": start_date.isoformat() if start_date else None,
                        "rating": rating
                    }
                    
                    logger.info(f"[GetActivePlan] Found active custom plan: {plan_data['name']}")
                    
                    return Response({
                        "success": True,
                        "has_active_plan": True,
                        "plan": plan_data
                    }, status=status.HTTP_200_OK)

            # Jeśli plan_id jest ustawiony, pobierz standardowy plan
            if plan_id:
                cursor.execute("""
                    SELECT 
                        tp.id, tp.name, tp.description, tp.goal_type, 
                        tp.difficulty_level, tp.training_days_per_week, tp.equipment_required,
                        upa.custom_name
                    FROM training_plans tp
                    LEFT JOIN user_plan_aliases upa ON (tp.id = upa.plan_id AND upa.auth_account_id = %s)
                    WHERE tp.id = %s
                """, [user_id, plan_id])
                row = cursor.fetchone()

                if row:
                    custom_name = row[7]  # Alias użytkownika
                    display_name = custom_name if custom_name else row[1]  # Priorytet: alias > oryginalna nazwa

            plan_data = {
                "planId": row[0],
                "id": row[0],
                        "isCustomPlan": False,  # 🆕 Flaga standardowego planu
                        "name": display_name,
                        "originalName": row[1],
                        "customName": custom_name,
                "description": row[2],
                "goalType": row[3],
                "difficultyLevel": row[4],
                "trainingDaysPerWeek": row[5],
                "equipmentRequired": row[6],
                        "startDate": start_date.isoformat() if start_date else None,
                        "rating": rating
            }

            logger.info(f"[GetActivePlan] Found active plan: {plan_data['name']}")

            return Response({
                "success": True,
                "has_active_plan": True,
                "plan": plan_data
                    }, status=status.HTTP_200_OK)

            # Jeśli nie znaleziono ani custom planu ani standardowego
            return Response({
                "success": True,
                "has_active_plan": False,
                "plan": None
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetActivePlan] Exception: {str(e)}")
        return Response({
            "error": "Server error getting active plan",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        is_custom_plan = request.data.get('isCustomPlan', False) or request.data.get('is_custom_plan', False)
        custom_plan_id = request.data.get('customPlanId') or request.data.get('custom_plan_id')
        
        if not plan_id:
            return Response({
                "error": "planId is required",
                "code": "missing_plan_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[ActivatePlan] Plan {plan_id} (custom: {is_custom_plan}, custom_plan_id: {custom_plan_id}) for user_id: {user_id}")

        plan_name = None
        final_plan_id = None
        final_custom_plan_id = None

        with connection.cursor() as cursor:
            # Sprawdź czy to custom plan
            if is_custom_plan or custom_plan_id:
                final_custom_plan_id = custom_plan_id or plan_id
                cursor.execute("""
                    SELECT id, name FROM user_custom_plans 
                    WHERE id = %s AND auth_account_id = %s
                """, [final_custom_plan_id, user_id])
                row = cursor.fetchone()
                if not row:
                    return Response({
                        "error": "Custom plan does not exist or does not belong to user",
                        "code": "plan_not_found"
                    }, status=status.HTTP_404_NOT_FOUND)
                plan_name = row[1]
                final_plan_id = None  # Dla custom planu plan_id = NULL
            else:
                # Standardowy plan
                cursor.execute("SELECT id, name FROM training_plans WHERE id=%s", [plan_id])
                row = cursor.fetchone()
                if not row:
                    return Response({
                        "error": "Plan does not exist",
                        "code": "plan_not_found"
                    }, status=status.HTTP_404_NOT_FOUND)
                plan_name = row[1]
                final_plan_id = plan_id
                final_custom_plan_id = None

            # Check if user_active_plans table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'user_active_plans'
                )
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Sprawdź czy kolumna custom_plan_id istnieje
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'user_active_plans' AND column_name = 'custom_plan_id'
                    )
                """)
                has_custom_plan_id = cursor.fetchone()[0]
                
                if has_custom_plan_id:
                    # UPSERT plan activation z custom_plan_id
                    cursor.execute("""
                        INSERT INTO user_active_plans (auth_account_id, plan_id, custom_plan_id, start_date, is_completed)
                        VALUES (%s, %s, %s, CURRENT_DATE, FALSE)
                        ON CONFLICT (auth_account_id)
                        DO UPDATE SET
                            plan_id = EXCLUDED.plan_id,
                            custom_plan_id = EXCLUDED.custom_plan_id,
                            start_date = EXCLUDED.start_date,
                            is_completed = FALSE
                    """, [user_id, final_plan_id, final_custom_plan_id])
                else:
                    # Fallback - stara wersja bez custom_plan_id
                    if final_plan_id:
                        cursor.execute("""
                            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, is_completed)
                            VALUES (%s, %s, CURRENT_DATE, FALSE)
                            ON CONFLICT (auth_account_id)
                            DO UPDATE SET
                                plan_id = EXCLUDED.plan_id,
                                start_date = EXCLUDED.start_date,
                                is_completed = FALSE
                        """, [user_id, final_plan_id])
                    else:
                        logger.error(f"[ActivatePlan] Cannot activate custom plan without custom_plan_id column")
                        return Response({
                            "error": "Custom plan activation not supported (missing custom_plan_id column)",
                            "code": "unsupported_operation"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                logger.info(f"[ActivatePlan] Plan '{plan_name}' (plan_id: {final_plan_id}, custom_plan_id: {final_custom_plan_id}) activated for user {user_id}")
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
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def plan_detailed(request, plan_id: int):
    """
    GET /api/plans/<plan_id>/detailed
    Zwraca { success, plan: {..., days: [...] } }
    """
    try:
        logger.info("=" * 80)
        logger.info(f"[PlanDetailed] ===== REQUEST START =====")
        logger.info(f"[PlanDetailed] Plan ID: {plan_id}")
        logger.info(f"[PlanDetailed] Request method: {request.method}")
        logger.info(f"[PlanDetailed] Request path: {request.path}")
        logger.info(f"[PlanDetailed] HAS_ENGINE: {HAS_ENGINE}")

        # Pobierz user_id z JWT (potrzebne do custom planów)
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')
        logger.info(f"[PlanDetailed] user_id from token: {user_id}")

        data = None

        # 0) Sprawdź czy to nie jest custom plan użytkownika
        if user_id:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT 
                            id, auth_account_id, name, description,
                            goal_type, difficulty_level, training_days_per_week,
                            equipment_required, is_active, created_at, updated_at
                        FROM user_custom_plans
                        WHERE id = %s AND auth_account_id = %s
                    """, [plan_id, user_id])
                    row = cursor.fetchone()

                    if row:
                        logger.info(f"[PlanDetailed] Found custom plan {plan_id} for user {user_id}")
                        plan_data = {
                            "id": row[0],
                            "plan_id": row[0],
                            "auth_account_id": row[1],
                            "is_custom_plan": True,
                            "isCustomPlan": True,
                            "name": row[2],
                            "description": row[3],
                            "goal_type": row[4],
                            "difficulty_level": row[5],
                            "training_days_per_week": row[6],
                            "equipment_required": row[7],
                            "is_active": row[8],
                            "created_at": row[9].isoformat() if row[9] else None,
                            "updated_at": row[10].isoformat() if row[10] else None,
                        }

                        # Pobierz dni i ćwiczenia custom planu (wzorowane na get_custom_plan)
                        cursor.execute("""
                            SELECT 
                                ucpd.id, ucpd.name, ucpd.day_order,
                                jsonb_agg(
                                    jsonb_build_object(
                                        'id', ucpe.id,
                                        'exercise_id', ucpe.exercise_id,
                                        'exercise_name', e.name,
                                        'muscle_group', e.muscle_group,
                                        'type', e.type,
                                        'target_sets', ucpe.target_sets,
                                        'target_reps', ucpe.target_reps,
                                        'rest_seconds', ucpe.rest_seconds,
                                        'exercise_order', ucpe.exercise_order
                                    ) ORDER BY ucpe.exercise_order
                                ) FILTER (WHERE ucpe.id IS NOT NULL) as exercises
                            FROM user_custom_plan_days ucpd
                            LEFT JOIN user_custom_plan_exercises ucpe ON ucpd.id = ucpe.plan_day_id
                            LEFT JOIN exercises e ON ucpe.exercise_id = e.id
                            WHERE ucpd.custom_plan_id = %s
                            GROUP BY ucpd.id, ucpd.name, ucpd.day_order
                            ORDER BY ucpd.day_order
                        """, [plan_id])

                        days = []
                        for day_row in cursor.fetchall():
                            raw_exercises = day_row[3] or []
                            exercises = []
                            for ex in raw_exercises:
                                # ex jest dict-em z jsonb_agg/jsonb_build_object
                                ex_id = ex.get('exercise_id') or ex.get('id')
                                exercises.append({
                                    "id": ex_id,
                                    "exercise_id": ex.get('exercise_id'),
                                    "name": ex.get('exercise_name') or ex.get('name'),
                                    "exercise_name": ex.get('exercise_name') or ex.get('name'),
                                    "muscle_group": ex.get('muscle_group'),
                                    "type": ex.get('type'),
                                    # mapowanie target_* -> sets/reps dla kompatybilności z frontendem
                                    "sets": ex.get('target_sets'),
                                    "target_sets": ex.get('target_sets'),
                                    "reps": ex.get('target_reps'),
                                    "target_reps": ex.get('target_reps'),
                                    "rest_seconds": ex.get('rest_seconds'),
                                    "exercise_order": ex.get('exercise_order'),
                                    "superset_group": ex.get('superset_group'),
                                })

                            day_id, day_name, day_order = day_row[0], day_row[1], day_row[2]
                            days.append({
                                "dayNumber": day_order,
                                "title": day_name or f"Dzień {day_order}",
                                "name": day_name or f"Dzień {day_order}",
                                "dayOfWeek": None,
                                "id": day_id,
                                "day_order": day_order,
                                "exercises": exercises,
                            })

                        plan_data["days"] = days
                        data = plan_data
                        logger.info(f"[PlanDetailed] Built custom plan data with {len(days)} days")
            except Exception as e:
                logger.warning(f"[PlanDetailed] Error while loading custom plan: {e}")
                logger.warning(traceback.format_exc())

        # 1) Spróbuj przez engine (jeśli dostępny) – tylko jeśli to nie custom plan
        if not data and HAS_ENGINE:
            try:
                logger.info(f"[PlanDetailed] Calling engine.plan_details([{plan_id}])")
                details = plan_details([plan_id]) or {}
                logger.info(f"[PlanDetailed] Engine returned: {details}")
                logger.info(f"[PlanDetailed] Type of details: {type(details)}")
                logger.info(f"[PlanDetailed] Keys in details: {list(details.keys()) if isinstance(details, dict) else 'N/A'}")

                # engine może zwrócić klucze int lub str
                data = details.get(plan_id) or details.get(str(plan_id))
                logger.info(f"[PlanDetailed] Extracted data from engine: {data}")

                if data:
                    logger.info(f"[PlanDetailed] Type of data: {type(data)}")
                    logger.info(f"[PlanDetailed] Keys in data: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                    if 'days' in data:
                        logger.info(f"[PlanDetailed] data['days']: {data['days']}")
                        logger.info(f"[PlanDetailed] Type of data['days']: {type(data['days'])}")
                        logger.info(f"[PlanDetailed] Length of data['days']: {len(data['days']) if isinstance(data['days'], list) else 'N/A'}")
            except Exception as e:
                logger.warning(f"[PlanDetailed] engine.plan_details error: {e}")
                logger.warning(f"[PlanDetailed] Exception traceback: {traceback.format_exc()}")

        # 2) Fallback – podstawowe meta z bazy (bez dni) dla training_plans
        if not data:
            logger.info(f"[PlanDetailed] No data from engine/custom, using training_plans fallback")
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, name, description, goal_type, difficulty_level,
                           training_days_per_week, equipment_required
                    FROM training_plans
                    WHERE id = %s
                """, [plan_id])
                row = cursor.fetchone()
                logger.info(f"[PlanDetailed] Database row: {row}")

                if row:
                    data = {
                        "plan_id": row[0],
                        "name": row[1],
                        "description": row[2],
                        "goal_type": row[3],
                        "difficulty_level": row[4],
                        "training_days_per_week": row[5],
                        "equipment_required": row[6],
                        "days": [],   # brak szczegółowych dni — UI to obsłuży
                    }
                    logger.info(f"[PlanDetailed] Created fallback data: {data}")

        if not data:
            logger.error(f"[PlanDetailed] Plan not found: {plan_id}")
            return Response({"error": "Plan not found", "code": "plan_not_found"},
                            status=status.HTTP_404_NOT_FOUND)

        # Upewnij się, że zawsze jest tablica 'days'
        if 'days' not in data or data['days'] is None:
            logger.info(f"[PlanDetailed] No 'days' in data, setting empty array")
            data['days'] = []

        response_data = {"success": True, "plan": data}
        logger.info(f"[PlanDetailed] Final response data: {response_data}")
        logger.info(f"[PlanDetailed] Type of response_data['plan']: {type(response_data['plan'])}")
        logger.info(f"[PlanDetailed] Type of response_data['plan']['days']: {type(response_data['plan']['days'])}")
        logger.info(f"[PlanDetailed] Length of response_data['plan']['days']: {len(response_data['plan']['days'])}")
        logger.info(f"[PlanDetailed] ===== REQUEST END =====")
        logger.info("=" * 80)

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[PlanDetailed] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching plan details",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_plan_by_path(request, plan_id: int):
    """
    POST /api/plans/<plan_id>/activate
    Alias do istniejącego endpointu aktywacji – przyjmuje plan_id w ścieżce.
    """
    try:
        # Pobierz user_id z JWT
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        # Sprawdź czy to custom plan (z request.data)
        logger.info(f"[ActivatePlanAlias] Request data: {request.data}")
        logger.info(f"[ActivatePlanAlias] Request data type: {type(request.data)}")
        logger.info(f"[ActivatePlanAlias] Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
        
        is_custom_plan = request.data.get('isCustomPlan', False) or request.data.get('is_custom_plan', False)
        custom_plan_id = request.data.get('customPlanId') or request.data.get('custom_plan_id')
        
        # Jeśli customPlanId jest None/empty, upewnij się że is_custom_plan też jest False
        if not custom_plan_id:
            is_custom_plan = False
        
        logger.info(f"[ActivatePlanAlias] Activate plan {plan_id} (custom: {is_custom_plan}, custom_plan_id: {custom_plan_id}) for user_id: {user_id}")

        plan_name = None
        final_plan_id = None
        final_custom_plan_id = None

        with connection.cursor() as cursor:
            # Sprawdź czy to custom plan
            if is_custom_plan or custom_plan_id:
                final_custom_plan_id = custom_plan_id or plan_id
                cursor.execute("""
                    SELECT id, name FROM user_custom_plans 
                    WHERE id = %s AND auth_account_id = %s
                """, [final_custom_plan_id, user_id])
                row = cursor.fetchone()
                if not row:
                    return Response({"error": "Custom plan does not exist or does not belong to user", "code": "plan_not_found"},
                                    status=status.HTTP_404_NOT_FOUND)
                plan_name = row[1]
                final_plan_id = None
            else:
                # Standardowy plan
                cursor.execute("SELECT id, name FROM training_plans WHERE id=%s", [plan_id])
                row = cursor.fetchone()
                if not row:
                    return Response({"error": "Plan does not exist", "code": "plan_not_found"},
                                    status=status.HTTP_404_NOT_FOUND)
                plan_name = row[1]
                final_plan_id = plan_id
                final_custom_plan_id = None

            # Sprawdź istnienie tabeli user_active_plans
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'user_active_plans'
                )
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Sprawdź czy kolumna custom_plan_id istnieje
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'user_active_plans' AND column_name = 'custom_plan_id'
                    )
                """)
                has_custom_plan_id = cursor.fetchone()[0]
                
                if has_custom_plan_id:
                    cursor.execute("""
                        INSERT INTO user_active_plans (auth_account_id, plan_id, custom_plan_id, start_date, is_completed)
                        VALUES (%s, %s, %s, CURRENT_DATE, FALSE)
                        ON CONFLICT (auth_account_id)
                        DO UPDATE SET
                            plan_id = EXCLUDED.plan_id,
                            custom_plan_id = EXCLUDED.custom_plan_id,
                            start_date = EXCLUDED.start_date,
                            is_completed = FALSE
                    """, [user_id, final_plan_id, final_custom_plan_id])
                else:
                    # Fallback - stara wersja
                    if final_plan_id:
                        cursor.execute("""
                            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, is_completed)
                            VALUES (%s, %s, CURRENT_DATE, FALSE)
                            ON CONFLICT (auth_account_id)
                            DO UPDATE SET
                                plan_id = EXCLUDED.plan_id,
                                start_date = EXCLUDED.start_date,
                                is_completed = FALSE
                        """, [user_id, final_plan_id])
                    else:
                        logger.error(f"[ActivatePlanAlias] Cannot activate custom plan without custom_plan_id column")
                        return Response({
                            "error": "Custom plan activation not supported (missing custom_plan_id column)",
                            "code": "unsupported_operation"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                logger.info(f"[ActivatePlanAlias] Plan '{plan_name}' (plan_id: {final_plan_id}, custom_plan_id: {final_custom_plan_id}) activated for user {user_id}")
            else:
                logger.warning("[ActivatePlanAlias] user_active_plans table does not exist")

        return Response({
            "success": True,
            "message": f"Plan '{plan_name}' activated successfully",
            "planId": plan_id,
            "planName": plan_name
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[ActivatePlanAlias] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error during plan activation",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PLAN EDITING ENDPOINTS
# ============================================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_plan(request, plan_id: int):
    """
    PUT/PATCH /api/recommendations/plans/<plan_id>/
    Update plan metadata (name, description, etc.)
    Body: {
        "name": "New Plan Name",
        "description": "New description",
        "goal_type": "masa",
        "difficulty_level": "sredniozaawansowany",
        "training_days_per_week": 4,
        "equipment_required": "silownia"
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[UpdatePlan] User {user_id} updating plan {plan_id}")
        
        data = request.data
        
        with connection.cursor() as cursor:
            # Check if plan exists and user has permission
            cursor.execute("""
                SELECT id, auth_account_id, name 
                FROM training_plans 
                WHERE id = %s
            """, [plan_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Plan not found", "code": "plan_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            plan_owner_id = row[1]
            
            # Check if user owns the plan or is staff
            if plan_owner_id and plan_owner_id != user_id:
                cursor.execute("SELECT is_staff, is_superuser FROM auth_accounts WHERE id=%s", [user_id])
                user_row = cursor.fetchone()
                is_admin = user_row and (user_row[0] or user_row[1])
                
                if not is_admin:
                    return Response({"error": "Permission denied", "code": "permission_denied"},
                                    status=status.HTTP_403_FORBIDDEN)
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            if 'name' in data:
                update_fields.append("name = %s")
                update_values.append(data['name'])
            
            if 'description' in data:
                update_fields.append("description = %s")
                update_values.append(data['description'])
            
            if 'goal_type' in data:
                update_fields.append("goal_type = %s")
                update_values.append(data['goal_type'])
            
            if 'difficulty_level' in data:
                update_fields.append("difficulty_level = %s")
                update_values.append(data['difficulty_level'])
            
            if 'training_days_per_week' in data:
                update_fields.append("training_days_per_week = %s")
                update_values.append(data['training_days_per_week'])
            
            if 'equipment_required' in data:
                update_fields.append("equipment_required = %s")
                update_values.append(data['equipment_required'])
            
            if not update_fields:
                return Response({"error": "No fields to update", "code": "no_fields"},
                                status=status.HTTP_400_BAD_REQUEST)
            
            # Execute update
            update_values.append(plan_id)
            query = f"UPDATE training_plans SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
            
            # Log change to plan_history
            cursor.execute("""
                INSERT INTO plan_history (plan_id, changed_by, changes)
                VALUES (%s, %s, %s)
            """, [plan_id, user_id, str(data)])
            
            logger.info(f"[UpdatePlan] Plan {plan_id} updated successfully")
        
        return Response({
            "success": True,
            "message": "Plan updated successfully",
            "planId": plan_id
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[UpdatePlan] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error updating plan",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_plan_day(request, plan_id: int, day_id: int):
    """
    PUT/PATCH /api/recommendations/plans/<plan_id>/days/<day_id>/
    Update plan day (name, day_of_week, etc.)
    Body: {
        "name": "Upper Body",
        "day_of_week": "Poniedziałek",
        "day_order": 1
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[UpdatePlanDay] User {user_id} updating day {day_id} in plan {plan_id}")
        
        data = request.data
        
        with connection.cursor() as cursor:
            # Check permissions
            cursor.execute("""
                SELECT tp.id, tp.auth_account_id 
                FROM training_plans tp
                JOIN plan_days pd ON tp.id = pd.plan_id
                WHERE tp.id = %s AND pd.id = %s
            """, [plan_id, day_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Plan day not found", "code": "day_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            plan_owner_id = row[1]
            if plan_owner_id and plan_owner_id != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)
            
            # Build update query
            update_fields = []
            update_values = []
            
            if 'name' in data:
                update_fields.append("name = %s")
                update_values.append(data['name'])
            
            if 'day_of_week' in data:
                update_fields.append("day_of_week = %s")
                update_values.append(data['day_of_week'])
            
            if 'day_order' in data:
                update_fields.append("day_order = %s")
                update_values.append(data['day_order'])
            
            if not update_fields:
                return Response({"error": "No fields to update", "code": "no_fields"},
                                status=status.HTTP_400_BAD_REQUEST)
            
            update_values.append(day_id)
            query = f"UPDATE plan_days SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
            
            logger.info(f"[UpdatePlanDay] Day {day_id} updated successfully")
        
        return Response({
            "success": True,
            "message": "Plan day updated successfully",
            "dayId": day_id
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[UpdatePlanDay] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error updating plan day",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_plan_exercise(request, plan_id: int, exercise_id: int):
    """
    PUT/PATCH /api/recommendations/plans/<plan_id>/exercises/<exercise_id>/
    Update exercise in plan (sets, reps, rest, superset_group)
    Body: {
        "target_sets": "3-4",
        "target_reps": "8-12",
        "rest_seconds": 90,
        "superset_group": 1
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[UpdatePlanExercise] User {user_id} updating exercise {exercise_id} in plan {plan_id}")
        
        data = request.data
        
        with connection.cursor() as cursor:
            # Check permissions
            cursor.execute("""
                SELECT tp.id, tp.auth_account_id 
                FROM training_plans tp
                JOIN plan_days pd ON tp.id = pd.plan_id
                JOIN plan_exercises pe ON pd.id = pe.plan_day_id
                WHERE tp.id = %s AND pe.id = %s
            """, [plan_id, exercise_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Exercise not found", "code": "exercise_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            plan_owner_id = row[1]
            if plan_owner_id and plan_owner_id != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)
            
            # Build update query
            update_fields = []
            update_values = []
            
            if 'target_sets' in data:
                update_fields.append("target_sets = %s")
                update_values.append(data['target_sets'])
            
            if 'target_reps' in data:
                update_fields.append("target_reps = %s")
                update_values.append(data['target_reps'])
            
            if 'rest_seconds' in data:
                update_fields.append("rest_seconds = %s")
                update_values.append(data['rest_seconds'])
            
            if 'superset_group' in data:
                update_fields.append("superset_group = %s")
                update_values.append(data['superset_group'])
            
            if not update_fields:
                return Response({"error": "No fields to update", "code": "no_fields"},
                                status=status.HTTP_400_BAD_REQUEST)
            
            update_values.append(exercise_id)
            query = f"UPDATE plan_exercises SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
            
            logger.info(f"[UpdatePlanExercise] Exercise {exercise_id} updated successfully")
        
        return Response({
            "success": True,
            "message": "Exercise updated successfully",
            "exerciseId": exercise_id
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[UpdatePlanExercise] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error updating exercise",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_plan_exercise(request, plan_id: int, exercise_id: int):
    """
    DELETE /api/recommendations/plans/<plan_id>/exercises/<exercise_id>/
    Delete exercise from plan
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[DeletePlanExercise] User {user_id} deleting exercise {exercise_id} from plan {plan_id}")
        
        with connection.cursor() as cursor:
            # Check permissions
            cursor.execute("""
                SELECT tp.id, tp.auth_account_id 
                FROM training_plans tp
                JOIN plan_days pd ON tp.id = pd.plan_id
                JOIN plan_exercises pe ON pd.id = pe.plan_day_id
                WHERE tp.id = %s AND pe.id = %s
            """, [plan_id, exercise_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Exercise not found", "code": "exercise_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            plan_owner_id = row[1]
            if plan_owner_id and plan_owner_id != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)
            
            # Delete exercise
            cursor.execute("DELETE FROM plan_exercises WHERE id = %s", [exercise_id])
            
            logger.info(f"[DeletePlanExercise] Exercise {exercise_id} deleted successfully")
        
        return Response({
            "success": True,
            "message": "Exercise deleted successfully"
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[DeletePlanExercise] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error deleting exercise",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_plan_exercise(request, plan_id: int, day_id: int):
    """
    POST /api/recommendations/plans/<plan_id>/days/<day_id>/exercises/
    Add exercise to plan day
    Body: {
        "exercise_id": 123,
        "target_sets": "3-4",
        "target_reps": "8-12",
        "rest_seconds": 90,
        "superset_group": null
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[AddPlanExercise] User {user_id} adding exercise to day {day_id} in plan {plan_id}")
        
        data = request.data
        exercise_id = data.get('exercise_id')
        
        if not exercise_id:
            return Response({"error": "exercise_id is required", "code": "missing_exercise_id"},
                            status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
            # Check permissions
            cursor.execute("""
                SELECT tp.id, tp.auth_account_id 
                FROM training_plans tp
                JOIN plan_days pd ON tp.id = pd.plan_id
                WHERE tp.id = %s AND pd.id = %s
            """, [plan_id, day_id])
            row = cursor.fetchone()
            
            if not row:
                return Response({"error": "Plan day not found", "code": "day_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            plan_owner_id = row[1]
            if plan_owner_id and plan_owner_id != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)
            
            # Check if exercise exists
            cursor.execute("SELECT id FROM exercises WHERE id = %s", [exercise_id])
            if not cursor.fetchone():
                return Response({"error": "Exercise not found", "code": "exercise_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            # Insert exercise
            cursor.execute("""
                INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [
                day_id,
                exercise_id,
                data.get('target_sets', '3'),
                data.get('target_reps', '10-12'),
                data.get('rest_seconds', 60),
                data.get('superset_group')
            ])
            new_exercise_id = cursor.fetchone()[0]
            
            logger.info(f"[AddPlanExercise] Exercise added successfully with id {new_exercise_id}")
        
        return Response({
            "success": True,
            "message": "Exercise added successfully",
            "exerciseId": new_exercise_id
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"[AddPlanExercise] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error adding exercise",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# EXERCISE CATALOG ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercises(request):
    """
    GET /api/exercises/
    Pobierz katalog wszystkich ćwiczeń z opcjonalnymi filtrami
    Query params:
        - muscle_group: str (optional) - filtruj po partii mięśniowej
        - type: str (optional) - filtruj po typie ćwiczenia
        - search: str (optional) - wyszukaj po nazwie
        - page: int (optional) - numer strony (default: 1)
        - limit: int (optional) - liczba wyników na stronę (default: 50)
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[GetExercises] Fetching exercises for user {user_id}")

        # Get query parameters
        muscle_group = request.query_params.get('muscle_group')
        exercise_type = request.query_params.get('type')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 50))
        offset = (page - 1) * limit

        with connection.cursor() as cursor:
            # Build query dynamically - dodajemy is_favorite i rating dla użytkownika
            query = """
                SELECT 
                    e.id,
                    e.name,
                    e.description,
                    e.muscle_group,
                    e.type,
                    e.video_url,
                    e.image_url,
                    COALESCE(ef.is_favorite, FALSE) as is_favorite,
                    ef.rating
                FROM exercises e
                LEFT JOIN exercise_feedback ef ON ef.exercise_id = e.id AND ef.auth_account_id = %s
                WHERE 1=1
            """
            params = [user_id]

            if muscle_group:
                query += " AND LOWER(e.muscle_group) = LOWER(%s)"
                params.append(muscle_group)

            if exercise_type:
                query += " AND LOWER(e.type) = LOWER(%s)"
                params.append(exercise_type)

            if search:
                query += " AND (LOWER(e.name) LIKE LOWER(%s) OR LOWER(e.description) LIKE LOWER(%s))"
                search_pattern = f"%{search}%"
                params.append(search_pattern)
                params.append(search_pattern)

            # Get total count
            count_query = f"SELECT COUNT(*) FROM ({query}) as filtered"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # Add pagination
            query += " ORDER BY e.name LIMIT %s OFFSET %s"
            params.append(limit)
            params.append(offset)

            cursor.execute(query, params)
            exercises = []
            
            for row in cursor.fetchall():
                exercises.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "muscle_group": row[3],
                    "type": row[4],
                    "video_url": row[5],
                    "image_url": row[6],
                    "is_favorite": row[7] if row[7] is not None else False,
                    "user_rating": row[8] if row[8] is not None else None
                })

            logger.info(f"[GetExercises] Found {len(exercises)} exercises (total: {total_count})")

            return Response({
                "success": True,
                "exercises": exercises,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_count,
                    "total_pages": (total_count + limit - 1) // limit
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetExercises] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching exercises",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def replace_plan_exercise(request, plan_id: int, plan_exercise_id: int):
    """
    POST /api/recommendations/plans/<plan_id>/exercises/<plan_exercise_id>/replace/
    Zamień ćwiczenie w planie na inne
    Body: {
        "new_exercise_id": int (ID nowego ćwiczenia z tabeli exercises),
        "target_sets": str (optional),
        "target_reps": str (optional),
        "rest_seconds": int (optional)
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        new_exercise_id = data.get('new_exercise_id')

        if not new_exercise_id:
            return Response({"error": "new_exercise_id is required", "code": "missing_exercise_id"},
                            status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[ReplaceExercise] User {user_id} replacing exercise {plan_exercise_id} with {new_exercise_id} in plan {plan_id}")

        with connection.cursor() as cursor:
            # Check permissions
            cursor.execute("""
                SELECT tp.id, tp.auth_account_id, pe.plan_day_id, pe.target_sets, pe.target_reps, pe.rest_seconds
                FROM training_plans tp
                JOIN plan_days pd ON tp.id = pd.plan_id
                JOIN plan_exercises pe ON pd.id = pe.plan_day_id
                WHERE tp.id = %s AND pe.id = %s
            """, [plan_id, plan_exercise_id])
            row = cursor.fetchone()

            if not row:
                return Response({"error": "Exercise not found in plan", "code": "exercise_not_found"},
                                status=status.HTTP_404_NOT_FOUND)

            plan_owner_id = row[1]
            plan_day_id = row[2]
            current_sets = row[3]
            current_reps = row[4]
            current_rest = row[5]

            if plan_owner_id and plan_owner_id != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)

            # Check if new exercise exists
            cursor.execute("SELECT id, name FROM exercises WHERE id = %s", [new_exercise_id])
            new_exercise_row = cursor.fetchone()
            if not new_exercise_row:
                return Response({"error": "New exercise not found", "code": "new_exercise_not_found"},
                                status=status.HTTP_404_NOT_FOUND)

            new_exercise_name = new_exercise_row[1]

            # Update the plan_exercise record with new exercise_id
            cursor.execute("""
                UPDATE plan_exercises
                SET exercise_id = %s,
                    target_sets = %s,
                    target_reps = %s,
                    rest_seconds = %s
                WHERE id = %s
            """, [
                new_exercise_id,
                data.get('target_sets', current_sets),
                data.get('target_reps', current_reps),
                data.get('rest_seconds', current_rest),
                plan_exercise_id
            ])

            logger.info(f"[ReplaceExercise] Exercise replaced successfully with {new_exercise_name}")

            return Response({
                "success": True,
                "message": f"Exercise replaced with {new_exercise_name}",
                "new_exercise_id": new_exercise_id,
                "new_exercise_name": new_exercise_name
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[ReplaceExercise] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error replacing exercise",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# WORKOUT ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_workout(request):
    """
    GET /api/workouts/today/
    Pobierz dzisiejszy trening na podstawie aktywnego planu i harmonogramu użytkownika
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[TodayWorkout] Fetching today's workout for user {user_id}")

        with connection.cursor() as cursor:
            # Pobierz aktywny plan użytkownika (sprawdź zarówno plan_id jak i custom_plan_id)
            cursor.execute("""
                SELECT uap.plan_id, uap.custom_plan_id, tp.name, ucp.name as custom_plan_name
                FROM user_active_plans uap
                LEFT JOIN training_plans tp ON uap.plan_id = tp.id
                LEFT JOIN user_custom_plans ucp ON uap.custom_plan_id = ucp.id
                WHERE uap.auth_account_id = %s AND uap.is_completed = FALSE
            """, [user_id])
            
            active_plan = cursor.fetchone()
            if not active_plan:
                return Response({
                    "workout": None,
                    "message": "No active plan"
                }, status=status.HTTP_200_OK)
            
            plan_id, custom_plan_id, plan_name, custom_plan_name = active_plan
            is_custom_plan = custom_plan_id is not None
            actual_plan_id = custom_plan_id if is_custom_plan else plan_id
            actual_plan_name = custom_plan_name if is_custom_plan else plan_name

            # Pobierz harmonogram użytkownika (z bazy danych)
            cursor.execute("""
                SELECT training_schedule, notifications_enabled
                FROM user_active_plans
                WHERE auth_account_id = %s
            """, [user_id])
            
            schedule_row = cursor.fetchone()
            if schedule_row and schedule_row[0]:
                import json
                schedule = json.loads(schedule_row[0]) if isinstance(schedule_row[0], str) else (schedule_row[0] or [])
            else:
                schedule = []
            
            # Określ dzisiejszy dzień tygodnia (po polsku)
            from datetime import datetime
            today_weekday = datetime.now().weekday()
            weekday_names = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
            today_name = weekday_names[today_weekday]

            # Sprawdź czy dziś jest dzień treningowy
            if not schedule or today_name not in schedule:
                return Response({
                    "workout": None,
                    "message": f"Today ({today_name}) is not a training day",
                    "schedule": schedule
                }, status=status.HTTP_200_OK)

            # Znajdź który dzień treningowy to jest (1-based index)
            training_day_index = schedule.index(today_name) + 1

            # Pobierz odpowiedni dzień planu (dla custom plans lub standardowych)
            if is_custom_plan:
                cursor.execute("""
                    SELECT id, name, day_order
                    FROM user_custom_plan_days
                    WHERE custom_plan_id = %s
                    ORDER BY day_order
                    LIMIT 1 OFFSET %s
                """, [custom_plan_id, training_day_index - 1])
            else:
                cursor.execute("""
                    SELECT id, name, day_order
                    FROM plan_days
                    WHERE plan_id = %s
                    ORDER BY day_order
                    LIMIT 1 OFFSET %s
                """, [plan_id, training_day_index - 1])
            
            plan_day = cursor.fetchone()
            if not plan_day:
                # Jeśli nie ma odpowiedniego dnia, weź pierwszy
                if is_custom_plan:
                    cursor.execute("""
                        SELECT id, name, day_order
                        FROM user_custom_plan_days
                        WHERE custom_plan_id = %s
                        ORDER BY day_order
                        LIMIT 1
                    """, [custom_plan_id])
                else:
                    cursor.execute("""
                        SELECT id, name, day_order
                        FROM plan_days
                        WHERE plan_id = %s
                        ORDER BY day_order
                        LIMIT 1
                    """, [plan_id])
                plan_day = cursor.fetchone()

            if not plan_day:
                return Response({
                    "workout": None,
                    "message": "No workout day found in plan"
                }, status=status.HTTP_200_OK)

            day_id, day_name, day_order = plan_day

            # Pobierz ćwiczenia dla tego dnia (dla custom plans lub standardowych)
            if is_custom_plan:
                cursor.execute("""
                    SELECT 
                        e.id,
                        e.name,
                        e.description,
                        e.muscle_group,
                        e.type,
                        e.video_url,
                        e.image_url,
                        ucpe.target_sets,
                        ucpe.target_reps,
                        ucpe.rest_seconds,
                        NULL as superset_group
                    FROM user_custom_plan_exercises ucpe
                    JOIN exercises e ON ucpe.exercise_id = e.id
                    WHERE ucpe.plan_day_id = %s
                    ORDER BY ucpe.exercise_order, ucpe.id
                """, [day_id])
            else:
                cursor.execute("""
                    SELECT 
                        e.id,
                        e.name,
                        e.description,
                        e.muscle_group,
                        e.type,
                        e.video_url,
                        e.image_url,
                        pe.target_sets,
                        pe.target_reps,
                        pe.rest_seconds,
                        pe.superset_group
                    FROM plan_exercises pe
                    JOIN exercises e ON pe.exercise_id = e.id
                    WHERE pe.plan_day_id = %s
                    ORDER BY pe.id
                """, [day_id])
            
            exercises = []
            for row in cursor.fetchall():
                exercises.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "muscle_group": row[3],
                    "type": row[4],
                    "video_url": row[5],
                    "image_url": row[6],
                    "target_sets": row[7],
                    "target_reps": row[8],
                    "rest_seconds": row[9],
                    "superset_group": row[10]
                })

            logger.info(f"[TodayWorkout] Found {len(exercises)} exercises for user {user_id}")

            return Response({
                "workout": {
                    "plan_id": actual_plan_id,
                    "plan_name": actual_plan_name,
                    "day_id": day_id,
                    "name": day_name,
                    "day_order": day_order,
                    "weekday": today_name,
                    "exercises": exercises
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[TodayWorkout] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching today's workout",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_session(request):
    """
    GET /api/workouts/active-session/
    Sprawdź czy użytkownik ma aktywną sesję treningową (niezakończoną)
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Znajdź aktywną sesję (bez duration_minutes = NULL oznacza niezakończoną)
            cursor.execute("""
                SELECT id, plan_id, session_date
                FROM training_sessions
                WHERE auth_account_id = %s 
                  AND duration_minutes IS NULL
                ORDER BY session_date DESC
                LIMIT 1
            """, [user_id])
            
            session = cursor.fetchone()
            
            if session:
                session_id, plan_id, session_date = session
                return Response({
                    "has_active_session": True,
                    "session_id": session_id,
                    "plan_id": plan_id,
                    "session_date": session_date.isoformat() if session_date else None
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "has_active_session": False
                }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetActiveSession] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error checking active session",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_workout_session(request):
    """
    POST /api/workouts/sessions/
    Rozpocznij nową sesję treningową
    Body: {
        "plan_id": int,
        "plan_day_id": int (optional)
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        plan_id = data.get('plan_id')
        plan_day_id = data.get('plan_day_id')

        if not plan_id:
            return Response({"error": "plan_id is required", "code": "missing_plan_id"},
                            status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[StartSession] User {user_id} starting session for plan {plan_id}")

        with connection.cursor() as cursor:
            # Sprawdź czy użytkownik ma już aktywną sesję (niezakończoną)
            cursor.execute("""
                SELECT id
                FROM training_sessions
                WHERE auth_account_id = %s 
                  AND duration_minutes IS NULL
                ORDER BY session_date DESC
                LIMIT 1
            """, [user_id])
            
            existing_session = cursor.fetchone()
            if existing_session:
                session_id = existing_session[0]
                logger.info(f"[StartSession] User {user_id} already has active session {session_id}, returning existing session")
                return Response({
                    "session_id": session_id,
                    "message": "Active session already exists",
                    "existing": True
                }, status=status.HTTP_200_OK)
            
            # Utwórz nową sesję treningową
            cursor.execute("""
                INSERT INTO training_sessions (auth_account_id, plan_id, session_date)
                VALUES (%s, %s, NOW())
                RETURNING id
            """, [user_id, plan_id])
            
            session_id = cursor.fetchone()[0]

            logger.info(f"[StartSession] Created session {session_id} for user {user_id}")

            return Response({
                "session_id": session_id,
                "message": "Session started successfully"
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[StartSession] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error starting session",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finish_workout_session(request, session_id: int):
    """
    POST /api/workouts/sessions/<session_id>/finish/
    Zakończ sesję treningową i zapisz wszystkie serie
    Body: {
        "duration_minutes": int,
        "sets": [
            {
                "exercise_id": int,
                "set_order": int,
                "weight_kg": float,
                "reps": int,
                "notes": str (optional)
            }
        ]
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token", "code": "invalid_token"},
                            status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        duration_minutes = data.get('duration_minutes', 0)
        sets = data.get('sets', [])

        logger.info(f"[FinishSession] User {user_id} finishing session {session_id} with {len(sets)} sets")

        with connection.cursor() as cursor:
            # Sprawdź czy sesja należy do użytkownika
            cursor.execute("""
                SELECT auth_account_id
                FROM training_sessions
                WHERE id = %s
            """, [session_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Session not found", "code": "session_not_found"},
                                status=status.HTTP_404_NOT_FOUND)
            
            if row[0] != user_id:
                return Response({"error": "Permission denied", "code": "permission_denied"},
                                status=status.HTTP_403_FORBIDDEN)

            # Zaktualizuj czas trwania sesji
            cursor.execute("""
                UPDATE training_sessions
                SET duration_minutes = %s
                WHERE id = %s
            """, [duration_minutes, session_id])

            # Zapisz wszystkie serie
            for set_data in sets:
                cursor.execute("""
                    INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, [
                    session_id,
                    set_data.get('exercise_id'),
                    set_data.get('set_order'),
                    set_data.get('weight_kg'),
                    set_data.get('reps'),
                    set_data.get('notes', '')
                ])
            
            # 🆕 Aktualizuj statystyki użytkownika w user_profiles
            # Oblicz liczbę treningów w tym tygodniu
            cursor.execute("""
                SELECT COUNT(DISTINCT DATE(session_date))
                FROM training_sessions
                WHERE auth_account_id = %s
                  AND session_date >= DATE_TRUNC('week', CURRENT_DATE)
                  AND session_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
            """, [user_id])
            weekly_count = cursor.fetchone()[0] or 0
            
            # Oblicz całkowitą liczbę treningów
            cursor.execute("""
                SELECT COUNT(DISTINCT id)
                FROM training_sessions
                WHERE auth_account_id = %s
            """, [user_id])
            total_count = cursor.fetchone()[0] or 0
            
            logger.info(f"[FinishSession] User {user_id} stats: {total_count} total workouts, {weekly_count} this week")

            logger.info(f"[FinishSession] Session {session_id} completed with {len(sets)} sets")

            return Response({
                "success": True,
                "message": "Workout session completed successfully",
                "session_id": session_id,
                "total_sets": len(sets),
                "stats": {
                    "total_workouts": total_count,
                    "weekly_progress": weekly_count
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[FinishSession] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error finishing session",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ALL PLANS - Wszystkie Plany Treningowe
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_plans(request):
    """
    GET /api/recommendations/plans/
    Pobierz wszystkie plany treningowe z bazy danych
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Fetch all training plans
            cursor.execute("""
                SELECT 
                    id,
                    name,
                    description,
                    goal_type,
                    difficulty_level,
                    training_days_per_week,
                    equipment_required,
                    auth_account_id,
                    created_at
                FROM training_plans
                ORDER BY 
                    CASE WHEN auth_account_id IS NULL THEN 0 ELSE 1 END,
                    created_at DESC
            """)
            
            plans = []
            for row in cursor.fetchall():
                plans.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "goal": row[3],
                    "difficulty_level": row[4],
                    "training_days_per_week": row[5],
                    "equipment_required": row[6],
                    "auth_account_id": row[7],
                    "created_at": row[8].isoformat() if row[8] else None
                })
            
            logger.info(f"[GetAllPlans] Found {len(plans)} plans for user {user_id}")
            
            return Response({
                "success": True,
                "plans": plans,
                "total": len(plans)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetAllPlans] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching plans",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PLAN ALIASES - Niestandardowe Nazwy Planów
# ============================================================================

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_plan_alias(request, plan_id: int):
    """
    POST /api/plans/<plan_id>/alias/ - Ustaw niestandardową nazwę (alias)
    DELETE /api/plans/<plan_id>/alias/ - Usuń alias
    Body (POST): { "custom_name": "Moja własna nazwa" }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        if request.method == 'POST':
            # SET ALIAS
            custom_name = request.data.get('custom_name', '').strip()
            if not custom_name:
                return Response({
                    "error": "Custom name is required",
                    "code": "missing_name"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Walidacja długości nazwy
            if len(custom_name) > 200:
                return Response({
                    "error": "Custom name is too long (max 200 characters)",
                    "code": "name_too_long"
                }, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                # Sprawdź czy plan istnieje
                cursor.execute("SELECT id FROM training_plans WHERE id = %s", [plan_id])
                if not cursor.fetchone():
                    return Response({
                        "error": "Plan not found",
                        "code": "plan_not_found"
                    }, status=status.HTTP_404_NOT_FOUND)

                # Wstaw lub zaktualizuj alias (ON CONFLICT DO UPDATE)
                cursor.execute("""
                    INSERT INTO user_plan_aliases (auth_account_id, plan_id, custom_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (auth_account_id, plan_id)
                    DO UPDATE SET 
                        custom_name = EXCLUDED.custom_name,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id, custom_name, created_at, updated_at
                """, [user_id, plan_id, custom_name])
                
                row = cursor.fetchone()
                alias_id, name, created_at, updated_at = row

                logger.info(f"[ManagePlanAlias] User {user_id} set alias for plan {plan_id}: '{custom_name}'")

                return Response({
                    "success": True,
                    "alias": {
                        "id": alias_id,
                        "plan_id": plan_id,
                        "custom_name": name,
                        "created_at": created_at.isoformat(),
                        "updated_at": updated_at.isoformat()
                    },
                    "message": "Alias saved successfully"
                }, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            # DELETE ALIAS
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM user_plan_aliases
                    WHERE auth_account_id = %s AND plan_id = %s
                    RETURNING id
                """, [user_id, plan_id])
                
                deleted_row = cursor.fetchone()
                if not deleted_row:
                    return Response({
                        "error": "Alias not found",
                        "code": "alias_not_found"
                    }, status=status.HTTP_404_NOT_FOUND)

                logger.info(f"[ManagePlanAlias] User {user_id} deleted alias for plan {plan_id}")

                return Response({
                    "success": True,
                    "message": "Alias deleted successfully"
                }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[ManagePlanAlias] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error managing alias",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_plan_aliases(request):
    """
    GET /api/plans/aliases/
    Pobierz wszystkie aliasy użytkownika
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    upa.id,
                    upa.plan_id,
                    upa.custom_name,
                    upa.created_at,
                    upa.updated_at,
                    tp.name AS original_name
                FROM user_plan_aliases upa
                JOIN training_plans tp ON upa.plan_id = tp.id
                WHERE upa.auth_account_id = %s
                ORDER BY upa.updated_at DESC
            """, [user_id])
            
            aliases = []
            for row in cursor.fetchall():
                aliases.append({
                    "id": row[0],
                    "plan_id": row[1],
                    "custom_name": row[2],
                    "created_at": row[3].isoformat(),
                    "updated_at": row[4].isoformat(),
                    "original_name": row[5]
                })

            logger.info(f"[GetUserPlanAliases] Found {len(aliases)} aliases for user {user_id}")

            return Response({
                "success": True,
                "aliases": aliases,
                "total": len(aliases)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetUserPlanAliases] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching aliases",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)