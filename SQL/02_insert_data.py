import psycopg2
from faker import Faker
import random
from datetime import datetime, timedelta
import hashlib
from collections import defaultdict
import json

# Inicjalizacja Fakera
fake = Faker('pl_PL')

# --- Konfiguracja połączenia z bazą ---
DB_NAME = "LaskoDB"
DB_USER = "postgres"
DB_PASS = "postgres"
DB_HOST = "localhost"
DB_PORT = "5433"

## USTAWIENIA ILOŚCI DANYCH ##
NUM_USERS = 1500
NUM_PLANS = 250
AVG_SESSIONS_PER_USER = 30

# ✅ POPRAWIONE DANE MISTRZOWSKIE (zgodne z nowym schematem)
EXERCISES_CATALOG = {
    # --- KLATKA PIERSIOWA ---
    ('Wyciskanie sztangi na ławce płaskiej', 'compound'): 'chest',
    ('Wyciskanie sztangi na ławce skośnej (góra)', 'compound'): 'chest',
    ('Wyciskanie hantli na ławce płaskiej', 'compound'): 'chest',
    ('Wyciskanie hantli na ławce skośnej (góra)', 'compound'): 'chest',
    ('Pompki na poręczach (dipy)', 'compound'): 'chest',
    ('Rozpiętki z hantlami na ławce płaskiej', 'isolation'): 'chest',
    ('Przenoszenie hantla za głowę (pullover)', 'compound'): 'chest',
    ('Wyciskanie na maszynie hammer (chwyt poziomy)', 'compound'): 'chest',
    ('Krzyżowanie linek wyciągu (brama)', 'isolation'): 'chest',
    ('Pompki klasyczne', 'compound'): 'chest',

    # --- PLECY ---
    ('Martwy ciąg klasyczny', 'compound'): 'back',
    ('Martwy ciąg rumuński (RDL)', 'compound'): 'back',
    ('Podciąganie na drążku (nachwyt)', 'compound'): 'back',
    ('Podciąganie na drążku (podchwyt)', 'compound'): 'back',
    ('Wiosłowanie sztangą w opadzie tułowia', 'compound'): 'back',
    ('Wiosłowanie hantlem w opadzie tułowia', 'compound'): 'back',
    ('Wiosłowanie na maszynie (seated cable row)', 'compound'): 'back',
    ('Ściąganie drążka wyciągu górnego do klatki', 'compound'): 'back',
    ('Narciarz (na wyciągu)', 'isolation'): 'back',
    ('Szrugsy ze sztangą', 'isolation'): 'back',

    # --- NOGI ---
    ('Przysiad ze sztangą na plecach (Back Squat)', 'compound'): 'legs',
    ('Przysiad ze sztangą z przodu (Front Squat)', 'compound'): 'legs',
    ('Przysiad bułgarski z hantlami', 'compound'): 'legs',
    ('Wypychanie na suwnicy (Leg Press)', 'compound'): 'legs',
    ('Wykroki chodzone z hantlami', 'compound'): 'legs',
    ('Prostowanie nóg na maszynie', 'isolation'): 'legs',
    ('Uginanie nóg na maszynie leżąc', 'isolation'): 'legs',
    ('Hip Thrust ze sztangą', 'compound'): 'legs',
    ('Wspięcia na palce ze sztangą', 'isolation'): 'legs',
    ('Żuraw (Nordic Ham Curl)', 'compound'): 'legs',

    # --- BARKI ---
    ('Wyciskanie żołnierskie (OHP)', 'compound'): 'shoulders',
    ('Wyciskanie hantli nad głowę siedząc', 'compound'): 'shoulders',
    ('Wznosy hantli na boki', 'isolation'): 'shoulders',
    ('Wznosy hantli w opadzie tułowia', 'isolation'): 'shoulders',
    ('Podciąganie sztangi wzdłuż tułowia (Upright Row)', 'compound'): 'shoulders',
    ('Face pulls (na wyciągu)', 'isolation'): 'shoulders',
    ('Odwrotne rozpiętki na maszynie (Reverse Pec Deck)', 'isolation'): 'shoulders',

    # --- BICEPS ---
    ('Uginanie ramion ze sztangą prostą', 'isolation'): 'biceps',
    ('Uginanie ramion ze sztangą łamaną', 'isolation'): 'biceps',
    ('Uginanie ramion z hantlami z supinacją', 'isolation'): 'biceps',
    ('Uginanie ramion chwytem młotkowym', 'isolation'): 'biceps',
    ('Uginanie ramion na modlitewniku', 'isolation'): 'biceps',
    ('Uginanie ramion na wyciągu dolnym', 'isolation'): 'biceps',

    # --- TRICEPS ---
    ('Wyciskanie sztangi w wąskim chwycie', 'compound'): 'triceps',
    ('Wyciskanie francuskie sztangą leżąc', 'isolation'): 'triceps',
    ('Prostowanie ramion na wyciągu górnym (linki)', 'isolation'): 'triceps',
    ('Prostowanie ramienia z hantlem w opadzie tułowia', 'isolation'): 'triceps',
    ('Pompki diamentowe', 'compound'): 'triceps',

    # --- BRZUCH ---
    ('Plank (deska)', 'isolation'): 'core',
    ('Unoszenie nóg w zwisie na drążku', 'compound'): 'core',
    ('Spięcia brzucha z linką wyciągu górnego (Allahy)', 'isolation'): 'core',
    ('Russian Twist (skręty tułowia)', 'isolation'): 'core',
    ('Kółko (Ab Wheel Rollout)', 'compound'): 'core',
}

