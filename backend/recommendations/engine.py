# backend/recommendations/engine.py
from typing import Dict, List, Tuple
from django.db import connection
from math import log
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# HEALTH & SAFETY - Mapowania kontuzji i schorzeń
# ============================================================================

# Mapowanie kontuzji → tagi ćwiczeń do unikania
INJURY_EXERCISE_BLACKLIST = {
    'knee': ['squat', 'przysiady', 'wypady', 'lunge', 'leg_press', 'running', 'bieganie'],
    'knee_left': ['squat', 'przysiady', 'wypady', 'lunge', 'leg_press'],
    'knee_right': ['squat', 'przysiady', 'wypady', 'lunge', 'leg_press'],
    'lower_back': ['deadlift', 'martwy', 'squat', 'przysiady', 'overhead', 'wyciskanie nad głową', 'rowing', 'wiosłowanie'],
    'shoulder': ['overhead', 'nad głową', 'bench_press', 'wyciskanie', 'dips', 'pompki na poręczach'],
    'shoulder_left': ['overhead', 'nad głową', 'bench_press', 'wyciskanie', 'dips'],
    'shoulder_right': ['overhead', 'nad głową', 'bench_press', 'wyciskanie', 'dips'],
    'elbow': ['tricep', 'triceps', 'curl', 'biceps', 'dips', 'pompki'],
    'wrist': ['plank', 'deska', 'pushup', 'pompki', 'bench_press', 'wyciskanie'],
    'neck': ['overhead', 'shrug', 'wznosy barków', 'deadlift'],
    'ankle': ['running', 'bieganie', 'jump', 'skoki', 'lunge', 'wypady'],
}

# Mapowanie schorzeń → ograniczenia intensywności i typów planów
HEALTH_CONDITION_RULES = {
    'hypertension': {  # Nadciśnienie
        'max_intensity': 'umiarkowana',
        'avoid_types': ['hiit', 'crossfit'],
        'warning': 'Unikaj wysokiej intensywności (nadciśnienie)'
    },
    'asthma': {  # Astma
        'max_intensity': 'umiarkowana',
        'avoid_types': ['hiit', 'cardio_intensive'],
        'warning': 'Unikaj intensywnego cardio (astma)'
    },
    'diabetes': {  # Cukrzyca
        'prefer_types': ['strength', 'hybrid'],
        'warning': 'Preferuj trening siłowy (cukrzyca - stabilizacja glukozy)'
    },
    'heart_condition': {  # Problemy z sercem
        'max_intensity': 'niska',
        'avoid_types': ['hiit', 'crossfit', 'plyo'],
        'warning': 'TYLKO niska intensywność (problemy z sercem)'
    },
    'arthritis': {  # Artretyzm
        'max_intensity': 'umiarkowana',
        'avoid_types': ['hiit', 'plyo'],
        'warning': 'Unikaj high-impact (artretyzm)'
    },
}

# Mapowanie poziomów intensywności na liczby (do porównywania)
INTENSITY_LEVELS = {
    'niska': 1,
    'umiarkowana': 2,
    'wysoka': 3,
    'bardzo_wysoka': 4,
    'hiit': 5,
}

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
    """Fetch user profile from database including health data."""
    q = """
    SELECT 
        goal, level, training_days_per_week, equipment_preference,
        weight_kg, height_cm, bmi, injuries, health_conditions
    FROM user_profiles
    WHERE auth_account_id = %s
    """
    with connection.cursor() as cur:
        cur.execute(q, [auth_account_id])
        row = cur.fetchone()
        if not row:
            logger.warning(f"[Engine] No profile found for user_id: {auth_account_id}")
            return {}
    # 🔧 Parse JSONB fields (mogą być stringami lub już listami)
    import json
    def parse_jsonb(value):
        if not value:
            return []
        if isinstance(value, str):
            try:
                return json.loads(value)
            except:
                return []
        if isinstance(value, list):
            return value
        return []
    
    profile = {
        'goal': _norm(row[0]),
        'level': _norm(row[1]),
        'days': row[2],
        'equipment': _norm(row[3]),
        'weight_kg': float(row[4]) if row[4] else None,  # 🆕
        'height_cm': int(row[5]) if row[5] else None,  # 🆕
        'bmi': float(row[6]) if row[6] else None,  # 🆕
        'injuries': parse_jsonb(row[7]),  # 🔧 Parse JSONB correctly
        'health_conditions': parse_jsonb(row[8]),  # 🔧 Parse JSONB correctly
    }
    logger.info(f"[Engine] Fetched profile for user {auth_account_id}: {profile}")
    return profile


