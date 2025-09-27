# SQL/02_insert_data_docker.py
# SZYBKI SEED: 10k+ użytkowników z profilami (batche, commit co batch, progress)
import os
import random
from datetime import date
import psycopg2
from psycopg2.extras import execute_values

# --- Django tylko po to, by zrobić poprawny hash hasła ---
import sys
sys.path.append('/app')  # w kontenerze backendu /app = katalog projektu
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
import django
django.setup()
from django.contrib.auth.hashers import make_password

# ---------- KONFIG ----------
DB_CONFIG = {
    'dbname': os.environ.get('POSTGRES_DB', 'LaskoDB'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
    'host': os.environ.get('DB_HOST', 'db'),
    'port': os.environ.get('DB_PORT', '5432'),
}
NUM_USERS = int(os.environ.get('SEED_USERS', '10000'))    # <- ustaw z env
SEED_RESET = os.environ.get('SEED_RESET', '0') == '1'
BATCH_SIZE = int(os.environ.get('SEED_BATCH', '2000'))    # size batche
DEFAULT_PASSWORD = os.environ.get('DEFAULT_PASSWORD', 'password123')

GOALS = ['masa', 'sila', 'wytrzymalosc', 'spalanie', 'zdrowie']
LEVELS = ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']
EQUIP = ['silownia', 'dom_podstawowy', 'dom_zaawansowany', 'masa_ciala', 'minimalne']

# Jeden hash dla wszystkich (szybciej niż liczyć 10k razy)
HASHED_PWD = make_password(DEFAULT_PASSWORD)

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def truncate_base(conn):
    with conn.cursor() as cur:
        cur.execute('TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE')
        cur.execute('TRUNCATE TABLE auth_accounts RESTART IDENTITY CASCADE')
    conn.commit()

def ensure_admin_and_test(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM auth_accounts WHERE username=%s", ('admin',))
        if cur.fetchone() is None:
            cur.execute(
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                ('admin', 'admin@lasko.com', HASHED_PWD, 'Admin', True, True, True, True)
            )
        cur.execute("SELECT id FROM auth_accounts WHERE username=%s", ('testuser1',))
        if cur.fetchone() is None:
            cur.execute(
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                ('testuser1', 'test1@lasko.com', HASHED_PWD, 'Test', False, False, False, True)
            )
    conn.commit()

def next_user_suffix(conn):
    """Ustala od jakiego numeru zacząć numerację userów (żeby nie kolidować)."""
    with conn.cursor() as cur:
        cur.execute("SELECT COALESCE(MAX(id),0) FROM auth_accounts")
        max_id = cur.fetchone()[0] or 0
    # rezerwujemy +2 na admin/testuser1, zaczniemy od (max_id+1) w dół i tak używamy unikalnych username/email
    return max_id + 1

def seed_users_fast(conn):
    # Przyspieszenia dla sesji
    with conn.cursor() as cur:
        cur.execute("SET synchronous_commit = off;")
        cur.execute("SET client_min_messages TO WARNING;")
    conn.commit()

    start_suffix = next_user_suffix(conn)

    total = 0
    while total < NUM_USERS:
        left = NUM_USERS - total
        n = min(BATCH_SIZE, left)

        # --- Przygotuj batch kont ---
        accounts_vals = []
        fnames = []
        for i in range(n):
            suffix = start_suffix + total + i
            username = f"user{suffix:06d}"
            email = f"user{suffix:06d}@seed.local"
            first_name = f"User{suffix:06d}"
            fnames.append(first_name)
            accounts_vals.append((
                username, email, HASHED_PWD, first_name, False, False, False, True
            ))

        # INSERT kont + RETURNING id (szybko dzięki execute_values)
        with conn.cursor() as cur:
            ids = execute_values(
                cur,
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES %s
                   RETURNING id""",
                accounts_vals,
                fetch=True
            )
            account_ids = [row[0] for row in ids]

        # --- Przygotuj powiązane profile (1:1 do account_ids) ---
        profile_vals = []
        for idx, acc_id in enumerate(account_ids):
            goal = random.choice(GOALS)
            level = random.choice(LEVELS)
            equip = random.choice(EQUIP)
            training_days = random.choice([2, 3, 4, 5, 6])
            year = random.randint(date.today().year - 60, date.today().year - 18)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            profile_vals.append((
                acc_id, fnames[idx], date(year, month, day),
                goal, level, training_days, equip
            ))

        with conn.cursor() as cur:
            execute_values(
                cur,
                """INSERT INTO user_profiles
                   (auth_account_id, first_name, date_of_birth, goal, level, training_days_per_week, equipment_preference)
                   VALUES %s""",
                profile_vals
            )

        conn.commit()
        total += n
        print(f"   📈 Wstawiono: {total}/{NUM_USERS}")

    # włącz synchroniczne commit z powrotem (opcjonalnie)
    with conn.cursor() as cur:
        cur.execute("SET synchronous_commit = on;")
    conn.commit()

def main():
    print("🚀 SEED START")
    with get_conn() as conn:
        if SEED_RESET:
            print("🧹 TRUNCATE auth_accounts + user_profiles")
            truncate_base(conn)

        ensure_admin_and_test(conn)
        print(f"👥 Docelowa liczba nowych użytkowników: {NUM_USERS}")

        if NUM_USERS > 0:
            seed_users_fast(conn)

    print("✅ SEED DONE")

if __name__ == '__main__':
    main()