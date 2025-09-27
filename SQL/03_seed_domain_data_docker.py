# SQL/03_seed_domain_data_docker.py
# Bogaty seed domenowy:
# - setki ćwiczeń (generowane programowo z wariantów kąta/uchwytu/sprzętu)
# - tags, equipment
# - training_plans + plan_days + plan_exercises
# - user_active_plans
# - training_sessions + session_exercises + logged_sets
# - exercise_alternatives
# - recommendation_logs (+ survey JSON)
# - user_progress_tracking
#
# Parametry sterujące przez ENV (sensowne defaulty poniżej).

import os, random, json
from datetime import datetime, timedelta, date
import psycopg2
import psycopg2.extras as extras

try:
    from faker import Faker
    fake = Faker('pl_PL')
except Exception:
    fake = None

DB = dict(
    dbname=os.environ.get('POSTGRES_DB','LaskoDB'),
    user=os.environ.get('POSTGRES_USER','postgres'),
    password=os.environ.get('POSTGRES_PASSWORD','postgres'),
    host=os.environ.get('DB_HOST','db'),
    port=os.environ.get('DB_PORT','5432'),
)

# ====== SKALA – zmieniaj przez ENV ======
PLANS               = int(os.environ.get('SEED_PLANS', '800'))        # ile planów
EX_TARGET           = int(os.environ.get('EX_COUNT_TARGET', '600'))   # docelowa liczba ćwiczeń (orientacyjnie)
ALTS_PAIRS          = int(os.environ.get('ALTS_PAIRS', '1500'))       # par alternatyw ćwiczeń
SESSIONS_AVG        = int(os.environ.get('SESSIONS_AVG', '18'))       # średnia sesji / user
SUBSET_FRACTION     = float(os.environ.get('SUBSET_FRACTION', '0.45'))# jaka część userów dostaje aktywny plan
USERS_LIMIT         = int(os.environ.get('USERS_LIMIT', '50000'))     # maksymalnie tylu userów bierzemy do próby
RECL_USERS_LIMIT    = int(os.environ.get('RECL_USERS_LIMIT', '6000')) # ilu userów logować w recommendation_logs
RECL_LOGS_PER_USER  = int(os.environ.get('RECL_LOGS_PER_USER','3'))   # ile logów rekomendacji / user
PROGRESS_USERS      = int(os.environ.get('PROGRESS_USERS','8000'))    # u ilu userów robić tracking postępów
PROGRESS_MEAS_MIN   = int(os.environ.get('PROGRESS_MEAS_MIN','6'))
PROGRESS_MEAS_MAX   = int(os.environ.get('PROGRESS_MEAS_MAX','15'))
RESET_DOMAIN        = os.environ.get('SEED_RESET_DOMAIN','0') == '1'  # czyścić domenę przed seedem?

CHUNK = 5000  # batch do execute_values

# ====== słowniki zgodne ze schematem ======
GOALS = ['masa', 'sila', 'wytrzymalosc', 'spalanie', 'zdrowie']
LEVELS = ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']
EQUIPMENT_PREFS = ['silownia','dom_podstawowy','dom_zaawansowany','masa_ciala','minimalne']

TAGS = [
    'kalistenika','siłowe','wytrzymałościowe','mobilność','kettlebell','plyometryczne',
    'rehab','tempo','HIIT','objętość','core','stabilizacja','jednostronne','hip hinge',
    'push','pull','full-body','cardio','izolacja','siła-maks','objętość-hipertrofia'
]

EQUIPMENT = [
    'sztanga','hantle','kettlebell','drążek','wyciąg','maszyna','ławka','taśmy','odważniki','brak'
]

