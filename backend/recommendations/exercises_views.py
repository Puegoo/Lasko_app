# backend/recommendations/exercises_views.py
"""
Rozszerzone endpointy dla katalogu ćwiczeń
- Szczegółowy widok ćwiczenia (z alternatywami, wariantami, sprzętem, tagami)
- System ocen i ulubionych
- Statystyki osobiste dla ćwiczenia
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import logging
import traceback
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


# ============================================================================
# SZCZEGÓŁOWY WIDOK ĆWICZENIA
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_detail(request, exercise_id):
    """
    GET /api/exercises/<exercise_id>/detail/
    Pobierz szczegółowe informacje o ćwiczeniu:
    - podstawowe dane ćwiczenia
    - warianty wykonania
    - alternatywne ćwiczenia
    - wymagany sprzęt
    - tagi
    - średnia ocena
    - liczba wykonań przez użytkownika
    - status ulubionego
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[GetExerciseDetail] Fetching details for exercise {exercise_id}, user {user_id}")

        with connection.cursor() as cursor:
            # Główne dane ćwiczenia
            cursor.execute("""
                SELECT 
                    e.id,
                    e.name,
                    e.description,
                    e.muscle_group,
                    e.type,
                    e.video_url,
                    e.image_url
                FROM exercises e
                WHERE e.id = %s
            """, [exercise_id])
            
            exercise_row = cursor.fetchone()
            if not exercise_row:
                return Response({"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND)

            exercise = {
                "id": exercise_row[0],
                "name": exercise_row[1],
                "description": exercise_row[2],
                "muscle_group": exercise_row[3],
                "type": exercise_row[4],
                "video_url": exercise_row[5],
                "image_url": exercise_row[6],
            }

            # Warianty wykonania
            cursor.execute("""
                SELECT id, name, notes
                FROM exercise_variants
                WHERE exercise_id = %s
                ORDER BY name
            """, [exercise_id])
            
            variants = []
            for row in cursor.fetchall():
                variants.append({
                    "id": row[0],
                    "name": row[1],
                    "notes": row[2]
                })
            
            exercise["variants"] = variants

            # Alternatywne ćwiczenia
            cursor.execute("""
                SELECT 
                    e.id,
                    e.name,
                    e.muscle_group,
                    e.type,
                    ea.replacement_reason,
                    ea.similarity_score
                FROM exercise_alternatives ea
                JOIN exercises e ON e.id = ea.alternative_exercise_id
                WHERE ea.exercise_id = %s
                ORDER BY ea.similarity_score DESC
            """, [exercise_id])
            
            alternatives = []
            for row in cursor.fetchall():
                alternatives.append({
                    "id": row[0],
                    "name": row[1],
                    "muscle_group": row[2],
                    "type": row[3],
                    "reason": row[4] if row[4] else f"Podobieństwo: {int(float(row[5]) * 100)}%",
                    "similarity_score": float(row[5]) if row[5] else 0.8
                })
            
            exercise["alternatives"] = alternatives

            # Wymagany sprzęt
            cursor.execute("""
                SELECT eq.id, eq.name
                FROM exercise_equipment ee
                JOIN equipment eq ON eq.id = ee.equipment_id
                WHERE ee.exercise_id = %s
                ORDER BY eq.name
            """, [exercise_id])
            
            equipment = []
            for row in cursor.fetchall():
                equipment.append({
                    "id": row[0],
                    "name": row[1]
                })
            
            exercise["equipment"] = equipment

            # Tagi
            cursor.execute("""
                SELECT t.id, t.name
                FROM exercise_tags et
                JOIN tags t ON t.id = et.tag_id
                WHERE et.exercise_id = %s
                ORDER BY t.name
            """, [exercise_id])
            
            tags = []
            for row in cursor.fetchall():
                tags.append({
                    "id": row[0],
                    "name": row[1]
                })
            
            exercise["tags"] = tags

            # Średnia ocena i liczba ocen
            cursor.execute("""
                SELECT 
                    AVG(rating)::numeric(3,2) as avg_rating,
                    COUNT(*) as rating_count
                FROM exercise_feedback
                WHERE exercise_id = %s AND rating IS NOT NULL
            """, [exercise_id])
            
            rating_row = cursor.fetchone()
            exercise["average_rating"] = float(rating_row[0]) if rating_row[0] else None
            exercise["rating_count"] = rating_row[1]

            # Ocena użytkownika
            cursor.execute("""
                SELECT rating, is_favorite, subjective_notes
                FROM exercise_feedback
                WHERE exercise_id = %s AND auth_account_id = %s
            """, [exercise_id, user_id])
            
            user_feedback = cursor.fetchone()
            exercise["user_rating"] = user_feedback[0] if user_feedback and user_feedback[0] else None
            exercise["is_favorite"] = user_feedback[1] if user_feedback else False
            exercise["user_notes"] = user_feedback[2] if user_feedback and user_feedback[2] else None

            # Statystyki użytkownika - liczba wykonań
            cursor.execute("""
                SELECT COUNT(DISTINCT ts.id) as session_count
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id
                WHERE ls.exercise_id = %s AND ts.auth_account_id = %s
            """, [exercise_id, user_id])
            
            stats_row = cursor.fetchone()
            exercise["user_session_count"] = stats_row[0] if stats_row else 0

            # Osobisty rekord (najcięższa waga)
            cursor.execute("""
                SELECT 
                    pr.weight_kg,
                    pr.reps,
                    pr.record_date
                FROM personal_records pr
                WHERE pr.exercise_id = %s AND pr.auth_account_id = %s
                ORDER BY pr.weight_kg DESC, pr.reps DESC
                LIMIT 1
            """, [exercise_id, user_id])
            
            pr_row = cursor.fetchone()
            if pr_row:
                exercise["personal_record"] = {
                    "value": float(pr_row[0]),
                    "reps": pr_row[1],
                    "date": pr_row[2].isoformat() if pr_row[2] else None
                }
            else:
                exercise["personal_record"] = None

            logger.info(f"[GetExerciseDetail] Successfully fetched details for exercise {exercise_id}")

        return Response({
            "success": True,
            "exercise": exercise
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[GetExerciseDetail] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# SYSTEM OCEN I ULUBIONYCH
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_exercise(request, exercise_id):
    """
    POST /api/exercises/<exercise_id>/rate/
    Oceń ćwiczenie (1-5 gwiazdek)
    Body: {
        "rating": 4  # 1-5
    }
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        rating = request.data.get('rating')
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return Response({"error": "Invalid rating. Must be between 1-5"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[RateExercise] User {user_id} rating exercise {exercise_id}: {rating}")

        with connection.cursor() as cursor:
            # Sprawdź czy ćwiczenie istnieje
            cursor.execute("SELECT id FROM exercises WHERE id = %s", [exercise_id])
            if not cursor.fetchone():
                return Response({"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND)

            # Upsert oceny
            cursor.execute("""
                INSERT INTO exercise_feedback (exercise_id, auth_account_id, rating, feedback_date)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (exercise_id, auth_account_id) 
                DO UPDATE SET 
                    rating = EXCLUDED.rating,
                    feedback_date = CURRENT_TIMESTAMP
            """, [exercise_id, user_id, rating])

            # Pobierz nową średnią
            cursor.execute("""
                SELECT AVG(rating)::numeric(3,2), COUNT(*)
                FROM exercise_feedback
                WHERE exercise_id = %s AND rating IS NOT NULL
            """, [exercise_id])
            
            avg_row = cursor.fetchone()
            new_average = float(avg_row[0]) if avg_row[0] else None
            rating_count = avg_row[1]

        return Response({
            "success": True,
            "message": "Rating saved",
            "new_average": new_average,
            "rating_count": rating_count
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[RateExercise] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, exercise_id):
    """
    POST /api/exercises/<exercise_id>/favorite/
    Oznacz/odznacz ćwiczenie jako ulubione
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[ToggleFavorite] User {user_id} toggling favorite for exercise {exercise_id}")

        with connection.cursor() as cursor:
            # Sprawdź czy ćwiczenie istnieje
            cursor.execute("SELECT id FROM exercises WHERE id = %s", [exercise_id])
            if not cursor.fetchone():
                return Response({"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND)

            # Sprawdź obecny status
            cursor.execute("""
                SELECT is_favorite
                FROM exercise_feedback
                WHERE exercise_id = %s AND auth_account_id = %s
            """, [exercise_id, user_id])
            
            current_row = cursor.fetchone()
            new_favorite_status = not (current_row[0] if current_row and current_row[0] is not None else False)

            # Upsert
            cursor.execute("""
                INSERT INTO exercise_feedback (exercise_id, auth_account_id, is_favorite, feedback_date)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (exercise_id, auth_account_id) 
                DO UPDATE SET 
                    is_favorite = EXCLUDED.is_favorite,
                    feedback_date = CURRENT_TIMESTAMP
            """, [exercise_id, user_id, new_favorite_status])

        return Response({
            "success": True,
            "is_favorite": new_favorite_status,
            "message": "Dodano do ulubionych" if new_favorite_status else "Usunięto z ulubionych"
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[ToggleFavorite] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorite_exercises(request):
    """
    GET /api/exercises/favorites/
    Pobierz listę ulubionych ćwiczeń użytkownika
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[GetFavoriteExercises] Fetching favorites for user {user_id}")

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.id,
                    e.name,
                    e.description,
                    e.muscle_group,
                    e.type,
                    e.video_url,
                    e.image_url,
                    ef.rating
                FROM exercise_feedback ef
                JOIN exercises e ON e.id = ef.exercise_id
                WHERE ef.auth_account_id = %s AND ef.is_favorite = TRUE
                ORDER BY e.name
            """, [user_id])
            
            favorites = []
            for row in cursor.fetchall():
                favorites.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "muscle_group": row[3],
                    "type": row[4],
                    "video_url": row[5],
                    "image_url": row[6],
                    "user_rating": row[7],
                    "is_favorite": True  # ZAWSZE TRUE bo to endpoint dla ulubionych
                })

        return Response({
            "success": True,
            "favorites": favorites,
            "count": len(favorites)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[GetFavoriteExercises] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# STATYSTYKI OSOBISTE
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_statistics(request, exercise_id):
    """
    GET /api/exercises/<exercise_id>/statistics/
    Pobierz szczegółowe statystyki użytkownika dla ćwiczenia:
    - Historia wykonań (daty, obciążenie, serie, powtórzenia)
    - Osobisty rekord
    - Postęp w czasie
    - Trend
    """
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')

        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"[GetExerciseStatistics] Fetching statistics for exercise {exercise_id}, user {user_id}")

        with connection.cursor() as cursor:
            # Sprawdź czy ćwiczenie istnieje
            cursor.execute("SELECT name FROM exercises WHERE id = %s", [exercise_id])
            exercise_row = cursor.fetchone()
            if not exercise_row:
                return Response({"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND)

            exercise_name = exercise_row[0]

            # Historia wykonań (ostatnie 50)
            cursor.execute("""
                SELECT 
                    ts.session_date,
                    ls.set_order,
                    ls.reps,
                    ls.weight_kg,
                    ls.notes
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id AND ls.exercise_id = %s
                WHERE ts.auth_account_id = %s
                ORDER BY ts.session_date DESC, ls.set_order
                LIMIT 50
            """, [exercise_id, user_id])
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    "date": row[0].isoformat() if row[0] else None,
                    "set_number": row[1],
                    "reps": row[2],
                    "weight": float(row[3]) if row[3] else None,
                    "notes": row[4]
                })

            # Osobisty rekord (najcięższa waga dla danego ćwiczenia)
            cursor.execute("""
                SELECT 
                    weight_kg,
                    reps,
                    record_date
                FROM personal_records
                WHERE exercise_id = %s AND auth_account_id = %s
                ORDER BY weight_kg DESC, reps DESC
                LIMIT 1
            """, [exercise_id, user_id])
            
            pr_row = cursor.fetchone()
            personal_record = None
            if pr_row:
                personal_record = {
                    "value": float(pr_row[0]),
                    "reps": pr_row[1],
                    "date": pr_row[2].isoformat() if pr_row[2] else None
                }

            # Postęp - oblicz średnią wagę z ostatnich 30 dni vs poprzednie 30 dni
            cursor.execute("""
                SELECT 
                    AVG(ls.weight_kg) as avg_weight_recent
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id
                WHERE ls.exercise_id = %s 
                    AND ts.auth_account_id = %s
                    AND ts.session_date >= CURRENT_DATE - INTERVAL '30 days'
                    AND ls.weight_kg IS NOT NULL
            """, [exercise_id, user_id])
            
            recent_avg = cursor.fetchone()[0]

            cursor.execute("""
                SELECT 
                    AVG(ls.weight_kg) as avg_weight_previous
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id
                WHERE ls.exercise_id = %s 
                    AND ts.auth_account_id = %s
                    AND ts.session_date BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'
                    AND ls.weight_kg IS NOT NULL
            """, [exercise_id, user_id])
            
            previous_avg = cursor.fetchone()[0]

            progress_percentage = None
            trend = "stable"
            if recent_avg and previous_avg:
                progress_percentage = ((recent_avg - previous_avg) / previous_avg) * 100
                if progress_percentage > 5:
                    trend = "increasing"
                elif progress_percentage < -5:
                    trend = "decreasing"

            # Liczba sesji
            cursor.execute("""
                SELECT COUNT(DISTINCT ts.id)
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id
                WHERE ls.exercise_id = %s AND ts.auth_account_id = %s
            """, [exercise_id, user_id])
            
            total_sessions = cursor.fetchone()[0]

            # Ostatnie wykonanie
            cursor.execute("""
                SELECT MAX(ts.session_date)
                FROM training_sessions ts
                JOIN logged_sets ls ON ls.session_id = ts.id
                WHERE ls.exercise_id = %s AND ts.auth_account_id = %s
            """, [exercise_id, user_id])
            
            last_performed = cursor.fetchone()[0]

        return Response({
            "success": True,
            "exercise_name": exercise_name,
            "statistics": {
                "total_sessions": total_sessions,
                "last_performed": last_performed.isoformat() if last_performed else None,
                "personal_record": personal_record,
                "progress": {
                    "recent_average_weight": float(recent_avg) if recent_avg else None,
                    "previous_average_weight": float(previous_avg) if previous_avg else None,
                    "progress_percentage": float(progress_percentage) if progress_percentage else None,
                    "trend": trend
                },
                "history": history
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[GetExerciseStatistics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

