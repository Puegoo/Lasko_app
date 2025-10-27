"""
Calendar Views - Kalendarz Treningowy
Historia treningów, zaplanowane vs wykonane, streak counter
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from datetime import datetime, timedelta
import logging
import traceback

logger = logging.getLogger(__name__)


# ============================================================================
# CALENDAR DATA - Dane Kalendarza
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_calendar_data(request):
    """
    GET /api/calendar/
    Pobierz dane kalendarza treningowego
    Query params:
        - month: YYYY-MM (default: current month)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        # Get month parameter or use current month
        month_param = request.query_params.get('month')
        if month_param:
            try:
                year, month = map(int, month_param.split('-'))
                start_date = datetime(year, month, 1).date()
            except:
                start_date = datetime.now().replace(day=1).date()
        else:
            start_date = datetime.now().replace(day=1).date()
        
        # Calculate end date (last day of month)
        if start_date.month == 12:
            end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1, day=1) - timedelta(days=1)
        
        # Get training sessions for the month
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    DATE(ts.session_date) as date,
                    ts.id as session_id,
                    ts.duration_minutes,
                    tp.name as plan_name,
                    COUNT(DISTINCT ls.exercise_id) as exercises_count,
                    COUNT(ls.id) as total_sets,
                    SUM(ls.weight_kg * ls.reps) as total_volume
                FROM training_sessions ts
                LEFT JOIN training_plans tp ON ts.plan_id = tp.id
                LEFT JOIN logged_sets ls ON ts.id = ls.session_id
                WHERE ts.auth_account_id = %s
                    AND DATE(ts.session_date) >= %s
                    AND DATE(ts.session_date) <= %s
                GROUP BY DATE(ts.session_date), ts.id, ts.duration_minutes, tp.name
                ORDER BY date ASC
            """, [user_id, start_date, end_date])
            
            calendar_data = []
            for row in cursor.fetchall():
                calendar_data.append({
                    "date": row[0].isoformat() if row[0] else None,
                    "session_id": row[1],
                    "duration_minutes": row[2],
                    "plan_name": row[3],
                    "exercises_count": row[4] or 0,
                    "total_sets": row[5] or 0,
                    "total_volume": float(row[6]) if row[6] else 0
                })
            
            # Get scheduled days from active plan
            cursor.execute("""
                SELECT 
                    uap.training_schedule
                FROM user_active_plans uap
                WHERE uap.auth_account_id = %s
                    AND uap.is_completed = FALSE
            """, [user_id])
            
            schedule_row = cursor.fetchone()
            scheduled_days = schedule_row[0] if schedule_row else []
            
            logger.info(f"[GetCalendarData] Found {len(calendar_data)} sessions for user {user_id} in {start_date.strftime('%Y-%m')}")
            
            return Response({
                "success": True,
                "month": start_date.strftime('%Y-%m'),
                "sessions": calendar_data,
                "scheduled_days": scheduled_days
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetCalendarData] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching calendar data",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# SESSION DETAILS - Szczegóły Sesji
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_details(request, session_id):
    """
    GET /api/calendar/session/<session_id>/
    Pobierz szczegóły sesji treningowej
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Get session info
            cursor.execute("""
                SELECT 
                    ts.id,
                    ts.session_date,
                    ts.duration_minutes,
                    ts.notes,
                    tp.name as plan_name,
                    tp.id as plan_id
                FROM training_sessions ts
                LEFT JOIN training_plans tp ON ts.plan_id = tp.id
                WHERE ts.id = %s AND ts.auth_account_id = %s
            """, [session_id, user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "Session not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            session = {
                "session_id": row[0],
                "session_date": row[1].isoformat() if row[1] else None,
                "duration_minutes": row[2],
                "notes": row[3],
                "plan_name": row[4],
                "plan_id": row[5]
            }
            
            # Get exercises from session
            cursor.execute("""
                SELECT 
                    e.id,
                    e.name,
                    e.muscle_group,
                    COUNT(ls.id) as sets_count,
                    MAX(ls.weight_kg) as max_weight,
                    SUM(ls.weight_kg * ls.reps) as total_volume
                FROM logged_sets ls
                JOIN exercises e ON ls.exercise_id = e.id
                WHERE ls.session_id = %s
                GROUP BY e.id, e.name, e.muscle_group
                ORDER BY MIN(ls.id) ASC
            """, [session_id])
            
            exercises = []
            for ex_row in cursor.fetchall():
                exercises.append({
                    "exercise_id": ex_row[0],
                    "name": ex_row[1],
                    "muscle_group": ex_row[2],
                    "sets_count": ex_row[3],
                    "max_weight": float(ex_row[4]) if ex_row[4] else 0,
                    "total_volume": float(ex_row[5]) if ex_row[5] else 0
                })
            
            session["exercises"] = exercises
            
            logger.info(f"[GetSessionDetails] Retrieved session {session_id} with {len(exercises)} exercises")
            
            return Response({
                "success": True,
                "session": session
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetSessionDetails] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching session details",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