# ====== generator bogatego katalogu ćwiczeń ======
def gen_exercises(target=600):
    # bazowe „rodziny” per grupa
    chest_press_angles   = ['płaska','skośna-góra','skośna-dół']
    chest_press_tools    = [('sztanga','compound'), ('hantle','compound'), ('maszyna','compound')]
    chest_iso_tools      = [('hantle','isolation'), ('wyciąg','isolation'), ('maszyna','isolation')]

    back_row_tools       = [('sztanga','compound'), ('hantle','compound'), ('wyciąg','compound'), ('maszyna','compound')]
    back_row_forms       = ['w opadzie','jednorącz','pendlay','na maszynie','seated cable']
    pulls                = [('podciąganie nachwytem','compound'), ('podciąganie podchwytem','compound'),
                            ('neutral grip pull-up','compound'), ('lat pulldown','compound')]

    legs_squat_types     = [('Back Squat','compound'), ('Front Squat','compound'), ('Hack Squat','compound')]
    legs_extra           = [('Romanian Deadlift','compound'), ('Good Morning','compound'), ('Leg Press','compound'),
                            ('Lunges','compound'), ('Bulgarian Split Squat','compound'),
                            ('Leg Extension','isolation'), ('Leg Curl','isolation'),
                            ('Hip Thrust','compound'), ('Calf Raise stojąc','isolation'), ('Calf Raise siedząc','isolation')]

    shoulders_press      = [('OHP (żołnierskie)','compound'), ('Arnold Press','compound'),
                            ('Wyciskanie hantli nad głowę','compound'), ('Wyciskanie na maszynie','compound')]
    shoulders_iso        = [('Wznosy bokiem','isolation'), ('Wznosy w opadzie','isolation'), ('Face Pulls','isolation'),
                            ('Upright Row','compound')]

    biceps_moves         = [('Uginanie sztangą prostą','isolation'), ('Uginanie sztangą łamaną','isolation'),
                            ('Uginanie z hantlami (naprzemiennie)','isolation'), ('Incline DB Curl','isolation'),
                            ('Hammer Curl','isolation'), ('Preacher Curl','isolation'), ('Cable Curl','isolation')]

    triceps_moves        = [('Wyciskanie wąsko','compound'), ('Francuskie leżąc','isolation'),
                            ('Prostowanie linki (wyciąg)','isolation'), ('Overhead Extension (linka)','isolation'),
                            ('Dipy tricepsowe','compound')]

    core_moves           = [('Plank','isolation'), ('Side Plank','isolation'), ('Crunch klasyczny','isolation'),
                            ('Hanging Leg Raise','compound'), ('Russian Twist','isolation'),
                            ('Cable Crunch','isolation'), ('Ab Wheel','compound'),
                            ('Hollow Hold','isolation'), ('Mountain Climbers','isolation')]

    out = []

    # Chest presses
    for ang in chest_press_angles:
        for tool, typ in chest_press_tools:
            out.append((f'Wyciskanie {tool} na ławce {ang}', typ, 'chest'))
    # Chest iso
    for tool, typ in chest_iso_tools:
        out.append((f'Rozpiętki {tool}', typ, 'chest'))
    # Pompki (wiele wariantów)
    for var in ['klasyczne','na poręczach','diamentowe','na podwyższeniu','spider','archer','ring']:
        out.append((f'Pompki {var}', 'compound', 'chest'))

    # Back – rows
    for tool, typ in back_row_tools:
        for form in back_row_forms:
            name = 'Wiosłowanie'
            if 'seated' in form: name = 'Wiosłowanie siedząc'
            out.append((f'{name} {tool} {form}', typ, 'back'))
    # Pull-ups / pulldowns
    for pull, typ in pulls:
        out.append((pull, typ, 'back'))
    # Deadlifts
    for dl in ['Martwy ciąg klasyczny','Martwy ciąg sumo','Rumuński martwy ciąg (RDL)']:
        out.append((dl, 'compound', 'back'))
    out.append(('Hiperekstencje (prostowniki)', 'isolation', 'back'))

    # Legs
    for st, typ in legs_squat_types:
        for note in ['high-bar','low-bar','pauza','tempo 3-1-3']:
            out.append((f'{st} {note}', typ, 'legs'))
    for nm, typ in legs_extra:
        out.append((nm, typ, 'legs'))

    # Shoulders
    for nm, typ in shoulders_press + shoulders_iso:
        out.append((nm, typ, 'shoulders'))

    # Biceps / Triceps
    for nm, typ in biceps_moves: out.append((nm, typ, 'biceps'))
    for nm, typ in triceps_moves: out.append((nm, typ, 'triceps'))

    # Core
    for nm, typ in core_moves: out.append((nm, typ, 'core'))

    # Rozszerzenia masowe: warianty chwytu/uchwytu/kąta/supersety
    grips  = ['wąski','szeroki','neutralny']
    tempos = ['tempo 2-0-2','tempo 3-1-3','pauza 1s']
    sides  = ['jednorącz','oburącz','jednonóż','obunóż']
    tools2 = [('na linkach','isolation'), ('na maszynie','isolation'), ('z gumą','isolation')]

    base = list(out)
    for name, typ, grp in base:
        # generuj od 0–3 wariantów
        for _ in range(random.randint(0,3)):
            tag = random.choice([None] + grips + tempos + sides)
            t2 = random.choice([None] + [t for t,_ in tools2])
            nm = name
            if tag: nm += f' ({tag})'
            if t2 and random.random()<0.5 and 'na ' not in nm:
                nm += f' {t2}'
            out.append((nm, typ, grp))

    # deduplikacja po nazwie
    seen, dedup = set(), []
    random.shuffle(out)
    for n, t, g in out:
        if n not in seen:
            seen.add(n); dedup.append((n,t,g))
        if len(dedup) >= target:
            break
    return dedup