def get_default_profile_for_new_user(goal=None, level=None, equipment=None) -> Dict:
    """
    🆕 COLD START SOLUTION: Stwórz sensowny profil domyślny dla nowego użytkownika
    na podstawie statystyk najpopularniejszych kombinacji.
    """
    logger.info(f"[ColdStart] Getting default profile for: goal={goal}, level={level}, equipment={equipment}")
    
    with connection.cursor() as cursor:
        # Znajdź najpopularniejsze kombinacje dla danego celu i poziomu
        cursor.execute("""
            SELECT 
                training_days_per_week,
                equipment_preference,
                COUNT(*) as popularity
            FROM user_profiles
            WHERE 1=1
                AND (%s IS NULL OR goal = %s)
                AND (%s IS NULL OR level = %s)
                AND training_days_per_week IS NOT NULL
                AND equipment_preference IS NOT NULL
            GROUP BY training_days_per_week, equipment_preference
            ORDER BY popularity DESC
            LIMIT 1
        """, [goal, goal, level, level])
        
        result = cursor.fetchone()
        
        if result:
            default_profile = {
                'days': result[0],
                'equipment': _norm(result[1]),
                'confidence': 'medium',  # oznacz poziom pewności
                'source': 'statistics'
            }
            logger.info(f"[ColdStart] Found popular combination: days={result[0]}, equipment={result[1]}, popularity={result[2]} users")
            return default_profile
        
        # Fallback - najbezpieczniejsze wartości dla początkujących
        logger.info(f"[ColdStart] No statistics found, using safe defaults")
        return {
            'days': 3,
            'equipment': 'silownia',
            'confidence': 'low',
            'source': 'hardcoded_safe'
        }


def calculate_profile_completeness(user: Dict) -> float:
    """
    🆕 Oblicz kompletność profilu użytkownika (0.0 - 1.0)
    """
    required_fields = ['goal', 'level', 'days', 'equipment']
    filled_fields = sum(1 for field in required_fields if user.get(field))
    completeness = filled_fields / len(required_fields)
    return completeness


def enhance_profile_with_defaults(user: Dict) -> Dict:
    """
    🆕 COLD START SOLUTION: Uzupełnij niepełny profil domyślnymi wartościami
    """
    # Sprawdź kompletność profilu
    completeness = calculate_profile_completeness(user)
    
    if completeness >= 0.75:  # 3/4 pól wypełnionych
        logger.info(f"[ColdStart] Profile complete ({completeness:.0%}), no enhancement needed")
        return user
    
    logger.warning(f"[ColdStart] Profile incomplete ({completeness:.0%}), enhancing with defaults...")
    
    # Pobierz domyślne wartości na podstawie tego co mamy
    defaults = get_default_profile_for_new_user(
        goal=user.get('goal'), 
        level=user.get('level'),
        equipment=user.get('equipment')
    )
    
    # Uzupełnij brakujące pola (user ma priorytet nad defaults)
    enhanced_profile = {**defaults, **user}
    
    # Dodaj metadane o uzupełnieniu
    enhanced_profile['was_enhanced'] = True
    enhanced_profile['original_completeness'] = completeness
    
    logger.info(f"[ColdStart] Profile enhanced: {enhanced_profile}")
    
    return enhanced_profile


