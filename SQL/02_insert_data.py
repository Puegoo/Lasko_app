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
DB_PORT = "5432"

## USTAWIENIA ILOŚCI DANYCH ##
NUM_USERS = 1500
NUM_PLANS = 250
AVG_SESSIONS_PER_USER = 30

# Dane mistrzowskie
EXERCISES_CATALOG = {
    # --- KLATKA PIERSIOWA ---
    ('Wyciskanie sztangi na ławce płaskiej', 'compound'): 'Klatka piersiowa',
    ('Wyciskanie sztangi na ławce skośnej (góra)', 'compound'): 'Klatka piersiowa',
    ('Wyciskanie hantli na ławce płaskiej', 'compound'): 'Klatka piersiowa',
    ('Wyciskanie hantli na ławce skośnej (góra)', 'compound'): 'Klatka piersiowa',
    ('Pompki na poręczach (dipy)', 'compound'): 'Klatka piersiowa',
    ('Rozpiętki z hantlami na ławce płaskiej', 'isolation'): 'Klatka piersiowa',
    ('Przenoszenie hantla za głowę (pullover)', 'compound'): 'Klatka piersiowa',
    ('Wyciskanie na maszynie hammer (chwyt poziomy)', 'compound'): 'Klatka piersiowa',
    ('Krzyżowanie linek wyciągu (brama)', 'isolation'): 'Klatka piersiowa',
    ('Pompki klasyczne', 'compound'): 'Klatka piersiowa',

    # --- PLECY ---
    ('Martwy ciąg klasyczny', 'compound'): 'Plecy',
    ('Martwy ciąg rumuński (RDL)', 'compound'): 'Plecy',
    ('Podciąganie na drążku (nachwyt)', 'compound'): 'Plecy',
    ('Podciąganie na drążku (podchwyt)', 'compound'): 'Plecy',
    ('Wiosłowanie sztangą w opadzie tułowia', 'compound'): 'Plecy',
    ('Wiosłowanie hantlem w opadzie tułowia', 'compound'): 'Plecy',
    ('Wiosłowanie na maszynie (seated cable row)', 'compound'): 'Plecy',
    ('Ściąganie drążka wyciągu górnego do klatki', 'compound'): 'Plecy',
    ('Narciarz (na wyciągu)', 'isolation'): 'Plecy',
    ('Szrugsy ze sztangą', 'isolation'): 'Plecy',

    # --- NOGI ---
    ('Przysiad ze sztangą na plecach (Back Squat)', 'compound'): 'Nogi',
    ('Przysiad ze sztangą z przodu (Front Squat)', 'compound'): 'Nogi',
    ('Przysiad bułgarski z hantlami', 'compound'): 'Nogi',
    ('Wypychanie na suwnicy (Leg Press)', 'compound'): 'Nogi',
    ('Wykroki chodzone z hantlami', 'compound'): 'Nogi',
    ('Prostowanie nóg na maszynie', 'isolation'): 'Nogi',
    ('Uginanie nóg na maszynie leżąc', 'isolation'): 'Nogi',
    ('Hip Thrust ze sztangą', 'compound'): 'Nogi',
    ('Wspięcia na palce ze sztangą', 'isolation'): 'Nogi',
    ('Żuraw (Nordic Ham Curl)', 'compound'): 'Nogi',

    # --- BARKI ---
    ('Wyciskanie żołnierskie (OHP)', 'compound'): 'Barki',
    ('Wyciskanie hantli nad głowę siedząc', 'compound'): 'Barki',
    ('Wznosy hantli na boki', 'isolation'): 'Barki',
    ('Wznosy hantli w opadzie tułowia', 'isolation'): 'Barki',
    ('Podciąganie sztangi wzdłuż tułowia (Upright Row)', 'compound'): 'Barki',
    ('Face pulls (na wyciągu)', 'isolation'): 'Barki',
    ('Odwrotne rozpiętki na maszynie (Reverse Pec Deck)', 'isolation'): 'Barki',

    # --- BICEPS ---
    ('Uginanie ramion ze sztangą prostą', 'isolation'): 'Biceps',
    ('Uginanie ramion ze sztangą łamaną', 'isolation'): 'Biceps',
    ('Uginanie ramion z hantlami z supinacją', 'isolation'): 'Biceps',
    ('Uginanie ramion chwytem młotkowym', 'isolation'): 'Biceps',
    ('Uginanie ramion na modlitewniku', 'isolation'): 'Biceps',
    ('Uginanie ramion na wyciągu dolnym', 'isolation'): 'Biceps',

    # --- TRICEPS ---
    ('Wyciskanie sztangi w wąskim chwycie', 'compound'): 'Triceps',
    ('Wyciskanie francuskie sztangą leżąc', 'isolation'): 'Triceps',
    ('Prostowanie ramion na wyciągu górnym (linki)', 'isolation'): 'Triceps',
    ('Prostowanie ramienia z hantlem w opadzie tułowia', 'isolation'): 'Triceps',
    ('Pompki diamentowe', 'compound'): 'Triceps',

    # --- BRZUCH ---
    ('Plank (deska)', 'isolation'): 'Brzuch',
    ('Unoszenie nóg w zwisie na drążku', 'compound'): 'Brzuch',
    ('Spięcia brzucha z linką wyciągu górnego (Allahy)', 'isolation'): 'Brzuch',
    ('Russian Twist (skręty tułowia)', 'isolation'): 'Brzuch',
    ('Kółko (Ab Wheel Rollout)', 'compound'): 'Brzuch',
}
TAGS_DATA = ['kettlebell', 'plyometryczne', 'kalistenika', 'siłowe', 'wytrzymałościowe', 'mobilność']
EQUIPMENT_DATA = ['sztanga', 'hantle', 'kettlebell', 'drążek do podciągania', 'maszyna', 'ławka', 'brak']

