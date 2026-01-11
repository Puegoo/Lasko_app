"""
Statistics Views - Dashboard Statystyk
Wykresy wolumenu, częstotliwości, heatmap kalendarz
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from datetime import datetime, timedelta
import logging
import traceback

logger = logging.getLogger(__name__)


# ============================================================================
# TRAINING VOLUME - Wolumen Treningowy
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_training_volume(request):
    """
    GET /api/statistics/volume/
    Pobierz wolumen treningowy (weight × reps) w czasie
    Query params:
        - period: 'week' | 'month' | 'year' (default: 'month')
        - group_by: 'day' | 'week' | 'month' (default: 'week')
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        period = request.query_params.get('period', 'month')
        group_by = request.query_params.get('group_by', 'week')
        
        # Określ zakres dat
        period_days = {
            'week': 7,
            'month': 30,
            'year': 365
        }
        days = period_days.get(period, 30)
        
        # Określ grupowanie
        group_format = {
            'day': "TO_CHAR(ts.session_date, 'YYYY-MM-DD')",
            'week': "TO_CHAR(DATE_TRUNC('week', ts.session_date), 'YYYY-MM-DD')",
            'month': "TO_CHAR(DATE_TRUNC('month', ts.session_date), 'YYYY-MM')"
        }
        group_expr = group_format.get(group_by, group_format['week'])
        
        with connection.cursor() as cursor:
            query = f"""
                SELECT 
                    {group_expr} as period,
                    SUM(ls.weight_kg * ls.reps) as total_volume,
                    COUNT(DISTINCT ts.id) as session_count,
                    COUNT(ls.id) as total_sets
                FROM training_sessions ts
                JOIN logged_sets ls ON ts.id = ls.session_id
                WHERE ts.auth_account_id = %s
                    AND ts.session_date >= CURRENT_DATE - INTERVAL '%s days'
                GROUP BY {group_expr}
                ORDER BY period ASC
            """
            
            cursor.execute(query, [user_id, days])
            
            volume_data = []
            for row in cursor.fetchall():
                volume_data.append({
                    "period": row[0],
                    "total_volume": float(row[1]) if row[1] else 0,
                    "session_count": row[2],
                    "total_sets": row[3]
                })
            
            logger.info(f"[GetTrainingVolume] Found {len(volume_data)} data points for user {user_id}")
            
            return Response({
                "success": True,
                "data": volume_data,
                "period": period,
                "group_by": group_by
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetTrainingVolume] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching training volume",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# MUSCLE GROUP FREQUENCY - Częstotliwość Partii Mięśniowych
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_muscle_group_frequency(request):
    """
    GET /api/statistics/muscle-frequency/
    Pobierz częstotliwość treningu poszczególnych partii mięśniowych
    Query params:
        - days: int (default: 90)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        days = int(request.query_params.get('days', 90))
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.muscle_group,
                    COUNT(DISTINCT ts.id) as session_count,
                    COUNT(ls.id) as total_sets,
                    SUM(ls.weight_kg * ls.reps) as total_volume,
                    AVG(ls.weight_kg) as avg_weight
                FROM training_sessions ts
                JOIN logged_sets ls ON ts.id = ls.session_id
                JOIN exercises e ON ls.exercise_id = e.id
                WHERE ts.auth_account_id = %s
                    AND ts.session_date >= CURRENT_DATE - INTERVAL '%s days'
                    AND e.muscle_group IS NOT NULL
                GROUP BY e.muscle_group
                ORDER BY session_count DESC
            """, [user_id, days])
            
            frequency_data = []
            for row in cursor.fetchall():
                frequency_data.append({
                    "muscle_group": row[0],
                    "session_count": row[1],
                    "total_sets": row[2],
                    "total_volume": float(row[3]) if row[3] else 0,
                    "avg_weight": float(row[4]) if row[4] else 0
                })
            
            logger.info(f"[GetMuscleGroupFrequency] Found {len(frequency_data)} muscle groups for user {user_id}")
            
            return Response({
                "success": True,
                "data": frequency_data,
                "days": days
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetMuscleGroupFrequency] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching muscle group frequency",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# TRAINING HEATMAP - Kalendarz Treningowy
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_training_heatmap(request):
    """
    GET /api/statistics/heatmap/
    Pobierz dane do heatmapy treningowej (style GitHub)
    Query params:
        - days: int (default: 365)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        days = int(request.query_params.get('days', 365))
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    DATE(ts.session_date) as date,
                    COUNT(ts.id) as session_count,
                    SUM(ts.duration_minutes) as total_duration,
                    COUNT(ls.id) as total_sets
                FROM training_sessions ts
                LEFT JOIN logged_sets ls ON ts.id = ls.session_id
                WHERE ts.auth_account_id = %s
                    AND ts.session_date >= CURRENT_DATE - INTERVAL '%s days'
                GROUP BY DATE(ts.session_date)
                ORDER BY date ASC
            """, [user_id, days])
            
            heatmap_data = []
            for row in cursor.fetchall():
                heatmap_data.append({
                    "date": row[0].isoformat() if row[0] else None,
                    "session_count": row[1],
                    "total_duration": row[2] or 0,
                    "total_sets": row[3] or 0
                })
            
            logger.info(f"[GetTrainingHeatmap] Found {len(heatmap_data)} days with workouts for user {user_id}")
            
            return Response({
                "success": True,
                "data": heatmap_data,
                "days": days
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetTrainingHeatmap] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching training heatmap",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# GENERAL STATISTICS - Statystyki Ogólne
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_general_statistics(request):
    """
    GET /api/statistics/general/
    Pobierz ogólne statystyki użytkownika
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Podstawowe statystyki
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT ts.id) as total_workouts,
                    SUM(ts.duration_minutes) as total_minutes,
                    AVG(ts.duration_minutes) as avg_duration,
                    COUNT(DISTINCT DATE(ts.session_date)) as training_days,
                    MAX(ts.session_date) as last_workout
                FROM training_sessions ts
                WHERE ts.auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            total_workouts = row[0] or 0
            total_minutes = row[1] or 0
            avg_duration = float(row[2]) if row[2] else 0
            training_days = row[3] or 0
            last_workout = row[4].isoformat() if row[4] else None
            
            # Streak - obecny ciąg treningowy
            cursor.execute("""
                WITH RECURSIVE training_dates AS (
                    SELECT DISTINCT DATE(session_date) as training_date
                    FROM training_sessions
                    WHERE auth_account_id = %s
                    ORDER BY training_date DESC
                ),
                streak_calc AS (
                    SELECT 
                        training_date,
                        ROW_NUMBER() OVER (ORDER BY training_date DESC) as rn,
                        training_date - (ROW_NUMBER() OVER (ORDER BY training_date DESC) * INTERVAL '1 day') as group_date
                    FROM training_dates
                )
                SELECT COUNT(*) as streak
                FROM streak_calc
                WHERE group_date = (SELECT group_date FROM streak_calc ORDER BY training_date DESC LIMIT 1)
            """, [user_id])
            
            streak_row = cursor.fetchone()
            current_streak = streak_row[0] if streak_row else 0
            
            # Najlepszy miesiąc
            cursor.execute("""
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', ts.session_date), 'YYYY-MM') as month,
                    COUNT(ts.id) as workout_count
                FROM training_sessions ts
                WHERE ts.auth_account_id = %s
                GROUP BY month
                ORDER BY workout_count DESC
                LIMIT 1
            """, [user_id])
            
            best_month_row = cursor.fetchone()
            best_month = best_month_row[0] if best_month_row else None
            best_month_count = best_month_row[1] if best_month_row else 0
            
            # Łączny wolumen
            cursor.execute("""
                SELECT SUM(ls.weight_kg * ls.reps) as total_volume
                FROM logged_sets ls
                JOIN training_sessions ts ON ls.session_id = ts.id
                WHERE ts.auth_account_id = %s
            """, [user_id])
            
            volume_row = cursor.fetchone()
            total_volume = float(volume_row[0]) if volume_row and volume_row[0] else 0
            
            # Liczba rekordów osobistych
            cursor.execute("""
                SELECT COUNT(*) as pr_count
                FROM personal_records
                WHERE auth_account_id = %s
            """, [user_id])
            
            pr_row = cursor.fetchone()
            pr_count = pr_row[0] if pr_row else 0
            
            # Treningi w tym miesiącu
            cursor.execute("""
                SELECT COUNT(DISTINCT ts.id) as workouts_this_month
                FROM training_sessions ts
                WHERE ts.auth_account_id = %s
                AND DATE_TRUNC('month', ts.session_date) = DATE_TRUNC('month', CURRENT_DATE)
            """, [user_id])
            
            month_row = cursor.fetchone()
            workouts_this_month = month_row[0] if month_row else 0
            
            logger.info(f"[GetGeneralStatistics] Stats for user {user_id}: {total_workouts} workouts, {current_streak} day streak")
            
            return Response({
                "success": True,
                "stats": {
                    "total_workouts": total_workouts,
                    "total_minutes": int(total_minutes),
                    "avg_duration": round(avg_duration, 1),
                    "training_days": training_days,
                    "last_workout": last_workout,
                    "current_streak": current_streak,
                    "best_month": best_month,
                    "best_month_count": best_month_count,
                    "total_volume": round(total_volume, 2),
                    "personal_records": pr_count,
                    "workouts_this_month": workouts_this_month
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetGeneralStatistics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching general statistics",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# EXERCISE STATISTICS - Statystyki Ćwiczeń
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_statistics(request):
    """
    GET /api/statistics/exercises/
    Pobierz statystyki najpopularniejszych ćwiczeń
    Query params:
        - limit: int (default: 10)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        limit = int(request.query_params.get('limit', 10))
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.id,
                    e.name,
                    e.muscle_group,
                    COUNT(DISTINCT ts.id) as times_trained,
                    COUNT(ls.id) as total_sets,
                    SUM(ls.weight_kg * ls.reps) as total_volume,
                    MAX(ls.weight_kg) as max_weight,
                    AVG(ls.weight_kg) as avg_weight
                FROM exercises e
                JOIN logged_sets ls ON e.id = ls.exercise_id
                JOIN training_sessions ts ON ls.session_id = ts.id
                WHERE ts.auth_account_id = %s
                GROUP BY e.id, e.name, e.muscle_group
                ORDER BY times_trained DESC
                LIMIT %s
            """, [user_id, limit])
            
            exercises = []
            for row in cursor.fetchall():
                exercises.append({
                    "exercise_id": row[0],
                    "name": row[1],
                    "muscle_group": row[2],
                    "times_trained": row[3],
                    "total_sets": row[4],
                    "total_volume": float(row[5]) if row[5] else 0,
                    "max_weight": float(row[6]) if row[6] else 0,
                    "avg_weight": float(row[7]) if row[7] else 0
                })
            
            logger.info(f"[GetExerciseStatistics] Found {len(exercises)} exercises for user {user_id}")
            
            return Response({
                "success": True,
                "exercises": exercises,
                "total": len(exercises)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetExerciseStatistics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching exercise statistics",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PUBLIC STATISTICS - Statystyki Publiczne (bez autoryzacji)
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_statistics(request):
    """
    GET /api/statistics/public/
    Pobierz publiczne statystyki (liczba użytkowników, planów, ćwiczeń)
    Nie wymaga autoryzacji
    """
    try:
        with connection.cursor() as cursor:
            # Liczba użytkowników (bez adminów)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM auth_accounts 
                WHERE (is_admin = FALSE OR is_admin IS NULL) 
                  AND (is_superuser = FALSE OR is_superuser IS NULL)
            """)
            users_count = cursor.fetchone()[0] or 0
            
            # Liczba planów treningowych (tylko bazowe)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM training_plans 
                WHERE is_base_plan = TRUE AND is_active = TRUE
            """)
            plans_count = cursor.fetchone()[0] or 0
            
            # Liczba ćwiczeń
            cursor.execute("""
                SELECT COUNT(*) 
                FROM exercises
            """)
            exercises_count = cursor.fetchone()[0] or 0
            
            logger.info(f"[GetPublicStatistics] Users: {users_count}, Plans: {plans_count}, Exercises: {exercises_count}")
            
            return Response({
                "success": True,
                "stats": {
                    "users": users_count,
                    "plans": plans_count,
                    "exercises": exercises_count
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetPublicStatistics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching public statistics",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