def _content_candidates() -> List[Tuple]:
    """Get all active BASE training plans with popularity stats + health data (intensity, type)."""
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
        ROUND(AVG(uap.rating)::numeric, 2) AS avg_rating,
        COALESCE(tp.intensity_level, 'umiarkowana') AS intensity_level,
        COALESCE(tp.plan_type, 'hybrid') AS plan_type
    FROM training_plans tp
    LEFT JOIN user_active_plans uap ON uap.plan_id = tp.id
    WHERE COALESCE(tp.is_active, TRUE) = TRUE
      AND tp.name <> 'Demo'
      AND COALESCE(tp.is_base_plan, TRUE) = TRUE
    GROUP BY
        tp.id, tp.name, tp.description, tp.goal_type,
        tp.difficulty_level, tp.training_days_per_week, tp.equipment_required,
        tp.intensity_level, tp.plan_type
    ORDER BY
        COUNT(DISTINCT uap.auth_account_id) DESC,
        AVG(uap.rating) DESC NULLS LAST
    """
    with connection.cursor() as cur:
        cur.execute(q)
        results = cur.fetchall()
    logger.info(f"[Engine] Found {len(results)} active base plans")
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


# ============================================================================
# HEALTH FILTERING - BMI, Injuries, Health Conditions
# ============================================================================

def _get_intensity_level(intensity_str: str) -> int:
    """Zamień intensity string na poziom liczbowy"""
    return INTENSITY_LEVELS.get(intensity_str, 2)  # Default: umiarkowana


def _bmi_gate_and_score(user_bmi: float, plan_intensity: str, plan_goal: str) -> Tuple[bool, float]:
    """
    🆕 BMI-based filtering & scoring
    
    BMI Categories (WHO):
    - < 18.5: Niedowaga → BLOKUJ HIIT, preferuj masę
    - 18.5-24.9: Norma → wszystkie plany OK + bonus
    - 25-29.9: Nadwaga → preferuj spalanie, unikaj bardzo wysokiej intensywności
    - 30+: Otyłość → BLOKUJ high-impact, TYLKO low/moderate
    
    Returns: (pass_gate, score_points)
    """
    if not user_bmi or user_bmi <= 0:
        return True, 0.0  # Brak BMI → nie filtruj, brak punktów
    
    intensity_level = _get_intensity_level(plan_intensity)
    
    # ========== HARD GATES (BLOKUJ niebezpieczne plany) ==========
    
    if user_bmi < 18.5:  # Niedowaga
        if intensity_level >= 4:  # bardzo_wysoka lub hiit
            logger.info(f"[BMI Gate] BLOKUJ plan (niedowaga BMI {user_bmi}, intensywność {plan_intensity})")
            return False, 0.0
    
    elif user_bmi >= 30:  # Otyłość
        if intensity_level >= 4:  # bardzo_wysoka lub hiit
            logger.info(f"[BMI Gate] BLOKUJ plan (otyłość BMI {user_bmi}, intensywność {plan_intensity})")
            return False, 0.0
    
    # ========== SCORING (punkty za dopasowanie) ==========
    score = 0.0
    
    if user_bmi < 18.5:  # Niedowaga
        if intensity_level <= 2:  # niska/umiarkowana
            score += 5  # Preferuj łagodne budowanie
        if plan_goal == 'masa':
            score += 3  # Bonus za cel "masa"
    
    elif 18.5 <= user_bmi < 25:  # Norma (zdrowy zakres)
        score += 6  # Bonus za zdrowy BMI - wszystkie plany OK
    
    elif 25 <= user_bmi < 30:  # Nadwaga
        if plan_goal == 'spalanie':
            score += 5  # Preferuj redukcję
        if intensity_level == 2:  # umiarkowana
            score += 3  # Preferuj umiarkowaną (bezpieczniej)
    
    elif user_bmi >= 30:  # Otyłość
        if plan_goal == 'spalanie':
            score += 6  # Priorytet: redukcja
        if intensity_level <= 2:  # niska/umiarkowana
            score += 2  # Bezpieczna intensywność
    
    logger.info(f"[BMI Score] BMI {user_bmi} → plan {plan_intensity}/{plan_goal} → +{score} pkt")
    return True, score


def _get_plan_exercise_tags(plan_id: int) -> List[str]:
    """
    Pobierz tagi ćwiczeń z planu (nazwy + opisy ćwiczeń)
    Używane do sprawdzania czy plan zawiera niebezpieczne ćwiczenia
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT LOWER(e.name), LOWER(e.description), LOWER(e.type)
                FROM plan_exercises pe
                JOIN plan_days pd ON pe.plan_day_id = pd.id
                JOIN exercises e ON pe.exercise_id = e.id
                WHERE pd.plan_id = %s
            """, [plan_id])
            
            tags = []
            for row in cursor.fetchall():
                name, desc, ex_type = row[0] or '', row[1] or '', row[2] or ''
                tags.extend([name, desc, ex_type])
            
            return [t for t in tags if t]  # Usuń puste
    except Exception as e:
        logger.error(f"[Engine] Error getting exercise tags for plan {plan_id}: {e}")
        return []


def _injury_filter(user_injuries: List[str], plan_id: int) -> Tuple[bool, str]:
    """
    🆕 Injury-based filtering
    Sprawdź czy plan zawiera ćwiczenia niebezpieczne dla kontuzjowanych
    
    Returns: (is_safe, warning_message)
    """
    if not user_injuries or user_injuries == [] or user_injuries == ['none']:
        return True, None
    
    # Pobierz tagi ćwiczeń z planu
    exercise_tags = _get_plan_exercise_tags(plan_id)
    if not exercise_tags:
        return True, None  # Brak danych → przepuść
    
    # Połącz wszystkie tagi w jeden string do szybszego wyszukiwania
    all_tags_str = ' '.join(exercise_tags).lower()
    
    dangerous_found = []
    for injury in user_injuries:
        if injury == 'none':
            continue
        
        blacklist = INJURY_EXERCISE_BLACKLIST.get(injury, [])
        for blocked_term in blacklist:
            if blocked_term.lower() in all_tags_str:
                dangerous_found.append((injury, blocked_term))
                break  # Wystarczy jeden match dla tej kontuzji
    
    if dangerous_found:
        injury_names = {i[0] for i in dangerous_found}
        injury_labels = {
            'knee': 'kolano', 'knee_left': 'lewe kolano', 'knee_right': 'prawe kolano',
            'lower_back': 'dolny odcinek kręgosłupa', 'shoulder': 'bark',
            'shoulder_left': 'lewy bark', 'shoulder_right': 'prawy bark',
            'elbow': 'łokieć', 'wrist': 'nadgarstek', 'neck': 'szyja', 'ankle': 'kostka'
        }
        readable_injuries = ', '.join(injury_labels.get(i, i) for i in injury_names)
        warning = f"Plan zawiera ćwiczenia niebezpieczne dla: {readable_injuries}"
        logger.info(f"[Injury Filter] BLOKUJ plan {plan_id} (kontuzja: {readable_injuries})")
        return False, warning
    
    return True, None


def _health_gate(user_conditions: List[str], plan_type: str, plan_intensity: str) -> Tuple[bool, List[str]]:
    """
    🆕 Health conditions filtering
    Filtruj plany na podstawie schorzeń (nadciśnienie, astma, etc.)
    
    Returns: (pass_gate, warnings_list)
    """
    if not user_conditions or user_conditions == [] or user_conditions == ['none']:
        return True, []
    
    warnings = []
    intensity_level = _get_intensity_level(plan_intensity)
    
    for condition in user_conditions:
        if condition == 'none':
            continue
        
        rules = HEALTH_CONDITION_RULES.get(condition)
        if not rules:
            continue
        
        # Sprawdź max intensywność (HARD GATE)
        if 'max_intensity' in rules:
            max_allowed = _get_intensity_level(rules['max_intensity'])
            if intensity_level > max_allowed:
                logger.info(f"[Health Gate] BLOKUJ plan (schorzenie: {condition}, intensywność {plan_intensity} > {rules['max_intensity']})")
                return False, [rules['warning']]
        
        # Sprawdź avoid types (HARD GATE)
        if 'avoid_types' in rules and plan_type in rules['avoid_types']:
            logger.info(f"[Health Gate] BLOKUJ plan (schorzenie: {condition}, typ {plan_type} w avoid list)")
            return False, [rules['warning']]
        
        # Dodaj soft warning (ale przepuść plan)
        if 'prefer_types' in rules and plan_type not in rules['prefer_types']:
            warnings.append(rules['warning'])
    
    return True, warnings


def content_based(user: Dict) -> List[Dict]:
    """Content-based recommendation algorithm with COLD START support."""
    
    # 🆕 COLD START: Uzupełnij niepełny profil domyślnymi wartościami
    user = enhance_profile_with_defaults(user)
    
    rows = _content_candidates()
    results = []
    logger.info(f"[Engine] User profile for matching: {user}")
    
    # 🆕 Pobierz health data użytkownika
    user_bmi = user.get('bmi')
    user_injuries = user.get('injuries', [])
    user_conditions = user.get('health_conditions', [])

    for (pid, name, desc, goal, level, days, equip, total_users, avg_rating, intensity, plan_type) in rows:
        # TWARDY GATE – wstępna selekcja jakości
        if not _hard_gate(user, goal, level, days, equip):
            continue
        
        # 🆕 HEALTH GATE 1: BMI
        bmi_pass, bmi_score = _bmi_gate_and_score(user_bmi, intensity, goal)
        if not bmi_pass:
            continue  # BLOKUJ plan niebezpieczny dla BMI
        
        # 🆕 HEALTH GATE 2: Injuries
        injury_safe, injury_warning = _injury_filter(user_injuries, pid)
        if not injury_safe:
            continue  # BLOKUJ plan z niebezpiecznymi ćwiczeniami
        
        # 🆕 HEALTH GATE 3: Health Conditions
        health_pass, health_warnings = _health_gate(user_conditions, plan_type, intensity)
        if not health_pass:
            continue  # BLOKUJ plan niebezpieczny dla schorzenia

        g = _norm(goal)
        lv = _norm(level)
        eq = _norm(equip)
        score = 0.0
        match_details = []
        score_breakdown = {}  # 🆕 Szczegółowy rozkład punktów

        # Goal
        user_goal = _norm(user.get('goal'))
        goal_points = 0
        if user_goal and g:
            if user_goal == g:
                goal_points = 15
                score += 15
                match_details.append(f"Goal match: {user_goal}")
        score_breakdown['goal'] = {'points': goal_points, 'max': 15, 'matched': goal_points > 0}

        # Level
        user_level = _norm(user.get('level'))
        level_points = 0
        if user_level and lv:
            if user_level == lv:
                level_points = 10
                score += 10
                match_details.append(f"Level match: {user_level}")
            elif user_level == 'sredniozaawansowany' and lv in ('poczatkujacy', 'zaawansowany'):
                level_points = 5
                score += 5
        score_breakdown['level'] = {'points': level_points, 'max': 10, 'matched': level_points > 0}

        # Days
        days_score = _score_days(user.get('days'), days)
        score += days_score
        if days_score > 8:
            match_details.append(f"Days match: {user.get('days')} vs {days}")
        score_breakdown['days'] = {
            'points': days_score, 
            'max': 12, 
            'matched': days_score > 0,
            'user_value': user.get('days'),
            'plan_value': days,
            'difference': abs((user.get('days') or 0) - (days or 0))
        }

        # Equipment – miękka kara za brak zgodności
        user_equip = _norm(user.get('equipment'))
        equipment_points = 0
        if user_equip and eq:
            if user_equip == eq:
                equipment_points = 8
                score += 8
                match_details.append(f"Equipment match: {user_equip}")
            else:
                equipment_points = -2
                score -= 2
        score_breakdown['equipment'] = {'points': equipment_points, 'max': 8, 'matched': equipment_points > 0}

        # Popularity
        popularity_points = _popularity_boost(total_users, avg_rating)
        score += popularity_points
        score_breakdown['popularity'] = {
            'points': round(popularity_points, 2), 
            'max': 6, 
            'total_users': total_users,
            'avg_rating': float(avg_rating) if avg_rating is not None else None
        }
        
        # 🆕 BMI Score (już obliczone w gate, teraz dodajemy do breakdown)
        score += bmi_score
        score_breakdown['bmi'] = {
            'points': round(bmi_score, 2),
            'max': 8,
            'user_bmi': user_bmi,
            'matched': bmi_score > 0
        }
        
        # 🆕 Health Safety Bonus (brak warnings = bezpieczny plan)
        health_bonus = 0
        if not health_warnings and not injury_warning:
            health_bonus = 5
            score += health_bonus
        score_breakdown['health_safety'] = {
            'points': health_bonus,
            'max': 5,
            'matched': health_bonus > 0,
            'has_warnings': bool(health_warnings or injury_warning)
        }

        # wynik
        if score > 0:
            # 🆕 Zbierz wszystkie health warnings
            all_health_warnings = []
            if health_warnings:
                all_health_warnings.extend(health_warnings)
            if injury_warning:
                all_health_warnings.append(injury_warning)
            
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
                    'intensity': intensity,  # 🆕 Intensity level
                    'plan_type': plan_type,  # 🆕 Plan type
                    'total_users': total_users,
                    'avg_rating': float(avg_rating) if avg_rating is not None else None,
                    'score_breakdown': score_breakdown,  # 🆕 Szczegółowy breakdown
                    'health_warnings': all_health_warnings,  # 🆕 Health warnings
                }
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    
    # 🆕 COLD START: Dodaj informację o uzupełnieniu profilu do metadanych
    if user.get('was_enhanced'):
        for result in results:
            if 'meta' not in result:
                result['meta'] = {}
            result['meta']['profile_enhanced'] = True
            result['meta']['profile_completeness'] = user.get('original_completeness', 0)
            result['meta']['enhancement_source'] = user.get('source', 'unknown')
    
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
    """
    ⚠️ DEPRECATED - używane tylko dla CF
    Normalize scores using min-max normalization (relative to current set).
    """
    if not items:
        return {}
    vals = [i['score'] for i in items]
    mn, mx = min(vals), max(vals)
    if mx == mn:
        return {i['plan_id']: 100.0 for i in items}
    return {i['plan_id']: ((i['score'] - mn) / (mx - mn)) * 100.0 for i in items}


def _absolute_norm_cb(items: List[Dict]) -> Dict[int, float]:
    """
    🆕 ABSOLUTE NORMALIZATION for Content-Based
    Normalizacja do teoretycznego maksimum (64 pkt):
    - Goal: 15 pkt
    - Level: 10 pkt  
    - Days: 12 pkt
    - Equipment: 8 pkt
    - Popularity: 6 pkt
    - BMI: 8 pkt (🆕)
    - Health Safety: 5 pkt (🆕)
    Total: 64 pkt → 100%
    """
    MAX_CB_SCORE = 64.0  # 🆕 Zaktualizowano z 51 na 64
    result = {}
    for item in items:
        score = item['score']
        # Normalizuj do 0-100 na podstawie maksymalnego możliwego wyniku
        normalized = (score / MAX_CB_SCORE) * 100.0
        # Ogranicz do 0-100 (na wypadek przekroczenia)
        normalized = max(0.0, min(100.0, normalized))
        result[item['plan_id']] = normalized
    return result


def calculate_adaptive_weights(user_id: int, user: Dict) -> Tuple[float, float]:
    """
    🆕 ML-INSPIRED ADAPTIVE WEIGHTS
    Oblicz optymalne wagi Content-Based vs Collaborative na podstawie:
    1. Kompletności profilu użytkownika (więcej CB gdy pełny profil)
    2. Liczby podobnych użytkowników (więcej CF gdy dużo podobnych)
    3. Historii aktywacji (więcej CF gdy doświadczony użytkownik)
    
    Returns: (cb_weight, cf_weight) gdzie suma = 1.0
    """
    
    # 1. KOMPLETNOŚĆ PROFILU (0.0 - 1.0)
    profile_score = calculate_profile_completeness(user)
    
    # 2. LICZBA PODOBNYCH UŻYTKOWNIKÓW (0.0 - 1.0)
    similar_users = _similar_user_ids(user_id)
    # Normalizacja: 0 podobnych = 0.0, 20+ podobnych = 1.0
    similarity_score = min(1.0, len(similar_users) / 20.0)
    
    # 3. HISTORIA AKTYWACJI (0.0 - 1.0)
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM user_active_plans WHERE auth_account_id = %s
        """, [user_id])
        history_count = cursor.fetchone()[0] or 0
    # Normalizacja: 0 planów = 0.0, 3+ planów = 1.0
    history_score = min(1.0, history_count / 3.0)
    
    # 4. OBLICZ WAGI (ADAPTIVE FORMULA)
    # Logika:
    # - Wysoki profile_score → więcej CB (znamy preferencje)
    # - Wysoki similarity_score → więcej CF (mamy podobnych)
    # - Wysoki history_score → więcej CF (ufamy społeczności)
    
    # Bazowa waga CB: 0.5 (50%)
    cb_weight = 0.5
    
    # Dodaj za kompletność profilu (max +0.3)
    cb_weight += 0.3 * profile_score
    
    # Odejmij za podobieństwo (max -0.2)
    cb_weight -= 0.2 * similarity_score
    
    # Odejmij za historię (max -0.1)
    cb_weight -= 0.1 * history_score
    
    # Ogranicz do sensownych zakresów: 50-90% CB, 10-50% CF
    cb_weight = max(0.5, min(0.9, cb_weight))
    cf_weight = 1.0 - cb_weight
    
    logger.info(f"[AdaptiveWeights] User {user_id}:")
    logger.info(f"  Profile completeness: {profile_score:.2%}")
    logger.info(f"  Similar users: {len(similar_users)} ({similarity_score:.2%})")
    logger.info(f"  History: {history_count} plans ({history_score:.2%})")
    logger.info(f"  → Weights: CB={cb_weight:.2%}, CF={cf_weight:.2%}")
    
    return cb_weight, cf_weight