TAGS_DATA = ['kettlebell', 'plyometryczne', 'kalistenika', 'siłowe', 'wytrzymałościowe', 'mobilność']
EQUIPMENT_DATA = ['sztanga', 'hantle', 'kettlebell', 'drążek do podciągania', 'maszyna', 'ławka', 'brak']

# ✅ NOWE: Dane zgodne z nowym schematem algorytmu
GOALS = ['masa', 'siła', 'wytrzymałość', 'spalanie', 'zdrowie']
LEVELS = ['początkujący', 'średniozaawansowany', 'zaawansowany']
EQUIPMENT_PREFERENCES = ['siłownia', 'dom_podstawowy', 'dom_zaawansowany', 'masa_ciała', 'minimalne']

# Obszary skupienia i ograniczenia dla użytkowników
FOCUS_AREAS = ['upper_body', 'lower_body', 'core', 'cardio', 'flexibility', 'functional']
AVOIDANCES = ['knee_issues', 'back_issues', 'shoulder_issues', 'time_constraints', 'high_impact', 'complex_movements']

def get_db_connection():
    return psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)

def clear_data(conn):
    print("🗑️ Czyszczenie istniejących danych...")
    with conn.cursor() as cur:
        # ✅ POPRAWIONA kolejność - dodano nowe tabele algorytmu
        tables = [
            # Nowe tabele algorytmu
            'recommendation_logs', 'exercise_alternatives', 'user_progress_tracking',
            # Istniejące tabele
            'notifications', 'exercise_feedback', 'user_notes', 'user_goals_history', 
            'personal_records', 'user_measurements', 'completed_plan_days', 
            'logged_sets', 'session_exercises', 'training_sessions', 
            'user_active_plans', 'plan_exercises', 'plan_days', 'plan_history', 
            'training_plans', 'exercise_equipment', 'equipment', 'exercise_tags', 
            'tags', 'exercise_variants', 'exercises', 'user_profiles', 'auth_accounts'
        ]
        
        # Tylko tabele, które istnieją
        existing_tables = []
        for table in tables:
            cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
            if cur.fetchone()[0]:
                existing_tables.append(table)
        
        if existing_tables:
            cur.execute(f"TRUNCATE TABLE {', '.join(existing_tables)} RESTART IDENTITY CASCADE;")
            print(f"   ✅ Wyczyszczono {len(existing_tables)} tabel")
        else:
            print("   ⚠️ Brak tabel do wyczyszczenia")
            
    conn.commit()

