import json
import logging
from typing import Optional

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.authentication import JWTAuthentication

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _get_user_id_from_jwt(request) -> Optional[int]:
    """
    Zwraca ID użytkownika z access tokena (SimpleJWT) lub None, jeśli brak/niepoprawny.
    """
    try:
        auth = JWTAuthentication()
        res = auth.authenticate(request)  # (user, token) lub None
        if not res:
            return None
        _user, token = res
        return token.payload.get("user_id") or token.payload.get("sub")
    except Exception:
        return None


# -------- Rekomendacje (fallback SQL) --------
@csrf_exempt
@require_http_methods(["POST"])
def reco_dispatch(request, mode: str):
    mode = (mode or "hybrid").lower()
    try:
        top = int(request.GET.get("top", 3))
    except Exception:
        top = 3

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        body = {}

    payload = body.get("payload") or body.get("preferences") or body or {}

    goal = (payload.get("goal") or "").strip()
    level = (payload.get("level") or "").strip()
    equipment = (payload.get("equipment") or payload.get("equipment_preference") or "").strip()
    tdays = payload.get("trainingDaysPerWeek") or payload.get("training_days_per_week")

    # ✅ NOWE: parametry ciała
    body_data = payload.get("body") or {}
    age = body_data.get("age")
    weight = body_data.get("weightKg") or body_data.get("weight")  # kg
    height_cm = body_data.get("heightCm") or body_data.get("height")  # cm
    bmi = body_data.get("bmi")
    try:
        if bmi is None and weight and height_cm:
            h = float(height_cm) / 100.0
            bmi = round(float(weight) / (h * h), 1)
    except Exception:
        bmi = None

    sql = """
      SELECT id, name, goal_type, difficulty_level, training_days_per_week, equipment_required
      FROM training_plans
      WHERE (%s = '' OR goal_type = %s)
        AND (%s = '' OR difficulty_level = %s)
        AND (%s = '' OR equipment_required = %s)
        AND is_active = TRUE
      ORDER BY RANDOM()
      LIMIT %s
    """
    with connection.cursor() as cur:
        cur.execute(sql, [goal, goal, level, level, equipment, equipment, top])
        rows = cur.fetchall()

    recs = []
    for pid, name, goal_type, diff, days, equip in rows:
        score = 0
        why = []

        # podstawowe dopasowania
        if goal and goal_type == goal:
            score += 40; why.append(f"Dopasowanie celu: {goal_type}")
        if level and diff == level:
            score += 30; why.append(f"Dopasowanie poziomu: {diff}")
        if equipment and equip == equipment:
            score += 20; why.append(f"Sprzęt: {equip}")
        if tdays and days == tdays:
            score += 10; why.append(f"{days} dni/tydzień")

        # ✅ dopasowanie po BMI
        if bmi:
            if goal_type == "spalanie" and bmi >= 27:
                score += 12; why.append("Priorytet redukcji przy podwyższonym BMI")
            if goal_type in ("masa", "siła") and 18.5 <= bmi <= 24.9:
                score += 10; why.append("Priorytet siły/masy przy prawidłowym BMI")
            if diff == "początkujący" and bmi >= 32:
                score += 6;  why.append("Niższa trudność przy wyższym BMI")
            if diff == "zaawansowany" and bmi <= 22:
                score += 4;  why.append("Wyższa trudność przy niższym BMI")

        # ✅ dopasowanie po wieku
        if age:
            try:
                age_i = int(age)
                if age_i >= 45 and diff in ("początkujący", "średniozaawansowany"):
                    score += 6;  why.append("Dostosowanie poziomu pod wiek 45+")
                if age_i >= 55 and days <= 4:
                    score += 5;  why.append("Umiarkowana częstotliwość przy 55+")
                if age_i <= 30 and diff == "zaawansowany":
                    score += 3;  why.append("Wyższy poziom dla młodszych")
            except Exception:
                pass

        recs.append({
            "planId": pid,
            "name": name,
            "goalType": goal_type,
            "difficultyLevel": diff,
            "trainingDaysPerWeek": days,
            "equipmentRequired": equip,
            "score": score,
            "matchPercentage": min(100, max(0, score)),
            "bodyHints": why[-3:]  # wyślij 3 ostatnie wskazówki dot. ciała
        })

    return JsonResponse({"recommendations": recs})