def hybrid(user_id: int, user: Dict) -> List[Dict]:
    """
    🆕 ADAPTIVE HYBRID: Dynamiczne wagi CB/CF zamiast statycznych 75/25
    Wagi dostosowują się do profilu użytkownika i kontekstu społecznego.
    """
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
        logger.info("[Engine] Only one algorithm has results, returning available")
        # 🆕 Dla samego CB, normalizuj absolutnie
        if cb:
            cbn_abs = _absolute_norm_cb(cb)
            for item in cb:
                item['score'] = cbn_abs[item['plan_id']]
                # 🆕 Dodaj metadane o CF score (0 jeśli CF nie zwrócił wyników)
                if 'meta' not in item:
                    item['meta'] = {}
                item['meta']['cf_score'] = 0.0
                item['meta']['cb_score'] = cbn_abs[item['plan_id']]
                item['meta']['cb_weight'] = 1.0
                item['meta']['cf_weight'] = 0.0
        return cb

    # 🆕 Użyj ABSOLUTE normalizacji dla CB, min-max dla CF
    cbn = _absolute_norm_cb(cb)
    cfn = _minmax_norm(cf)

    # 🆕 ADAPTIVE WEIGHTS: Oblicz dynamiczne wagi zamiast statycznych 75/25
    cb_weight, cf_weight = calculate_adaptive_weights(user_id, user)

    all_plan_ids = set(cbn.keys()) | set(cfn.keys())
    out: List[Dict] = []
    for pid in all_plan_ids:
        cb_score = cbn.get(pid, 0.0)
        cf_score = cfn.get(pid, 0.0)
        
        # 🆕 Użyj adaptacyjnych wag zamiast hardkodowanych
        combined_score = cb_weight * cb_score + cf_weight * cf_score
        
        # 🆕 OCHRONA: Finalny wynik nie może być niższy niż 80% wartości CB
        # (zapobiega sytuacji gdzie plan z wysokim CB ma niski finalny przez CF)
        min_score = cb_score * 0.8
        if combined_score < min_score:
            logger.info(f"[Hybrid] Plan {pid}: combined={combined_score:.2f}% < min={min_score:.2f}% (80% of CB={cb_score:.2f}%), boosting to {min_score:.2f}%")
            combined_score = min_score

        meta = {}
        for item in cb:
            if item['plan_id'] == pid:
                meta = item.get('meta', {})
                break
        
        # 🆕 Dodaj metadane o wagach i score'ach
        meta['cb_weight'] = round(cb_weight, 3)
        meta['cf_weight'] = round(cf_weight, 3)
        meta['cb_score'] = round(cb_score, 2)  # 🆕 CB score w %
        meta['cf_score'] = round(cf_score, 2)  # 🆕 CF score w %
        meta['was_boosted'] = combined_score == min_score  # 🆕 Flaga czy został boostowany

        out.append({'plan_id': pid, 'score': combined_score, 'meta': meta})

    out.sort(key=lambda x: x['score'], reverse=True)
    logger.info(f"[Engine] Adaptive Hybrid returning {len(out)} recommendations (CB: {cb_weight:.0%}, CF: {cf_weight:.0%})")
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