def seed_master_data(conn):
    print("📋 Generowanie danych mistrzowskich...")
    with conn.cursor() as cur:
        # Tagi
        cur.executemany("INSERT INTO tags (name) VALUES (%s)", [(tag,) for tag in TAGS_DATA])
        print(f"   ✅ Dodano {len(TAGS_DATA)} tagów")
        
        # Sprzęt
        cur.executemany("INSERT INTO equipment (name) VALUES (%s)", [(eq,) for eq in EQUIPMENT_DATA])
        print(f"   ✅ Dodano {len(EQUIPMENT_DATA)} elementów sprzętu")
        
        # ✅ POPRAWIONE ćwiczenia - z opisami i URL-ami
        exercises_to_insert = []
        for (name, type), group in EXERCISES_CATALOG.items():
            description = f"Ćwiczenie {type} na {group}"
            video_url = f"/videos/exercises/{name.lower().replace(' ', '_')}.mp4"
            image_url = f"/images/exercises/{name.lower().replace(' ', '_')}.jpg"
            exercises_to_insert.append((name, description, video_url, image_url, group, type))
        
        cur.executemany(
            "INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES (%s, %s, %s, %s, %s, %s)", 
            exercises_to_insert
        )
        print(f"   ✅ Dodano {len(exercises_to_insert)} ćwiczeń")

        # Pobierz ID utworzonych danych
        cur.execute("SELECT id, name FROM exercises")
        exercises = cur.fetchall()
        cur.execute("SELECT id FROM tags")
        tag_ids = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT id FROM equipment")
        equipment_ids = [row[0] for row in cur.fetchall()]
        
        # Warianty ćwiczeń
        variants_count = 0
        for ex_id, ex_name in exercises:
            if 'Przysiad' in ex_name:
                cur.execute("INSERT INTO exercise_variants (exercise_id, name, notes) VALUES (%s, %s, %s)", 
                           (ex_id, 'Przysiad High-Bar', 'Sztanga wysoko na plecach'))
                cur.execute("INSERT INTO exercise_variants (exercise_id, name, notes) VALUES (%s, %s, %s)", 
                           (ex_id, 'Przysiad Low-Bar', 'Sztanga nisko na plecach'))
                variants_count += 2
            elif 'Pompki' in ex_name:
                cur.execute("INSERT INTO exercise_variants (exercise_id, name, notes) VALUES (%s, %s, %s)", 
                           (ex_id, 'Pompki na kolanach', 'Łatwiejsza wersja dla początkujących'))
                variants_count += 1
        
        print(f"   ✅ Dodano {variants_count} wariantów ćwiczeń")
        
        # Tagi i sprzęt do ćwiczeń
        ex_tags_data, ex_equip_data = [], []
        for ex_id, _ in exercises:
            # Losowe tagi (0-3)
            for tag_id in random.sample(tag_ids, k=random.randint(0, 3)): 
                ex_tags_data.append((ex_id, tag_id))
            # Losowy sprzęt (1-3)
            for eq_id in random.sample(equipment_ids, k=random.randint(1, 3)): 
                ex_equip_data.append((ex_id, eq_id))
        
        cur.executemany("INSERT INTO exercise_tags (exercise_id, tag_id) VALUES (%s, %s)", ex_tags_data)
        cur.executemany("INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (%s, %s)", ex_equip_data)
        print(f"   ✅ Połączono ćwiczenia z {len(ex_tags_data)} tagami i {len(ex_equip_data)} elementami sprzętu")
        
    conn.commit()
    
