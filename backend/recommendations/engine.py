# backend/recommendations/engine.py
from typing import Dict, List, Tuple
from django.db import connection
from math import log
import logging

logger = logging.getLogger(__name__)

# ---------- helpers ----------

def _norm(s):
    """Normalize string for database comparison"""
    if not s:
        return None
    repl = {'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'}
    s = ''.join(repl.get(ch, ch) for ch in str(s).lower())
    mapping = {
        'początkujący': 'poczatkujacy', 'poczatkujacy': 'poczatkujacy',
        'średniozaawansowany': 'sredniozaawansowany', 'sredniozaawansowany': 'sredniozaawansowany',
        'zaawansowany': 'zaawansowany',
        'siłownia': 'silownia', 'silownia': 'silownia',
        'dom - podstawowy': 'dom_podstawowy', 'dom_podstawowy': 'dom_podstawowy',
        'dom - zaawansowany': 'dom_zaawansowany', 'dom_zaawansowany': 'dom_zaawansowany',
        'masa ciała': 'masa_ciala', 'masa_ciala': 'masa_ciala',
        'minimalne': 'minimalne',
        'masa': 'masa',
        'siła': 'sila', 'sila': 'sila',
        'wytrzymałość': 'wytrzymalosc', 'wytrzymalosc': 'wytrzymalosc',
        'spalanie': 'spalanie', 'spalanie tłuszczu': 'spalanie',
        'zdrowie': 'zdrowie', 'ogólne zdrowie': 'zdrowie',
    }
    return mapping.get(s, s)


def fetch_user_profile(auth_account_id: int) -> Dict:
    """Fetch user profile from database (plural table name)."""
    q = """
    SELECT goal, level, training_days_per_week, equipment_preference
    FROM user_profiles
    WHERE auth_account_id = %s
    """
    with connection.cursor() as cur:
        cur.execute(q, [auth_account_id])
        row = cur.fetchone()
        if not row:
            logger.warning(f"[Engine] No profile found for user_id: {auth_account_id}")
            return {}
    profile = {
        'goal': _norm(row[0]),
        'level': _norm(row[1]),
        'days': row[2],
        'equipment': _norm(row[3]),
    }
    logger.info(f"[Engine] Fetched profile for user {auth_account_id}: {profile}")
    return profile


def _content_candidates() -> List[Tuple]:
    """Get all active training plans with popularity stats."""
    q = """
    SELECT
        tp.id AS plan_id,
        tp.name,
        tp.description,
        tp.goal_type,
        tp.difficulty_level,
        tp.training_days_per_week,
        tp.equipment_required,
        COUNT(DISTINCT uap.auth_account_id) AS total_users,
        ROUND(AVG(uap.rating)::numeric, 2) AS avg_rating
    FROM training_plans tp
    LEFT JOIN user_active_plans uap ON uap.plan_id = tp.id
    WHERE COALESCE(tp.is_active, TRUE) = TRUE
      AND tp.name <> 'Demo'
    GROUP BY
        tp.id, tp.name, tp.description, tp.goal_type,
        tp.difficulty_level, tp.training_days_per_week, tp.equipment_required
    ORDER BY
        COUNT(DISTINCT uap.auth_account_id) DESC,
        AVG(uap.rating) DESC NULLS LAST
    """
    with connection.cursor() as cur:
        cur.execute(q)
        results = cur.fetchall()
    logger.info(f"[Engine] Found {len(results)} active plans")
    return results


def _score_days(user_days, plan_days):
    if user_days is None or plan_days is None:
        return 0
    diff = abs(int(user_days) - int(plan_days))
    if diff == 0:
        return 12
    elif diff == 1:
        return 8
    elif diff == 2:
        return 4
    else:
        return 1


def _days_ok(user_days, plan_days, tolerance=1):
    if user_days is None or plan_days is None:
        return True
    try:
        return abs(int(user_days) - int(plan_days)) <= tolerance
    except Exception:
        return False


