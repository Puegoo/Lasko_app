# backend/recommendations/exercise_engine.py
"""
Algorytm rekomendacji ćwiczeń na poziomie pojedynczych ćwiczeń.
Umożliwia użytkownikom budowanie własnych planów z rekomendowanych ćwiczeń.
"""
from typing import Dict, List, Tuple, Optional
from django.db import connection
from math import log
import logging
import json

logger = logging.getLogger(__name__)

# Import funkcji z głównego engine.py
from .engine import (
    fetch_user_profile,
    _norm,
    _bmi_gate_and_score,
    _injury_filter,
    _health_gate,
    INTENSITY_LEVELS,
    INJURY_EXERCISE_BLACKLIST,
    HEALTH_CONDITION_RULES,
    calculate_profile_completeness,
    _similar_user_ids,
    calculate_adaptive_weights
)

# ============================================================================
# MAPOWANIA CEL → GRUPY MIĘŚNIOWE
# ============================================================================

GOAL_MUSCLE_GROUPS = {
    'masa': ['chest', 'back', 'legs', 'shoulders', 'arms'],  # Wszystkie grupy
    'sila': ['chest', 'back', 'legs'],  # Główne grupy siłowe
    'spalanie': ['legs', 'chest', 'back', 'core'],  # Duże grupy mięśniowe
    'wytrzymalosc': ['legs', 'core', 'cardio'],  # Wytrzymałość
    'zdrowie': ['full_body', 'core', 'flexibility'],  # Ogólne zdrowie
}

# Priorytety grup mięśniowych dla każdego celu
GOAL_MUSCLE_PRIORITIES = {
    'masa': {
        'chest': 20, 'back': 20, 'legs': 25, 'shoulders': 15, 'arms': 10, 'core': 10
    },
    'sila': {
        'chest': 25, 'back': 30, 'legs': 35, 'shoulders': 10
    },
    'spalanie': {
        'legs': 30, 'chest': 20, 'back': 20, 'core': 30
    },
    'wytrzymalosc': {
        'legs': 40, 'core': 30, 'cardio': 30
    },
    'zdrowie': {
        'full_body': 40, 'core': 30, 'flexibility': 30
    },
}

# ============================================================================
# POZIOM ZAAWANSOWANIA → ZŁOŻONOŚĆ ĆWICZENIA
# ============================================================================

LEVEL_EXERCISE_COMPLEXITY = {
    'poczatkujacy': ['beginner', 'intermediate'],  # Tylko proste ćwiczenia
    'sredniozaawansowany': ['beginner', 'intermediate', 'advanced'],  # Wszystkie
    'zaawansowany': ['intermediate', 'advanced', 'expert'],  # Bez prostych
}

# ============================================================================
# CONTENT-BASED SCORING DLA ĆWICZEŃ
# ============================================================================

