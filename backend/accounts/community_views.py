"""
Community Views - System Społeczności
Podobni użytkownicy, wyszukiwanie, porównanie postępów
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from datetime import datetime
import logging
import traceback

logger = logging.getLogger(__name__)


# ============================================================================
# SIMILAR USERS - Podobni Użytkownicy
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_similar_users(request):
    """
    GET /api/community/similar-users/
    Pobierz listę podobnych użytkowników (z widoku v_similar_users)
    Query params:
        - limit: int (default: 20)
        - min_score: int (default: 50)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        limit = int(request.query_params.get('limit', 20))
        page = int(request.query_params.get('page', 1))
        min_score = int(request.query_params.get('min_score', 50))
        offset = (page - 1) * limit
        
        with connection.cursor() as cursor:
            # First get total count
            cursor.execute("""
                SELECT COUNT(DISTINCT vsu.similar_user_id)
                FROM v_similar_users vsu
                WHERE vsu.user_id = %s
                    AND vsu.similarity_score >= %s
            """, [user_id, min_score])
            total_count = cursor.fetchone()[0]
            
            # Then get paginated results
            cursor.execute("""
                SELECT 
                    vsu.similar_user_id,
                    vsu.similarity_score,
                    aa.username,
                    up.first_name,
                    up.goal,
                    up.level,
                    up.training_days_per_week,
                    up.equipment_preference,
                    COUNT(DISTINCT ts.id) as total_workouts,
                    COUNT(DISTINCT pr.id) as total_prs,
                    MAX(ts.session_date) as last_workout,
                    up.profile_picture
                FROM v_similar_users vsu
                JOIN auth_accounts aa ON vsu.similar_user_id = aa.id
                LEFT JOIN user_profiles up ON vsu.similar_user_id = up.auth_account_id
                LEFT JOIN training_sessions ts ON vsu.similar_user_id = ts.auth_account_id
                LEFT JOIN personal_records pr ON vsu.similar_user_id = pr.auth_account_id
                WHERE vsu.user_id = %s
                    AND vsu.similarity_score >= %s
                GROUP BY vsu.similar_user_id, vsu.similarity_score, aa.username, 
                         up.first_name, up.goal, up.level, up.training_days_per_week, up.equipment_preference, up.profile_picture
                ORDER BY vsu.similarity_score DESC, total_workouts DESC
                LIMIT %s OFFSET %s
            """, [user_id, min_score, limit, offset])
            
            similar_users = []
            for row in cursor.fetchall():
                similar_users.append({
                    "user_id": row[0],
                    "similarity_score": row[1],
                    "username": row[2],
                    "first_name": row[3],
                    "goal": row[4],
                    "level": row[5],
                    "training_days_per_week": row[6],
                    "equipment_preference": row[7],
                    "total_workouts": row[8] or 0,
                    "total_prs": row[9] or 0,
                    "last_workout": row[10].isoformat() if row[10] else None,
                    "profile_picture": row[11]
                })
            
            logger.info(f"[GetSimilarUsers] Found {len(similar_users)} similar users for user {user_id} (page {page}/{total_count // limit + 1})")
            
            return Response({
                "success": True,
                "users": similar_users,
                "total": total_count,
                "page": page,
                "limit": limit
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetSimilarUsers] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching similar users",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# SEARCH USERS - Wyszukiwanie Użytkowników
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    GET /api/community/search/
    Wyszukaj użytkowników po username lub first_name
    Query params:
        - q: string (search query)
        - goal: string (filter by goal)
        - level: string (filter by level)
        - limit: int (default: 20)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        query = request.query_params.get('q', '').strip()
        goal_filter = request.query_params.get('goal', '').strip()
        level_filter = request.query_params.get('level', '').strip()
        limit = int(request.query_params.get('limit', 20))
        page = int(request.query_params.get('page', 1))
        offset = (page - 1) * limit
        
        # Build dynamic query
        where_clauses = ["aa.id != %s"]  # Exclude current user
        params = [user_id]
        
        if query:
            where_clauses.append("(aa.username ILIKE %s OR up.first_name ILIKE %s)")
            params.extend([f'%{query}%', f'%{query}%'])
        
        if goal_filter:
            where_clauses.append("up.goal = %s")
            params.append(goal_filter)
        
        if level_filter:
            where_clauses.append("up.level = %s")
            params.append(level_filter)
        
        where_sql = " AND ".join(where_clauses)
        
        with connection.cursor() as cursor:
            # First get total count
            count_params = params[:-2] if len(params) > 2 else params  # Remove limit and offset from count query
            cursor.execute(f"""
                SELECT COUNT(DISTINCT aa.id)
                FROM auth_accounts aa
                LEFT JOIN user_profiles up ON aa.id = up.auth_account_id
                WHERE {where_sql}
            """, count_params)
            total_count = cursor.fetchone()[0]
            
            # Then get paginated results
            params.extend([limit, offset])
            cursor.execute(f"""
                SELECT 
                    aa.id,
                    aa.username,
                    up.first_name,
                    up.goal,
                    up.level,
                    up.training_days_per_week,
                    up.equipment_preference,
                    COUNT(DISTINCT ts.id) as total_workouts,
                    COUNT(DISTINCT pr.id) as total_prs,
                    MAX(ts.session_date) as last_workout,
                    up.profile_picture
                FROM auth_accounts aa
                LEFT JOIN user_profiles up ON aa.id = up.auth_account_id
                LEFT JOIN training_sessions ts ON aa.id = ts.auth_account_id
                LEFT JOIN personal_records pr ON aa.id = pr.auth_account_id
                WHERE {where_sql}
                GROUP BY aa.id, aa.username, up.first_name, up.goal, up.level, 
                         up.training_days_per_week, up.equipment_preference, up.profile_picture
                ORDER BY total_workouts DESC
                LIMIT %s OFFSET %s
            """, params)
            
            users = []
            for row in cursor.fetchall():
                users.append({
                    "user_id": row[0],
                    "username": row[1],
                    "first_name": row[2],
                    "goal": row[3],
                    "level": row[4],
                    "training_days_per_week": row[5],
                    "equipment_preference": row[6],
                    "total_workouts": row[7] or 0,
                    "total_prs": row[8] or 0,
                    "last_workout": row[9].isoformat() if row[9] else None,
                    "profile_picture": row[10]
                })
            
            logger.info(f"[SearchUsers] Found {len(users)} users for query: {query} (page {page}/{total_count // limit + 1})")
            
            return Response({
                "success": True,
                "users": users,
                "total": total_count,
                "page": page,
                "limit": limit
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[SearchUsers] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error searching users",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# USER PROFILE - Profil Użytkownika
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request, user_id):
    """
    GET /api/community/user/<user_id>/
    Pobierz publiczny profil użytkownika
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    aa.id,
                    aa.username,
                    aa.date_joined,
                    up.first_name,
                    up.goal,
                    up.level,
                    up.training_days_per_week,
                    up.equipment_preference,
                    up.preferred_session_duration
                FROM auth_accounts aa
                LEFT JOIN user_profiles up ON aa.id = up.auth_account_id
                WHERE aa.id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            profile = {
                "user_id": row[0],
                "username": row[1],
                "date_joined": row[2].isoformat() if row[2] else None,
                "first_name": row[3],
                "goal": row[4],
                "level": row[5],
                "training_days_per_week": row[6],
                "equipment_preference": row[7],
                "preferred_session_duration": row[8]
            }
            
            logger.info(f"[GetUserProfile] Retrieved profile for user {user_id}")
            
            return Response({
                "success": True,
                "profile": profile
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetUserProfile] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching user profile",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# USER STATISTICS - Statystyki Użytkownika
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_statistics(request, user_id):
    """
    GET /api/community/user/<user_id>/stats/
    Pobierz statystyki użytkownika
    """
    try:
        with connection.cursor() as cursor:
            # Basic stats
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT ts.id) as total_workouts,
                    SUM(ts.duration_minutes) as total_minutes,
                    AVG(ts.duration_minutes) as avg_duration,
                    MAX(ts.session_date) as last_workout,
                    MIN(ts.session_date) as first_workout
                FROM training_sessions ts
                WHERE ts.auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            total_workouts = row[0] or 0
            total_minutes = row[1] or 0
            avg_duration = float(row[2]) if row[2] else 0
            last_workout = row[3].isoformat() if row[3] else None
            first_workout = row[4].isoformat() if row[4] else None
            
            # Personal records
            cursor.execute("""
                SELECT COUNT(*) as pr_count
                FROM personal_records
                WHERE auth_account_id = %s
            """, [user_id])
            
            pr_count = cursor.fetchone()[0] or 0
            
            # Total volume
            cursor.execute("""
                SELECT SUM(ls.weight_kg * ls.reps) as total_volume
                FROM logged_sets ls
                JOIN training_sessions ts ON ls.session_id = ts.id
                WHERE ts.auth_account_id = %s
            """, [user_id])
            
            volume_row = cursor.fetchone()
            total_volume = float(volume_row[0]) if volume_row and volume_row[0] else 0
            
            # Top exercises
            cursor.execute("""
                SELECT 
                    e.name,
                    e.muscle_group,
                    COUNT(DISTINCT ts.id) as times_trained
                FROM exercises e
                JOIN logged_sets ls ON e.id = ls.exercise_id
                JOIN training_sessions ts ON ls.session_id = ts.id
                WHERE ts.auth_account_id = %s
                GROUP BY e.id, e.name, e.muscle_group
                ORDER BY times_trained DESC
                LIMIT 3
            """, [user_id])
            
            top_exercises = []
            for ex_row in cursor.fetchall():
                top_exercises.append({
                    "name": ex_row[0],
                    "muscle_group": ex_row[1],
                    "times_trained": ex_row[2]
                })
            
            # Current streak
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
            
            logger.info(f"[GetUserStatistics] Retrieved stats for user {user_id}")
            
            return Response({
                "success": True,
                "stats": {
                    "total_workouts": total_workouts,
                    "total_minutes": int(total_minutes),
                    "avg_duration": round(avg_duration, 1),
                    "last_workout": last_workout,
                    "first_workout": first_workout,
                    "personal_records": pr_count,
                    "total_volume": round(total_volume, 2),
                    "current_streak": current_streak,
                    "top_exercises": top_exercises
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetUserStatistics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching user statistics",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# USER PLANS - Plany Użytkownika
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_plans(request, user_id):
    """
    GET /api/community/user/<user_id>/plans/
    Pobierz plany użytkownika (aktywny plan i historia)
    """
    try:
        with connection.cursor() as cursor:
            # Active plan
            cursor.execute("""
                SELECT 
                    tp.id,
                    tp.name,
                    tp.description,
                    tp.goal_type,
                    tp.difficulty_level,
                    tp.training_days_per_week,
                    tp.equipment_required,
                    uap.start_date,
                    uap.rating
                FROM user_active_plans uap
                JOIN training_plans tp ON uap.plan_id = tp.id
                WHERE uap.auth_account_id = %s
                    AND uap.is_completed = FALSE
            """, [user_id])
            
            active_plan = None
            row = cursor.fetchone()
            if row:
                active_plan = {
                    "plan_id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "goal_type": row[3],
                    "difficulty_level": row[4],
                    "training_days_per_week": row[5],
                    "equipment_required": row[6],
                    "start_date": row[7].isoformat() if row[7] else None,
                    "rating": row[8]
                }
            
            # Completed plans history
            cursor.execute("""
                SELECT 
                    tp.id,
                    tp.name,
                    tp.goal_type,
                    tp.difficulty_level,
                    uap.start_date,
                    uap.end_date,
                    uap.rating
                FROM user_active_plans uap
                JOIN training_plans tp ON uap.plan_id = tp.id
                WHERE uap.auth_account_id = %s
                    AND uap.is_completed = TRUE
                ORDER BY uap.end_date DESC
                LIMIT 5
            """, [user_id])
            
            completed_plans = []
            for plan_row in cursor.fetchall():
                completed_plans.append({
                    "plan_id": plan_row[0],
                    "name": plan_row[1],
                    "goal_type": plan_row[2],
                    "difficulty_level": plan_row[3],
                    "start_date": plan_row[4].isoformat() if plan_row[4] else None,
                    "end_date": plan_row[5].isoformat() if plan_row[5] else None,
                    "rating": plan_row[6]
                })
            
            logger.info(f"[GetUserPlans] Retrieved plans for user {user_id}")
            
            return Response({
                "success": True,
                "active_plan": active_plan,
                "completed_plans": completed_plans
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetUserPlans] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching user plans",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