def connect():
    return psycopg2.connect(**DB)

def cols(cur, table):
    cur.execute("""
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name=%s
    """, (table,))
    return {r[0] for r in cur.fetchall()}

def ev(cur, sql, rows, chunk=CHUNK):
    if not rows: return
    for i in range(0, len(rows), chunk):
        extras.execute_values(cur, sql, rows[i:i+chunk], page_size=min(chunk, len(rows)-i))

def truncate_domain(conn):
    with conn.cursor() as cur:
        cur.execute("""
          SELECT table_name FROM information_schema.tables
          WHERE table_schema='public'
        """)
        existing = {r[0] for r in cur.fetchall()}
        order = [
            'logged_sets','session_exercises','training_sessions',
            'user_active_plans',
            'plan_exercises','plan_days','training_plans',
            'exercise_alternatives',
            'exercise_equipment','exercise_tags','exercise_variants',
            'exercises',
            'equipment','tags',
            'recommendation_logs','user_progress_tracking'
        ]
        clear = [t for t in order if t in existing]
        if clear:
            cur.execute("TRUNCATE TABLE {} RESTART IDENTITY CASCADE".format(", ".join(clear)))
    conn.commit()

def seed_master(conn, ex_target):
    with conn.cursor() as cur:
        cur.executemany("INSERT INTO tags (name) VALUES (%s) ON CONFLICT DO NOTHING", [(t,) for t in TAGS])
        cur.executemany("INSERT INTO equipment (name) VALUES (%s) ON CONFLICT DO NOTHING", [(e,) for e in EQUIPMENT])

        exercises = gen_exercises(ex_target)
        rows = []
        for name, typ, group in exercises:
            desc = f"Ćwiczenie {typ} – grupa: {group}"
            video = f"/videos/{name.lower().replace(' ','_').replace('(','').replace(')','')}.mp4"
            img   = f"/images/{name.lower().replace(' ','_').replace('(','').replace(')','')}.jpg"
            rows.append((name, desc, video, img, group, typ))
        ev(cur, """
          INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type)
          VALUES %s
        """, rows)
    conn.commit()