def _score_exercise_content_based(exercise: Dict, user: Dict) -> Tuple[float, Dict]:
    """
    Ocenia pojedyncze ćwiczenie na podstawie preferencji użytkownika.
    
    Returns: (score, breakdown)
    """
    score = 0.0
    breakdown = {
        'goal_match': 0,
        'level_match': 0,
        'equipment_match': 0,
        'muscle_group': 0,
        'max': 50  # Maksymalny score dla content-based
    }
    
    user_goal = _norm(user.get('goal', ''))
    user_level = _norm(user.get('level', ''))
    user_equipment = _norm(user.get('equipment', ''))
    
    exercise_muscle = exercise.get('muscle_group', '').lower()
    exercise_type = exercise.get('type', '').lower()
    exercise_name = exercise.get('name', '').lower()
    
    # 1. DOPASOWANIE DO CELU (0-15 pkt)
    if user_goal in GOAL_MUSCLE_PRIORITIES:
        priorities = GOAL_MUSCLE_PRIORITIES[user_goal]
        for muscle, priority in priorities.items():
            if muscle in exercise_muscle or muscle.replace('_', ' ') in exercise_muscle:
                score += (priority / 100.0) * 15
                breakdown['goal_match'] = (priority / 100.0) * 15
                break
    
    # 2. DOPASOWANIE DO POZIOMU (0-10 pkt)
    # Założenie: ćwiczenia mają pole 'complexity' (beginner/intermediate/advanced/expert)
    exercise_complexity = exercise.get('complexity', 'intermediate').lower()
    if user_level in LEVEL_EXERCISE_COMPLEXITY:
        allowed = LEVEL_EXERCISE_COMPLEXITY[user_level]
        if exercise_complexity in allowed:
            if user_level == 'poczatkujacy' and exercise_complexity == 'beginner':
                score += 10  # Idealne dopasowanie
                breakdown['level_match'] = 10
            elif user_level == 'sredniozaawansowany' and exercise_complexity == 'intermediate':
                score += 10
                breakdown['level_match'] = 10
            elif user_level == 'zaawansowany' and exercise_complexity in ['advanced', 'expert']:
                score += 10
                breakdown['level_match'] = 10
            else:
                score += 5  # Dopuszczalne, ale nie idealne
                breakdown['level_match'] = 5
    
    # 3. DOPASOWANIE SPRZĘTU (0-10 pkt)
    # Założenie: ćwiczenia mają pole 'equipment' (array lub string)
    exercise_equipment = exercise.get('equipment', [])
    if isinstance(exercise_equipment, str):
        exercise_equipment = [exercise_equipment]
    
    user_equipment_normalized = _norm(user_equipment)
    equipment_mapping = {
        'silownia': ['barbell', 'dumbbells', 'machine', 'cables', 'bench'],
        'dom_podstawowy': ['dumbbells', 'bench', 'bodyweight'],
        'masa_ciala': ['bodyweight'],
        'minimalne': ['bodyweight', 'resistance_bands'],
    }
    
    if user_equipment_normalized in equipment_mapping:
        required = equipment_mapping[user_equipment_normalized]
        if any(eq.lower() in [e.lower() for e in exercise_equipment] for eq in required):
            score += 10
            breakdown['equipment_match'] = 10
        elif 'bodyweight' in [e.lower() for e in exercise_equipment]:
            score += 5  # Bodyweight zawsze dostępne
            breakdown['equipment_match'] = 5
    
    # 4. PRIORYTET GRUPY MIĘŚNIOWEJ (0-10 pkt)
    if user_goal in GOAL_MUSCLE_PRIORITIES:
        priorities = GOAL_MUSCLE_PRIORITIES[user_goal]
        for muscle, priority in priorities.items():
            if muscle in exercise_muscle:
                score += (priority / 100.0) * 10
                breakdown['muscle_group'] = (priority / 100.0) * 10
                break
    
    # 5. BMI i Health Safety (0-5 pkt) - używamy funkcji z engine.py
    user_bmi = user.get('bmi')
    if user_bmi:
        # Sprawdź czy ćwiczenie jest odpowiednie dla BMI
        # (np. high-impact dla wysokiego BMI = -5 pkt)
        exercise_impact = exercise.get('impact_level', 'moderate').lower()
        if user_bmi >= 30 and exercise_impact in ['high', 'very_high']:
            score -= 5  # Kara za high-impact przy otyłości
        elif 18.5 <= user_bmi <= 24.9:
            score += 2  # Bonus dla normalnego BMI
            breakdown['bmi_bonus'] = 2
    
    # Ograniczenie do maksimum
    score = min(score, breakdown['max'])
    breakdown['total'] = score
    
    return score, breakdown