def seed_accounts_and_profiles(conn):
    print(f"👥 Generowanie {NUM_USERS} kont i profili...")
    unique_usernames, unique_emails = set(), set()
    
    with conn.cursor() as cur:
        users_created = 0
        while users_created < NUM_USERS:
            username, email = fake.user_name(), fake.email()
            if username in unique_usernames or email in unique_emails: 
                continue
            
            unique_usernames.add(username)
            unique_emails.add(email)
            
            # 1. Stwórz konto logowania
            first_name = fake.first_name()
            password_hash = hashlib.sha256('password123'.encode()).hexdigest()
            cur.execute(
                "INSERT INTO auth_accounts (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (username, email, password_hash, first_name, False, False, False, True)
            )
            auth_account_id = cur.fetchone()[0]

            # ✅ 2. Stwórz powiązany profil z NOWYMI kolumnami
            goal = random.choice(GOALS)
            level = random.choice(LEVELS)
            equipment_pref = random.choice(EQUIPMENT_PREFERENCES)
            training_days = random.choice([2, 3, 4, 5, 6])
            preferred_duration = random.choice([30, 45, 60, 75, 90])
            
            # Losowe obszary skupienia (0-3)
            focus_areas = random.sample(FOCUS_AREAS, k=random.randint(0, 3))
            # Losowe ograniczenia (0-2)
            avoid_exercises = random.sample(AVOIDANCES, k=random.randint(0, 2))
            
            cur.execute(
                """INSERT INTO user_profiles 
                (auth_account_id, first_name, date_of_birth, goal, level, training_days_per_week, equipment_preference, 
                preferred_session_duration, focus_areas, avoid_exercises, last_survey_date) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (auth_account_id, first_name, fake.date_of_birth(minimum_age=16, maximum_age=60),
                 goal, level, training_days, equipment_pref, 
                 preferred_duration, focus_areas, avoid_exercises, fake.date_time_between(start_date='-1y', end_date='now'))
            )
            
            users_created += 1
            
            if users_created % 100 == 0:
                print(f"   📊 Utworzono {users_created}/{NUM_USERS} użytkowników")
    
    conn.commit()
    print(f"   ✅ Utworzono {NUM_USERS} kont i profili z nowymi kolumnami")

def seed_plans(conn, exercise_ids, account_ids):
    print(f"📋 Generowanie {NUM_PLANS} planów treningowych...")
    with conn.cursor() as cur:
        plans_created = 0
        
        for _ in range(NUM_PLANS):
            days = random.choice([2, 3, 4, 5, 6])
            goal = random.choice(GOALS)
            level = random.choice(LEVELS)
            equipment = random.choice(EQUIPMENT_PREFERENCES)
            
            plan_name = f"Plan {days}-dniowy: {goal.capitalize()} ({level})"
            description = f"Profesjonalny plan treningowy dla celu '{goal}' na poziomie {level}. Zaprojektowany na {days} dni w tygodniu z wykorzystaniem: {equipment}."
            
            # ✅ NOWE KOLUMNY: is_active, created_at
            cur.execute(
                """INSERT INTO training_plans 
                (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, auth_account_id, is_active, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (plan_name, description, goal, level, days, equipment, random.choice(account_ids), True, fake.date_time_between(start_date='-2y', end_date='now'))
            )
            plan_id = cur.fetchone()[0]

            # Dni w planie
            day_names = [
                "Push (Pchnij)", "Pull (Pociągnij)", "Legs (Nogi)", "Upper Body", "Lower Body", 
                "Full Body", "Cardio", "Core & Conditioning"
            ]
            
            for i in range(days):
                day_name = day_names[i] if i < len(day_names) else f"Dzień {i+1}"
                day_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i] if i < 7 else None
                
                cur.execute(
                    "INSERT INTO plan_days (plan_id, name, day_order, day_of_week) VALUES (%s, %s, %s, %s) RETURNING id", 
                    (plan_id, day_name, i+1, day_of_week)
                )
                day_id = cur.fetchone()[0]
                
                # Ćwiczenia w dniu (4-7 ćwiczeń)
                num_exercises = random.randint(4, 7)
                day_exercises = random.sample(exercise_ids, num_exercises)
                
                for idx, ex_id in enumerate(day_exercises):
                    # Różne parametry w zależności od celu
                    if goal == 'siła':
                        sets, reps, rest = '5', '3-5', random.randint(120, 180)
                    elif goal == 'masa':
                        sets, reps, rest = random.choice(['3', '4']), '8-12', random.randint(60, 120)
                    elif goal == 'wytrzymałość':
                        sets, reps, rest = '3', '15-20', random.randint(30, 60)
                    else:
                        sets, reps, rest = '3', '10-15', random.randint(45, 90)
                    
                    # Supersety (30% szans na grupę)
                    superset_group = random.randint(1, 3) if random.random() < 0.3 else None
                    
                    cur.execute(
                        "INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group) VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex_id, sets, reps, rest, superset_group)
                    )
            
            plans_created += 1
            if plans_created % 50 == 0:
                print(f"   📊 Utworzono {plans_created}/{NUM_PLANS} planów")
    
    conn.commit()
    print(f"   ✅ Utworzono {NUM_PLANS} planów z dniami i ćwiczeniami")