# ============================================================================
# K-NEAREST NEIGHBORS & PLAN SIMILARITY
# ============================================================================

def calculate_user_similarity(user1: Dict, user2: Dict) -> float:
    """
    Oblicz podobieństwo między dwoma użytkownikami (0.0 - 1.0)
    Na podstawie profilu: goal, level, days, equipment, weight, height, BMI
    """
    similarity = 0.0
    factors = 0
    
    # Goal (waga: 0.3)
    if user1.get('goal') and user2.get('goal'):
        if _norm(user1['goal']) == _norm(user2['goal']):
            similarity += 0.3
        factors += 0.3
    
    # Level (waga: 0.2)
    if user1.get('level') and user2.get('level'):
        if _norm(user1['level']) == _norm(user2['level']):
            similarity += 0.2
        factors += 0.2
    
    # Days (waga: 0.2)
    if user1.get('days') and user2.get('days'):
        days_diff = abs(int(user1['days']) - int(user2['days']))
        if days_diff == 0:
            similarity += 0.2
        elif days_diff == 1:
            similarity += 0.15
        elif days_diff == 2:
            similarity += 0.1
        factors += 0.2
    
    # Equipment (waga: 0.1)
    if user1.get('equipment') and user2.get('equipment'):
        if _norm(user1['equipment']) == _norm(user2['equipment']):
            similarity += 0.1
        factors += 0.1
    
    # BMI similarity (waga: 0.2)
    bmi1 = user1.get('bmi')
    bmi2 = user2.get('bmi')
    if bmi1 and bmi2:
        bmi_diff = abs(float(bmi1) - float(bmi2))
        if bmi_diff < 2:
            similarity += 0.2
        elif bmi_diff < 5:
            similarity += 0.15
        elif bmi_diff < 10:
            similarity += 0.1
        factors += 0.2
    
    return similarity / factors if factors > 0 else 0.0