def _score_exercises_content_based(user: Dict) -> Dict[int, Tuple[float, Dict]]:
    """
    Ocenia wszystkie ćwiczenia na podstawie preferencji użytkownika.
    
    Returns: {exercise_id: (score, breakdown)}
    """
    results = {}
    
    try:
        with connection.cursor() as cursor:
            # Pobierz wszystkie aktywne ćwiczenia
            cursor.execute("""
                SELECT 
                    id, name, description, muscle_group, type,
                    COALESCE(
                        (SELECT jsonb_agg(eq.name)
                         FROM exercise_equipment ee
                         JOIN equipment eq ON ee.equipment_id = eq.id
                         WHERE ee.exercise_id = e.id),
                        '[]'::jsonb
                    ) as equipment
                FROM exercises e
                ORDER BY id
            """)
            
            exercises = cursor.fetchall()
            logger.info(f"[ExerciseEngine] Scoring {len(exercises)} exercises for content-based")
            
            for row in exercises:
                exercise_id = row[0]
                exercise = {
                    'id': exercise_id,
                    'name': row[1],
                    'description': row[2],
                    'muscle_group': row[3] or '',
                    'type': row[4] or '',
                    'equipment': row[5] or [],
                    'complexity': 'intermediate',  # Default - można dodać do tabeli exercises
                    'impact_level': 'moderate'  # Default - można dodać do tabeli exercises
                }
                
                # Filtruj kontuzje i schorzenia
                injuries = user.get('injuries', [])
                health_conditions = user.get('health_conditions', [])
                
                # Sprawdź czy ćwiczenie nie jest na blackliście
                should_skip = False
                for injury in injuries:
                    if injury in INJURY_EXERCISE_BLACKLIST:
                        blacklist = INJURY_EXERCISE_BLACKLIST[injury]
                        exercise_name_lower = exercise['name'].lower()
                        if any(bl in exercise_name_lower for bl in blacklist):
                            should_skip = True
                            break
                
                if should_skip:
                    continue
                
                # Oceniaj ćwiczenie
                score, breakdown = _score_exercise_content_based(exercise, user)
                if score > 0:  # Tylko ćwiczenia z dodatnim score
                    results[exercise_id] = (score, breakdown)
            
            logger.info(f"[ExerciseEngine] Content-based scored {len(results)} exercises")
            return results
            
    except Exception as e:
        logger.error(f"[ExerciseEngine] Error in content-based scoring: {e}")
        return {}


# ============================================================================
# COLLABORATIVE FILTERING DLA ĆWICZEŃ
# ============================================================================

def _score_exercises_collaborative(user_id: int, user: Dict) -> Dict[int, float]:
    """
    Ocenia ćwiczenia na podstawie wyborów podobnych użytkowników.
    
    Returns: {exercise_id: score}
    """
    results = {}
    
    try:
        # Znajdź podobnych użytkowników
        similar_users = _similar_user_ids(user_id)
        if not similar_users:
            logger.info(f"[ExerciseEngine] No similar users found for user {user_id}")
            return {}
        
        with connection.cursor() as cursor:
            # Znajdź ćwiczenia używane przez podobnych użytkowników
            # w ich aktywnych planach
            cursor.execute("""
                WITH similar_users_plans AS (
                    SELECT DISTINCT uap.plan_id
                    FROM user_active_plans uap
                    WHERE uap.auth_account_id = ANY(%s)
                      AND uap.is_completed = FALSE
                ),
                exercises_in_plans AS (
                    SELECT 
                        pe.exercise_id,
                        COUNT(DISTINCT sup.plan_id) as plan_count,
                        COUNT(DISTINCT uap.auth_account_id) as user_count
                    FROM similar_users_plans sup
                    JOIN plan_days pd ON sup.plan_id = pd.plan_id
                    JOIN plan_exercises pe ON pd.id = pe.plan_day_id
                    JOIN user_active_plans uap ON sup.plan_id = uap.plan_id
                    WHERE uap.auth_account_id = ANY(%s)
                    GROUP BY pe.exercise_id
                )
                SELECT 
                    exercise_id,
                    plan_count,
                    user_count,
                    (plan_count * 1.0 + user_count * 2.0) as score
                FROM exercises_in_plans
                ORDER BY score DESC
                LIMIT 100
            """, [similar_users, similar_users])
            
            for row in cursor.fetchall():
                exercise_id = row[0]
                score = float(row[3])
                results[exercise_id] = score
            
            logger.info(f"[ExerciseEngine] Collaborative scored {len(results)} exercises")
            return results
            
    except Exception as e:
        logger.error(f"[ExerciseEngine] Error in collaborative scoring: {e}")
        return {}


# ============================================================================
# HYBRID RECOMMENDATION (Content-Based + Collaborative)
# ============================================================================

