# backend/recommendations/engine.py
from typing import Dict, List, Tuple
from django.db import connection
from math import log


# ---------- helpery ----------

def _norm(s):
    if not s:
        return None
    repl = {'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ż': 'z', 'ź': 'z'}
    out = ''.join(repl.get(ch, ch) for ch in s.lower())
    return out


def fetch_user_profile(auth_account_id: int) -> Dict:
    q = """
    SELECT goal, level, training_days_per_week, equipment_preference
    FROM user_profiles WHERE auth_account_id = %s
    """
    with connection.cursor() as cur:
        cur.execute(q, [auth_account_id])
        row = cur.fetchone()
        if not row:
            return {}
    return {
        'goal': _norm(row[0]),
        'level': _norm(row[1]),
        'days': row[2],
        'equipment': _norm(row[3]),
    }


def _content_candidates() -> List[Tuple]:
    q = """
    SELECT tp.id, tp.name, tp.description, tp.goal_type, tp.difficulty_level,
           tp.training_days_per_week, tp.equipment_required,
           vps.total_users, vps.avg_rating
    FROM training_plans tp
    LEFT JOIN v_plan_statistics vps ON vps.plan_id = tp.id
    WHERE tp.is_active = TRUE
    """
    with connection.cursor() as cur:
        cur.execute(q)
        return cur.fetchall()


def _score_days(user_days, plan_days):
    if user_days is None or plan_days is None:
        return 0
    diff = abs(int(user_days) - int(plan_days))
    return 12 if diff == 0 else 8 if diff == 1 else 4 if diff == 2 else 0


def _popularity_boost(total_users, avg_rating):
    tu = total_users or 0
    ar = float(avg_rating) if avg_rating is not None else 3.0
    return min(10.0, (log(1 + tu) * 2.0) + (ar - 3.0) * 1.5)


def content_based(user: Dict) -> List[Dict]:
    rows = _content_candidates()
    results = []
    for (pid, name, desc, goal, level, days, equip, total_users, avg_rating) in rows:
        g = _norm(goal)
        lv = _norm(level)
        eq = _norm(equip)
        score = 0
        if user.get('goal') and g == user['goal']:
            score += 10
        if user.get('level') and lv == user['level']:
            score += 8
        score += _score_days(user.get('days'), days)
        if user.get('equipment') and eq == user['equipment']:
            score += 5
        score += _popularity_boost(total_users, avg_rating)
        if score > 0:
            results.append({
                'plan_id': pid,
                'score': float(score),
                'meta': {
                    'name': name, 'desc': desc, 'days': days, 'goal': goal,
                    'level': level, 'equipment': equip,
                    'total_users': total_users, 'avg_rating': avg_rating
                }
            })
    results.sort(key=lambda x: x['score'], reverse=True)
    return results


def _similar_user_ids(user_id: int) -> List[int]:
    q = "SELECT similar_user_id FROM v_similar_users WHERE user_id = %s"
    with connection.cursor() as cur:
        cur.execute(q, [user_id])
        return [r[0] for r in cur.fetchall()]


def collaborative(user_id: int) -> List[Dict]:
    sims = _similar_user_ids(user_id)
    if not sims:
        return []
    with connection.cursor() as cur:
        cur.execute("""
            SELECT plan_id,
                   COUNT(*) AS activations,
                   AVG(COALESCE(rating,3)) AS avg_rating
            FROM user_active_plans
            WHERE auth_account_id = ANY(%s)
            GROUP BY plan_id
        """, [sims])
        act = {r[0]: {'activations': r[1], 'avg_rating': float(r[2]) if r[2] else 3.0}
               for r in cur.fetchall()}

        cur.execute("""
            SELECT plan_id, COUNT(*) FROM training_sessions
            WHERE auth_account_id = ANY(%s) AND plan_id IS NOT NULL
            GROUP BY plan_id
        """, [sims])
        ses = {r[0]: r[1] for r in cur.fetchall()}

    results = []
    for pid, meta in act.items():
        base = meta['activations'] * 1.0 + meta['avg_rating'] * 2.0
        bonus = (ses.get(pid, 0) * 0.2)
        score = base + bonus
        results.append({'plan_id': pid, 'score': float(score)})
    results.sort(key=lambda x: x['score'], reverse=True)
    return results