def find_k_nearest_neighbors(user_id: int, k: int = 5) -> List[Tuple[int, float]]:
    """
    Znajdź k najbliższych sąsiadów użytkownika na podstawie podobieństwa profilu.
    Zwraca listę (user_id, similarity_score) posortowaną malejąco.
    """
    user_profile = fetch_user_profile(user_id)
    if not user_profile:
        logger.warning(f"[KNN] No profile found for user {user_id}")
        return []
    
    # Pobierz wszystkich innych użytkowników z aktywnymi planami
    q = """
    SELECT DISTINCT 
        up.auth_account_id,
        up.goal,
        up.level,
        up.training_days_per_week,
        up.equipment_preference,
        up.weight_kg,
        up.height_cm,
        up.bmi
    FROM user_profiles up
    WHERE up.auth_account_id != %s
      AND up.goal IS NOT NULL
      AND up.level IS NOT NULL
      AND up.training_days_per_week IS NOT NULL
    """
    
    with connection.cursor() as cur:
        cur.execute(q, [user_id])
        all_users = cur.fetchall()
    
    similarities = []
    for other_user_row in all_users:
        other_id = other_user_row[0]
        other_profile = {
            'goal': _norm(other_user_row[1]),
            'level': _norm(other_user_row[2]),
            'days': other_user_row[3],
            'equipment': _norm(other_user_row[4]),
            'weight_kg': float(other_user_row[5]) if other_user_row[5] else None,
            'height_cm': int(other_user_row[6]) if other_user_row[6] else None,
            'bmi': float(other_user_row[7]) if other_user_row[7] else None,
        }
        
        sim_score = calculate_user_similarity(user_profile, other_profile)
        similarities.append((other_id, sim_score))
    
    # Sortuj malejąco i zwróć k najlepszych
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:k]


