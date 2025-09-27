# SQL/02_insert_data_docker.py
# Seed dla Docker: hasła w formacie Django (pole 'password'), bez interaktywnych pytań

import os
import random
from datetime import date
import psycopg2
from faker import Faker
from django.contrib.auth.hashers import make_password

fake = Faker('pl_PL')

DB_CONFIG = {
    'dbname': os.environ.get('POSTGRES_DB', 'LaskoDB'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
    'host': os.environ.get('DB_HOST', 'db'),
    'port': os.environ.get('DB_PORT', '5432')
}

NUM_USERS = int(os.environ.get('SEED_USERS', '10000'))

GOALS = ['masa', 'sila', 'wytrzymalosc', 'spalanie', 'zdrowie']
LEVELS = ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']
EQUIPMENT_PREFERENCES = ['silownia', 'dom_podstawowy', 'dom_zaawansowany', 'masa_ciala', 'minimalne']

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def table_count(conn, table):
    with conn.cursor() as cur:
        cur.execute(f'SELECT COUNT(*) FROM {table}')
        return cur.fetchone()[0]

def truncate_base(conn):
    # Czyścimy tylko tabele powiązane z kontami — resztą może zająć się schema/migracje
    with conn.cursor() as cur:
        cur.execute('TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE')
        cur.execute('TRUNCATE TABLE auth_accounts RESTART IDENTITY CASCADE')
    conn.commit()

def ensure_admin_and_test(conn):
    with conn.cursor() as cur:
        # admin
        cur.execute("SELECT id FROM auth_accounts WHERE username=%s", ('admin',))
        if cur.fetchone() is None:
            cur.execute(
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                ('admin', 'admin@lasko.com', make_password('admin123'), 'Admin', True, True, True, True)
            )
        # testuser1
        cur.execute("SELECT id FROM auth_accounts WHERE username=%s", ('testuser1',))
        if cur.fetchone() is None:
            cur.execute(
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                ('testuser1', 'test1@lasko.com', make_password('test123'), 'Test', False, False, False, True)
            )
    conn.commit()

def seed_users(conn):
    created = 0
    usernames = set(['admin', 'testuser1'])
    emails = set(['admin@lasko.com', 'test1@lasko.com'])

    with conn.cursor() as cur:
        while created < NUM_USERS:
            username = fake.user_name()
            email = fake.unique.email()
            if username in usernames or email in emails:
                continue
            usernames.add(username)
            emails.add(email)

            pwd = make_password('password123')
            first_name = fake.first_name()

            cur.execute(
                """INSERT INTO auth_accounts
                   (username, email, password, first_name, is_superuser, is_admin, is_staff, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (username, email, pwd, first_name, False, False, False, True)
            )
            auth_id = cur.fetchone()[0]

            goal = random.choice(GOALS)
            level = random.choice(LEVELS)
            equipment_pref = random.choice(EQUIPMENT_PREFERENCES)
            training_days = random.choice([2, 3, 4, 5, 6])

            # Data urodzenia 18-60 lat
            year = random.randint(date.today().year - 60, date.today().year - 18)
            month = random.randint(1, 12)
            day = random.randint(1, 28)

            cur.execute(
                """INSERT INTO user_profiles
                   (auth_account_id, first_name, date_of_birth, goal, level, training_days_per_week, equipment_preference)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (auth_id, first_name, date(year, month, day), goal, level, training_days, equipment_pref)
            )

            created += 1
            if created % 20 == 0:
                pass  # tu można dodać log

    conn.commit()

def main():
    # Jeśli tabela pusta → seed
    # Jeśli niepusta i ustawiono SEED_RESET=1 → wyczyść i seed
    reset = os.environ.get('SEED_RESET', '0') == '1'
    with get_conn() as conn:
        cnt = table_count(conn, 'auth_accounts')
        if cnt == 0 or reset:
            if reset and cnt > 0:
                truncate_base(conn)
            ensure_admin_and_test(conn)
            # NUM_USERS to liczba „dodatkowych” users poza admin/testuser1
            if NUM_USERS > 0:
                seed_users(conn)

if __name__ == '__main__':
    # Konfiguracja Django do make_password
    import sys
    sys.path.append('/app')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
    import django
    django.setup()
    main()
