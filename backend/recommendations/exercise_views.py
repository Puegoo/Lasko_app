# backend/recommendations/exercise_views.py
"""
API views dla rekomendacji ćwiczeń i custom planów.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import logging
import json
import traceback

from .exercise_engine import recommend_exercises, suggest_plan_structure
from .engine import fetch_user_profile

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_recommended_exercises(request):
    """
    GET/POST /api/recommendations/exercises/
    
    Zwraca listę rekomendowanych ćwiczeń z score i reason.
    
    Query/Body params:
    - preferences: Dict (opcjonalne - nadpisuje profil użytkownika)
    - limit: int (domyślnie 50)
    - muscle_group: str (opcjonalny filtr)
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
        
        # Pobierz parametry
        data = request.data if request.method == 'POST' else request.query_params
        preferences = data.get('preferences', {})
        limit = int(data.get('limit', 50))
        muscle_group_filter = data.get('muscle_group')
        
        # 🆕 Pobierz informacje o już wybranych ćwiczeniach i partiach mięśniowych
        selected_exercises = data.get('selected_exercises', [])  # Lista już wybranych ćwiczeń
        current_day_muscle_groups = data.get('current_day_muscle_groups', [])  # Partie w aktualnym dniu
        week_muscle_groups = data.get('week_muscle_groups', [])  # Partie w całym tygodniu
        
        logger.info(f"[ExerciseViews] Getting recommended exercises for user {user_id}")
        if selected_exercises:
            logger.info(f"[ExerciseViews] Filtering out {len(selected_exercises)} already selected exercises")
        if current_day_muscle_groups:
            logger.info(f"[ExerciseViews] Current day muscle groups: {current_day_muscle_groups}")
        if week_muscle_groups:
            logger.info(f"[ExerciseViews] Week muscle groups: {week_muscle_groups}")
        
        # Rekomenduj ćwiczenia z uwzględnieniem już wybranych
        exercises = recommend_exercises(
            user_id, 
            preferences,
            selected_exercises=selected_exercises,
            current_day_muscle_groups=current_day_muscle_groups,
            week_muscle_groups=week_muscle_groups
        )
        
        # Filtruj po grupie mięśniowej jeśli podano
        if muscle_group_filter:
            exercises = [
                ex for ex in exercises 
                if muscle_group_filter.lower() in ex.get('muscle_group', '').lower()
            ]
        
        # Limit
        exercises = exercises[:limit]
        
        # Pobierz sugerowaną strukturę planu
        user = fetch_user_profile(user_id)
        if preferences:
            user.update(preferences)
        structure = suggest_plan_structure(user)
        
        return Response({
            "success": True,
            "exercises": exercises,
            "total": len(exercises),
            "suggested_structure": structure,
            "metadata": {
                "user_id": user_id,
                "limit": limit,
                "muscle_group_filter": muscle_group_filter
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[ExerciseViews] Error: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_custom_plans(request):
    """
    GET /api/recommendations/custom-plans/
    Pobiera listę wszystkich custom planów użytkownika.
    
    POST /api/recommendations/custom-plans/
    Tworzy nowy custom plan.
    """
    try:
        if request.method == 'GET':
            # Lista planów użytkownika (istniejący widok DRF)
            return get_user_custom_plans(request)
        else:
            # Tworzenie nowego custom planu (wewnętrzna logika bez dodatkowego dekorowania)
            return _create_custom_plan(request)
    except Exception as e:
        logger.error(f"[ExerciseViews] manage_custom_plans unexpected error: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error managing custom plans",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _create_custom_plan(request):
    """
    Wewnętrzny handler tworzenia custom planu.
    Zakłada, że autoryzacja została już sprawdzona przez widok zewnętrzny.
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
        
        data = request.data
        
        # Walidacja
        if not data.get('name'):
            return Response({
                "error": "Plan name is required",
                "code": "missing_name"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('days') or not isinstance(data['days'], list):
            return Response({
                "error": "At least one day is required",
                "code": "missing_days"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"[ExerciseViews] Creating custom plan for user {user_id}: {data.get('name')}")
        logger.info(f"[ExerciseViews] Plan data: name={data.get('name')}, goal={data.get('goal_type')}, level={data.get('difficulty_level')}, equipment={data.get('equipment_required')}, days_count={len(data.get('days', []))}")
        
        # 🆕 Walidacja wymaganych pól
        if not data.get('name'):
            return Response({
                "error": "Plan name is required",
                "code": "missing_name"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('goal_type'):
            return Response({
                "error": "goal_type is required",
                "code": "missing_goal_type"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('difficulty_level'):
            return Response({
                "error": "difficulty_level is required",
                "code": "missing_difficulty_level"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('equipment_required'):
            # 🆕 Domyślna wartość jeśli nie podano
            equipment_required = 'bodyweight'
            logger.warning(f"[ExerciseViews] equipment_required not provided, using default: {equipment_required}")
        else:
            equipment_required = data.get('equipment_required')
        
        # 🆕 Upewnij się że training_days_per_week jest int
        training_days = data.get('training_days_per_week')
        if training_days:
            try:
                training_days = int(training_days)
            except (ValueError, TypeError):
                logger.warning(f"[ExerciseViews] Invalid training_days_per_week: {training_days}, using days count")
                training_days = len(data.get('days', []))
        else:
            training_days = len(data.get('days', []))
        
        logger.info(f"[ExerciseViews] Final values: equipment={equipment_required}, training_days={training_days}")
        
        with connection.cursor() as cursor:
            # 1. Utwórz custom plan
            try:
                cursor.execute("""
                    INSERT INTO user_custom_plans (
                        auth_account_id, name, description,
                        goal_type, difficulty_level, training_days_per_week,
                        equipment_required, is_active
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
                    RETURNING id
                """, [
                    user_id,
                    data.get('name'),
                    data.get('description', ''),
                    data.get('goal_type'),
                    data.get('difficulty_level'),
                    training_days,  # 🆕 Użyj przekonwertowanej wartości
                    equipment_required
                ])
            except Exception as e:
                logger.error(f"[ExerciseViews] Error creating custom plan: {e}")
                logger.error(f"[ExerciseViews] Data: {data}")
                import traceback
                logger.error(traceback.format_exc())
                return Response({
                    "error": "Failed to create custom plan",
                    "message": str(e),
                    "code": "database_error"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            plan_id = cursor.fetchone()[0]
            logger.info(f"[ExerciseViews] Created custom plan {plan_id}")
            
            # 🆕 Commit po utworzeniu planu (przed dodawaniem dni)
            connection.commit()
            logger.info(f"[ExerciseViews] Committed custom plan {plan_id}")
            
            # 2. Utwórz dni i ćwiczenia
            for day_idx, day_data in enumerate(data['days']):
                if not isinstance(day_data, dict):
                    logger.error(f"[ExerciseViews] Invalid day_data at index {day_idx}: {day_data}")
                    continue
                
                day_name = day_data.get('name', f'Dzień {day_idx + 1}')
                day_order = day_data.get('day_order', day_idx + 1)
                
                # 🆕 Upewnij się że day_order jest int
                try:
                    day_order = int(day_order)
                except (ValueError, TypeError):
                    day_order = day_idx + 1
                
                try:
                    cursor.execute("""
                        INSERT INTO user_custom_plan_days (custom_plan_id, name, day_order)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    """, [plan_id, day_name, day_order])
                    
                    day_id = cursor.fetchone()[0]
                    logger.info(f"[ExerciseViews] Created day {day_id}: {day_name} (order: {day_order})")
                except Exception as e:
                    logger.error(f"[ExerciseViews] Error creating day {day_idx}: {e}")
                    logger.error(f"[ExerciseViews] Day data: {day_data}")
                    import traceback
                    logger.error(traceback.format_exc())
                    raise
                
                # Dodaj ćwiczenia
                exercises = day_data.get('exercises', [])
                if not isinstance(exercises, list):
                    logger.warning(f"[ExerciseViews] Day {day_idx} has no exercises list: {exercises}")
                    exercises = []
                
                for ex_idx, ex_data in enumerate(exercises):
                    if not isinstance(ex_data, dict):
                        logger.error(f"[ExerciseViews] Invalid exercise_data at day {day_idx}, exercise {ex_idx}: {ex_data}")
                        continue
                    
                    exercise_id = ex_data.get('exercise_id')
                    if not exercise_id:
                        logger.error(f"[ExerciseViews] Missing exercise_id at day {day_idx}, exercise {ex_idx}: {ex_data}")
                        continue
                    
                    # 🆕 Upewnij się że exercise_id jest int
                    try:
                        exercise_id = int(exercise_id)
                    except (ValueError, TypeError):
                        logger.error(f"[ExerciseViews] Invalid exercise_id: {exercise_id} at day {day_idx}, exercise {ex_idx}")
                        continue
                    
                    # 🆕 Sprawdź czy exercise_id istnieje w bazie
                    cursor.execute("SELECT id FROM exercises WHERE id = %s", [exercise_id])
                    if not cursor.fetchone():
                        logger.error(f"[ExerciseViews] Exercise {exercise_id} does not exist in database (day {day_idx}, exercise {ex_idx})")
                        continue
                    
                    # 🆕 Upewnij się że rest_seconds jest int
                    rest_seconds = ex_data.get('rest_seconds', 60)
                    try:
                        rest_seconds = int(rest_seconds)
                    except (ValueError, TypeError):
                        rest_seconds = 60
                    
                    # 🆕 Upewnij się że exercise_order jest int
                    exercise_order = ex_data.get('exercise_order', ex_idx + 1)
                    try:
                        exercise_order = int(exercise_order)
                    except (ValueError, TypeError):
                        exercise_order = ex_idx + 1
                    
                    try:
                        cursor.execute("""
                            INSERT INTO user_custom_plan_exercises (
                                plan_day_id, exercise_id, target_sets,
                                target_reps, rest_seconds, exercise_order
                            )
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, [
                            day_id,
                            exercise_id,
                            str(ex_data.get('target_sets', '4')),  # 🆕 Upewnij się że to string
                            str(ex_data.get('target_reps', '8-12')),  # 🆕 Upewnij się że to string
                            rest_seconds,
                            exercise_order
                        ])
                        logger.debug(f"[ExerciseViews] Added exercise {exercise_id} to day {day_id}")
                    except Exception as e:
                        logger.error(f"[ExerciseViews] Error creating exercise {ex_idx} in day {day_idx}: {e}")
                        logger.error(f"[ExerciseViews] Exercise data: {ex_data}")
                        logger.error(f"[ExerciseViews] Day ID: {day_id}, Exercise ID: {exercise_id}")
                        import traceback
                        logger.error(traceback.format_exc())
                        raise
                
                # 🆕 Commit po dodaniu wszystkich ćwiczeń w dniu
                connection.commit()
                logger.info(f"[ExerciseViews] Committed day {day_id} with {len(exercises)} exercises")
            
            # 🆕 Commit po utworzeniu wszystkich dni
            connection.commit()
            logger.info(f"[ExerciseViews] Committed all days for plan {plan_id}")
            
            # 3. Ustaw jako aktywny plan (deaktywuj poprzedni)
            try:
                cursor.execute("""
                    UPDATE user_active_plans
                    SET is_completed = TRUE, end_date = CURRENT_DATE
                    WHERE auth_account_id = %s AND is_completed = FALSE
                """, [user_id])
                
                # 🆕 Sprawdź czy użytkownik już ma aktywny plan
                cursor.execute("""
                    SELECT id FROM user_active_plans 
                    WHERE auth_account_id = %s AND is_completed = FALSE
                """, [user_id])
                existing_plan = cursor.fetchone()
                
                if existing_plan:
                    # Aktualizuj istniejący plan
                    # 🆕 plan_id jest NOT NULL, więc nie możemy ustawić go na NULL
                    # Zostaw istniejący plan_id (placeholder) i ustaw tylko custom_plan_id
                    cursor.execute("""
                        UPDATE user_active_plans
                        SET custom_plan_id = %s,
                            start_date = CURRENT_DATE,
                            is_completed = FALSE,
                            end_date = NULL
                        WHERE auth_account_id = %s AND is_completed = FALSE
                    """, [plan_id, user_id])
                else:
                    # Utwórz nowy aktywny plan
                    # 🆕 plan_id jest NOT NULL, więc musimy użyć placeholder
                    # Użyj najmniejszego istniejącego plan_id jako placeholder
                    cursor.execute("""
                        SELECT id FROM training_plans ORDER BY id LIMIT 1
                    """)
                    result = cursor.fetchone()
                    
                    if not result or not result[0]:
                        # Jeśli nie ma żadnych planów, to jest problem - nie możemy utworzyć custom planu
                        logger.error(f"[ExerciseViews] No training plans exist in database - cannot create custom plan")
                        return Response({
                            "error": "Database configuration error",
                            "message": "No training plans exist. Custom plans require at least one training plan as placeholder.",
                            "code": "no_training_plans"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    placeholder_plan_id = result[0]
                    logger.info(f"[ExerciseViews] Using placeholder plan_id={placeholder_plan_id} for custom_plan_id={plan_id}")
                    
                    # Wstaw z placeholder plan_id (custom_plan_id będzie używany do identyfikacji)
                    # Użyj ON CONFLICT aby zaktualizować istniejący wpis jeśli użytkownik już ma aktywny plan
                    cursor.execute("""
                        INSERT INTO user_active_plans (
                            auth_account_id, custom_plan_id, plan_id, start_date, is_completed
                        )
                        VALUES (%s, %s, %s, CURRENT_DATE, FALSE)
                        ON CONFLICT (auth_account_id)
                        DO UPDATE SET
                            custom_plan_id = EXCLUDED.custom_plan_id,
                            plan_id = EXCLUDED.plan_id,
                            start_date = EXCLUDED.start_date,
                            is_completed = FALSE
                    """, [user_id, plan_id, placeholder_plan_id])
                
                # 4. Ustaw custom plan jako aktywny
                cursor.execute("""
                    UPDATE user_custom_plans
                    SET is_active = TRUE
                    WHERE id = %s
                """, [plan_id])
                
                # Deaktywuj inne custom plany użytkownika
                cursor.execute("""
                    UPDATE user_custom_plans
                    SET is_active = FALSE
                    WHERE auth_account_id = %s AND id != %s
                """, [user_id, plan_id])
                
                # 🆕 Explicit commit transakcji
                connection.commit()
                logger.info(f"[ExerciseViews] Transaction committed successfully")
            except Exception as e:
                logger.error(f"[ExerciseViews] Error activating plan: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Rollback transakcji
                try:
                    connection.rollback()
                    logger.info(f"[ExerciseViews] Transaction rolled back")
                except:
                    pass
                # Usuń utworzony plan jeśli nie udało się aktywować
                try:
                    cursor.execute("DELETE FROM user_custom_plans WHERE id = %s", [plan_id])
                    connection.commit()
                except:
                    pass
                raise
        
        logger.info(f"[ExerciseViews] Custom plan {plan_id} created and activated")
        
        return Response({
            "success": True,
            "message": "Custom plan created and activated",
            "plan_id": plan_id,
            "custom_plan_id": plan_id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"[ExerciseViews] Error creating custom plan: {e}")
        logger.error(f"[ExerciseViews] Error type: {type(e).__name__}")
        logger.error(traceback.format_exc())
        
        # 🆕 Zwróć bardziej szczegółowy błąd
        error_message = str(e)
        if "null value" in error_message.lower() or "not null" in error_message.lower():
            error_message = f"Database constraint error: {error_message}. Plan may require all fields to be filled."
        elif "foreign key" in error_message.lower():
            error_message = f"Foreign key error: {error_message}. Check if exercise IDs exist in database."
        elif "unique constraint" in error_message.lower() or "duplicate" in error_message.lower():
            error_message = f"Duplicate entry: {error_message}"
        
        return Response({
            "error": "Server error",
            "message": error_message,
            "code": "server_error",
            "details": {
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc() if logger.level <= logging.DEBUG else None
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_custom_plan(request, plan_id: int):
    """
    GET /api/recommendations/custom-plans/<plan_id>/
    
    Pobiera szczegóły custom planu.
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
        
        with connection.cursor() as cursor:
            # Sprawdź czy plan należy do użytkownika
            cursor.execute("""
                SELECT id, auth_account_id, name, description,
                       goal_type, difficulty_level, training_days_per_week,
                       equipment_required, is_active, created_at, updated_at
                FROM user_custom_plans
                WHERE id = %s AND auth_account_id = %s
            """, [plan_id, user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "Plan not found",
                    "code": "plan_not_found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            plan_data = {
                "id": row[0],
                "plan_id": row[0],  # Alias dla kompatybilności
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
            
            # Pobierz dni i ćwiczenia
            logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: Checking for days in database...")
            
            # Najpierw sprawdź czy są jakieś dni dla tego planu
            cursor.execute("""
                SELECT COUNT(*) FROM user_custom_plan_days WHERE custom_plan_id = %s
            """, [plan_id])
            days_count = cursor.fetchone()[0]
            logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: Found {days_count} days in user_custom_plan_days table")
            
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
            
            raw_days = cursor.fetchall()
            logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: SQL query returned {len(raw_days)} rows")
            
            days = []
            for idx, day_row in enumerate(raw_days):
                logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: Processing day {idx}: id={day_row[0]}, name={day_row[1]}, day_order={day_row[2]}, exercises_raw={day_row[3]}")
                exercises_raw = day_row[3]
                
                # Upewnij się że exercises jest zawsze listą
                if exercises_raw is None:
                    exercises = []
                elif isinstance(exercises_raw, list):
                    exercises = exercises_raw
                elif isinstance(exercises_raw, dict):
                    # Jeśli to dict, przekonwertuj na listę
                    exercises = [exercises_raw]
                else:
                    # Spróbuj sparsować jako JSON
                    try:
                        import json
                        if isinstance(exercises_raw, str):
                            parsed = json.loads(exercises_raw)
                            exercises = parsed if isinstance(parsed, list) else [parsed] if parsed else []
                        else:
                            exercises = []
                    except:
                        exercises = []
                
                logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: Day {idx} has {len(exercises)} exercises (type: {type(exercises)})")
                days.append({
                    "id": day_row[0],
                    "name": day_row[1],
                    "day_order": day_row[2],
                    "exercises": exercises
                })

            logger.info(f"[ExerciseViews] get_custom_plan {plan_id}: Final days={len(days)}, exercises_per_day={[len(d['exercises']) if isinstance(d['exercises'], list) else 'not-list' for d in days]}")
            plan_data["days"] = days
        
        return Response({
            "success": True,
            "plan": plan_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[ExerciseViews] Error getting custom plan: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_custom_plan(request, plan_id: int):
    """
    PUT/PATCH /api/recommendations/custom-plans/<plan_id>/
    
    Aktualizuje custom plan (nazwa, opis, ćwiczenia).
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
        
        data = request.data
        
        with connection.cursor() as cursor:
            # Sprawdź czy plan należy do użytkownika
            cursor.execute("""
                SELECT id FROM user_custom_plans
                WHERE id = %s AND auth_account_id = %s
            """, [plan_id, user_id])
            
            if not cursor.fetchone():
                return Response({
                    "error": "Plan not found",
                    "code": "plan_not_found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Aktualizuj podstawowe dane
            if 'name' in data or 'description' in data:
                updates = []
                params = []
                
                if 'name' in data:
                    updates.append("name = %s")
                    params.append(data['name'])
                if 'description' in data:
                    updates.append("description = %s")
                    params.append(data['description'])
                
                params.append(plan_id)
                cursor.execute(f"""
                    UPDATE user_custom_plans
                    SET {', '.join(updates)}
                    WHERE id = %s
                """, params)
            
            # Aktualizuj dni i ćwiczenia jeśli podano
            if 'days' in data:
                logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Updating {len(data['days'])} days")
                
                # Usuń stare dni (cascade usunie ćwiczenia)
                cursor.execute("""
                    DELETE FROM user_custom_plan_days
                    WHERE custom_plan_id = %s
                """, [plan_id])
                deleted_count = cursor.rowcount
                logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Deleted {deleted_count} old days")
                
                # Dodaj nowe dni
                for day_idx, day_data in enumerate(data['days']):
                    if not isinstance(day_data, dict):
                        logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Invalid day_data at index {day_idx}: {day_data}")
                        continue
                    
                    day_name = day_data.get('name', f'Dzień {day_idx + 1}')
                    day_order = day_data.get('day_order', day_idx + 1)
                    
                    try:
                        day_order = int(day_order)
                    except (ValueError, TypeError):
                        day_order = day_idx + 1
                    
                    try:
                        cursor.execute("""
                            INSERT INTO user_custom_plan_days (custom_plan_id, name, day_order)
                            VALUES (%s, %s, %s)
                            RETURNING id
                        """, [plan_id, day_name, day_order])
                        
                        day_id = cursor.fetchone()[0]
                        logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Created day {day_id}: {day_name} (order: {day_order})")
                    except Exception as e:
                        logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Error creating day {day_idx}: {e}")
                        logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Day data: {day_data}")
                        import traceback
                        logger.error(traceback.format_exc())
                        raise
                    
                    # Dodaj ćwiczenia
                    exercises = day_data.get('exercises', [])
                    if not isinstance(exercises, list):
                        logger.warning(f"[ExerciseViews] update_custom_plan {plan_id}: Day {day_idx} has no exercises list: {exercises}")
                        exercises = []
                    
                    logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Adding {len(exercises)} exercises to day {day_id}")
                    
                    for ex_idx, ex_data in enumerate(exercises):
                        if not isinstance(ex_data, dict):
                            logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Invalid exercise_data at day {day_idx}, exercise {ex_idx}: {ex_data}")
                            continue
                        
                        exercise_id = ex_data.get('exercise_id')
                        if not exercise_id:
                            logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Missing exercise_id at day {day_idx}, exercise {ex_idx}: {ex_data}")
                            continue
                        
                        try:
                            exercise_id = int(exercise_id)
                        except (ValueError, TypeError):
                            logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Invalid exercise_id: {exercise_id} at day {day_idx}, exercise {ex_idx}")
                            continue
                        
                        rest_seconds = ex_data.get('rest_seconds', 60)
                        try:
                            rest_seconds = int(rest_seconds)
                        except (ValueError, TypeError):
                            rest_seconds = 60
                        
                        exercise_order = ex_data.get('exercise_order', ex_idx + 1)
                        try:
                            exercise_order = int(exercise_order)
                        except (ValueError, TypeError):
                            exercise_order = ex_idx + 1
                        
                        try:
                            cursor.execute("""
                                INSERT INTO user_custom_plan_exercises (
                                    plan_day_id, exercise_id, target_sets,
                                    target_reps, rest_seconds, exercise_order
                                )
                                VALUES (%s, %s, %s, %s, %s, %s)
                            """, [
                                day_id,
                                exercise_id,
                                str(ex_data.get('target_sets', '4')),
                                str(ex_data.get('target_reps', '8-12')),
                                rest_seconds,
                                exercise_order
                            ])
                            logger.debug(f"[ExerciseViews] update_custom_plan {plan_id}: Added exercise {exercise_id} to day {day_id}")
                        except Exception as e:
                            logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Error creating exercise {ex_idx} in day {day_idx}: {e}")
                            logger.error(f"[ExerciseViews] update_custom_plan {plan_id}: Exercise data: {ex_data}")
                            import traceback
                            logger.error(traceback.format_exc())
                            raise
                    
                    # Commit po każdym dniu
                    connection.commit()
                    logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Committed day {day_id} with {len(exercises)} exercises")
            
            # Commit po aktualizacji podstawowych danych
            if 'name' in data or 'description' in data:
                connection.commit()
                logger.info(f"[ExerciseViews] update_custom_plan {plan_id}: Committed name/description update")
        
        logger.info(f"[ExerciseViews] Custom plan {plan_id} updated successfully")
        
        return Response({
            "success": True,
            "message": "Custom plan updated",
            "plan_id": plan_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[ExerciseViews] Error updating custom plan: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_custom_plans(request):
    """
    GET /api/recommendations/custom-plans/
    
    Pobiera listę wszystkich custom planów użytkownika.
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
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, name, description, goal_type, difficulty_level,
                    training_days_per_week, equipment_required, is_active,
                    created_at, updated_at
                FROM user_custom_plans
                WHERE auth_account_id = %s
                ORDER BY created_at DESC
            """, [user_id])
            
            plans = []
            for row in cursor.fetchall():
                plans.append({
                    "id": row[0],
                    "plan_id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "goal_type": row[3],
                    "difficulty_level": row[4],
                    "training_days_per_week": row[5],
                    "equipment_required": row[6],
                    "is_active": row[7],
                    "created_at": row[8].isoformat() if row[8] else None,
                    "updated_at": row[9].isoformat() if row[9] else None,
                })
        
        return Response({
            "success": True,
            "plans": plans,
            "total": len(plans)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[ExerciseViews] Error getting custom plans: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e),
            "code": "server_error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