def calculate_plan_similarity(plan1_id: int, plan2_id: int) -> float:
    """
    Oblicz podobieństwo między dwoma planami treningowymi (0.0 - 1.0)
    Na podstawie: ćwiczeń, celów, poziomu, dni, sprzętu
    """
    q = """
    SELECT 
        tp.id,
        tp.goal_type,
        tp.difficulty_level,
        tp.training_days_per_week,
        tp.equipment_required,
        ARRAY_AGG(DISTINCT pe.exercise_id) as exercise_ids
    FROM training_plans tp
    LEFT JOIN plan_days pd ON tp.id = pd.plan_id
    LEFT JOIN plan_exercises pe ON pd.id = pe.plan_day_id
    WHERE tp.id IN (%s, %s)
    GROUP BY tp.id, tp.goal_type, tp.difficulty_level, tp.training_days_per_week, tp.equipment_required
    """
    
    with connection.cursor() as cur:
        cur.execute(q, [plan1_id, plan2_id])
        plans_data = cur.fetchall()
    
    if len(plans_data) != 2:
        return 0.0
    
    plan1 = {
        'goal': _norm(plans_data[0][1]),
        'level': _norm(plans_data[0][2]),
        'days': plans_data[0][3],
        'equipment': _norm(plans_data[0][4]),
        'exercises': set(plans_data[0][5] or []),
    }
    plan2 = {
        'goal': _norm(plans_data[1][1]),
        'level': _norm(plans_data[1][2]),
        'days': plans_data[1][3],
        'equipment': _norm(plans_data[1][4]),
        'exercises': set(plans_data[1][5] or []),
    }
    
    similarity = 0.0
    
    # Goal match (waga: 0.2)
    if plan1['goal'] == plan2['goal']:
        similarity += 0.2
    
    # Level match (waga: 0.15)
    if plan1['level'] == plan2['level']:
        similarity += 0.15
    
    # Days similarity (waga: 0.15)
    if plan1['days'] and plan2['days']:
        days_diff = abs(int(plan1['days']) - int(plan2['days']))
        if days_diff == 0:
            similarity += 0.15
        elif days_diff == 1:
            similarity += 0.1
        elif days_diff == 2:
            similarity += 0.05
    
    # Equipment match (waga: 0.1)
    if plan1['equipment'] == plan2['equipment']:
        similarity += 0.1
    
    # Exercise overlap (waga: 0.4) - Jaccard similarity
    if plan1['exercises'] and plan2['exercises']:
        intersection = len(plan1['exercises'] & plan2['exercises'])
        union = len(plan1['exercises'] | plan2['exercises'])
        if union > 0:
            jaccard = intersection / union
            similarity += 0.4 * jaccard
    
    return min(1.0, similarity)


