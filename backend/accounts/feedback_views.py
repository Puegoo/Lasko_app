# backend/accounts/feedback_views.py
"""
Endpointy związane z systemem ocen i feedbacku:
- Oceny planów treningowych
- Feedback dla ćwiczeń
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from datetime import datetime
import logging
import traceback
import json

logger = logging.getLogger(__name__)


# ============================================================================
# PLAN RATINGS - Oceny Planów
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_plan(request):
    """
    POST /api/feedback/rate-plan/
    Oceń aktywny plan użytkownika
    Body: {
        "rating": int (1-5),
        "feedback_text": str (optional),
        "mark_completed": bool (optional, default: False)
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        rating = data.get('rating')
        feedback_text = data.get('feedback_text', '')
        mark_completed = data.get('mark_completed', False)

        if not rating or rating not in [1, 2, 3, 4, 5]:
            return Response({
                "error": "rating must be between 1 and 5"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            # Sprawdź czy użytkownik ma aktywny plan
            cursor.execute("""
                SELECT uap.id, uap.plan_id, tp.name
                FROM user_active_plans uap
                JOIN training_plans tp ON uap.plan_id = tp.id
                WHERE uap.auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "No active plan found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            active_plan_id, plan_id, plan_name = row
            
            # Zaktualizuj ocenę (trigger automatycznie ustawi rating_date)
            cursor.execute("""
                UPDATE user_active_plans
                SET rating = %s,
                    feedback_text = %s,
                    is_completed = %s
                WHERE id = %s
            """, [rating, feedback_text, mark_completed, active_plan_id])
            
            logger.info(f"[RatePlan] User {user_id} rated plan {plan_id} with {rating} stars")
            
            return Response({
                "success": True,
                "message": f"Plan '{plan_name}' został oceniony!",
                "rating": rating,
                "plan_id": plan_id,
                "plan_name": plan_name
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[RatePlan] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error rating plan",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_plan_rating(request):
    """
    GET /api/feedback/plan-rating/
    Pobierz ocenę aktywnego planu użytkownika
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    uap.plan_id,
                    tp.name,
                    uap.rating,
                    uap.rating_date,
                    uap.feedback_text,
                    uap.is_completed,
                    uap.start_date
                FROM user_active_plans uap
                JOIN training_plans tp ON uap.plan_id = tp.id
                WHERE uap.auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "success": True,
                    "has_rating": False,
                    "rating": None
                }, status=status.HTTP_200_OK)
            
            plan_data = {
                "plan_id": row[0],
                "plan_name": row[1],
                "rating": row[2],
                "rating_date": row[3].isoformat() if row[3] else None,
                "feedback_text": row[4],
                "is_completed": row[5],
                "start_date": row[6].isoformat() if row[6] else None
            }
            
            return Response({
                "success": True,
                "has_rating": row[2] is not None,
                "rating": plan_data
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetPlanRating] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching plan rating",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# EXERCISE FEEDBACK - Feedback dla Ćwiczeń
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_exercise_feedback(request):
    """
    POST /api/feedback/exercise/
    Dodaj feedback dla ćwiczenia
    Body: {
        "exercise_id": int,
        "difficulty_rating": int (1-5, optional),
        "subjective_notes": str (optional)
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        exercise_id = data.get('exercise_id')
        difficulty_rating = data.get('difficulty_rating')
        subjective_notes = data.get('subjective_notes', '')

        if not exercise_id:
            return Response({
                "error": "exercise_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        if difficulty_rating and difficulty_rating not in [1, 2, 3, 4, 5]:
            return Response({
                "error": "difficulty_rating must be between 1 and 5"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            # Sprawdź czy ćwiczenie istnieje
            cursor.execute("SELECT name FROM exercises WHERE id = %s", [exercise_id])
            exercise_row = cursor.fetchone()
            
            if not exercise_row:
                return Response({
                    "error": "Exercise not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            exercise_name = exercise_row[0]
            
            # Dodaj feedback
            cursor.execute("""
                INSERT INTO exercise_feedback 
                (auth_account_id, exercise_id, difficulty_rating, subjective_notes, feedback_date)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id
            """, [user_id, exercise_id, difficulty_rating, subjective_notes])
            
            feedback_id = cursor.fetchone()[0]
            
            logger.info(f"[SubmitExerciseFeedback] User {user_id} submitted feedback for exercise {exercise_id}")
            
            return Response({
                "success": True,
                "message": f"Feedback dla '{exercise_name}' został zapisany!",
                "feedback_id": feedback_id
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[SubmitExerciseFeedback] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error submitting feedback",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_feedback(request, exercise_id: int):
    """
    GET /api/feedback/exercise/<exercise_id>/
    Pobierz feedback użytkownika dla konkretnego ćwiczenia
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    ef.id,
                    ef.difficulty_rating,
                    ef.subjective_notes,
                    ef.feedback_date,
                    e.name as exercise_name
                FROM exercise_feedback ef
                JOIN exercises e ON ef.exercise_id = e.id
                WHERE ef.auth_account_id = %s AND ef.exercise_id = %s
                ORDER BY ef.feedback_date DESC
            """, [user_id, exercise_id])
            
            feedbacks = []
            for row in cursor.fetchall():
                feedbacks.append({
                    "id": row[0],
                    "difficulty_rating": row[1],
                    "subjective_notes": row[2],
                    "feedback_date": row[3].isoformat() if row[3] else None,
                    "exercise_name": row[4]
                })
            
            return Response({
                "success": True,
                "feedbacks": feedbacks,
                "total": len(feedbacks)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetExerciseFeedback] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching feedback",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_exercise_feedback(request):
    """
    GET /api/feedback/exercises/
    Pobierz cały feedback użytkownika dla wszystkich ćwiczeń
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    ef.id,
                    ef.exercise_id,
                    e.name as exercise_name,
                    e.muscle_group,
                    ef.difficulty_rating,
                    ef.subjective_notes,
                    ef.feedback_date
                FROM exercise_feedback ef
                JOIN exercises e ON ef.exercise_id = e.id
                WHERE ef.auth_account_id = %s
                ORDER BY ef.feedback_date DESC
            """, [user_id])
            
            feedbacks = []
            for row in cursor.fetchall():
                feedbacks.append({
                    "id": row[0],
                    "exercise_id": row[1],
                    "exercise_name": row[2],
                    "muscle_group": row[3],
                    "difficulty_rating": row[4],
                    "subjective_notes": row[5],
                    "feedback_date": row[6].isoformat() if row[6] else None
                })
            
            logger.info(f"[GetAllExerciseFeedback] Found {len(feedbacks)} feedbacks for user {user_id}")
            
            return Response({
                "success": True,
                "feedbacks": feedbacks,
                "total": len(feedbacks)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetAllExerciseFeedback] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching feedbacks",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_plan_completion(request):
    """
    GET /api/feedback/check-plan-completion/
    Sprawdź czy użytkownik powinien ocenić plan
    (np. po 4 tygodniach treningu lub jeśli ukończył wszystkie dni)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Pobierz aktywny plan
            cursor.execute("""
                SELECT 
                    uap.plan_id,
                    tp.name,
                    uap.start_date,
                    uap.rating,
                    uap.is_completed,
                    tp.training_days_per_week
                FROM user_active_plans uap
                JOIN training_plans tp ON uap.plan_id = tp.id
                WHERE uap.auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "success": True,
                    "should_rate": False,
                    "reason": "No active plan"
                }, status=status.HTTP_200_OK)
            
            plan_id, plan_name, start_date, rating, is_completed, training_days = row
            
            # Jeśli plan już oceniony, nie pokazuj modala
            if rating:
                return Response({
                    "success": True,
                    "should_rate": False,
                    "reason": "Already rated",
                    "current_rating": rating
                }, status=status.HTTP_200_OK)
            
            # Policz ile treningów użytkownik odbył
            cursor.execute("""
                SELECT COUNT(*)
                FROM training_sessions
                WHERE auth_account_id = %s 
                    AND plan_id = %s
                    AND session_date >= %s
            """, [user_id, plan_id, start_date])
            
            sessions_count = cursor.fetchone()[0]
            
            # Policz ile dni minęło od rozpoczęcia
            days_active = (datetime.now().date() - start_date).days if start_date else 0
            
            # Warunki do pokazania modala oceny:
            # 1. Min. 4 tygodnie treningu (28 dni)
            # 2. Min. 8 sesji treningowych
            # 3. Plan oznaczony jako ukończony
            should_rate = (
                is_completed or
                days_active >= 28 or
                sessions_count >= 8
            )
            
            reason = None
            if is_completed:
                reason = "Plan completed"
            elif days_active >= 28:
                reason = f"Active for {days_active} days"
            elif sessions_count >= 8:
                reason = f"Completed {sessions_count} sessions"
            else:
                reason = f"Not enough data (days: {days_active}, sessions: {sessions_count})"
            
            return Response({
                "success": True,
                "should_rate": should_rate,
                "reason": reason,
                "plan": {
                    "id": plan_id,
                    "name": plan_name,
                    "start_date": start_date.isoformat() if start_date else None,
                    "days_active": days_active,
                    "sessions_count": sessions_count
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[CheckPlanCompletion] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error checking plan completion",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# TRAINING JOURNAL - Dziennik Treningowy (User Notes)
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_journal_notes(request):
    """
    GET /api/journal/notes/
    Pobierz notatki użytkownika z dziennika treningowego
    Query params:
        - days: int (optional) - ostatnie N dni (default: 30)
        - search: str (optional) - wyszukaj w treści
        - tag: str (optional) - filtruj po tagu
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        days = int(request.query_params.get('days', 30))
        search = request.query_params.get('search', '')
        tag = request.query_params.get('tag', '')
        
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    un.id,
                    un.note_date,
                    un.content
                FROM user_notes un
                WHERE un.auth_account_id = %s
                    AND un.note_date >= CURRENT_TIMESTAMP - INTERVAL '%s days'
            """
            params = [user_id, days]
            
            if search:
                query += " AND LOWER(un.content) LIKE LOWER(%s)"
                params.append(f"%{search}%")
            
            query += " ORDER BY un.note_date DESC"
            
            cursor.execute(query, params)
            
            notes = []
            for row in cursor.fetchall():
                content = row[2]
                # Parsuj tagi z treści (zakładam format #tag)
                tags = []
                if content:
                    import re
                    tags = re.findall(r'#(\w+)', content)
                
                # Filtruj po tagu jeśli podany
                if tag and tag.lower() not in [t.lower() for t in tags]:
                    continue
                
                notes.append({
                    "id": row[0],
                    "note_date": row[1].isoformat() if row[1] else None,
                    "content": content,
                    "tags": tags
                })
            
            logger.info(f"[GetJournalNotes] Found {len(notes)} notes for user {user_id}")
            
            return Response({
                "success": True,
                "notes": notes,
                "total": len(notes)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetJournalNotes] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching journal notes",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_journal_note(request):
    """
    POST /api/journal/notes/
    Dodaj notatkę do dziennika
    Body: {
        "content": str,
        "note_date": "2025-10-26T14:30:00" (optional, default: now)
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        content = data.get('content')
        note_date = data.get('note_date', datetime.now())

        if not content or not content.strip():
            return Response({
                "error": "content is required and cannot be empty"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_notes (auth_account_id, note_date, content)
                VALUES (%s, %s, %s)
                RETURNING id
            """, [user_id, note_date, content.strip()])
            
            note_id = cursor.fetchone()[0]
            
            logger.info(f"[AddJournalNote] Added note {note_id} for user {user_id}")
            
            return Response({
                "success": True,
                "message": "Notatka została zapisana!",
                "id": note_id
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[AddJournalNote] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error saving note",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_journal_note(request, note_id: int):
    """
    PUT/PATCH /api/journal/notes/<note_id>/
    Zaktualizuj notatkę
    Body: {
        "content": str
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        content = data.get('content')

        if not content or not content.strip():
            return Response({
                "error": "content is required and cannot be empty"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            # Sprawdź czy notatka należy do użytkownika
            cursor.execute("""
                SELECT auth_account_id FROM user_notes WHERE id = %s
            """, [note_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if row[0] != user_id:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            # Zaktualizuj notatkę
            cursor.execute("""
                UPDATE user_notes
                SET content = %s
                WHERE id = %s
            """, [content.strip(), note_id])
            
            logger.info(f"[UpdateJournalNote] Updated note {note_id}")
            
            return Response({
                "success": True,
                "message": "Notatka została zaktualizowana!"
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[UpdateJournalNote] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error updating note",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_journal_note(request, note_id: int):
    """
    DELETE /api/journal/notes/<note_id>/
    Usuń notatkę
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Sprawdź czy notatka należy do użytkownika
            cursor.execute("""
                SELECT auth_account_id FROM user_notes WHERE id = %s
            """, [note_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if row[0] != user_id:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            # Usuń notatkę
            cursor.execute("DELETE FROM user_notes WHERE id = %s", [note_id])
            
            logger.info(f"[DeleteJournalNote] Deleted note {note_id}")
            
            return Response({
                "success": True,
                "message": "Notatka została usunięta!"
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[DeleteJournalNote] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error deleting note",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_journal_tags(request):
    """
    GET /api/journal/tags/
    Pobierz wszystkie unikalne tagi użyte przez użytkownika
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT content
                FROM user_notes
                WHERE auth_account_id = %s
            """, [user_id])
            
            all_tags = set()
            import re
            for row in cursor.fetchall():
                content = row[0]
                if content:
                    tags = re.findall(r'#(\w+)', content)
                    all_tags.update(tags)
            
            tags_list = sorted(list(all_tags))
            
            return Response({
                "success": True,
                "tags": tags_list,
                "total": len(tags_list)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetJournalTags] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching tags",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_plan_completed(request):
    """
    POST /api/feedback/complete-plan/
    Oznacz plan jako ukończony (bez oceny - użytkownik może ocenić później)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE user_active_plans
                SET is_completed = TRUE,
                    end_date = CURRENT_DATE
                WHERE auth_account_id = %s
                RETURNING plan_id
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "No active plan found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            plan_id = row[0]
            
            logger.info(f"[MarkPlanCompleted] User {user_id} marked plan {plan_id} as completed")
            
            return Response({
                "success": True,
                "message": "Plan oznaczony jako ukończony!",
                "plan_id": plan_id
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[MarkPlanCompleted] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error marking plan as completed",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

