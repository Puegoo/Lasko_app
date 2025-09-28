# SQL/02_insert_data_docker.py
# SZYBKI SEED: 10k+ użytkowników z *ludzkimi* danymi (Jan Kowalski, jan.kowalski@...),
# batche + commit co batch + progress. Hasła hashowane Django (jeden hash dla szybkości).

import os
import random
import re
import unicodedata
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

try:
    from faker import Faker
    fake = Faker('pl_PL')
except Exception:
    fake = None

# ---------- KONFIG ----------
DB_CONFIG = {
    'dbname': os.environ.get('POSTGRES_DB', 'LaskoDB'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
    'host': os.environ.get('DB_HOST', 'db'),
    'port': os.environ.get('DB_PORT', '5432'),
}

NUM_USERS = int(os.environ.get('SEED_USERS', '10000'))     # ile nowych kont
SEED_RESET = os.environ.get('SEED_RESET', '0') == '1'      # czyścić tabele kont
BATCH_SIZE = int(os.environ.get('SEED_BATCH', '2000'))     # batch insert
DEFAULT_PASSWORD = os.environ.get('DEFAULT_PASSWORD', 'password123')

GOALS = ['masa', 'sila', 'wytrzymalosc', 'spalanie', 'zdrowie']
LEVELS = ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']
EQUIP = ['silownia', 'dom_podstawowy', 'dom_zaawansowany', 'masa_ciala', 'minimalne']

# Jeden hash dla wszystkich (zdecydowanie szybciej)
HASHED_PWD = make_password(DEFAULT_PASSWORD)

# ---------- POMOCNICZE ----------
_slug_re = re.compile(r'[^a-z0-9._-]+')

def to_ascii(s: str) -> str:
    """Prosta transliteracja PL -> ASCII."""
    if s is None:
        return ''
    nfkd = unicodedata.normalize('NFKD', s)
    return nfkd.encode('ascii', 'ignore').decode('ascii')

def username_from_name(first: str, last: str) -> str:
    """Buduje username w stylu jan.kowalski (ASCII, lower)."""
    base = f"{to_ascii(first).lower()}.{to_ascii(last).lower()}"
    base = _slug_re.sub('', base).strip('.')
    base = base[:28]  # zostaw trochę miejsca na ewentualne sufiksy cyfr
    return base or "user"

def email_from_username(username: str, domain: str = "seedmail.pl") -> str:
    return f"{username}@{domain}"

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def truncate_base(conn):
    with conn.cursor() as cur:
        # Uporządkowana kolejność, 1:1 profilu do konta
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

def seed_users_fast(conn):
    # Przyspieszenia
    with conn.cursor() as cur:
        cur.execute("SET synchronous_commit = off;")
        cur.execute("SET client_min_messages TO WARNING;")
    conn.commit()

    # Zbiór istniejących username/email (na wypadek SEED_RESET=0)
    existing_usernames = set()
    existing_emails = set()
    with conn.cursor() as cur:
        cur.execute("SELECT username, email FROM auth_accounts")
        for u, e in cur.fetchall():
            if u: existing_usernames.add(u)
            if e: existing_emails.add(e)

    total = 0
    while total < NUM_USERS:
        left = NUM_USERS - total
        n = min(BATCH_SIZE, left)

        accounts_vals = []
        fnames = []
        used_usernames = set()
        used_emails = set()

        for _ in range(n):
            # Imię/Nazwisko (PL) → username/email
            if fake:
                first = fake.first_name()
                last  = fake.last_name()
            else:
                first = random.choice(["Jan","Piotr","Adam","Kuba","Marek","Paweł","Tomasz","Michał"])
                last  = random.choice(["Kowalski","Nowak","Wiśniewski","Wójcik","Kozłowski","Mazur","Krawczyk"])

            uname = username_from_name(first, last)
            email = email_from_username(uname)

            # zapewnij unikalność (w ramach batcha i bazy)
            suffix = 1
            base_uname = uname
            base_email = email
            while uname in used_usernames or uname in existing_usernames:
                suffix += 1
                uname = (base_uname[:28] + f".{suffix}")[:30]
            while email in used_emails or email in existing_emails:
                suffix += 1
                email = email_from_username((base_uname[:28] + f".{suffix}")[:30])

            used_usernames.add(uname); existing_usernames.add(uname)
            used_emails.add(email);   existing_emails.add(email)

            fnames.append(first)
            accounts_vals.append((
                uname, email, HASHED_PWD, first, False, False, False, True
            ))

        # INSERT kont + RETURNING id
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

        # Profile (1:1)
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

    # Przywróć synchroniczne commit
    with conn.cursor() as cur:
        cur.execute("SET synchronous_commit = on;")
    conn.commit()

def main():
    print("🚀 SEED START (ludzkie konta)")
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