def get_plans_by_similar_users(user_id: int, k: int = 5, limit: int = 10) -> List[Dict]:
    """
    Znajdź plany używane przez k najbliższych sąsiadów użytkownika.
    Zwraca posortowaną listę planów według popularności wśród podobnych użytkowników.
    """
    neighbors = find_k_nearest_neighbors(user_id, k)
    if not neighbors:
        logger.info(f"[KNN] No neighbors found for user {user_id}")
        return []
    
    neighbor_ids = [n[0] for n in neighbors]
    
    q = """
    SELECT 
        tp.id,
        tp.name,
        tp.description,
        tp.goal_type,
        tp.difficulty_level,
        tp.training_days_per_week,
        tp.equipment_required,
        COUNT(DISTINCT uap.auth_account_id) as usage_count,
        AVG(uap.rating) as avg_rating
    FROM training_plans tp
    INNER JOIN user_active_plans uap ON uap.plan_id = tp.id
    WHERE uap.auth_account_id = ANY(%s)
      AND COALESCE(tp.is_base_plan, TRUE) = TRUE
      AND COALESCE(tp.is_active, TRUE) = TRUE
    GROUP BY tp.id, tp.name, tp.description, tp.goal_type, 
             tp.difficulty_level, tp.training_days_per_week, tp.equipment_required
    ORDER BY usage_count DESC, avg_rating DESC NULLS LAST
    LIMIT %s
    """
    
    with connection.cursor() as cur:
        cur.execute(q, [neighbor_ids, limit])
        results = cur.fetchall()
    
    plans = []
    for row in results:
        plans.append({
            'plan_id': row[0],
            'name': row[1],
            'description': row[2],
            'goal_type': row[3],
            'difficulty_level': row[4],
            'training_days_per_week': row[5],
            'equipment_required': row[6],
            'usage_count': row[7],
            'avg_rating': float(row[8]) if row[8] else None,
            'recommendation_method': 'knn_collaborative',
            'similarity_score': None,  # Można dodać szczegółowe score
        })
    
    logger.info(f"[KNN] Found {len(plans)} plans from {len(neighbors)} similar users")
    return plans


__all__ = [
    "RecommendationService",
    "fetch_user_profile",
    "content_based",
    "collaborative",
    "hybrid",
    "plan_details",
    "explain_match",
    "get_default_profile_for_new_user",
    "calculate_profile_completeness",
    "enhance_profile_with_defaults",
    "calculate_adaptive_weights",
    "find_k_nearest_neighbors",
    "calculate_plan_similarity",
    "calculate_user_similarity",
    "get_plans_by_similar_users",
]