def _minmax_norm(items: List[Dict]) -> Dict[int, float]:
    if not items:
        return {}
    vals = [i['score'] for i in items]
    mn, mx = min(vals), max(vals)
    if mx == mn:
        return {i['plan_id']: 100.0 for i in items}
    return {i['plan_id']: ((i['score'] - mn) / (mx - mn)) * 100.0 for i in items}


def hybrid(user_id: int, user: Dict) -> List[Dict]:
    cb = content_based(user)
    if not cb:
        return []
    cf = collaborative(user_id)
    cbn = _minmax_norm(cb)
    cfn = _minmax_norm(cf)
    out = []
    for i in cb:
        pid = i['plan_id']
        score = 0.6 * cbn.get(pid, 0.0) + 0.4 * cfn.get(pid, 0.0)
        if not cf:
            score = cbn.get(pid, 0.0)
        out.append({'plan_id': pid, 'score': float(score), 'meta': i['meta']})
    out.sort(key=lambda x: x['score'], reverse=True)
    return out


def plan_details(ids: List[int]) -> Dict[int, Dict]:
    if not ids:
        return {}
    with connection.cursor() as cur:
        q = """
        SELECT id, name, description, goal_type, difficulty_level,
               training_days_per_week, equipment_required
        FROM training_plans WHERE id = ANY(%s)
        """
        cur.execute(q, [ids])
        return {
            r[0]: {
                'id': r[0], 'name': r[1], 'description': r[2],
                'goal_type': r[3], 'difficulty_level': r[4],
                'training_days_per_week': r[5], 'equipment_required': r[6]
            } for r in cur.fetchall()
        }


def explain_match(user: Dict, plan: Dict, total_users, avg_rating) -> List[str]:
    reasons = []
    if user.get('goal') and _norm(plan['goal_type']) == user['goal']:
        reasons.append("Cel zgodny")
    if user.get('level') and _norm(plan['difficulty_level']) == user['level']:
        reasons.append("Poziom zgodny")
    if user.get('days') and plan['training_days_per_week'] == user['days']:
        reasons.append("Tyle samo dni/tydz.")
    if user.get('equipment') and _norm(plan['equipment_required']) == user['equipment']:
        reasons.append("Sprzęt zgodny")
    if (total_users or 0) >= 5:
        reasons.append("Popularny wśród użytkowników")
    return reasons


# ---------- klasa zgodna z oczekiwanym importem ----------

class RecommendationService:
    """
    Adapter: zapewnia interfejs używany przez widoki:
      - get_recommendations(user_id, mode)
      - get_plan_details(plan_ids)
      - close_connection()
    Korzysta z globalnego połączenia Django (django.db.connection).
    """

    def __init__(self, db_params: Dict | None = None):
        # Django samo zarządza pool'em połączeń – trzymamy referencję tylko dla zgodności.
        self.conn = connection

    def get_recommendations(self, user_id: int, mode: str = "hybrydowo") -> List[Dict]:
        user = fetch_user_profile(user_id)
        mode = (mode or "").lower()
        if mode in ("hybrydowo", "hybrid"):
            return hybrid(user_id, user)
        if mode in ("produkt", "product", "content"):
            return content_based(user)
        if mode in ("klient", "user", "collaborative"):
            return collaborative(user_id)
        # domyślnie hybryda
        return hybrid(user_id, user)

    def get_plan_details(self, plan_ids: List[int]) -> Dict[int, Dict]:
        return plan_details(plan_ids)

    def close_connection(self) -> None:
        # Opcjonalnie można zamknąć – ale w Django nie jest to konieczne.
        try:
            self.conn.close()
        except Exception:
            pass


__all__ = ["RecommendationService",
           "fetch_user_profile", "content_based", "collaborative",
           "hybrid", "plan_details", "explain_match"]