def _hard_gate(user: Dict, g: str, lv: str, d: int, eq: str) -> bool:
    """
    Twarde kryteria – jeśli nie przejdą, plan nie jest oceniany w ogóle.
    - cel: dokładny match (obowiązkowy)
    - poziom: dopuszczamy różnice (tylko BLOKUJ jeśli jest za trudny)
    - dni: różnica ≤ 2 (bardziej elastycznie)
    - sprzęt: NIE BLOKUJ (oceniamy punktami)
    """
    ug = _norm(user.get('goal'))
    ul = _norm(user.get('level'))
    
    # CEL: musi się zgadzać (jeśli użytkownik podał)
    if ug and _norm(g) != ug:
        return False
    
    # POZIOM: blokuj TYLKO jeśli plan jest zaawansowany a użytkownik początkujący
    # (inne kombinacje dopuszczamy)
    if ul and _norm(lv):
        plan_level = _norm(lv)
        user_level = ul
        # Blokuj zaawansowane plany dla początkujących
        if user_level == 'poczatkujacy' and plan_level == 'zaawansowany':
            return False
    
    # DNI: bardziej elastycznie - różnica do 2 dni
    if not _days_ok(user.get('days'), d, tolerance=2):
        return False
    
    # SPRZĘT: NIE BLOKUJ - oceniamy w punktacji
    # (użytkownik może mieć dostęp do różnego sprzętu)
    
    return True


def _popularity_boost(total_users, avg_rating):
    tu = total_users or 0
    ar = float(avg_rating) if avg_rating is not None else 3.0
    # łagodniej niż wcześniej – max 6 pkt
    return min(6.0, (log(1 + tu) * 1.2) + (ar - 3.0) * 1.0)