def seed_user_activities(conn, all_accounts, all_plans):
    print("🏃 Symulowanie aktywności użytkowników...")
    with conn.cursor() as cur:
        # ✅ Aktywne plany z NOWYMI kolumnami (rating, feedback)
        active_plans_data = []
        for account_id, profile in all_accounts:
            goal, level, days, equipment = profile
            
            # Znajdź plany pasujące do profilu
            suitable_plans = []
            for p_id, p_goal, p_level, p_days, p_equipment in all_plans:
                score = 0
                if p_goal == goal: score += 3
                if p_level == level: score += 2  
                if p_days == days: score += 4
                if p_equipment == equipment: score += 1
                
                if score >= 5:  # Tylko dobrze pasujące plany
                    suitable_plans.append((p_id, score))
            
            if suitable_plans:
                # Wybierz najlepiej pasujący plan
                best_plan = max(suitable_plans, key=lambda x: x[1])[0]
                
                # Losowa ocena (więcej wysokich ocen dla lepiej dopasowanych planów)
                rating = random.choices([3, 4, 5], weights=[1, 3, 4])[0] if len(suitable_plans) > 3 else random.choices([2, 3, 4], weights=[2, 3, 2])[0]
                feedback_options = [
                    "Świetny plan, widzę rezultaty!",
                    "Bardzo mi odpowiada, polecam",
                    "Dobry plan, ale mógłby być bardziej zróżnicowany",
                    "Plan OK, ale czasem za długie treningi",
                    "Zadowolony z wyników",
                    None  # Brak feedback
                ]
                feedback = random.choice(feedback_options)
                
                active_plans_data.append((account_id, best_plan, rating, feedback))
            else:
                # Losowy plan jeśli nic nie pasuje
                random_plan = random.choice([p[0] for p in all_plans])
                rating = random.choice([2, 3, 4])
                active_plans_data.append((account_id, random_plan, rating, None))
        
        cur.executemany(
            "INSERT INTO user_active_plans (auth_account_id, plan_id, rating, feedback_text) VALUES (%s, %s, %s, %s)", 
            active_plans_data
        )
        print(f"   ✅ Przypisano {len(active_plans_data)} aktywnych planów z ocenami")

        # Sesje treningowe i logi
        session_count = 0
        for account_id, profile in all_accounts:
            cur.execute("SELECT plan_id FROM user_active_plans WHERE auth_account_id = %s", (account_id,))
            active_plan_row = cur.fetchone()
            active_plan_id = active_plan_row[0] if active_plan_row else random.choice([p[0] for p in all_plans])
            
            # Różna ilość sesji w zależności od poziomu
            level = profile[1]  # poziom z profilu
            if level == 'zaawansowany':
                num_sessions = int(random.gauss(AVG_SESSIONS_PER_USER * 1.3, 8))
            elif level == 'średniozaawansowany':
                num_sessions = int(random.gauss(AVG_SESSIONS_PER_USER, 6))
            else:
                num_sessions = int(random.gauss(AVG_SESSIONS_PER_USER * 0.7, 5))
            
            num_sessions = max(5, min(100, num_sessions))  # Ograniczenia
            
            for _ in range(num_sessions):
                session_date = fake.date_time_between(start_date='-1y', end_date='now')
                duration = random.randint(30, 120)  # minuty
                session_notes = random.choice([
                    "Świetny trening!", "Ciężko dziś było", "Nowy rekord!", 
                    "Skróciłem odpoczynki", "Zwiększyłem ciężary", None
                ])
                
                cur.execute(
                    "INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes) VALUES (%s, %s, %s, %s, %s) RETURNING id", 
                    (account_id, active_plan_id, session_date, duration, session_notes)
                )
                session_id = cur.fetchone()[0]
                
                # Ćwiczenia w sesji
                cur.execute("SELECT id FROM exercises ORDER BY random() LIMIT %s", (random.randint(4, 8),))
                exercises_in_session = [row[0] for row in cur.fetchall()]

                for ex_id in exercises_in_session:
                    cur.execute("INSERT INTO session_exercises (session_id, exercise_id) VALUES (%s, %s)", (session_id, ex_id))
                    
                    # Serie dla ćwiczenia (2-6 serii)
                    num_sets = random.randint(2, 6)
                    for set_num in range(1, num_sets + 1):
                        # Realistyczne ciężary w zależności od ćwiczenia i poziomu
                        base_weight = 40 if level == 'początkujący' else 70 if level == 'średniozaawansowany' else 100
                        weight = round(random.uniform(base_weight * 0.5, base_weight * 1.5), 1)
                        reps = random.randint(5, 20)
                        set_notes = random.choice([None, "Ciężko", "Lekko", "Perfect form", "Ostatnia seria"])
                        
                        cur.execute(
                            "INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                            (session_id, ex_id, set_num, weight, reps, set_notes)
                        )
                
                session_count += 1
                
        print(f"   ✅ Utworzono {session_count} sesji treningowych z detalami")