@csrf_exempt
@require_http_methods(["POST"])
def reco_dispatch_default(request):
    """
    Alias pod /api/recommendations/?mode=... albo body.mode.
    """
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        body = {}
    mode = (request.GET.get("mode") or body.get("mode") or "hybrid")
    # przekazujemy to samo body dalej
    request._body = json.dumps(body).encode("utf-8")
    return reco_dispatch(request, mode)


# -------- Szczegóły planu dla kreatora/ankiety --------
@require_http_methods(["GET"])
def get_plan_detailed(request, plan_id: int):
    """
    Zwraca szczegóły planu wraz z dniami i ćwiczeniami, łącznie z wyliczeniami:
    - estimated_duration,
    - target_muscle_groups (z agregacji).
    """
    q = """
    SELECT 
      tp.id, tp.name, tp.description, tp.goal_type, tp.difficulty_level,
      tp.training_days_per_week, tp.equipment_required,
      json_agg(
        json_build_object(
          'day_id', pd.id,
          'name', pd.name,
          'day_order', pd.day_order,
          'day_of_week', pd.day_of_week,
          'exercises', day_exercises.exercises,
          'estimated_duration', day_exercises.estimated_duration,
          'target_muscle_groups', day_exercises.muscle_groups
        )
        ORDER BY pd.day_order
      ) AS days
    FROM training_plans tp
    JOIN plan_days pd ON tp.id = pd.plan_id
    JOIN LATERAL (
      SELECT 
        json_agg(
          json_build_object(
            'id', e.id,
            'name', e.name,
            'muscle_group', e.muscle_group,
            'type', e.type,
            'target_sets', pe.target_sets,
            'target_reps', pe.target_reps,
            'rest_seconds', pe.rest_seconds,
            'superset_group', pe.superset_group,
            'tags', exercise_tags.tags,
            'image_url', e.image_url,
            'video_url', e.video_url
          )
          ORDER BY pe.id
        ) AS exercises,
        SUM(
          CASE 
            WHEN pe.target_sets ~ '^[0-9]+$' THEN 
              pe.target_sets::int * 2 + COALESCE(pe.rest_seconds, 60) / 60.0
            ELSE 3 * 2 + COALESCE(pe.rest_seconds, 60) / 60.0
          END
        ) AS estimated_duration,
        array_agg(DISTINCT e.muscle_group) AS muscle_groups
      FROM plan_exercises pe
      JOIN exercises e ON pe.exercise_id = e.id
      LEFT JOIN LATERAL (
        SELECT array_agg(t.name) AS tags
        FROM exercise_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.exercise_id = e.id
      ) exercise_tags ON TRUE
      WHERE pe.plan_day_id = pd.id
    ) day_exercises ON TRUE
    WHERE tp.id = %s
    GROUP BY tp.id
    """
    with connection.cursor() as cur:
        cur.execute(q, [plan_id])
        row = cur.fetchone()
        if not row:
            return JsonResponse({'success': False, 'message': 'Plan nie znaleziony'}, status=404)

    cols = [
      'id','name','description','goal_type','difficulty_level',
      'training_days_per_week','equipment_required','days'
    ]
    data = dict(zip(cols, row))
    return JsonResponse({'success': True, 'plan': data})


# -------- Aktywacja i tworzenie planu --------
@csrf_exempt
@require_http_methods(["POST"])
def activate_plan(request, plan_id: int):
    """
    Ustawia dany plan jako aktywny użytkownika (zamyka poprzedni aktywny, jeśli istnieje).
    """
    user_id = _get_user_id_from_jwt(request)
    if not user_id:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    with connection.cursor() as cur:
        cur.execute("SELECT id FROM training_plans WHERE id=%s", [plan_id])
        if not cur.fetchone():
            return JsonResponse({"message": "Plan nie istnieje"}, status=404)

        cur.execute("""
            UPDATE user_active_plans
               SET is_completed = TRUE, end_date = CURRENT_DATE
             WHERE auth_account_id=%s AND is_completed=FALSE
        """, [user_id])

        cur.execute("""
            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
            VALUES (%s, %s, CURRENT_DATE)
        """, [user_id, plan_id])

    return JsonResponse({"success": True, "message": "Plan aktywowany", "planId": plan_id})