def seed_links(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM exercises")
        ex = cur.fetchall()
        cur.execute("SELECT id FROM tags");  tag_ids = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT id FROM equipment"); eq_ids = [r[0] for r in cur.fetchall()]

        variants, ex_tags, ex_eq = [], [], []
        for ex_id, name in ex:
            # warianty dla wybranych rodzin
            if any(k in name.lower() for k in ['przysiad','squat','pompki','wyciskanie','row','wiosłowanie']):
                for vname, vnote in [('Wariant A','pauza'),('Wariant B','tempo 3-1-3')]:
                    variants.append((ex_id, vname, vnote))
            # tagi
            for tid in random.sample(tag_ids, k=random.randint(1, min(4, len(tag_ids)))):
                ex_tags.append((ex_id, tid))
            # sprzęt
            for eid in random.sample(eq_ids, k=random.randint(1, min(3, len(eq_ids)))):
                ex_eq.append((ex_id, eid))

        ev(cur, "INSERT INTO exercise_variants (exercise_id, name, notes) VALUES %s", variants)
        ev(cur, "INSERT INTO exercise_tags (exercise_id, tag_id) VALUES %s ON CONFLICT DO NOTHING", ex_tags)
        ev(cur, "INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES %s ON CONFLICT DO NOTHING", ex_eq)
    conn.commit()

def seed_plans(conn, plans_n):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM exercises"); ex_ids = [r[0] for r in cur.fetchall()]
        if not ex_ids: raise RuntimeError("Brak exercises")

        pcols = cols(cur,'training_plans')
        has_active   = 'is_active' in pcols
        has_created  = 'created_at' in pcols
        has_author   = 'auth_account_id' in pcols

        authors = []
        if has_author:
            cur.execute("SELECT id FROM auth_accounts ORDER BY id ASC LIMIT 1000")
            authors = [r[0] for r in cur.fetchall()]

        # training_plans
        prows = []
        for _ in range(plans_n):
            days = random.choice([2,3,4,5,6])
            goal = random.choice(GOALS)
            lvl  = random.choice(LEVELS)
            eq   = random.choice(EQUIPMENT_PREFS)
            name = f"Plan {days}d — {goal}/{lvl}"
            desc = fake.text(160) if fake else f"Plan {days} dni ({goal}/{lvl})"
            base = [name, desc, goal, lvl, days, eq]
            if has_author:  base.append(random.choice(authors) if authors else None)
            if has_active:  base.append(True)
            if has_created: base.append(fake.date_time_between('-2y','now') if fake else datetime.utcnow())
            prows.append(tuple(base))

        pcols_list = ["name","description","goal_type","difficulty_level","training_days_per_week","equipment_required"]
        if has_author:  pcols_list.append("auth_account_id")
        if has_active:  pcols_list.append("is_active")
        if has_created: pcols_list.append("created_at")

        ev(cur, f"INSERT INTO training_plans ({', '.join(pcols_list)}) VALUES %s", prows)

        # plan_days
        cur.execute("""
          SELECT id, training_days_per_week FROM training_plans
        """)
        plans = cur.fetchall()
        day_pool = ["Push","Pull","Legs","Upper","Lower","Full Body","Cardio","Core"]
        drows = []
        for pid, dcount in plans:
            for i in range(dcount):
                name = day_pool[i] if i < len(day_pool) else f"Dzień {i+1}"
                drows.append((pid, name, i+1, None))
        dcols = cols(cur,'plan_days')
        if 'day_of_week' in dcols:
            ev(cur, "INSERT INTO plan_days (plan_id, name, day_order, day_of_week) VALUES %s", drows)
        else:
            ev(cur, "INSERT INTO plan_days (plan_id, name, day_order) VALUES %s",
               [(a,b,c) for (a,b,c,_) in drows])

        # plan_exercises
        cur.execute("SELECT id FROM plan_days"); days = [r[0] for r in cur.fetchall()]
        per_day = []
        for day_id in days:
            for _ in range(random.randint(5,8)):
                ex_id = random.choice(ex_ids)
                goal  = random.choice(GOALS)
                if goal == 'sila':
                    sets, reps, rest = '5','3-5',random.randint(120,180)
                elif goal == 'masa':
                    sets, reps, rest = random.choice(['3','4']),'8-12',random.randint(60,120)
                elif goal == 'wytrzymalosc':
                    sets, reps, rest = '3','15-20',random.randint(30,60)
                else:
                    sets, reps, rest = '3','10-15',random.randint(45,90)
                superset = (random.random()<0.25) and random.randint(1,3) or None
                per_day.append((day_id, ex_id, sets, reps, rest, superset))
        ev(cur, """
          INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
          VALUES %s
        """, per_day)
    conn.commit()

def choose_plan(plans, prof):
    goal, level, days, eq = prof
    best, score = None, -1
    for pid, g, l, d, e in plans:
        s = 0
        if g==goal: s+=3
        if l==level: s+=2
        if d==days: s+=3
        if e==eq:   s+=1
        if s>score: best,score = pid,s
    return best or random.choice([p[0] for p in plans])

def seed_active_sessions(conn):
    with conn.cursor() as cur:
        cur.execute("""
          SELECT auth_account_id, goal, level, training_days_per_week, equipment_preference
          FROM user_profiles
          ORDER BY auth_account_id ASC
          LIMIT %s
        """,(USERS_LIMIT,))
        users = cur.fetchall()
        if not users: return

        cur.execute("""
          SELECT id, goal_type, difficulty_level, training_days_per_week, equipment_required
          FROM training_plans
        """)
        plans = cur.fetchall()
        if not plans: return

        uap_cols = cols(cur,'user_active_plans')
        has_rating   = 'rating' in uap_cols
        has_feedback = 'feedback_text' in uap_cols

        # subset users
        k = max(1,int(len(users)*SUBSET_FRACTION))
        sample = random.sample(users, k)

        # insert user_active_plans
        act = []
        for (uid, g, l, d, e) in sample:
            pid = choose_plan(plans, (g,l,d,e))
            row = [uid, pid]
            if has_rating:   row.append(random.choice([None,3,4,5,4,5]))
            if has_feedback: row.append(random.choice([None,"Świetny plan!","OK","Za długi","Duża pompa"]))
            act.append(tuple(row))

        cols_list = ["auth_account_id","plan_id"]
        if has_rating: cols_list.append("rating")
        if has_feedback: cols_list.append("feedback_text")
        ev(cur, f"INSERT INTO user_active_plans ({', '.join(cols_list)}) VALUES %s", act)

        # sessions
        cur.execute("SELECT auth_account_id, plan_id FROM user_active_plans")
        m = {u:p for (u,p) in cur.fetchall()}

        sess = []
        for (uid, *_rest) in sample:
            pid = m.get(uid, random.choice(plans)[0])
            n = max(5, int(random.gauss(SESSIONS_AVG, max(3, SESSIONS_AVG*0.3))))
            for _ in range(n):
                dt  = datetime.utcnow() - timedelta(days=random.randint(1,365))
                dur = random.randint(25,110)
                note= random.choice([None,"Mocno","Lekko","Rekord","Krótsze przerwy"])
                sess.append((uid, pid, dt, dur, note))
        ev(cur, """
          INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
          VALUES %s
        """, sess)

        # session_exercises + logged_sets
        cur.execute("SELECT id FROM exercises"); ex_ids=[r[0] for r in cur.fetchall()]
        cur.execute("SELECT id FROM training_sessions"); sess_ids=[r[0] for r in cur.fetchall()]

        s_ex, sets = [], []
        for sid in sess_ids:
            for _ in range(random.randint(4,8)):
                ex_id = random.choice(ex_ids)
                s_ex.append((sid, ex_id))
                for i in range(1, random.randint(2,5)+1):
                    w = round(random.uniform(20,120),1)
                    reps = random.randint(5,15)
                    note = random.choice([None,'ok','ciężko','lekko'])
                    sets.append((sid, ex_id, i, w, reps, note))

        ev(cur, "INSERT INTO session_exercises (session_id, exercise_id) VALUES %s", s_ex)
        ev(cur, """
          INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
          VALUES %s
        """, sets)
    conn.commit()

def seed_alternatives(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM exercises")
        ex_ids = [r[0] for r in cur.fetchall()]
        pairs = set()
        rows = []
        tries = 0
        need = ALTS_PAIRS
        while len(rows) < need and tries < need*5:
            tries += 1
            a,b = random.sample(ex_ids,2)
            if a>b: a,b=b,a
            if (a,b) in pairs: continue
            pairs.add((a,b))
            sim = round(random.uniform(0.6, 0.98),2)
            reason = random.choice(['Podobna grupa','Wersja bez sprzętu','Mniejsze obciążenie stawów',
                                    'Zaawansowana progresja','Wersja unilateralna','Podobny wzorzec ruchu'])
            rows.append((a,b,sim,reason))
        ev(cur, """
          INSERT INTO exercise_alternatives (exercise_id, alternative_exercise_id, similarity_score, replacement_reason)
          VALUES %s
          ON CONFLICT DO NOTHING
        """, rows)
    conn.commit()

def seed_recommendation_logs(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT auth_account_id, goal, level, training_days_per_week, equipment_preference FROM user_profiles LIMIT %s",
                    (RECL_USERS_LIMIT,))
        users = cur.fetchall()
        cur.execute("SELECT id, goal_type, difficulty_level, training_days_per_week, equipment_required FROM training_plans")
        plans = cur.fetchall()
        if not users or not plans: return

        rows = []
        for (uid, g, l, d, e) in users:
            for _ in range(RECL_LOGS_PER_USER):
                pid   = choose_plan(plans, (g,l,d,e))
                score = round(random.uniform(60.0, 95.0), 2)
                survey = {
                    "goal": g, "level": l, "trainingDaysPerWeek": d, "equipment": e,
                    "sessionDuration": random.choice([45,60,75,90]),
                    "focusAreas": random.sample(['upper_body','lower_body','core','cardio','flexibility','functional'],
                                                k=random.randint(1,3)),
                    "avoidances": random.sample(['knee_issues','back_issues','shoulder_issues','time_constraints',
                                                 'high_impact','complex_movements'], k=random.randint(0,2))
                }
                ver = random.choice(['2.0','2.1','2.1-beta'])
                created = fake.date_time_between('-8m','now') if fake else datetime.utcnow()
                rows.append((uid, pid, score, json.dumps(survey), ver, created))
        ev(cur, """
          INSERT INTO recommendation_logs (auth_account_id, plan_id, recommendation_score, survey_data, algorithm_version, created_at)
          VALUES %s
        """, rows)
    conn.commit()

def seed_progress_tracking(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT auth_account_id FROM user_profiles ORDER BY auth_account_id ASC LIMIT %s", (PROGRESS_USERS,))
        uids = [r[0] for r in cur.fetchall()]
        if not uids: return
        rows = []
        for uid in uids:
            n = random.randint(PROGRESS_MEAS_MIN, PROGRESS_MEAS_MAX)
            for _ in range(n):
                metric = random.choice(['weight','body_fat','strength','endurance'])
                if metric=='weight':   val = round(random.uniform(55.0, 120.0),1)
                elif metric=='body_fat': val = round(random.uniform(8.0, 35.0),1)
                elif metric=='strength': val = round(random.uniform(40.0, 220.0),1)
                else: val = round(random.uniform(20.0, 60.0),1)
                when = fake.date_between('-1y','today') if fake else date.today()
                note = random.choice([None,"Nowy rekord","Lekka poprawa","Stagnacja","Po kontuzji","Zmiana diety"])
                rows.append((uid, None, metric, val, when, note))
        ev(cur, """
          INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
          VALUES %s
        """, rows)
    conn.commit()

def stats(conn):
    with conn.cursor() as cur:
        for label, tbl in [
            ("Ćwiczenia", "exercises"),
            ("Warianty ćwiczeń", "exercise_variants"),
            ("Tagi", "tags"),
            ("Sprzęt", "equipment"),
            ("Ćwiczenia×Tagi", "exercise_tags"),
            ("Ćwiczenia×Sprzęt", "exercise_equipment"),
            ("Plany", "training_plans"),
            ("Dni planów", "plan_days"),
            ("Ćwiczenia w planach", "plan_exercises"),
            ("Aktywne plany", "user_active_plans"),
            ("Sesje", "training_sessions"),
            ("Serie", "logged_sets"),
            ("Alternatywy", "exercise_alternatives"),
            ("Logi rekom.", "recommendation_logs"),
            ("Tracking post.", "user_progress_tracking"),
        ]:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                print(f"{label:22}: {cur.fetchone()[0]:,}")
            except Exception:
                pass

def main():
    print("🚀 Rich domain seeder start")
    with connect() as conn:
        if RESET_DOMAIN:
            print("🧹 Reset domeny...")
            truncate_domain(conn)

        print(f"📦 Seed master (ex≈{EX_TARGET})...")
        seed_master(conn, EX_TARGET)

        print("🔗 Linki/Tagi/Sprzęt/Warianty...")
        seed_links(conn)

        print(f"📋 Seed plans (n={PLANS}) + days + plan_exercises...")
        seed_plans(conn, PLANS)

        print("🏃 Aktywacje + sesje + serie...")
        seed_active_sessions(conn)

        print(f"🔁 Alternatywy ćwiczeń (pairs={ALTS_PAIRS})...")
        seed_alternatives(conn)

        print("🧠 Recommendation logs...")
        seed_recommendation_logs(conn)

        print("📈 Progress tracking...")
        seed_progress_tracking(conn)

        print("\n📊 STATY:")
        stats(conn)

    print("✅ DONE")

if __name__ == "__main__":
    main()