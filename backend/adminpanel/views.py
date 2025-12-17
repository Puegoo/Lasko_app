from datetime import datetime, timedelta
from io import StringIO
from django.db import connection, transaction
from django.db.models import Q
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from accounts.models import AuthAccount, UserProfile
from adminpanel.permissions import IsAdmin


# =========================
# HELPERY
# =========================


LAST_7_DAYS = 7


def _paginate_queryset(queryset, page, page_size):
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    return queryset[start:end], total


def _serialize_account(account: AuthAccount):
    profile = None
    try:
        profile_obj = account.userprofile
        profile = {
            "goal": profile_obj.goal,
            "level": profile_obj.level,
            "training_days_per_week": profile_obj.training_days_per_week,
            "equipment_preference": profile_obj.equipment_preference,
            "last_survey_date": profile_obj.last_survey_date.isoformat() if profile_obj.last_survey_date else None,
        }
    except UserProfile.DoesNotExist:
        profile = None

    return {
        "id": account.id,
        "username": account.username,
        "email": account.email,
        "first_name": account.first_name,
        "is_active": account.is_active,
        "is_admin": bool(account.is_admin or account.is_superuser),
        "date_joined": account.date_joined.isoformat() if account.date_joined else None,
        "last_login": account.last_login.isoformat() if account.last_login else None,
        "profile": profile,
    }


def _fetch_plan(plan_id: int):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, description, goal_type, difficulty_level,
                   training_days_per_week, equipment_required, is_active,
                   created_at, auth_account_id
            FROM training_plans
            WHERE id = %s
            """,
            [plan_id]
        )
        row = cursor.fetchone()
        if not row:
            return None

        plan = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "goal_type": row[3],
            "difficulty_level": row[4],
            "training_days_per_week": row[5],
            "equipment_required": row[6],
            "is_active": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
            "author_id": row[9],
            "days": [],
        }

        cursor.execute(
            """
            SELECT id, name, day_order, day_of_week
            FROM plan_days
            WHERE plan_id = %s
            ORDER BY day_order ASC, id ASC
            """,
            [plan_id]
        )
        day_rows = cursor.fetchall()

        for day_row in day_rows:
            day = {
                "id": day_row[0],
                "name": day_row[1],
                "day_order": day_row[2],
                "day_of_week": day_row[3],
                "exercises": [],
            }

            cursor.execute(
                """
                SELECT pe.id, pe.exercise_id, e.name, e.muscle_group, e.type,
                       pe.target_sets, pe.target_reps, pe.rest_seconds, pe.superset_group
                FROM plan_exercises pe
                JOIN exercises e ON e.id = pe.exercise_id
                WHERE pe.plan_day_id = %s
                ORDER BY pe.id ASC
                """,
                [day_row[0]]
            )
            exercise_rows = cursor.fetchall()
            day["exercises"] = [
                {
                    "id": ex_row[0],
                    "exercise_id": ex_row[1],
                    "name": ex_row[2],
                    "muscle_group": ex_row[3],
                    "type": ex_row[4],
                    "target_sets": ex_row[5],
                    "target_reps": ex_row[6],
                    "rest_seconds": ex_row[7],
                    "superset_group": ex_row[8],
                }
                for ex_row in exercise_rows
            ]
            plan["days"].append(day)

        cursor.execute(
            """
            SELECT COUNT(*) FILTER (WHERE is_completed = TRUE) AS completed,
                   COUNT(*) AS activations,
                   AVG(rating) FILTER (WHERE rating IS NOT NULL) AS avg_rating
            FROM user_active_plans
            WHERE plan_id = %s
            """,
            [plan_id]
        )
        stats_row = cursor.fetchone()
        plan["activation_count"] = stats_row[1] if stats_row else 0
        plan["completed_count"] = stats_row[0] if stats_row else 0
        plan["average_rating"] = float(stats_row[2] or 0.0) if stats_row else 0.0

    return plan


def _replace_plan_structure(cursor, plan_id: int, days_payload):
    cursor.execute("DELETE FROM plan_days WHERE plan_id = %s", [plan_id])
    for index, day_payload in enumerate(days_payload):
        name = day_payload.get('name') or f'Dzień {index + 1}'
        day_order = day_payload.get('day_order') or (index + 1)
        day_of_week = day_payload.get('day_of_week')
        cursor.execute(
            """
            INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
            VALUES (%s, %s, %s, %s) RETURNING id
            """,
            [plan_id, name, day_order, day_of_week]
        )
        plan_day_id = cursor.fetchone()[0]

        for exercise_payload in day_payload.get('exercises', []):
            exercise_id = exercise_payload.get('exercise_id')
            if not exercise_id:
                continue
            cursor.execute(
                """
                INSERT INTO plan_exercises (
                    plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                [
                    plan_day_id,
                    exercise_id,
                    exercise_payload.get('target_sets'),
                    exercise_payload.get('target_reps'),
                    exercise_payload.get('rest_seconds'),
                    exercise_payload.get('superset_group'),
                ]
            )