def seed_algorithm_data(conn, exercise_ids):
    """✅ NOWE: Dane dla algorytmu rekomendacyjnego"""
    print("🤖 Generowanie danych dla algorytmu rekomendacyjnego...")
    
    with conn.cursor() as cur:
        # 1. Alternatywne ćwiczenia
        alternatives_data = []
        for _ in range(100):  # 100 par alternatyw
            ex1, ex2 = random.sample(exercise_ids, 2)
            similarity_score = round(random.uniform(0.6, 1.0), 2)
            reasons = [
                'Podobna grupa mięśniowa', 'Łatwiejsza wersja', 'Wersja bez sprzętu',
                'Mniejsze obciążenie stawów', 'Wersja dla zaawansowanych', 'Inne ujęcie mięśnia'
            ]
            reason = random.choice(reasons)
            
            alternatives_data.append((ex1, ex2, similarity_score, reason))
        
        # Unikaj duplikatów
        unique_alternatives = list(set(alternatives_data))
        
        cur.executemany(
            "INSERT INTO exercise_alternatives (exercise_id, alternative_exercise_id, similarity_score, replacement_reason) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING", 
            unique_alternatives
        )
        print(f"   ✅ Dodano {len(unique_alternatives)} alternatywnych ćwiczeń")

        # 2. Logi rekomendacji (symulowane)
        cur.execute("SELECT auth_account_id FROM user_profiles LIMIT 200")  # Pierwsi 200 użytkowników
        user_ids = [row[0] for row in cur.fetchall()]
        
        cur.execute("SELECT id FROM training_plans LIMIT 50")  # Pierwsze 50 planów
        plan_ids = [row[0] for row in cur.fetchall()]
        
        recommendation_logs = []
        for user_id in user_ids:
            # Każdy użytkownik ma 2-5 logów rekomendacji
            for _ in range(random.randint(2, 5)):
                plan_id = random.choice(plan_ids)
                score = round(random.uniform(60.0, 95.0), 2)
                
                # Przykładowe dane ankiety
                survey_data = {
                    "goal": random.choice(GOALS),
                    "level": random.choice(LEVELS),
                    "trainingDaysPerWeek": random.randint(3, 6),
                    "equipment": random.choice(EQUIPMENT_PREFERENCES),
                    "sessionDuration": random.choice([45, 60, 75, 90]),
                    "focusAreas": random.sample(FOCUS_AREAS, random.randint(1, 3)),
                    "avoidances": random.sample(AVOIDANCES, random.randint(0, 2))
                }
                
                algorithm_version = random.choice(['2.0', '2.1', '2.1-beta'])
                created_at = fake.date_time_between(start_date='-6m', end_date='now')
                
                recommendation_logs.append((user_id, plan_id, score, json.dumps(survey_data), algorithm_version, created_at))
        
        cur.executemany(
            "INSERT INTO recommendation_logs (auth_account_id, plan_id, recommendation_score, survey_data, algorithm_version, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
            recommendation_logs
        )
        print(f"   ✅ Dodano {len(recommendation_logs)} logów rekomendacji")

        # 3. Tracking postępów
        progress_data = []
        for user_id in user_ids[:100]:  # Pierwsi 100 użytkowników
            # Każdy ma 5-15 pomiarów w czasie
            for _ in range(random.randint(5, 15)):
                metric_name = random.choice(['weight', 'body_fat', 'strength', 'endurance'])
                
                # Realistyczne wartości
                if metric_name == 'weight':
                    value = round(random.uniform(55.0, 120.0), 1)
                elif metric_name == 'body_fat':
                    value = round(random.uniform(8.0, 35.0), 1)
                elif metric_name == 'strength':
                    value = round(random.uniform(40.0, 200.0), 1)  # kg w martwym ciągu
                else:  # endurance
                    value = round(random.uniform(20.0, 60.0), 1)  # minuty cardio
                
                measurement_date = fake.date_between(start_date='-1y', end_date='today')
                notes = random.choice([
                    "Nowy rekord!", "Lekka poprawa", "Stagnacja", "Spadek formy", 
                    "Po kontuzji", "Zmiana diety", None
                ])
                
                progress_data.append((user_id, None, metric_name, value, measurement_date, notes))
        
        cur.executemany(
            "INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes) VALUES (%s, %s, %s, %s, %s, %s)",
            progress_data
        )
        print(f"   ✅ Dodano {len(progress_data)} rekordów trackingu postępów")

    conn.commit()