@csrf_exempt
@require_http_methods(["POST"])
def create_custom_plan(request):
    """
    Tworzy prosty, niestandardowy plan użytkownika i od razu ustawia go jako aktywny.
    Wymagane pola: name, goal, trainingDays (lub training_days_per_week), equipment.
    Opcjonalne: basePlanId - jeśli podane, plan będzie skopiowany z planu bazowego.
    """
    user_id = _get_user_id_from_jwt(request)
    if not user_id:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        data = {}

    base_plan_id = data.get("basePlanId") or data.get("base_plan_id")
    
    # Jeśli kopiujemy z planu bazowego
    if base_plan_id:
        return copy_and_customize_plan(request, user_id, base_plan_id, data)
    
    # Standardowe tworzenie nowego planu
    name = (data.get("name") or "").strip()
    goal = (data.get("goal") or "").strip()
    training_days = data.get("trainingDays") or data.get("training_days_per_week")
    equipment = (data.get("equipment") or data.get("equipment_preference") or "").strip()
    notes = data.get("notes") or ""

    if not name or not goal or not training_days or not equipment:
        return JsonResponse({"message": "Wymagane pola: name, goal, trainingDays, equipment"}, status=400)

    with connection.cursor() as cur:
        # Sprawdź czy kolumny istnieją
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'training_plans'
        """)
        cols_set = {row[0] for row in cur.fetchall()}
        has_base_plan = 'is_base_plan' in cols_set
        has_base_plan_id = 'base_plan_id' in cols_set
        
        plan_cols = ["name", "description", "auth_account_id", "goal_type", "difficulty_level",
                    "training_days_per_week", "equipment_required", "is_active"]
        plan_vals = [name, notes, user_id, goal, "niestandardowy", training_days, equipment, True]
        
        if has_base_plan:
            plan_cols.append("is_base_plan")
            plan_vals.append(False)  # Niestandardowy plan użytkownika
        if has_base_plan_id:
            plan_cols.append("base_plan_id")
            plan_vals.append(None)
        
        plan_cols_str = ', '.join(plan_cols)
        placeholders = ', '.join(['%s'] * len(plan_cols))
        
        cur.execute(f"""
            INSERT INTO training_plans ({plan_cols_str})
            VALUES ({placeholders})
            RETURNING id
        """, plan_vals)
        new_plan_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
            VALUES (%s, %s, CURRENT_DATE)
            ON CONFLICT (auth_account_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, start_date = CURRENT_DATE
        """, [user_id, new_plan_id])

    return JsonResponse({"success": True, "planId": new_plan_id}, status=201)