# =========================
# DASHBOARD
# =========================


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def dashboard_summary(request):
    """Podstawowe KPI dla panelu admina."""
    today = datetime.utcnow()
    last_7_days = today - timedelta(days=LAST_7_DAYS)
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM auth_accounts")
        total_users = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE is_active = TRUE")
        active_users = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM auth_accounts WHERE date_joined >= %s",
            [last_7_days]
        )
        new_users_week = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM user_active_plans")
        active_plans = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM exercise_feedback WHERE is_favorite = TRUE"
        )
        favorite_count = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COALESCE(AVG(rating), 0) FROM user_active_plans WHERE rating IS NOT NULL"
        )
        avg_plan_rating = float(cursor.fetchone()[0] or 0.0)

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM recommendation_logs
            WHERE created_at >= %s
            """,
            [last_7_days]
        )
        reco_requests_week = cursor.fetchone()[0]

    return Response({
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_week": new_users_week,
            "active_plans": active_plans,
            "favorite_exercises": favorite_count,
            "average_plan_rating": round(avg_plan_rating, 2),
            "recommendation_requests_week": reco_requests_week,
        }
    })


# =========================
# UŻYTKOWNICY
# =========================


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_users(request):
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)
    search = (request.query_params.get('search') or '').strip()
    status_filter = request.query_params.get('status')

    queryset = AuthAccount.objects.all().order_by('-date_joined')
    if search:
        queryset = queryset.filter(
            Q(username__icontains=search) | Q(email__icontains=search)
        )

    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'inactive':
        queryset = queryset.filter(is_active=False)

    subset, total = _paginate_queryset(queryset, page, page_size)
    items = [_serialize_account(acc) for acc in subset]

    return Response({
        "results": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def retrieve_user(request, user_id: int):
    try:
        account = AuthAccount.objects.get(id=user_id)
    except AuthAccount.DoesNotExist:
        return Response({"detail": "Użytkownik nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

    data = _serialize_account(account)

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT COUNT(*) FROM exercise_feedback WHERE auth_account_id = %s AND is_favorite = TRUE",
            [user_id]
        )
        favorites = cursor.fetchone()[0]

        cursor.execute(
            "SELECT plan_id FROM user_active_plans WHERE auth_account_id = %s",
            [user_id]
        )
        active_plan_row = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) FROM user_active_plans WHERE auth_account_id = %s AND is_completed = TRUE",
            [user_id]
        )
        completed_plans = cursor.fetchone()[0]

    data.update({
        "favorite_exercise_count": favorites,
        "active_plan_id": active_plan_row[0] if active_plan_row else None,
        "completed_plans": completed_plans,
    })

    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_user_status(request, user_id: int):
    try:
        account = AuthAccount.objects.get(id=user_id)
    except AuthAccount.DoesNotExist:
        return Response({"detail": "Użytkownik nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

    payload = request.data
    allowed_fields = {}
    if 'is_active' in payload:
        allowed_fields['is_active'] = bool(payload['is_active'])
    if 'is_admin' in payload:
        allowed_fields['is_admin'] = bool(payload['is_admin'])
    if 'is_superuser' in payload:
        allowed_fields['is_superuser'] = bool(payload['is_superuser'])

    if not allowed_fields:
        return Response({"detail": "Brak zmian"}, status=status.HTTP_400_BAD_REQUEST)

    for field, value in allowed_fields.items():
        setattr(account, field, value)
    account.save(update_fields=list(allowed_fields.keys()))

    return Response(_serialize_account(account))


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def reset_user_password(request, user_id: int):
    """Reset hasła użytkownika przez admina"""
    try:
        account = AuthAccount.objects.get(id=user_id)
    except AuthAccount.DoesNotExist:
        return Response({"detail": "Użytkownik nie istnieje"}, status=status.HTTP_404_NOT_FOUND)
    
    # Domyślne hasło po resecie
    new_password = request.data.get('new_password', 'password123')
    
    # Minimalna walidacja
    if len(new_password) < 8:
        return Response({
            "detail": "Hasło musi mieć minimum 8 znaków"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Zresetuj hasło
    account.set_password(new_password)
    account.save()
    
    return Response({
        "success": True,
        "message": f"Hasło zostało zresetowane dla użytkownika {account.username}",
        "user": _serialize_account(account)
    })


# =========================
# ĆWICZENIA
# =========================


def _fetch_exercise(exercise_id: int):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT e.id, e.name, e.description, e.video_url, e.image_url, e.muscle_group, e.type
            FROM exercises e
            WHERE e.id = %s
            """,
            [exercise_id]
        )
        row = cursor.fetchone()
        if not row:
            return None

        exercise = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "video_url": row[3],
            "image_url": row[4],
            "muscle_group": row[5],
            "type": row[6],
            "tags": [],
            "equipment": [],
            "variants": [],
        }

        cursor.execute(
            """
            SELECT t.name FROM exercise_tags et
            JOIN tags t ON t.id = et.tag_id
            WHERE et.exercise_id = %s
            ORDER BY t.name
            """,
            [exercise_id]
        )
        exercise["tags"] = [r[0] for r in cursor.fetchall()]

        cursor.execute(
            """
            SELECT eq.name FROM exercise_equipment ee
            JOIN equipment eq ON eq.id = ee.equipment_id
            WHERE ee.exercise_id = %s
            ORDER BY eq.name
            """,
            [exercise_id]
        )
        exercise["equipment"] = [r[0] for r in cursor.fetchall()]

        cursor.execute(
            """
            SELECT id, name, notes
            FROM exercise_variants
            WHERE exercise_id = %s
            ORDER BY name
            """,
            [exercise_id]
        )
        exercise["variants"] = [
            {"id": r[0], "name": r[1], "notes": r[2]} for r in cursor.fetchall()
        ]

        cursor.execute(
            """
            SELECT
                COALESCE(AVG(ef.rating), 0) as avg_rating,
                SUM(CASE WHEN ef.is_favorite THEN 1 ELSE 0 END) as favorite_count
            FROM exercise_feedback ef
            WHERE ef.exercise_id = %s
            """,
            [exercise_id]
        )
        stats_row = cursor.fetchone()
        exercise["average_rating"] = float(stats_row[0] or 0.0)
        exercise["favorite_count"] = stats_row[1] or 0

    return exercise


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def exercises_collection(request):
    if request.method == 'GET':
        search = (request.query_params.get('search') or '').strip()
        muscle_group = (request.query_params.get('muscle_group') or '').strip()
        exercise_type = (request.query_params.get('type') or '').strip()

        query = """
            SELECT e.id, e.name, e.muscle_group, e.type, 
                   COALESCE(avg_stats.avg_rating, 0) AS avg_rating,
                   COALESCE(fav_stats.favorite_count, 0) AS favorite_count
            FROM exercises e
            LEFT JOIN (
                SELECT exercise_id, AVG(rating) AS avg_rating
                FROM exercise_feedback
                GROUP BY exercise_id
            ) avg_stats ON avg_stats.exercise_id = e.id
            LEFT JOIN (
                SELECT exercise_id, COUNT(*) AS favorite_count
                FROM exercise_feedback
                WHERE is_favorite = TRUE
                GROUP BY exercise_id
            ) fav_stats ON fav_stats.exercise_id = e.id
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (LOWER(e.name) LIKE LOWER(%s) OR LOWER(e.description) LIKE LOWER(%s))"
            like_term = f"%{search}%"
            params.extend([like_term, like_term])
        if muscle_group:
            query += " AND LOWER(e.muscle_group) = LOWER(%s)"
            params.append(muscle_group)
        if exercise_type:
            query += " AND LOWER(e.type) = LOWER(%s)"
            params.append(exercise_type)
        query += " ORDER BY e.name"

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        items = [
            {
                "id": row[0],
                "name": row[1],
                "muscle_group": row[2],
                "type": row[3],
                "average_rating": float(row[4] or 0.0),
                "favorite_count": row[5] or 0,
            }
            for row in rows
        ]

        return Response({"results": items})

    payload = request.data
    required_fields = ['name', 'muscle_group', 'type']
    for field in required_fields:
        if not payload.get(field):
            return Response({"detail": f"Brak pola {field}"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            [
                payload['name'],
                payload.get('description'),
                payload.get('video_url'),
                payload.get('image_url'),
                payload['muscle_group'],
                payload['type'],
            ]
        )
        exercise_id = cursor.fetchone()[0]

        _sync_exercise_relations(cursor, exercise_id, payload)

    return Response(_fetch_exercise(exercise_id), status=status.HTTP_201_CREATED)


def _sync_exercise_relations(cursor, exercise_id: int, payload):
    tags = payload.get('tags') or []
    equipment = payload.get('equipment') or []
    variants = payload.get('variants') or []

    if tags is not None:
        cursor.execute("DELETE FROM exercise_tags WHERE exercise_id = %s", [exercise_id])
        for tag in tags:
            cursor.execute("INSERT INTO tags (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", [tag])
            cursor.execute(
                "INSERT INTO exercise_tags (exercise_id, tag_id) SELECT %s, id FROM tags WHERE name = %s",
                [exercise_id, tag]
            )

    if equipment is not None:
        cursor.execute("DELETE FROM exercise_equipment WHERE exercise_id = %s", [exercise_id])
        for item in equipment:
            cursor.execute("INSERT INTO equipment (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", [item])
            cursor.execute(
                "INSERT INTO exercise_equipment (exercise_id, equipment_id) SELECT %s, id FROM equipment WHERE name = %s",
                [exercise_id, item]
            )

    if variants is not None:
        cursor.execute("DELETE FROM exercise_variants WHERE exercise_id = %s", [exercise_id])
        for variant in variants:
            if not variant or not variant.get('name'):
                continue
            cursor.execute(
                "INSERT INTO exercise_variants (exercise_id, name, notes) VALUES (%s, %s, %s)",
                [exercise_id, variant['name'], variant.get('notes')]
            )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def exercise_detail(request, exercise_id: int):
    exercise = _fetch_exercise(exercise_id)
    if not exercise:
        return Response({"detail": "Ćwiczenie nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(exercise)

    if request.method in ('PUT', 'PATCH'):
        payload = request.data
        fields = {key: payload.get(key) for key in ['name', 'description', 'video_url', 'image_url', 'muscle_group', 'type'] if key in payload}
        if fields:
            set_clause = ", ".join(f"{field} = %s" for field in fields.keys())
            with transaction.atomic(), connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE exercises SET {set_clause} WHERE id = %s",
                    list(fields.values()) + [exercise_id]
                )
                _sync_exercise_relations(cursor, exercise_id, payload)
        return Response(_fetch_exercise(exercise_id))

    if request.method == 'DELETE':
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM exercises WHERE id = %s", [exercise_id])
        return Response(status=status.HTTP_204_NO_CONTENT)

    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


# =========================
# PLANY TRENINGOWE
# =========================


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def plans_collection(request):
    search = (request.query_params.get('search') or '').strip()
    goal = (request.query_params.get('goal') or '').strip()
    level = (request.query_params.get('level') or '').strip()
    status_filter = request.query_params.get('status')
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)

    query = """
        SELECT
            tp.id, tp.name, tp.goal_type, tp.difficulty_level,
            tp.training_days_per_week, tp.equipment_required,
            tp.is_active, tp.created_at,
            COALESCE(ua.activations, 0) AS activations,
            COALESCE(uc.completed, 0) AS completed,
            COALESCE(avg_r.avg_rating, 0) AS avg_rating
        FROM training_plans tp
        LEFT JOIN (
            SELECT plan_id, COUNT(*) AS activations
            FROM user_active_plans
            GROUP BY plan_id
        ) ua ON ua.plan_id = tp.id
        LEFT JOIN (
            SELECT plan_id, COUNT(*) AS completed
            FROM user_active_plans
            WHERE is_completed = TRUE
            GROUP BY plan_id
        ) uc ON uc.plan_id = tp.id
        LEFT JOIN (
            SELECT plan_id, AVG(rating) AS avg_rating
            FROM user_active_plans
            WHERE rating IS NOT NULL
            GROUP BY plan_id
        ) avg_r ON avg_r.plan_id = tp.id
        WHERE 1=1
    """
    params = []
    if search:
        query += " AND LOWER(tp.name) LIKE LOWER(%s)"
        params.append(f"%{search}%")
    if goal:
        query += " AND LOWER(tp.goal_type) = LOWER(%s)"
        params.append(goal)
    if level:
        query += " AND LOWER(tp.difficulty_level) = LOWER(%s)"
        params.append(level)
    if status_filter == 'active':
        query += " AND tp.is_active = TRUE"
    elif status_filter == 'inactive':
        query += " AND tp.is_active = FALSE"

    query += " ORDER BY tp.created_at DESC, tp.id DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    rows = rows[start:end]

    items = [
        {
            "id": row[0],
            "name": row[1],
            "goal_type": row[2],
            "difficulty_level": row[3],
            "training_days_per_week": row[4],
            "equipment_required": row[5],
            "is_active": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
            "activation_count": row[8],
            "completed_count": row[9],
            "average_rating": float(row[10] or 0.0),
        }
        for row in rows
    ]

    return Response({
        "results": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def plan_detail(request, plan_id: int):
    plan = _fetch_plan(plan_id)
    if not plan:
        return Response({"detail": "Plan nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(plan)

    payload = request.data
    fields = {key: payload.get(key) for key in [
        'name', 'description', 'goal_type', 'difficulty_level',
        'training_days_per_week', 'equipment_required', 'is_active'
    ] if key in payload}

    with transaction.atomic(), connection.cursor() as cursor:
        if fields:
            set_clause = ", ".join(f"{field} = %s" for field in fields.keys())
            cursor.execute(
                f"UPDATE training_plans SET {set_clause} WHERE id = %s",
                list(fields.values()) + [plan_id]
            )
        if 'days' in payload and isinstance(payload['days'], list):
            _replace_plan_structure(cursor, plan_id, payload['days'])
            if 'training_days_per_week' not in fields:
                cursor.execute(
                    "UPDATE training_plans SET training_days_per_week = %s WHERE id = %s",
                    [len(payload['days']), plan_id]
                )

    return Response(_fetch_plan(plan_id))


# =========================
# REKOMENDACJE – STATYSTYKI I LOGI
# =========================


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def recommendation_stats(request):
    stats = {
        "total_logs": 0,
        "average_score": 0.0,
        "versions": [],
        "activations_last_week": 0,
    }
    last_7_days = datetime.utcnow() - timedelta(days=LAST_7_DAYS)

    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*), AVG(recommendation_score) FROM recommendation_logs")
        row = cursor.fetchone()
        stats["total_logs"] = row[0] or 0
        stats["average_score"] = float(row[1] or 0.0)

        cursor.execute(
            """
            SELECT algorithm_version, COUNT(*) AS cnt, AVG(recommendation_score) AS avg_score
            FROM recommendation_logs
            GROUP BY algorithm_version
            ORDER BY algorithm_version
            """
        )
        stats["versions"] = [
            {
                "algorithm_version": r[0],
                "count": r[1],
                "average_score": float(r[2] or 0.0),
            }
            for r in cursor.fetchall()
        ]

        cursor.execute(
            "SELECT COUNT(*) FROM user_active_plans WHERE start_date >= %s",
            [last_7_days.date()]
        )
        stats["activations_last_week"] = cursor.fetchone()[0]

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def training_statistics(request):
    """Statystyki treningów - sesje, wolumen, aktywność w czasie"""
    stats = {
        "total_sessions": 0,
        "total_duration_minutes": 0,
        "avg_session_duration": 0.0,
        "total_volume_kg": 0.0,
        "sessions_last_7_days": 0,
        "users_with_sessions": 0,
        "sessions_by_day": [],
        "top_exercises": [],
    }
    
    last_7_days = datetime.utcnow() - timedelta(days=7)
    last_30_days = datetime.utcnow() - timedelta(days=30)

    with connection.cursor() as cursor:
        # Podstawowe statystyki sesji
        cursor.execute("SELECT COUNT(*), SUM(duration_minutes), AVG(duration_minutes) FROM training_sessions")
        row = cursor.fetchone()
        stats["total_sessions"] = row[0] or 0
        stats["total_duration_minutes"] = int(row[1] or 0)
        stats["avg_session_duration"] = float(row[2] or 0.0)

        # Sesje w ostatnich 7 dniach
        cursor.execute(
            "SELECT COUNT(*) FROM training_sessions WHERE session_date >= %s",
            [last_7_days]
        )
        stats["sessions_last_7_days"] = cursor.fetchone()[0]

        # Użytkownicy z sesjami
        cursor.execute("SELECT COUNT(DISTINCT auth_account_id) FROM training_sessions")
        stats["users_with_sessions"] = cursor.fetchone()[0]

        # Wolumen treningowy (weight * reps)
        cursor.execute("""
            SELECT COALESCE(SUM(weight_kg * reps), 0)
            FROM logged_sets
        """)
        volume_row = cursor.fetchone()
        stats["total_volume_kg"] = float(volume_row[0] or 0.0)

        # Sesje w ostatnich 30 dniach (dla wykresu)
        cursor.execute("""
            SELECT DATE(session_date) as day, COUNT(*) as count
            FROM training_sessions
            WHERE session_date >= %s
            GROUP BY DATE(session_date)
            ORDER BY day
        """, [last_30_days])
        stats["sessions_by_day"] = [
            {"date": row[0].isoformat() if row[0] else None, "count": row[1]}
            for row in cursor.fetchall()
        ]

        # Top 10 ćwiczeń (najczęściej trenowane)
        cursor.execute("""
            SELECT e.id, e.name, e.muscle_group, COUNT(DISTINCT ls.session_id) as session_count,
                   COUNT(ls.id) as set_count, SUM(ls.weight_kg * ls.reps) as total_volume
            FROM exercises e
            JOIN logged_sets ls ON e.id = ls.exercise_id
            GROUP BY e.id, e.name, e.muscle_group
            ORDER BY session_count DESC
            LIMIT 10
        """)
        stats["top_exercises"] = [
            {
                "id": row[0],
                "name": row[1],
                "muscle_group": row[2],
                "session_count": row[3],
                "set_count": row[4],
                "total_volume": float(row[5] or 0.0),
            }
            for row in cursor.fetchall()
        ]

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def user_activity_statistics(request):
    """Statystyki aktywności użytkowników - rejestracje w czasie"""
    stats = {
        "registrations_by_day": [],
        "registrations_by_month": [],
        "active_users_count": 0,
        "new_users_last_7_days": 0,
        "new_users_last_30_days": 0,
    }

    last_30_days = datetime.utcnow() - timedelta(days=30)
    last_7_days = datetime.utcnow() - timedelta(days=7)
    last_12_months = datetime.utcnow() - timedelta(days=365)

    with connection.cursor() as cursor:
        # Aktywni użytkownicy
        cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE is_active = TRUE")
        stats["active_users_count"] = cursor.fetchone()[0]

        # Nowi użytkownicy w ostatnich 7 i 30 dniach
        cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE date_joined >= %s", [last_7_days])
        stats["new_users_last_7_days"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM auth_accounts WHERE date_joined >= %s", [last_30_days])
        stats["new_users_last_30_days"] = cursor.fetchone()[0]

        # Rejestracje w ostatnich 30 dniach (dla wykresu dziennego)
        cursor.execute("""
            SELECT DATE(date_joined) as day, COUNT(*) as count
            FROM auth_accounts
            WHERE date_joined >= %s AND (is_admin = FALSE OR is_admin IS NULL)
            GROUP BY DATE(date_joined)
            ORDER BY day
        """, [last_30_days])
        stats["registrations_by_day"] = [
            {"date": row[0].isoformat() if row[0] else None, "count": row[1]}
            for row in cursor.fetchall()
        ]

        # Rejestracje w ostatnich 12 miesiącach (dla wykresu miesięcznego)
        cursor.execute("""
            SELECT DATE_TRUNC('month', date_joined) as month, COUNT(*) as count
            FROM auth_accounts
            WHERE date_joined >= %s AND (is_admin = FALSE OR is_admin IS NULL)
            GROUP BY DATE_TRUNC('month', date_joined)
            ORDER BY month
        """, [last_12_months])
        stats["registrations_by_month"] = [
            {"date": row[0].isoformat() if row[0] else None, "count": row[1]}
            for row in cursor.fetchall()
        ]

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def recommendation_logs(request):
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)
    offset = (page - 1) * page_size

    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM recommendation_logs")
        total = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT rl.id, rl.auth_account_id, aa.username, rl.plan_id, tp.name,
                   rl.recommendation_score, rl.algorithm_version, rl.created_at
            FROM recommendation_logs rl
            LEFT JOIN auth_accounts aa ON aa.id = rl.auth_account_id
            LEFT JOIN training_plans tp ON tp.id = rl.plan_id
            ORDER BY rl.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [page_size, offset]
        )
        rows = cursor.fetchall()

    items = [
        {
            "id": row[0],
            "user_id": row[1],
            "username": row[2],
            "plan_id": row[3],
            "plan_name": row[4],
            "score": float(row[5] or 0.0),
            "algorithm_version": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
        }
        for row in rows
    ]

    return Response({
        "results": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    })


# =========================
# RAPORTY / EKSPORTY
# =========================


def _build_csv_response(filename: str, header: list, rows: list):
    output = StringIO()
    output.write(','.join(header) + '\n')
    for row in rows:
        sanitized = []
        for value in row:
            if value is None:
                sanitized.append('')
            else:
                text = str(value).replace('"', '""')
                if ',' in text or '\n' in text:
                    sanitized.append(f'"{text}"')
                else:
                    sanitized.append(text)
        output.write(','.join(sanitized) + '\n')
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def export_users_csv(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, username, email, first_name, is_active, is_admin, date_joined, last_login
            FROM auth_accounts
            ORDER BY id
            """
        )
        rows = cursor.fetchall()
    header = [
        "id", "username", "email", "first_name", "is_active",
        "is_admin", "date_joined", "last_login"
    ]
    return _build_csv_response('users.csv', header, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def export_plans_csv(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT tp.id, tp.name, tp.goal_type, tp.difficulty_level,
                   tp.training_days_per_week, tp.equipment_required,
                   tp.is_active, tp.created_at,
                   COALESCE(ua.activations, 0) AS activations,
                   COALESCE(uc.completed, 0) AS completed,
                   COALESCE(avg_r.avg_rating, 0) AS avg_rating
            FROM training_plans tp
            LEFT JOIN (
                SELECT plan_id, COUNT(*) AS activations
                FROM user_active_plans
                GROUP BY plan_id
            ) ua ON ua.plan_id = tp.id
            LEFT JOIN (
                SELECT plan_id, COUNT(*) AS completed
                FROM user_active_plans
                WHERE is_completed = TRUE
                GROUP BY plan_id
            ) uc ON uc.plan_id = tp.id
            LEFT JOIN (
                SELECT plan_id, AVG(rating) AS avg_rating
                FROM user_active_plans
                WHERE rating IS NOT NULL
                GROUP BY plan_id
            ) avg_r ON avg_r.plan_id = tp.id
            ORDER BY tp.id
            """
        )
        rows = cursor.fetchall()
    header = [
        "id", "name", "goal_type", "difficulty_level",
        "training_days_per_week", "equipment_required", "is_active", "created_at",
        "activations", "completed", "average_rating"
    ]
    return _build_csv_response('training_plans.csv', header, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def export_exercises_csv(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT e.id, e.name, e.muscle_group, e.type,
                   COALESCE(avg_stats.avg_rating, 0) AS avg_rating,
                   COALESCE(fav_stats.favorite_count, 0) AS favorite_count
            FROM exercises e
            LEFT JOIN (
                SELECT exercise_id, AVG(rating) AS avg_rating
                FROM exercise_feedback
                GROUP BY exercise_id
            ) avg_stats ON avg_stats.exercise_id = e.id
            LEFT JOIN (
                SELECT exercise_id, COUNT(*) AS favorite_count
                FROM exercise_feedback
                WHERE is_favorite = TRUE
                GROUP BY exercise_id
            ) fav_stats ON fav_stats.exercise_id = e.id
            ORDER BY e.id
            """
        )
        rows = cursor.fetchall()
    header = ["id", "name", "muscle_group", "type", "average_rating", "favorite_count"]
    return _build_csv_response('exercises.csv', header, rows)