def main():
    """Główna funkcja uruchamiająca seed"""
    conn = None
    try:
        print("🚀 ROZPOCZYNAM SEED BAZY DANYCH LASKO (NOWY SCHEMAT)")
        print("=" * 60)
        
        conn = get_db_connection()
        print("✅ Połączenie z bazą danych nawiązane")
        
        # Sprawdź czy nowe tabele istnieją
        with conn.cursor() as cur:
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name IN ('recommendation_logs', 'exercise_alternatives', 'user_progress_tracking') AND table_schema = 'public'")
            new_tables = [row[0] for row in cur.fetchall()]
            
            if len(new_tables) == 3:
                print("✅ Nowe tabele algorytmu wykryte - pełny seed")
                algorithm_ready = True
            else:
                print(f"⚠️ Wykryto tylko {len(new_tables)}/3 nowych tabel - podstawowy seed")
                algorithm_ready = False
        
        # 1. Czyszczenie danych
        clear_data(conn)
        
        # 2. Dane mistrzowskie
        seed_master_data(conn)
        
        # 3. Użytkownicy i profile
        seed_accounts_and_profiles(conn)
        
        # Pobierz utworzone dane
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM exercises")
            exercise_ids = [row[0] for row in cur.fetchall()]
            
            cur.execute("SELECT auth_account_id, goal, level, training_days_per_week, equipment_preference FROM user_profiles")
            all_accounts = [(row[0], (row[1], row[2], row[3], row[4])) for row in cur.fetchall()]
            
            account_ids = [acc[0] for acc in all_accounts]
        
        print(f"📊 Dane do dalszego przetwarzania:")
        print(f"   • Ćwiczenia: {len(exercise_ids)}")
        print(f"   • Użytkownicy: {len(all_accounts)}")
        
        # 4. Plany treningowe
        seed_plans(conn, exercise_ids, account_ids)
        
        # Pobierz utworzone plany
        with conn.cursor() as cur:
            cur.execute("SELECT id, goal_type, difficulty_level, training_days_per_week, equipment_required FROM training_plans")
            all_plans = cur.fetchall()
        
        print(f"   • Plany treningowe: {len(all_plans)}")
        
        # 5. Aktywności użytkowników
        seed_user_activities(conn, all_accounts, all_plans)
        
        # 6. Dane algorytmu (jeśli tabele istnieją)
        if algorithm_ready:
            seed_algorithm_data(conn, exercise_ids)
        else:
            print("⚠️ Pomijam dane algorytmu - brak tabel. Uruchom najpierw migrację: ./migrate_recommendation_algorithm.sh")

        # 7. Podsumowanie
        print("\n" + "=" * 60)
        print("🎉 SEED ZAKOŃCZONY POMYŚLNIE!")
        print("=" * 60)
        
        with conn.cursor() as cur:
            # Statystyki
            stats_queries = [
                ("Użytkownicy", "SELECT COUNT(*) FROM auth_accounts"),
                ("Profile użytkowników", "SELECT COUNT(*) FROM user_profiles"),
                ("Ćwiczenia", "SELECT COUNT(*) FROM exercises"),
                ("Plany treningowe", "SELECT COUNT(*) FROM training_plans"),
                ("Dni planów", "SELECT COUNT(*) FROM plan_days"),
                ("Ćwiczenia w planach", "SELECT COUNT(*) FROM plan_exercises"),
                ("Aktywne plany", "SELECT COUNT(*) FROM user_active_plans"),
                ("Sesje treningowe", "SELECT COUNT(*) FROM training_sessions"),
                ("Zalogowane serie", "SELECT COUNT(*) FROM logged_sets"),
            ]
            
            if algorithm_ready:
                stats_queries.extend([
                    ("Logi rekomendacji", "SELECT COUNT(*) FROM recommendation_logs"),
                    ("Alternatywne ćwiczenia", "SELECT COUNT(*) FROM exercise_alternatives"),
                    ("Tracking postępów", "SELECT COUNT(*) FROM user_progress_tracking"),
                ])
            
            print("\n📊 STATYSTYKI BAZY DANYCH:")
            for name, query in stats_queries:
                cur.execute(query)
                count = cur.fetchone()[0]
                print(f"   • {name:<25}: {count:>6,}")
        
        # Przykładowe zapytania do testowania
        print("\n🧪 PRZYKŁADOWE ZAPYTANIA DO TESTOWANIA:")
        print("   • Planów na masę dla początkujących:")
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM training_plans WHERE goal_type = 'masa' AND difficulty_level = 'początkujący'")
            count = cur.fetchone()[0]
            print(f"     {count} planów")
        
        print("   • Średnia ocena planów:")
        with conn.cursor() as cur:
            cur.execute("SELECT ROUND(AVG(rating), 2) FROM user_active_plans WHERE rating IS NOT NULL")
            avg_rating = cur.fetchone()[0]
            print(f"     {avg_rating}/5.0")
        
        if algorithm_ready:
            print("   • Algorytm rekomendacyjny - przykład:")
            with conn.cursor() as cur:
                # Test prostego zapytania algorytmu
                cur.execute("""
                SELECT tp.name, COUNT(rl.id) as recommendations_count
                FROM training_plans tp
                LEFT JOIN recommendation_logs rl ON tp.id = rl.plan_id
                WHERE tp.goal_type = 'masa' AND tp.difficulty_level = 'początkujący'
                GROUP BY tp.id, tp.name
                ORDER BY recommendations_count DESC
                LIMIT 3
                """)
                top_plans = cur.fetchall()
                for plan_name, rec_count in top_plans:
                    print(f"     • {plan_name}: {rec_count} rekomendacji")

        print("\n🚀 NASTĘPNE KROKI:")
        print("   1. Sprawdź połączenie frontend → backend → baza")
        print("   2. Przetestuj algorytm rekomendacyjny")
        print("   3. Dodaj więcej danych jeśli potrzeba")
        
        if not algorithm_ready:
            print("\n⚠️ UWAGA: Aby włączyć pełny algorytm rekomendacyjny:")
            print("   1. Uruchom: ./migrate_recommendation_algorithm.sh")
            print("   2. Ponownie uruchom ten script dla pełnych danych")

    except psycopg2.Error as e:
        print(f"❌ BŁĄD BAZY DANYCH: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ BŁĄD OGÓLNY: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("\n✅ Połączenie z bazą zamknięte")

if __name__ == "__main__":
    main()