def get_db_connection():
    return psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)

def clear_data(conn):
    print("Czyszczenie istniejących danych...")
    with conn.cursor() as cur:
        # Lista tabel do wyczyszczenia (zależności odwrócone)
        tables = [
            'notifications', 'exercise_feedback', 'user_notes', 'user_goals_history', 
            'personal_records', 'user_measurements', 'completed_plan_days', 
            'logged_sets', 'session_exercises', 'training_sessions', 
            'user_active_plans', 'plan_exercises', 'plan_days', 'plan_history', 
            'training_plans', 'exercise_equipment', 'equipment', 'exercise_tags', 
            'tags', 'exercise_variants', 'exercises', 'user_profiles', 'auth_accounts'
        ]
        cur.execute(f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE;")
    conn.commit()


def seed_master_data(conn):
    print("Generowanie danych mistrzowskich...")
    with conn.cursor() as cur:
        cur.executemany("INSERT INTO tags (name) VALUES (%s)", [(tag,) for tag in TAGS_DATA])
        cur.executemany("INSERT INTO equipment (name) VALUES (%s)", [(eq,) for eq in EQUIPMENT_DATA])
        
        exercises_to_insert = [ (name, group, type) for (name, type), group in EXERCISES_CATALOG.items() ]
        cur.executemany("INSERT INTO exercises (name, muscle_group, type) VALUES (%s, %s, %s)", exercises_to_insert)

        cur.execute("SELECT id, name FROM exercises")
        exercises = cur.fetchall()
        cur.execute("SELECT id FROM tags")
        tag_ids = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT id FROM equipment")
        equipment_ids = [row[0] for row in cur.fetchall()]
        
        for ex_id, ex_name in exercises:
            if 'Przysiad' in ex_name:
                cur.execute("INSERT INTO exercise_variants (exercise_id, name) VALUES (%s, %s)", (ex_id, 'Przysiad High-Bar'))
        
        ex_tags_data, ex_equip_data = [], []
        for ex_id, _ in exercises:
            for tag_id in random.sample(tag_ids, k=random.randint(0, 2)): ex_tags_data.append((ex_id, tag_id))
            for eq_id in random.sample(equipment_ids, k=random.randint(1, 3)): ex_equip_data.append((ex_id, eq_id))
        
        cur.executemany("INSERT INTO exercise_tags (exercise_id, tag_id) VALUES (%s, %s)", ex_tags_data)
        cur.executemany("INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (%s, %s)", ex_equip_data)
    conn.commit()
    
def seed_accounts_and_profiles(conn):
    print(f"Generowanie {NUM_USERS} kont i profili...")
    unique_usernames, unique_emails = set(), set()
    
    with conn.cursor() as cur:
        while len(unique_usernames) < NUM_USERS:
            username, email = fake.user_name(), fake.email()
            if username in unique_usernames or email in unique_emails: continue
            
            unique_usernames.add(username)
            unique_emails.add(email)
            
            # 1. Stwórz konto logowania
            first_name = fake.first_name()
            cur.execute(
                "INSERT INTO auth_accounts (username, email, password_hash, first_name) VALUES (%s, %s, %s, %s) RETURNING id",
                (username, email, hashlib.sha256('password123'.encode()).hexdigest(), first_name)
            )
            auth_account_id = cur.fetchone()[0]

            # 2. Stwórz powiązany profil użytkownika z danymi z ankiety
            cur.execute(
                "INSERT INTO user_profiles (auth_account_id, first_name, date_of_birth, goal, level, training_days_per_week, equipment_preference) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (auth_account_id, first_name, fake.date_of_birth(minimum_age=16, maximum_age=60),
                 random.choice(['masa', 'redukcja', 'siła']), 
                 random.choice(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']),
                 random.choice([2, 3, 4, 5, 6]), 
                 random.choice(['silownia_full', 'wolne_ciezary', 'dom_kalistenika']))
            )
    conn.commit()

def seed_plans(conn, exercise_ids, account_ids):
    print(f"Generowanie {NUM_PLANS} planów treningowych...")
    with conn.cursor() as cur:
        for _ in range(NUM_PLANS):
            days = random.choice([2, 3, 4, 5, 6])
            goal = random.choice(['masa', 'redukcja', 'siła'])
            level = random.choice(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany'])
            equipment = random.choice(['silownia_full', 'wolne_ciezary', 'dom_kalistenika'])
            plan_name = f"Plan {days}-dniowy: {goal.capitalize()} ({level})"
            
            cur.execute("INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, auth_account_id) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                        (plan_name, f"Opis planu dla celu {goal}", goal, level, days, equipment, random.choice(account_ids)))
            plan_id = cur.fetchone()[0]

            for i in range(days):
                cur.execute("INSERT INTO plan_days (plan_id, name, day_order) VALUES (%s, %s, %s) RETURNING id", (plan_id, f"Dzień {i+1}", i+1))
                day_id = cur.fetchone()[0]
                
                for _ in range(random.randint(4, 6)): # ćwiczenia w dniu
                    cur.execute("INSERT INTO plan_exercises (plan_day_id, exercise_id) VALUES (%s, %s)",
                                 (day_id, random.choice(exercise_ids)))
    conn.commit()

def seed_user_activities(conn, all_accounts, all_plans):
    print("Symulowanie aktywności użytkowników...")
    with conn.cursor() as cur:
        active_plans_data = []
        for account_id, days in all_accounts:
            suitable_plans = [p_id for p_id, p_days in all_plans if p_days == days]
            if suitable_plans: active_plans_data.append((account_id, random.choice(suitable_plans)))
        cur.executemany("INSERT INTO user_active_plans (auth_account_id, plan_id) VALUES (%s, %s)", active_plans_data)

        for account_id, _ in all_accounts:
            cur.execute("SELECT plan_id FROM user_active_plans WHERE auth_account_id = %s", (account_id,))
            active_plan_row = cur.fetchone()
            active_plan_id = active_plan_row[0] if active_plan_row else random.choice([p[0] for p in all_plans])
            
            for _ in range(int(random.gauss(AVG_SESSIONS_PER_USER, 5))):
                session_date = datetime.now() - timedelta(days=random.randint(1, 365))
                cur.execute("INSERT INTO training_sessions (auth_account_id, plan_id, session_date) VALUES (%s, %s, %s) RETURNING id", 
                            (account_id, active_plan_id, session_date))
                session_id = cur.fetchone()[0]
                
                cur.execute("SELECT id FROM exercises ORDER BY random() LIMIT %s", (random.randint(4, 7),))
                exercises_in_session = [row[0] for row in cur.fetchall()]

                for ex_id in exercises_in_session:
                    cur.execute("INSERT INTO session_exercises (session_id, exercise_id) VALUES (%s, %s)", (session_id, ex_id))
                    for set_num in range(1, 4):
                        weight = round(random.uniform(20.0, 120.0), 1)
                        cur.execute("INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps) VALUES (%s, %s, %s, %s, %s)",
                                    (session_id, ex_id, set_num, weight, random.randint(5, 12)))
    conn.commit()

def main():
    conn = None
    try:
        conn = get_db_connection()
        clear_data(conn)
        
        seed_master_data(conn)
        seed_accounts_and_profiles(conn)
        
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM exercises")
            exercise_ids = [row[0] for row in cur.fetchall()]
            cur.execute("SELECT auth_account_id, training_days_per_week FROM user_profiles")
            all_accounts = cur.fetchall()
            account_ids = [acc[0] for acc in all_accounts]
        
        seed_plans(conn, exercise_ids, account_ids)
        
        with conn.cursor() as cur:
            cur.execute("SELECT id, training_days_per_week FROM training_plans")
            all_plans = cur.fetchall()

        seed_user_activities(conn, all_accounts, all_plans)

        print("\n\n✅ Gotowe! Baza danych została wypełniona danymi dla nowego schematu.")
    except psycopg2.Error as e:
        print(f"❌ Błąd bazy danych: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    main()