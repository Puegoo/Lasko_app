from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
from django.db import connection
import json
import logging
from .recommendation_service import RecommendationService

# Konfiguracja logowania
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Parametry bazy danych dla serwisu rekomendacji
DB_PARAMS = {
    "dbname": "LaskoDB", 
    "user": "postgres", 
    "password": "postgres", 
    "host": "localhost", 
    "port": "5432"
}

@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    """
    Endpoint rejestracji użytkownika z opcjonalną ankietą.
    
    POST /api/register/
    
    Body:
    {
        "email": "user@example.com",
        "password": "password123",
        "name": "Jan Kowalski",
        "birthDate": "1990-01-01",
        "skipSurvey": false,
        "surveyData": {
            "goal": "masa",
            "level": "poczatkujacy", 
            "trainingDaysPerWeek": 3,
            "equipmentPreference": "silownia_full"
        }
    }
    """
    try:
        data = json.loads(request.body)
        
        # Podstawowe dane użytkownika
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        birth_date = data.get('birthDate')
        skip_survey = data.get('skipSurvey', False)
        survey_data = data.get('surveyData', {})
        
        # Walidacja podstawowych danych
        if not all([email, password, name]):
            return JsonResponse({
                'success': False,
                'error': 'Wymagane pola: email, password, name'
            }, status=400)
        
        with connection.cursor() as cursor:
            # Sprawdź czy email już istnieje
            cursor.execute("SELECT id FROM auth_accounts WHERE email = %s", [email])
            if cursor.fetchone():
                return JsonResponse({
                    'success': False,
                    'error': 'Konto z tym adresem email już istnieje'
                }, status=400)
            
            # Utwórz konto logowania
            hashed_password = make_password(password)
            cursor.execute("""
                INSERT INTO auth_accounts (username, email, password_hash, first_name) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id
            """, [email, email, hashed_password, name])
            
            auth_account_id = cursor.fetchone()[0]
            
            # Utwórz profil użytkownika
            if skip_survey:
                # Profil bez danych z ankiety
                cursor.execute("""
                    INSERT INTO user_profiles (auth_account_id, first_name, date_of_birth) 
                    VALUES (%s, %s, %s)
                """, [auth_account_id, name, birth_date])
                
                response_data = {
                    'success': True,
                    'message': 'Konto utworzone pomyślnie',
                    'userId': auth_account_id,
                    'skipSurvey': True,
                    'redirectTo': '/plan-creator'
                }
            else:
                # Profil z danymi z ankiety
                cursor.execute("""
                    INSERT INTO user_profiles (
                        auth_account_id, first_name, date_of_birth, 
                        goal, level, training_days_per_week, equipment_preference
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, [
                    auth_account_id, name, birth_date,
                    survey_data.get('goal'),
                    survey_data.get('level'),
                    survey_data.get('trainingDaysPerWeek'),
                    survey_data.get('equipmentPreference')
                ])
                
                response_data = {
                    'success': True,
                    'message': 'Konto utworzone pomyślnie z danymi ankiety',
                    'userId': auth_account_id,
                    'skipSurvey': False,
                    'redirectTo': '/recommended-plans'
                }
        
        logger.info(f"Pomyślnie utworzono konto dla {email} (ID: {auth_account_id})")
        return JsonResponse(response_data, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Nieprawidłowy format JSON'
        }, status=400)
    except Exception as e:
        logger.error(f"Błąd podczas rejestracji: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Wystąpił błąd wewnętrzny serwera'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def get_recommendations(request):
    """
    Endpoint do pobierania rekomendacji planów treningowych.
    
    POST /api/recommendations/
    
    Body:
    {
        "userId": 123,
        "mode": "hybrydowo"  // "produkt", "klient", "hybrydowo"
    }
    """
    try:
        data = json.loads(request.body)
        user_id = data.get('userId')
        mode = data.get('mode', 'hybrydowo')
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'error': 'Wymagane pole: userId'
            }, status=400)
        
        # Inicjalizacja serwisu rekomendacji
        reco_service = RecommendationService(DB_PARAMS)
        
        if not reco_service.conn:
            return JsonResponse({
                'success': False,
                'error': 'Błąd połączenia z bazą danych'
            }, status=500)
        
        try:
            # Pobierz rekomendacje
            recommendations = reco_service.get_recommendations(user_id, mode)
            
            if not recommendations:
                return JsonResponse({
                    'success': True,
                    'recommendations': [],
                    'message': 'Brak dostępnych rekomendacji'
                })
            
            # Pobierz szczegóły planów
            top_plan_ids = [r['plan_id'] for r in recommendations[:10]]  # Top 10
            plan_details = reco_service.get_plan_details(top_plan_ids)
            
            # Połącz rekomendacje ze szczegółami
            enriched_recommendations = []
            for reco in recommendations[:10]:
                plan_id = reco['plan_id']
                plan = plan_details.get(plan_id, {})
                
                enriched_recommendations.append({
                    'planId': plan_id,
                    'score': round(reco['score'], 2),
                    'name': plan.get('name', 'Nieznany plan'),
                    'description': plan.get('description', ''),
                    'goalType': plan.get('goal_type', ''),
                    'difficultyLevel': plan.get('difficulty_level', ''),
                    'trainingDaysPerWeek': plan.get('training_days_per_week', 0),
                    'equipmentRequired': plan.get('equipment_required', ''),
                    'matchPercentage': min(100, round((reco['score'] / 35) * 100))  # 35 to max możliwy wynik
                })
            
            reco_service.close_connection()
            
            logger.info(f"Wygenerowano {len(enriched_recommendations)} rekomendacji dla użytkownika {user_id}")
            
            return JsonResponse({
                'success': True,
                'recommendations': enriched_recommendations,
                'mode': mode,
                'userId': user_id
            })
            
        finally:
            reco_service.close_connection()
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Nieprawidłowy format JSON'
        }, status=400)
    except Exception as e:
        logger.error(f"Błąd podczas generowania rekomendacji: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Wystąpił błąd wewnętrzny serwera'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def activate_plan(request):
    """
    Endpoint do aktywacji planu treningowego dla użytkownika.
    
    POST /api/activate-plan/
    
    Body:
    {
        "userId": 123,
        "planId": 456
    }
    """
    try:
        data = json.loads(request.body)
        user_id = data.get('userId')
        plan_id = data.get('planId')
        
        if not all([user_id, plan_id]):
            return JsonResponse({
                'success': False,
                'error': 'Wymagane pola: userId, planId'
            }, status=400)
        
        with connection.cursor() as cursor:
            # Sprawdź czy plan istnieje
            cursor.execute("SELECT id, name FROM training_plans WHERE id = %s", [plan_id])
            plan = cursor.fetchone()
            
            if not plan:
                return JsonResponse({
                    'success': False,
                    'error': 'Plan treningowy nie został znaleziony'
                }, status=404)
            
            # Sprawdź czy użytkownik ma już aktywny plan
            cursor.execute("""
                SELECT id FROM user_active_plans 
                WHERE auth_account_id = %s AND is_completed = FALSE
            """, [user_id])
            
            existing_plan = cursor.fetchone()
            
            if existing_plan:
                # Zakończ poprzedni plan
                cursor.execute("""
                    UPDATE user_active_plans 
                    SET is_completed = TRUE, end_date = CURRENT_DATE 
                    WHERE id = %s
                """, [existing_plan[0]])
            
            # Aktywuj nowy plan
            cursor.execute("""
                INSERT INTO user_active_plans (auth_account_id, plan_id, start_date) 
                VALUES (%s, %s, CURRENT_DATE)
            """, [user_id, plan_id])
        
        logger.info(f"Aktywowano plan {plan_id} dla użytkownika {user_id}")
        
        return JsonResponse({
            'success': True,
            'message': f'Plan "{plan[1]}" został aktywowany',
            'planId': plan_id,
            'planName': plan[1]
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Nieprawidłowy format JSON'
        }, status=400)
    except Exception as e:
        logger.error(f"Błąd podczas aktywacji planu: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Wystąpił błąd wewnętrzny serwera'
        }, status=500)

@csrf_exempt  
@require_http_methods(["POST"])
def create_custom_plan(request):
    """
    Endpoint do tworzenia niestandardowego planu treningowego.
    
    POST /api/create-plan/
    
    Body:
    {
        "userId": 123,
        "planData": {
            "name": "Mój plan",
            "goal": "masa",
            "trainingDays": 4,
            "planDuration": 8,
            "equipment": "silownia_full",
            "notes": "Dodatkowe uwagi"
        }
    }
    """
    try:
        data = json.loads(request.body)
        user_id = data.get('userId')
        plan_data = data.get('planData', {})
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'error': 'Wymagane pole: userId'
            }, status=400)
        
        # Walidacja danych planu
        required_fields = ['name', 'goal', 'trainingDays', 'equipment']
        for field in required_fields:
            if not plan_data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'Wymagane pole w planData: {field}'
                }, status=400)
        
        with connection.cursor() as cursor:
            # Sprawdź czy użytkownik istnieje
            cursor.execute("SELECT id FROM auth_accounts WHERE id = %s", [user_id])
            if not cursor.fetchone():
                return JsonResponse({
                    'success': False,
                    'error': 'Użytkownik nie został znaleziony'
                }, status=404)
            
            # Utwórz nowy plan
            cursor.execute("""
                INSERT INTO training_plans (
                    name, description, auth_account_id, goal_type, 
                    difficulty_level, training_days_per_week, equipment_required
                ) VALUES (%s, %s, %s, %s, %s, %s, %s) 
                RETURNING id
            """, [
                plan_data['name'],
                plan_data.get('notes', ''),
                user_id,
                plan_data['goal'],
                'niestandardowy',  # Oznacz jako plan niestandardowy
                plan_data['trainingDays'],
                plan_data['equipment']
            ])
            
            new_plan_id = cursor.fetchone()[0]
            
            # Automatycznie aktywuj plan
            cursor.execute("""
                INSERT INTO user_active_plans (auth_account_id, plan_id, start_date) 
                VALUES (%s, %s, CURRENT_DATE)
            """, [user_id, new_plan_id])
        
        logger.info(f"Utworzono i aktywowano niestandardowy plan {new_plan_id} dla użytkownika {user_id}")
        
        return JsonResponse({
            'success': True,
            'message': 'Plan został utworzony i aktywowany',
            'planId': new_plan_id,
            'planName': plan_data['name']
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Nieprawidłowy format JSON'
        }, status=400)
    except Exception as e:
        logger.error(f"Błąd podczas tworzenia planu: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Wystąpił błąd wewnętrzny serwera'
        }, status=500)