def recommend_exercises(user_id: int, preferences: Optional[Dict] = None, 
                       selected_exercises: Optional[List[Dict]] = None,
                       current_day_muscle_groups: Optional[List[str]] = None,
                       week_muscle_groups: Optional[List[str]] = None) -> List[Dict]:
    """
    Główna funkcja rekomendacji ćwiczeń.
    
    Args:
        user_id: ID użytkownika
        preferences: Preferencje użytkownika (opcjonalne)
        selected_exercises: Lista już wybranych ćwiczeń (opcjonalne)
        current_day_muscle_groups: Partie mięśniowe już wybrane w aktualnym dniu (opcjonalne)
        week_muscle_groups: Partie mięśniowe już wybrane w całym tygodniu (opcjonalne)
    
    Returns: Lista ćwiczeń z score, reason, breakdown
    """
    try:
        # Pobierz profil użytkownika
        user = fetch_user_profile(user_id)
        
        # Nadpisz preferencjami z requesta
        if preferences:
            user.update(preferences)
        
        logger.info(f"[ExerciseEngine] Recommending exercises for user {user_id}")
        if current_day_muscle_groups:
            logger.info(f"[ExerciseEngine] Current day muscle groups: {current_day_muscle_groups}")
        if week_muscle_groups:
            logger.info(f"[ExerciseEngine] Week muscle groups: {week_muscle_groups}")
        
        # Content-Based Scoring
        cb_scores = _score_exercises_content_based(user)
        logger.info(f"[ExerciseEngine] Content-based found {len(cb_scores)} exercises")
        
        # Collaborative Filtering
        cf_scores = _score_exercises_collaborative(user_id, user)
        logger.info(f"[ExerciseEngine] Collaborative found {len(cf_scores)} exercises")
        
        # Adaptive Weights
        cb_weight, cf_weight = calculate_adaptive_weights(user_id, user)
        logger.info(f"[ExerciseEngine] Weights: CB={cb_weight:.2f}, CF={cf_weight:.2f}")
        
        # 🆕 Filtruj już wybrane ćwiczenia
        selected_exercise_ids = set()
        if selected_exercises:
            for ex in selected_exercises:
                if isinstance(ex, dict):
                    ex_id = ex.get('exercise_id') or ex.get('id')
                    if ex_id:
                        selected_exercise_ids.add(ex_id)
                elif isinstance(ex, int):
                    selected_exercise_ids.add(ex)
        
        # 🆕 Normalizuj nazwy partii mięśniowych do głównych kategorii (definicja przed użyciem)
        def normalize_muscle_group_for_priority(muscle_group: str) -> str:
            """Normalizuje nazwę partii mięśniowej do głównej kategorii (używane w get_muscle_group_priority)"""
            if not muscle_group:
                return 'other'
            
            muscle_lower = muscle_group.lower()
            
            # Mapowanie do głównych kategorii
            if any(m in muscle_lower for m in ['chest', 'klatka', 'pectoral']):
                return 'chest'
            elif any(m in muscle_lower for m in ['back', 'plecy', 'lat', 'rhomboid']):
                return 'back'
            elif any(m in muscle_lower for m in ['leg', 'noga', 'quad', 'hamstring', 'glute', 'poślad', 'calf', 'łydka']):
                return 'legs'
            elif any(m in muscle_lower for m in ['shoulder', 'bark', 'deltoid']):
                return 'shoulders'
            elif any(m in muscle_lower for m in ['bicep', 'biceps']):
                return 'biceps'
            elif any(m in muscle_lower for m in ['tricep', 'triceps']):
                return 'triceps'
            elif any(m in muscle_lower for m in ['core', 'abs', 'brzuch', 'abdominal']):
                return 'core'
            elif any(m in muscle_lower for m in ['cardio', 'cardio']):
                return 'cardio'
            else:
                return 'other'
        
        # 🆕 Mapowanie partii mięśniowych do priorytetów
        def get_muscle_group_priority(exercise_muscle_group: str) -> float:
            """Zwraca bonus/kara dla partii mięśniowej na podstawie już wybranych partii"""
            if not exercise_muscle_group:
                return 0.0
            
            # 🆕 Użyj znormalizowanych nazw dla porównań
            exercise_muscle_normalized = normalize_muscle_group_for_priority(exercise_muscle_group)
            priority = 1.0  # Domyślny mnożnik
            
            # 🆕 Kara za powtarzanie tej samej partii w aktualnym dniu
            if current_day_muscle_groups:
                day_muscle_normalized = [normalize_muscle_group_for_priority(m) for m in current_day_muscle_groups]
                if exercise_muscle_normalized in day_muscle_normalized:
                    priority *= 0.2  # 🆕 Bardzo duża kara (80% redukcja) za powtarzanie w tym samym dniu
            
            # 🆕 Bonus za różnorodność w tygodniu (priorytetyzuj partie które jeszcze nie były trenowane)
            if week_muscle_groups:
                week_muscle_normalized = [normalize_muscle_group_for_priority(m) for m in week_muscle_groups]
                
                if exercise_muscle_normalized not in week_muscle_normalized:
                    priority *= 2.0  # 🆕 Duży bonus (100% wzrost) za nową partię w tygodniu
                else:
                    # Sprawdź częstotliwość - jeśli partia była trenowana wiele razy, zmniejsz priorytet
                    count = week_muscle_normalized.count(exercise_muscle_normalized)
                    if count >= 2:
                        priority *= 0.5  # 🆕 Duża kara (50% redukcja) za zbyt częste trenowanie tej samej partii
                    elif count >= 1:
                        priority *= 0.8  # 🆕 Mała kara (20% redukcja) jeśli już była raz
            
            return priority
        
        # Połącz wyniki
        all_exercise_ids = set(list(cb_scores.keys()) + list(cf_scores.keys()))
        final_scores = {}
        
        for ex_id in all_exercise_ids:
            # 🆕 Pomiń już wybrane ćwiczenia
            if ex_id in selected_exercise_ids:
                continue
            
            cb_score, cb_breakdown = cb_scores.get(ex_id, (0, {}))
            cf_score = cf_scores.get(ex_id, 0)
            
            # Normalizuj CF score do 0-50 (żeby pasowało do CB max 50)
            if cf_score > 0:
                # Normalizuj do zakresu 0-50
                max_cf = max(cf_scores.values()) if cf_scores else 1
                normalized_cf = (cf_score / max_cf) * 50 if max_cf > 0 else 0
            else:
                normalized_cf = 0
            
            # Hybrid score
            hybrid_score = (cb_score * cb_weight) + (normalized_cf * cf_weight)
            
            # 🆕 Zastosuj priorytet partii mięśniowej
            # Musimy pobrać muscle_group ćwiczenia - zrobimy to później w pętli z exercise_details
            # Na razie zapisz hybrid_score bez modyfikacji
            
            # Dodaj breakdown
            breakdown = {
                'content_based': {
                    'score': cb_score,
                    'breakdown': cb_breakdown
                },
                'collaborative': {
                    'score': normalized_cf,
                    'raw_score': cf_score
                },
                'hybrid': {
                    'score': hybrid_score,
                    'cb_weight': cb_weight,
                    'cf_weight': cf_weight
                }
            }
            
            final_scores[ex_id] = (hybrid_score, breakdown)
        
        # Sortuj po score
        sorted_exercises = sorted(final_scores.items(), key=lambda x: x[1][0], reverse=True)
        
        # Pobierz szczegóły ćwiczeń
        exercise_ids = [ex_id for ex_id, _ in sorted_exercises[:100]]  # TOP 100
        
        if not exercise_ids:
            return []
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, name, description, muscle_group, type,
                    COALESCE(
                        (SELECT jsonb_agg(eq.name)
                         FROM exercise_equipment ee
                         JOIN equipment eq ON ee.equipment_id = eq.id
                         WHERE ee.exercise_id = e.id),
                        '[]'::jsonb
                    ) as equipment
                FROM exercises e
                WHERE id = ANY(%s)
            """, [exercise_ids])
            
            exercise_details = {row[0]: {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'muscle_group': row[3] or '',
                'type': row[4] or '',
                'equipment': row[5] or []
            } for row in cursor.fetchall()}
        
        # 🆕 Normalizuj nazwy partii mięśniowych do głównych kategorii (używana w select_diverse_exercises)
        def normalize_muscle_group_for_diversity(muscle_group: str) -> str:
            """Normalizuje nazwę partii mięśniowej do głównej kategorii"""
            if not muscle_group:
                return 'other'
            
            muscle_lower = str(muscle_group).lower().strip()
            
            # Mapowanie do głównych kategorii
            if any(m in muscle_lower for m in ['chest', 'klatka', 'pectoral', 'pec']):
                return 'chest'
            elif any(m in muscle_lower for m in ['back', 'plecy', 'lat', 'rhomboid', 'rear']):
                return 'back'
            elif any(m in muscle_lower for m in ['leg', 'noga', 'quad', 'hamstring', 'glute', 'poślad', 'calf', 'łydka', 'thigh', 'thighs']):
                return 'legs'
            elif any(m in muscle_lower for m in ['shoulder', 'bark', 'deltoid', 'delts']):
                return 'shoulders'
            elif any(m in muscle_lower for m in ['bicep', 'biceps']):
                return 'biceps'
            elif any(m in muscle_lower for m in ['tricep', 'triceps']):
                return 'triceps'
            elif any(m in muscle_lower for m in ['core', 'abs', 'brzuch', 'abdominal', 'abdominals']):
                return 'core'
            elif any(m in muscle_lower for m in ['cardio']):
                return 'cardio'
            else:
                return 'other'
        
        # 🆕 Zastosuj priorytety partii mięśniowych i przelicz score
        exercise_scores_with_priority = []
        for ex_id, (score, breakdown) in sorted_exercises[:100]:  # TOP 100 do filtrowania
            if ex_id not in exercise_details:
                continue
            
            exercise = exercise_details[ex_id]
            muscle_group = exercise.get('muscle_group', '')
            
            # 🆕 Zastosuj priorytet partii mięśniowej
            muscle_priority = get_muscle_group_priority(muscle_group)
            adjusted_score = score * muscle_priority
            
            # 🆕 Normalizuj partię mięśniową dla różnorodności
            normalized_muscle = normalize_muscle_group_for_diversity(muscle_group)
            
            exercise_scores_with_priority.append((ex_id, adjusted_score, score, breakdown, exercise, normalized_muscle))
            
            # 🆕 Loguj dla debugowania (tylko pierwsze 5)
            if len(exercise_scores_with_priority) <= 5:
                logger.info(f"[ExerciseEngine] Exercise {ex_id} ({exercise.get('name', 'N/A')}): muscle_group='{muscle_group}' -> normalized='{normalized_muscle}', priority={muscle_priority:.2f}, adjusted_score={adjusted_score:.2f}")
        
        # 🆕 Sortuj ponownie po adjusted_score
        exercise_scores_with_priority.sort(key=lambda x: x[1], reverse=True)
        
        # 🆕 WYMUSZ RÓŻNORODNOŚĆ: Wybierz TOP ćwiczenia z różnych partii mięśniowych
        def select_diverse_exercises(exercises_with_priority, target_count=3):
            """Wybiera ćwiczenia z różnych partii mięśniowych"""
            selected = []
            used_muscle_groups = set()
            
            # Najpierw wybierz TOP 1 z każdej partii (aż do target_count)
            for ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle in exercises_with_priority:
                if len(selected) >= target_count:
                    break
                
                if normalized_muscle not in used_muscle_groups:
                    selected.append((ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle))
                    used_muscle_groups.add(normalized_muscle)
            
            # Jeśli nie mamy wystarczająco różnych partii, dodaj najlepsze pozostałe
            if len(selected) < target_count:
                for ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle in exercises_with_priority:
                    if len(selected) >= target_count:
                        break
                    
                    # Sprawdź czy to ćwiczenie już nie jest wybrane
                    if not any(s[0] == ex_id for s in selected):
                        selected.append((ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle))
            
            return selected
        
        # 🆕 Wybierz różnorodne ćwiczenia dla TOP 3
        diverse_top3 = select_diverse_exercises(exercise_scores_with_priority, target_count=3)
        
        # 🆕 Loguj różnorodność dla debugowania
        if diverse_top3:
            diverse_muscles = [ex[5] for ex in diverse_top3]
            diverse_names = [ex[4].get('name', 'N/A') for ex in diverse_top3]
            logger.info(f"[ExerciseEngine] Diverse TOP 3: {diverse_names}")
            logger.info(f"[ExerciseEngine] Diverse TOP 3 muscle groups: {diverse_muscles}")
            
            # 🆕 Sprawdź czy faktycznie są różne
            unique_muscles = set(diverse_muscles)
            if len(unique_muscles) < len(diverse_top3):
                logger.warning(f"[ExerciseEngine] ⚠️ TOP 3 nie są różnorodne! Mamy tylko {len(unique_muscles)} unikalnych partii: {unique_muscles}")
            else:
                logger.info(f"[ExerciseEngine] ✅ TOP 3 są różnorodne: {len(unique_muscles)} różnych partii")
        
        # 🆕 Pozostałe ćwiczenia (dla pełnej listy TOP 50)
        remaining_exercises = []
        selected_ids = {ex[0] for ex in diverse_top3}
        for ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle in exercise_scores_with_priority:
            if ex_id not in selected_ids:
                remaining_exercises.append((ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle))
            if len(remaining_exercises) >= 47:  # TOP 50 - 3 już wybrane
                break
        
        # 🆕 Połącz: najpierw różnorodne TOP 3, potem reszta
        all_selected_exercises = diverse_top3 + remaining_exercises
        
        # Zbuduj wynikową listę
        results = []
        for ex_id, adjusted_score, original_score, breakdown, exercise, normalized_muscle in all_selected_exercises[:50]:  # TOP 50
            # Generuj reason (dlaczego to ćwiczenie)
            reasons = []
            cb_breakdown = breakdown.get('content_based', {}).get('breakdown', {})
            
            # 🆕 Dodaj informację o różnorodności partii mięśniowych
            muscle_group = exercise.get('muscle_group', '')
            normalized_muscle = normalize_muscle_group_for_diversity(muscle_group)
            
            # Sprawdź różnorodność względem aktualnego dnia
            if current_day_muscle_groups:
                day_muscle_normalized = [normalize_muscle_group_for_diversity(m) for m in current_day_muscle_groups]
                if normalized_muscle not in day_muscle_normalized:
                    reasons.append("Różna partia mięśniowa od już wybranych w tym dniu")
            
            # Sprawdź różnorodność względem całego tygodnia
            if week_muscle_groups:
                week_muscle_normalized = [normalize_muscle_group_for_diversity(m) for m in week_muscle_groups]
                if normalized_muscle not in week_muscle_normalized:
                    reasons.append("Nowa partia mięśniowa w tym tygodniu")
            
            # 🆕 Dodaj informację jeśli to ćwiczenie jest w TOP 3 różnorodnych
            if len(results) < 3:
                reasons.append(f"Rekomendowane dla różnorodności ({normalized_muscle})")
            
            if cb_breakdown.get('goal_match', 0) > 5:
                reasons.append(f"Idealne dla celu: {user.get('goal', 'trening')}")
            if cb_breakdown.get('level_match', 0) > 5:
                reasons.append(f"Dopasowane do poziomu: {user.get('level', '')}")
            if cb_breakdown.get('equipment_match', 0) > 5:
                reasons.append("Dostępne z Twoim sprzętem")
            if breakdown.get('collaborative', {}).get('score', 0) > 10:
                reasons.append("Popularne wśród podobnych użytkowników")
            
            if not reasons:
                reasons.append("Dobrze dopasowane do Twojego profilu")
            
            results.append({
                'exercise_id': ex_id,
                'name': exercise['name'],
                'description': exercise['description'],
                'muscle_group': muscle_group,
                'type': exercise['type'],
                'equipment': exercise['equipment'],
                'score': round(adjusted_score, 2),  # 🆕 Użyj adjusted_score
                'score_percent': round((adjusted_score / 100.0) * 100, 1),
                'reason': reasons[0] if reasons else "Rekomendowane",
                'reasons': reasons,
                'score_breakdown': breakdown
            })
        
        logger.info(f"[ExerciseEngine] Returning {len(results)} recommended exercises")
        return results
        
    except Exception as e:
        logger.error(f"[ExerciseEngine] Error recommending exercises: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return []


# ============================================================================
# SUGGEST PLAN STRUCTURE (sugerowana struktura planu)
# ============================================================================

def suggest_plan_structure(user: Dict) -> Dict:
    """
    Sugeruje strukturę planu na podstawie preferencji użytkownika.
    Np. "Dzień 1: Klatka + Triceps, 4-5 ćwiczeń"
    """
    goal = _norm(user.get('goal', ''))
    days_per_week = user.get('days', user.get('training_days_per_week', 3))
    
    # Mapowanie cel → struktura dni
    structures = {
        'masa': {
            3: [
                {'name': 'Górna część ciała', 'muscle_groups': ['chest', 'back', 'shoulders', 'arms']},
                {'name': 'Dolna część ciała', 'muscle_groups': ['legs', 'glutes']},
                {'name': 'Górna część ciała', 'muscle_groups': ['chest', 'back', 'shoulders', 'arms']}
            ],
            4: [
                {'name': 'Klatka + Triceps', 'muscle_groups': ['chest', 'triceps']},
                {'name': 'Plecy + Biceps', 'muscle_groups': ['back', 'biceps']},
                {'name': 'Nogi + Pośladki', 'muscle_groups': ['legs', 'glutes']},
                {'name': 'Barki + Ramiona', 'muscle_groups': ['shoulders', 'arms']}
            ],
            5: [
                {'name': 'Klatka', 'muscle_groups': ['chest']},
                {'name': 'Plecy', 'muscle_groups': ['back']},
                {'name': 'Nogi', 'muscle_groups': ['legs']},
                {'name': 'Barki + Triceps', 'muscle_groups': ['shoulders', 'triceps']},
                {'name': 'Biceps + Core', 'muscle_groups': ['biceps', 'core']}
            ]
        },
        'sila': {
            3: [
                {'name': 'Górna część ciała', 'muscle_groups': ['chest', 'back', 'shoulders']},
                {'name': 'Dolna część ciała', 'muscle_groups': ['legs']},
                {'name': 'Full Body', 'muscle_groups': ['chest', 'back', 'legs']}
            ],
            4: [
                {'name': 'Klatka + Triceps', 'muscle_groups': ['chest', 'triceps']},
                {'name': 'Plecy + Biceps', 'muscle_groups': ['back', 'biceps']},
                {'name': 'Nogi', 'muscle_groups': ['legs']},
                {'name': 'Full Body', 'muscle_groups': ['chest', 'back', 'legs']}
            ]
        },
        'spalanie': {
            3: [
                {'name': 'Full Body', 'muscle_groups': ['full_body']},
                {'name': 'Cardio + Core', 'muscle_groups': ['cardio', 'core']},
                {'name': 'Full Body', 'muscle_groups': ['full_body']}
            ],
            4: [
                {'name': 'Górna część ciała + Cardio', 'muscle_groups': ['chest', 'back', 'cardio']},
                {'name': 'Dolna część ciała + Cardio', 'muscle_groups': ['legs', 'cardio']},
                {'name': 'Full Body', 'muscle_groups': ['full_body']},
                {'name': 'Cardio + Core', 'muscle_groups': ['cardio', 'core']}
            ]
        }
    }
    
    default_structure = {
        3: [
            {'name': 'Dzień 1', 'muscle_groups': ['full_body']},
            {'name': 'Dzień 2', 'muscle_groups': ['full_body']},
            {'name': 'Dzień 3', 'muscle_groups': ['full_body']}
        ]
    }
    
    goal_structures = structures.get(goal, {})
    structure = goal_structures.get(days_per_week, default_structure.get(days_per_week, default_structure[3]))
    
    return {
        'days': structure,
        'suggested_exercises_per_day': 4 if days_per_week <= 3 else 3,
        'total_days': days_per_week
    }