def content_based(user: Dict) -> List[Dict]:
    """Content-based recommendation algorithm."""
    rows = _content_candidates()
    results = []
    logger.info(f"[Engine] User profile for matching: {user}")

    for (pid, name, desc, goal, level, days, equip, total_users, avg_rating) in rows:
        # TWARDY GATE – wstępna selekcja jakości
        if not _hard_gate(user, goal, level, days, equip):
            continue

        g = _norm(goal)
        lv = _norm(level)
        eq = _norm(equip)
        score = 0.0
        match_details = []

        # Goal
        user_goal = _norm(user.get('goal'))
        if user_goal and g:
            if user_goal == g:
                score += 15
                match_details.append(f"Goal match: {user_goal}")

        # Level
        user_level = _norm(user.get('level'))
        if user_level and lv:
            if user_level == lv:
                score += 10
                match_details.append(f"Level match: {user_level}")
            elif user_level == 'sredniozaawansowany' and lv in ('poczatkujacy', 'zaawansowany'):
                score += 5

        # Days
        days_score = _score_days(user.get('days'), days)
        score += days_score
        if days_score > 8:
            match_details.append(f"Days match: {user.get('days')} vs {days}")

        # Equipment – miękka kara za brak zgodności
        user_equip = _norm(user.get('equipment'))
        if user_equip and eq:
            if user_equip == eq:
                score += 8
                match_details.append(f"Equipment match: {user_equip}")
            else:
                score -= 2

        # Popularity
        score += _popularity_boost(total_users, avg_rating)

        # wynik
        if score > 0:
            results.append({
                'plan_id': pid,
                'score': float(score),
                'meta': {
                    'name': name,
                    'desc': desc,
                    'days': days,
                    'goal': goal,
                    'level': level,
                    'equipment': equip,
                    'total_users': total_users,
                    'avg_rating': float(avg_rating) if avg_rating is not None else None,
                }
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    logger.info(f"[Engine] Content-based returning {len(results)} recommendations")
    return results


def _similar_user_ids(user_id: int) -> List[int]:
    """Get similar user IDs based on profile similarity (plural table)."""
    query = """
    WITH me AS (
        SELECT goal, level, training_days_per_week, equipment_preference
        FROM user_profiles
        WHERE auth_account_id = %s
    )
    SELECT DISTINCT up.auth_account_id
    FROM user_profiles up
    CROSS JOIN me
    WHERE up.auth_account_id != %s
      AND (
            up.goal = me.goal
         OR up.level = me.level
         OR up.training_days_per_week = me.training_days_per_week
         OR up.equipment_preference = me.equipment_preference
      )
    LIMIT 50
    """
    try:
        with connection.cursor() as cur:
            cur.execute(query, [user_id, user_id])
            similar_ids = [r[0] for r in cur.fetchall()]
        logger.info(f"[Engine] Found {len(similar_ids)} similar users for user {user_id}")
        return similar_ids
    except Exception as e:
        logger.error(f"[Engine] Error finding similar users: {str(e)}")
        return []


def collaborative(user_id: int) -> List[Dict]:
    """Collaborative filtering recommendation algorithm."""
    sims = _similar_user_ids(user_id)
    if not sims:
        logger.warning(f"[Engine] No similar users found for user {user_id}")
        return []
    try:
        with connection.cursor() as cur:
            cur.execute("""
                SELECT plan_id,
                       COUNT(*) AS activations,
                       AVG(COALESCE(rating, 3)) AS avg_rating
                FROM user_active_plans
                WHERE auth_account_id = ANY(%s)
                GROUP BY plan_id
                ORDER BY COUNT(*) DESC, AVG(rating) DESC NULLS LAST
            """, [sims])
            results = []
            for plan_id, activations, avg_rating in cur.fetchall():
                score = activations * 1.0 + (float(avg_rating) if avg_rating is not None else 3.0) * 2.0
                results.append({'plan_id': plan_id, 'score': float(score)})
        results.sort(key=lambda x: x['score'], reverse=True)
        logger.info(f"[Engine] Collaborative returning {len(results)} recommendations")
        return results
    except Exception as e:
        logger.error(f"[Engine] Error in collaborative filtering: {str(e)}")
        return []


def _minmax_norm(items: List[Dict]) -> Dict[int, float]:
    """Normalize scores using min-max normalization."""
    if not items:
        return {}
    vals = [i['score'] for i in items]
    mn, mx = min(vals), max(vals)
    if mx == mn:
        return {i['plan_id']: 100.0 for i in items}
    return {i['plan_id']: ((i['score'] - mn) / (mx - mn)) * 100.0 for i in items}


def hybrid(user_id: int, user: Dict) -> List[Dict]:
    """Hybrid recommendation: treść 75%, CF 25%, CF tylko na planach zgodnych treściowo."""
    cb = content_based(user)
    cf = collaborative(user_id)

    if not cb and not cf:
        logger.warning("[Engine] Both content-based and collaborative returned no results")
        return []

    # Przepuszczamy CF tylko dla planów, które przeszły gate treści (są w CB)
    allowed_ids = {i['plan_id'] for i in cb}
    cf = [i for i in cf if i['plan_id'] in allowed_ids]

    # Jeśli CB puste (nie powinno), albo CF po filtrze puste – zwracamy CB
    if not cb or not cf:
        return cb

    cbn = _minmax_norm(cb)
    cfn = _minmax_norm(cf)

    all_plan_ids = set(cbn.keys()) | set(cfn.keys())
    out: List[Dict] = []
    for pid in all_plan_ids:
        cb_score = cbn.get(pid, 0.0)
        cf_score = cfn.get(pid, 0.0)
        combined_score = 0.75 * cb_score + 0.25 * cf_score

        meta = {}
        for item in cb:
            if item['plan_id'] == pid:
                meta = item.get('meta', {})
                break

        out.append({'plan_id': pid, 'score': combined_score, 'meta': meta})

    out.sort(key=lambda x: x['score'], reverse=True)
    logger.info(f"[Engine] Hybrid returning {len(out)} recommendations")
    return out


def plan_details(ids: List[int]) -> Dict[int, Dict]:
    """Get detailed information for specific plan IDs including days/workouts."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"[plan_details] Called with IDs: {ids}")
    
    if not ids:
        logger.info(f"[plan_details] No IDs provided, returning empty dict")
        return {}
    
    with connection.cursor() as cur:
        # Najpierw pobierz podstawowe informacje o planach
        q_plans = """
        SELECT
            id AS plan_id,
            name, description, goal_type, difficulty_level,
            training_days_per_week, equipment_required
        FROM training_plans
        WHERE id = ANY(%s)
        """
        cur.execute(q_plans, [ids])
        plans = {
            r[0]: {
                'plan_id': r[0],
                'name': r[1],
                'description': r[2],
                'goal_type': r[3],
                'difficulty_level': r[4],
                'training_days_per_week': r[5],
                'equipment_required': r[6],
                'days': []  # Zainicjalizuj pustą tablicę
            } for r in cur.fetchall()
        }
        
        logger.info(f"[plan_details] Found {len(plans)} plans")
        
        # Teraz pobierz dni treningowe dla każdego planu z ćwiczeniami
        for plan_id in plans.keys():
            # Pobierz dni
            q_days = """
            SELECT
                pd.id,
                pd.name,
                pd.day_order,
                pd.day_of_week
            FROM plan_days pd
            WHERE pd.plan_id = %s
            ORDER BY pd.day_order
            """
            cur.execute(q_days, [plan_id])
            days_rows = cur.fetchall()
            
            logger.info(f"[plan_details] Plan {plan_id}: found {len(days_rows)} days")
            
            days = []
            for day_row in days_rows:
                day_id, day_name, day_order, day_of_week = day_row
                logger.info(f"[plan_details] Plan {plan_id}, Day {day_order}: {day_name}")
                
                # Pobierz ćwiczenia dla tego dnia
                q_exercises = """
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
                """
                cur.execute(q_exercises, [day_id])
                exercises_rows = cur.fetchall()
                
                logger.info(f"[plan_details] Day {day_id}: found {len(exercises_rows)} exercises")
                
                exercises = []
                for ex_row in exercises_rows:
                    ex_id, ex_name, ex_desc, ex_muscle, ex_type, ex_video, ex_image, sets, reps, rest, superset = ex_row
                    exercises.append({
                        'id': ex_id,
                        'name': ex_name,
                        'description': ex_desc,
                        'muscle_group': ex_muscle,
                        'type': ex_type,
                        'video_url': ex_video,
                        'image_url': ex_image,
                        'sets': sets,
                        'reps': reps,
                        'rest_seconds': rest,
                        'superset_group': superset
                    })
                
                days.append({
                    'dayNumber': day_order,
                    'title': day_name or f'Dzień {day_order}',
                    'name': day_name or f'Dzień {day_order}',
                    'dayOfWeek': day_of_week,
                    'exercises': exercises
                })
            
            plans[plan_id]['days'] = days
            logger.info(f"[plan_details] Plan {plan_id}: assigned {len(days)} days with exercises")
        
        logger.info(f"[plan_details] Returning plans with days: {list(plans.keys())}")
        return plans


def explain_match(user: Dict, plan: Dict, total_users=None, avg_rating=None) -> List[str]:
    """Explain why a plan matches the user (accepts goal/goal_type synonyms)."""
    reasons: List[str] = []

    p_goal = _norm(plan.get('goal_type') or plan.get('goal'))
    p_level = _norm(plan.get('difficulty_level') or plan.get('level'))
    p_days = plan.get('training_days_per_week') or plan.get('days')
    p_equip = _norm(plan.get('equipment_required') or plan.get('equipment'))

    if user.get('goal') and p_goal == _norm(user.get('goal')):
        reasons.append(f"Zgodny z celem: {user.get('goal')}")
    if user.get('level') and p_level == _norm(user.get('level')):
        reasons.append(f"Odpowiedni poziom: {user.get('level')}")
    if user.get('days') and p_days == user.get('days'):
        reasons.append(f"Pasuje do harmonogramu: {user.get('days')} dni/tydzień")
    if user.get('equipment') and p_equip == _norm(user.get('equipment')):
        reasons.append(f"Odpowiedni sprzęt: {user.get('equipment')}")
    if (total_users or 0) >= 5:
        reasons.append(f"Popularny wśród {total_users} użytkowników")
    if avg_rating and float(avg_rating) > 4.0:
        reasons.append(f"Wysoko oceniany: {float(avg_rating):.1f}/5")

    return reasons or ["Dopasowany do Twoich preferencji"]


# ---------- class compatible with expected import ----------

class RecommendationService:
    """Adapter providing interface for views."""

    def __init__(self, db_params: Dict = None):
        self.conn = connection

    def get_recommendations(self, user_id: int, mode: str = "hybrid") -> List[Dict]:
        user = fetch_user_profile(user_id)
        mode = (mode or "").lower()
        if mode in ("hybrid", "hybrydowo"):
            return hybrid(user_id, user)
        if mode in ("product", "content", "produkt", "content_based"):
            return content_based(user)
        if mode in ("user", "collaborative", "klient"):
            return collaborative(user_id)
        return hybrid(user_id, user)

    def get_plan_details(self, plan_ids: List[int]) -> Dict[int, Dict]:
        return plan_details(plan_ids)

    def close_connection(self) -> None:
        try:
            self.conn.close()
        except Exception:
            pass


__all__ = [
    "RecommendationService",
    "fetch_user_profile",
    "content_based",
    "collaborative",
    "hybrid",
    "plan_details",
    "explain_match",
]