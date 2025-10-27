# backend/accounts/progress_views.py
"""
Endpointy związane z systemem postępów użytkownika:
- Pomiary (waga, tkanka tłuszczowa)
- Rekordy osobiste (PR)
- Metryki postępu (objętości, siła, wytrzymałość)
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
# MEASUREMENTS - Waga i Pomiary Ciała
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_measurements(request):
    """
    GET /api/progress/measurements/
    Pobierz wszystkie pomiary użytkownika
    Query params:
        - days: int (optional) - ostatnie N dni (default: 90)
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        days = int(request.query_params.get('days', 90))
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id,
                    measurement_date,
                    weight_kg,
                    body_fat_percentage,
                    notes
                FROM user_measurements
                WHERE auth_account_id = %s
                    AND measurement_date >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY measurement_date DESC
            """, [user_id, days])
            
            measurements = []
            for row in cursor.fetchall():
                measurements.append({
                    "id": row[0],
                    "date": row[1].isoformat() if row[1] else None,
                    "weight_kg": float(row[2]) if row[2] else None,
                    "body_fat_percentage": float(row[3]) if row[3] else None,
                    "notes": row[4]
                })
            
            logger.info(f"[GetMeasurements] Found {len(measurements)} measurements for user {user_id}")
            
            return Response({
                "success": True,
                "measurements": measurements,
                "total": len(measurements)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetMeasurements] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching measurements",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_measurement(request):
    """
    POST /api/progress/measurements/
    Dodaj nowy pomiar
    Body: {
        "date": "2025-10-26" (optional, default: today),
        "weight_kg": 75.5,
        "body_fat_percentage": 15.2 (optional),
        "notes": "Po porannym treningu" (optional)
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        measurement_date = data.get('date', datetime.now().date())
        weight_kg = data.get('weight_kg')
        body_fat_percentage = data.get('body_fat_percentage')
        notes = data.get('notes', '')

        if not weight_kg:
            return Response({"error": "weight_kg is required"}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            # Upsert - jeśli pomiar na ten dzień istnieje, zaktualizuj
            cursor.execute("""
                INSERT INTO user_measurements (auth_account_id, measurement_date, weight_kg, body_fat_percentage, notes)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (auth_account_id, measurement_date)
                DO UPDATE SET
                    weight_kg = EXCLUDED.weight_kg,
                    body_fat_percentage = EXCLUDED.body_fat_percentage,
                    notes = EXCLUDED.notes
                RETURNING id
            """, [user_id, measurement_date, weight_kg, body_fat_percentage, notes])
            
            measurement_id = cursor.fetchone()[0]
            
            logger.info(f"[AddMeasurement] Added measurement {measurement_id} for user {user_id}")
            
            return Response({
                "success": True,
                "message": "Measurement saved successfully",
                "id": measurement_id
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[AddMeasurement] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error saving measurement",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_measurement(request, measurement_id: int):
    """
    DELETE /api/progress/measurements/<measurement_id>/
    Usuń pomiar
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Sprawdź czy pomiar należy do użytkownika
            cursor.execute("""
                SELECT auth_account_id FROM user_measurements WHERE id = %s
            """, [measurement_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Measurement not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if row[0] != user_id:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            # Usuń pomiar
            cursor.execute("DELETE FROM user_measurements WHERE id = %s", [measurement_id])
            
            logger.info(f"[DeleteMeasurement] Deleted measurement {measurement_id}")
            
            return Response({
                "success": True,
                "message": "Measurement deleted successfully"
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[DeleteMeasurement] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error deleting measurement",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_body_stats(request):
    """
    GET /api/progress/body-stats/
    Oblicz statystyki ciała: BMI, BMR, TDEE
    Wymaga: aktualnej wagi, wzrostu z profilu, wieku z date_of_birth
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Pobierz ostatni pomiar wagi
            cursor.execute("""
                SELECT weight_kg, body_fat_percentage
                FROM user_measurements
                WHERE auth_account_id = %s
                ORDER BY measurement_date DESC
                LIMIT 1
            """, [user_id])
            
            weight_row = cursor.fetchone()
            current_weight = float(weight_row[0]) if weight_row and weight_row[0] else None
            body_fat = float(weight_row[1]) if weight_row and weight_row[1] else None
            
            # Pobierz wzrost i datę urodzenia z profilu
            cursor.execute("""
                SELECT date_of_birth FROM user_profiles WHERE auth_account_id = %s
            """, [user_id])
            
            profile_row = cursor.fetchone()
            date_of_birth = profile_row[0] if profile_row else None
            
            # Oblicz wiek
            age = None
            if date_of_birth:
                today = datetime.now().date()
                age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
            
            # Pobierz wzrost z ankiety (jeśli był podany w body)
            # Zakładam że wzrost może być w user_progress_tracking jako 'height_cm'
            cursor.execute("""
                SELECT metric_value
                FROM user_progress_tracking
                WHERE auth_account_id = %s AND metric_name = 'height_cm'
                ORDER BY measurement_date DESC
                LIMIT 1
            """, [user_id])
            
            height_row = cursor.fetchone()
            height_cm = float(height_row[0]) if height_row and height_row[0] else None
            
            # Oblicz BMI (jeśli mamy wagę i wzrost)
            bmi = None
            if current_weight and height_cm:
                height_m = height_cm / 100
                bmi = round(current_weight / (height_m ** 2), 1)
            
            # Oblicz BMR (Basal Metabolic Rate) - wzór Mifflin-St Jeor
            # Mężczyźni: BMR = 10 × waga (kg) + 6.25 × wzrost (cm) - 5 × wiek + 5
            # Kobiety: BMR = 10 × waga (kg) + 6.25 × wzrost (cm) - 5 × wiek - 161
            bmr = None
            if current_weight and height_cm and age:
                # Zakładam mężczyznę (można rozszerzyć o pole gender w przyszłości)
                bmr = round(10 * current_weight + 6.25 * height_cm - 5 * age + 5)
            
            # Oblicz TDEE (Total Daily Energy Expenditure)
            # TDEE = BMR × activity_factor
            # Pobierz liczbę dni treningowych z profilu
            cursor.execute("""
                SELECT training_days_per_week FROM user_profiles WHERE auth_account_id = %s
            """, [user_id])
            
            training_days_row = cursor.fetchone()
            training_days = training_days_row[0] if training_days_row else 3
            
            tdee = None
            if bmr:
                # Activity factor based on training frequency
                activity_factors = {
                    0: 1.2,   # Sedentary
                    1: 1.2,   # Sedentary
                    2: 1.375, # Lightly active
                    3: 1.55,  # Moderately active
                    4: 1.55,  # Moderately active
                    5: 1.725, # Very active
                    6: 1.725, # Very active
                    7: 1.9    # Extra active
                }
                factor = activity_factors.get(training_days, 1.55)
                tdee = round(bmr * factor)
            
            # Lean Body Mass (jeśli mamy body fat)
            lean_mass = None
            fat_mass = None
            if current_weight and body_fat:
                fat_mass = round(current_weight * (body_fat / 100), 1)
                lean_mass = round(current_weight - fat_mass, 1)
            
            return Response({
                "success": True,
                "stats": {
                    "current_weight": current_weight,
                    "body_fat_percentage": body_fat,
                    "height_cm": height_cm,
                    "age": age,
                    "bmi": bmi,
                    "bmr": bmr,
                    "tdee": tdee,
                    "lean_mass": lean_mass,
                    "fat_mass": fat_mass,
                    "training_days_per_week": training_days
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetBodyStats] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error calculating body stats",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PERSONAL RECORDS - Rekordy Osobiste
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_personal_records(request):
    """
    GET /api/progress/personal-records/
    Pobierz wszystkie rekordy osobiste użytkownika
    Query params:
        - exercise_id: int (optional) - filtruj po ćwiczeniu
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        exercise_id = request.query_params.get('exercise_id')
        
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    pr.id,
                    pr.exercise_id,
                    e.name as exercise_name,
                    e.muscle_group,
                    pr.reps,
                    pr.weight_kg,
                    pr.record_date
                FROM personal_records pr
                JOIN exercises e ON pr.exercise_id = e.id
                WHERE pr.auth_account_id = %s
            """
            params = [user_id]
            
            if exercise_id:
                query += " AND pr.exercise_id = %s"
                params.append(exercise_id)
            
            query += " ORDER BY pr.record_date DESC"
            
            cursor.execute(query, params)
            
            records = []
            for row in cursor.fetchall():
                records.append({
                    "id": row[0],
                    "exercise_id": row[1],
                    "exercise_name": row[2],
                    "muscle_group": row[3],
                    "reps": row[4],
                    "weight_kg": float(row[5]) if row[5] else None,
                    "record_date": row[6].isoformat() if row[6] else None
                })
            
            logger.info(f"[GetPersonalRecords] Found {len(records)} PRs for user {user_id}")
            
            return Response({
                "success": True,
                "records": records,
                "total": len(records)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetPersonalRecords] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching personal records",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_and_save_pr(request):
    """
    POST /api/progress/personal-records/check/
    Sprawdź czy dana seria to nowy PR i zapisz jeśli tak
    Body: {
        "exercise_id": int,
        "reps": int,
        "weight_kg": float,
        "logged_set_id": int (optional)
    }
    Response: {
        "is_pr": bool,
        "previous_pr": {...} or null,
        "new_pr": {...} or null
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        exercise_id = data.get('exercise_id')
        reps = data.get('reps')
        weight_kg = data.get('weight_kg')
        logged_set_id = data.get('logged_set_id')

        if not all([exercise_id, reps, weight_kg]):
            return Response({
                "error": "exercise_id, reps, and weight_kg are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            # Sprawdź czy istnieje rekord dla tego ćwiczenia i liczby powtórzeń
            cursor.execute("""
                SELECT id, weight_kg, record_date
                FROM personal_records
                WHERE auth_account_id = %s 
                    AND exercise_id = %s 
                    AND reps = %s
            """, [user_id, exercise_id, reps])
            
            existing_pr = cursor.fetchone()
            
            is_pr = False
            previous_pr = None
            new_pr = None
            
            if existing_pr:
                previous_weight = float(existing_pr[1])
                previous_pr = {
                    "weight_kg": previous_weight,
                    "record_date": existing_pr[2].isoformat()
                }
                
                # Sprawdź czy nowy wynik jest lepszy
                if weight_kg > previous_weight:
                    is_pr = True
                    # Aktualizuj rekord
                    cursor.execute("""
                        UPDATE personal_records
                        SET weight_kg = %s,
                            record_date = %s,
                            source_logged_set_id = %s
                        WHERE id = %s
                    """, [weight_kg, datetime.now().date(), logged_set_id, existing_pr[0]])
                    
                    new_pr = {
                        "id": existing_pr[0],
                        "exercise_id": exercise_id,
                        "reps": reps,
                        "weight_kg": weight_kg,
                        "record_date": datetime.now().date().isoformat()
                    }
            else:
                # To jest pierwszy rekord dla tego ćwiczenia i liczby powtórzeń
                is_pr = True
                cursor.execute("""
                    INSERT INTO personal_records 
                    (auth_account_id, exercise_id, reps, weight_kg, record_date, source_logged_set_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, [user_id, exercise_id, reps, weight_kg, datetime.now().date(), logged_set_id])
                
                new_record_id = cursor.fetchone()[0]
                new_pr = {
                    "id": new_record_id,
                    "exercise_id": exercise_id,
                    "reps": reps,
                    "weight_kg": weight_kg,
                    "record_date": datetime.now().date().isoformat()
                }
            
            logger.info(f"[CheckPR] User {user_id}, Exercise {exercise_id}, is_pr: {is_pr}")
            
            return Response({
                "success": True,
                "is_pr": is_pr,
                "previous_pr": previous_pr,
                "new_pr": new_pr
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[CheckPR] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error checking PR",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PROGRESS TRACKING - Inne Metryki Postępu
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress_metrics(request):
    """
    GET /api/progress/metrics/
    Pobierz wszystkie metryki postępu użytkownika
    Query params:
        - metric_name: str (optional) - filtruj po nazwie metryki
        - days: int (optional) - ostatnie N dni
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        metric_name = request.query_params.get('metric_name')
        days = int(request.query_params.get('days', 365))
        
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    id,
                    plan_id,
                    metric_name,
                    metric_value,
                    measurement_date,
                    notes,
                    created_at
                FROM user_progress_tracking
                WHERE auth_account_id = %s
                    AND measurement_date >= CURRENT_DATE - INTERVAL '%s days'
            """
            params = [user_id, days]
            
            if metric_name:
                query += " AND metric_name = %s"
                params.append(metric_name)
            
            query += " ORDER BY measurement_date DESC"
            
            cursor.execute(query, params)
            
            metrics = []
            for row in cursor.fetchall():
                metrics.append({
                    "id": row[0],
                    "plan_id": row[1],
                    "metric_name": row[2],
                    "metric_value": float(row[3]) if row[3] else None,
                    "measurement_date": row[4].isoformat() if row[4] else None,
                    "notes": row[5],
                    "created_at": row[6].isoformat() if row[6] else None
                })
            
            logger.info(f"[GetProgressMetrics] Found {len(metrics)} metrics for user {user_id}")
            
            return Response({
                "success": True,
                "metrics": metrics,
                "total": len(metrics)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetProgressMetrics] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching progress metrics",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_progress_metric(request):
    """
    POST /api/progress/metrics/
    Dodaj nową metrykę postępu
    Body: {
        "metric_name": "biceps_cm" | "chest_cm" | "waist_cm" | "1rm_bench" | etc.,
        "metric_value": float,
        "measurement_date": "2025-10-26" (optional),
        "plan_id": int (optional),
        "notes": str (optional)
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        metric_name = data.get('metric_name')
        metric_value = data.get('metric_value')
        measurement_date = data.get('measurement_date', datetime.now().date())
        plan_id = data.get('plan_id')
        notes = data.get('notes', '')

        if not all([metric_name, metric_value]):
            return Response({
                "error": "metric_name and metric_value are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_progress_tracking 
                (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [user_id, plan_id, metric_name, metric_value, measurement_date, notes])
            
            metric_id = cursor.fetchone()[0]
            
            logger.info(f"[AddProgressMetric] Added metric {metric_id} for user {user_id}")
            
            return Response({
                "success": True,
                "message": "Progress metric saved successfully",
                "id": metric_id
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[AddProgressMetric] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error saving progress metric",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_workout_history(request):
    """
    GET /api/progress/workout-history/
    Pobierz historię treningów z podstawowymi statystykami
    Query params:
        - days: int (optional) - ostatnie N dni (default: 30)
        - plan_id: int (optional) - filtruj po planie
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        days = int(request.query_params.get('days', 30))
        plan_id = request.query_params.get('plan_id')
        
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    ts.id,
                    ts.plan_id,
                    tp.name as plan_name,
                    ts.session_date,
                    ts.duration_minutes,
                    ts.notes,
                    COUNT(DISTINCT ls.exercise_id) as exercises_count,
                    COUNT(ls.id) as total_sets,
                    SUM(ls.weight_kg * ls.reps) as total_volume
                FROM training_sessions ts
                LEFT JOIN training_plans tp ON ts.plan_id = tp.id
                LEFT JOIN logged_sets ls ON ts.id = ls.session_id
                WHERE ts.auth_account_id = %s
                    AND ts.session_date >= CURRENT_TIMESTAMP - INTERVAL '%s days'
            """
            params = [user_id, days]
            
            if plan_id:
                query += " AND ts.plan_id = %s"
                params.append(plan_id)
            
            query += """
                GROUP BY ts.id, ts.plan_id, tp.name, ts.session_date, ts.duration_minutes, ts.notes
                ORDER BY ts.session_date DESC
            """
            
            cursor.execute(query, params)
            
            workouts = []
            for row in cursor.fetchall():
                workouts.append({
                    "id": row[0],
                    "plan_id": row[1],
                    "plan_name": row[2],
                    "session_date": row[3].isoformat() if row[3] else None,
                    "duration_minutes": row[4],
                    "notes": row[5],
                    "exercises_count": row[6],
                    "total_sets": row[7],
                    "total_volume": float(row[8]) if row[8] else 0
                })
            
            logger.info(f"[GetWorkoutHistory] Found {len(workouts)} workouts for user {user_id}")
            
            return Response({
                "success": True,
                "workouts": workouts,
                "total": len(workouts)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetWorkoutHistory] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching workout history",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_progress(request, exercise_id: int):
    """
    GET /api/progress/exercises/<exercise_id>/
    Pobierz historię postępu dla konkretnego ćwiczenia
    Zwraca wszystkie serie z ostatnich 90 dni
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            # Pobierz nazwę ćwiczenia
            cursor.execute("SELECT name, muscle_group FROM exercises WHERE id = %s", [exercise_id])
            exercise_row = cursor.fetchone()
            
            if not exercise_row:
                return Response({"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND)
            
            exercise_name = exercise_row[0]
            muscle_group = exercise_row[1]
            
            # Pobierz wszystkie serie dla tego ćwiczenia
            cursor.execute("""
                SELECT 
                    ls.id,
                    ls.set_order,
                    ls.weight_kg,
                    ls.reps,
                    ls.notes,
                    ts.session_date
                FROM logged_sets ls
                JOIN training_sessions ts ON ls.session_id = ts.id
                WHERE ts.auth_account_id = %s
                    AND ls.exercise_id = %s
                    AND ts.session_date >= CURRENT_TIMESTAMP - INTERVAL '90 days'
                ORDER BY ts.session_date DESC, ls.set_order ASC
            """, [user_id, exercise_id])
            
            sets = []
            for row in cursor.fetchall():
                sets.append({
                    "id": row[0],
                    "set_order": row[1],
                    "weight_kg": float(row[2]) if row[2] else None,
                    "reps": row[3],
                    "notes": row[4],
                    "session_date": row[5].isoformat() if row[5] else None
                })
            
            # Pobierz rekordy osobiste dla tego ćwiczenia
            cursor.execute("""
                SELECT reps, weight_kg, record_date
                FROM personal_records
                WHERE auth_account_id = %s AND exercise_id = %s
                ORDER BY weight_kg DESC
                LIMIT 5
            """, [user_id, exercise_id])
            
            prs = []
            for row in cursor.fetchall():
                prs.append({
                    "reps": row[0],
                    "weight_kg": float(row[1]) if row[1] else None,
                    "record_date": row[2].isoformat() if row[2] else None
                })
            
            # Oblicz estymowaną 1RM (One Rep Max) - wzór Brzycki
            # 1RM = weight / (1.0278 - 0.0278 × reps)
            estimated_1rm = None
            if sets:
                max_weight_set = max(sets, key=lambda s: (s['weight_kg'] or 0))
                if max_weight_set['weight_kg'] and max_weight_set['reps']:
                    w = max_weight_set['weight_kg']
                    r = max_weight_set['reps']
                    if r == 1:
                        estimated_1rm = w
                    elif r <= 10:
                        estimated_1rm = round(w / (1.0278 - 0.0278 * r), 1)
            
            logger.info(f"[GetExerciseProgress] Found {len(sets)} sets for exercise {exercise_id}")
            
            return Response({
                "success": True,
                "exercise": {
                    "id": exercise_id,
                    "name": exercise_name,
                    "muscle_group": muscle_group
                },
                "sets": sets,
                "personal_records": prs,
                "estimated_1rm": estimated_1rm,
                "total_sets": len(sets)
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetExerciseProgress] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching exercise progress",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