def copy_and_customize_plan(request, user_id, base_plan_id, customization_data):
    """
    Kopiuje plan bazowy i pozwala na personalizację przez użytkownika.
    """
    with connection.cursor() as cur:
        # Pobierz plan bazowy
        cur.execute("""
            SELECT id, name, description, goal_type, difficulty_level,
                   training_days_per_week, equipment_required, is_base_plan
            FROM training_plans
            WHERE id = %s AND COALESCE(is_base_plan, TRUE) = TRUE
        """, [base_plan_id])
        
        base_plan = cur.fetchone()
        if not base_plan:
            return JsonResponse({"message": "Plan bazowy nie został znaleziony"}, status=404)
        
        # Przygotuj dane nowego planu (można nadpisać wartościami z customization_data)
        new_name = (customization_data.get("name") or "").strip() or f"Kopia - {base_plan[1]}"
        new_description = customization_data.get("description") or base_plan[2] or ""
        new_goal = (customization_data.get("goal") or "").strip() or base_plan[3]
        new_level = (customization_data.get("level") or "").strip() or base_plan[4]
        new_days = customization_data.get("trainingDays") or customization_data.get("training_days_per_week") or base_plan[5]
        new_equipment = (customization_data.get("equipment") or "").strip() or base_plan[6]
        
        # Sprawdź kolumny
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'training_plans'
        """)
        cols_set = {row[0] for row in cur.fetchall()}
        has_base_plan = 'is_base_plan' in cols_set
        has_base_plan_id = 'base_plan_id' in cols_set
        
        # Utwórz nowy plan
        plan_cols = ["name", "description", "auth_account_id", "goal_type", "difficulty_level",
                    "training_days_per_week", "equipment_required", "is_active"]
        plan_vals = [new_name, new_description, user_id, new_goal, new_level, new_days, new_equipment, True]
        
        if has_base_plan:
            plan_cols.append("is_base_plan")
            plan_vals.append(False)  # To jest niestandardowy plan użytkownika
        if has_base_plan_id:
            plan_cols.append("base_plan_id")
            plan_vals.append(base_plan_id)  # Link do planu bazowego
        
        plan_cols_str = ', '.join(plan_cols)
        placeholders = ', '.join(['%s'] * len(plan_cols))
        
        cur.execute(f"""
            INSERT INTO training_plans ({plan_cols_str})
            VALUES ({placeholders})
            RETURNING id
        """, plan_vals)
        new_plan_id = cur.fetchone()[0]
        
        # Skopiuj dni planu
        cur.execute("""
            INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
            SELECT %s, name, day_order, day_of_week
            FROM plan_days
            WHERE plan_id = %s
            ORDER BY day_order
            RETURNING id
        """, [new_plan_id, base_plan_id])
        
        new_day_ids = [row[0] for row in cur.fetchall()]
        
        # Skopiuj ćwiczenia z dni
        cur.execute("""
            SELECT pd.id as old_day_id, pd.day_order
            FROM plan_days pd
            WHERE pd.plan_id = %s
            ORDER BY pd.day_order
        """, [base_plan_id])
        
        old_days = cur.fetchall()
        day_mapping = {}
        for old_day_id, day_order in old_days:
            # Znajdź odpowiadający nowy dzień
            day_idx = day_order - 1
            if day_idx < len(new_day_ids):
                day_mapping[old_day_id] = new_day_ids[day_idx]
        
        # Kopiuj ćwiczenia dla każdego dnia
        for old_day_id, new_day_id in day_mapping.items():
            cur.execute("""
                INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
                SELECT %s, exercise_id, target_sets, target_reps, rest_seconds, superset_group
                FROM plan_exercises
                WHERE plan_day_id = %s
            """, [new_day_id, old_day_id])
        
        # Opcjonalnie: Zapisz historię zmian
        try:
            cur.execute("""
                INSERT INTO plan_history (plan_id, changed_by, changes)
                VALUES (%s, %s, %s::jsonb)
            """, [new_plan_id, user_id, json.dumps({
                'action': 'copied_from_base',
                'base_plan_id': base_plan_id,
                'customizations': {
                    'name': new_name != base_plan[1],
                    'goal': new_goal != base_plan[3],
                    'level': new_level != base_plan[4],
                    'days': new_days != base_plan[5],
                    'equipment': new_equipment != base_plan[6],
                }
            })])
        except Exception as e:
            # Jeśli tabela plan_history nie istnieje, po prostu kontynuuj
            pass
        
        # Ustaw jako aktywny plan
        cur.execute("""
            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
            VALUES (%s, %s, CURRENT_DATE)
            ON CONFLICT (auth_account_id) DO UPDATE 
            SET plan_id = EXCLUDED.plan_id, start_date = CURRENT_DATE
        """, [user_id, new_plan_id])
    
    return JsonResponse({
        "success": True, 
        "planId": new_plan_id,
        "message": "Plan został skopiowany i dostosowany",
        "basePlanId": base_plan_id
    }, status=201)