-- =================================================================
-- LASKO APP - STATYCZNY SEED DANYCH
-- Realistyczne dane dla aplikacji treningowej
-- =================================================================

-- =================================================================
-- CZYSZCZENIE ISTNIEJĄCYCH DANYCH
-- =================================================================
TRUNCATE TABLE logged_sets, session_exercises, training_sessions, user_active_plans,
plan_exercises, plan_days, training_plans, exercise_alternatives,
exercise_equipment, exercise_tags, exercise_variants, exercises,
equipment, tags, recommendation_logs, user_progress_tracking,
user_profiles, auth_accounts
RESTART IDENTITY CASCADE;

-- =================================================================
-- SPRZĘT
-- =================================================================
INSERT INTO equipment (name) VALUES
('sztanga'),
('hantle'),
('kettlebell'),
('drążek'),
('wyciąg'),
('maszyna'),
('ławka'),
('taśmy'),
('odważniki'),
('brak')
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- TAGI
-- =================================================================
INSERT INTO tags (name) VALUES
('kalistenika'),
('siłowe'),
('wytrzymałościowe'),
('mobilność'),
('kettlebell'),
('plyometryczne'),
('rehab'),
('tempo'),
('HIIT'),
('objętość'),
('core'),
('stabilizacja'),
('jednostronne'),
('hip hinge'),
('push'),
('pull'),
('full-body'),
('cardio'),
('izolacja'),
('siła-maks'),
('objętość-hipertrofia')
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- ĆWICZENIA - REALISTYCZNE, BOGATE DANE
-- =================================================================

-- KLATKA PIERSIOWA
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Wyciskanie sztangi na ławce płaska', 'Podstawowe ćwiczenie na klatkę piersiową. Leżąc na ławce, wyciskasz sztangę w górę.', '/videos/wyciskanie-sztangi-lawka-plaska.mp4', '/images/wyciskanie-sztangi-lawka-plaska.jpg', 'chest', 'compound'),
('Wyciskanie hantli na ławce płaska', 'Wyciskanie hantli pozwala na większy zakres ruchu niż sztanga.', '/videos/wyciskanie-hantli-lawka-plaska.mp4', '/images/wyciskanie-hantli-lawka-plaska.jpg', 'chest', 'compound'),
('Wyciskanie sztangi na ławce skośna-góra', 'Mocniej angażuje górną część klatki piersiowej.', '/videos/wyciskanie-sztangi-skosna-gora.mp4', '/images/wyciskanie-sztangi-skosna-gora.jpg', 'chest', 'compound'),
('Wyciskanie hantli na ławce skośna-góra', 'Wariant z hantlami na ławce ustawionej pod kątem 30-45 stopni.', '/videos/wyciskanie-hantli-skosna-gora.mp4', '/images/wyciskanie-hantli-skosna-gora.jpg', 'chest', 'compound'),
('Wyciskanie sztangi na ławce skośna-dół', 'Mocniej angażuje dolną część klatki piersiowej.', '/videos/wyciskanie-sztangi-skosna-dol.mp4', '/images/wyciskanie-sztangi-skosna-dol.jpg', 'chest', 'compound'),
('Rozpiętki hantle', 'Ćwiczenie izolacyjne na klatkę piersiową. Rozchylasz ręce z hantlami.', '/videos/rozpietki-hantle.mp4', '/images/rozpietki-hantle.jpg', 'chest', 'isolation'),
('Rozpiętki wyciąg', 'Rozpiętki wykonywane na wyciągu, zapewnia ciągłe napięcie mięśni.', '/videos/rozpietki-wyciag.mp4', '/images/rozpietki-wyciag.jpg', 'chest', 'isolation'),
('Pompki klasyczne', 'Podstawowe ćwiczenie kalisteniczne na klatkę piersiową i triceps.', '/videos/pompki-klasyczne.mp4', '/images/pompki-klasyczne.jpg', 'chest', 'compound'),
('Pompki na poręczach', 'Zaawansowane pompki na poręczach, mocno angażują klatkę i triceps.', '/videos/pompki-poręczach.mp4', '/images/pompki-poręczach.jpg', 'chest', 'compound'),
('Pompki diamentowe', 'Pompki z rękami ułożonymi w kształt diamentu, mocniej angażują triceps.', '/videos/pompki-diamentowe.mp4', '/images/pompki-diamentowe.jpg', 'chest', 'compound'),
('Pompki na podwyższeniu', 'Ułatwiona wersja pompek, dobre dla początkujących.', '/videos/pompki-podwyzszeniu.mp4', '/images/pompki-podwyzszeniu.jpg', 'chest', 'compound'),
('Dips na poręczach', 'Ćwiczenie na klatkę piersiową i triceps wykonywane na poręczach.', '/videos/dips-poreczach.mp4', '/images/dips-poreczach.jpg', 'chest', 'compound');

-- PLECY
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Martwy ciąg', 'Król ćwiczeń siłowych. Angażuje całe ciało, szczególnie plecy i nogi.', '/videos/martwy-ciag.mp4', '/images/martwy-ciag.jpg', 'back', 'compound'),
('Wiosłowanie sztangą', 'Klasyczne ćwiczenie na szerokość i grubość pleców.', '/videos/wioslowanie-sztanga.mp4', '/images/wioslowanie-sztanga.jpg', 'back', 'compound'),
('Wiosłowanie hantlem jednorącz', 'Pozwala na lepsze rozciągnięcie i większy zakres ruchu.', '/videos/wioslowanie-hantlem-jednoracz.mp4', '/images/wioslowanie-hantlem-jednoracz.jpg', 'back', 'compound'),
('Podciąganie na drążku', 'Najlepsze ćwiczenie kalisteniczne na plecy. Chwyt szeroki.', '/videos/podciaganie-drazek.mp4', '/images/podciaganie-drazek.jpg', 'back', 'compound'),
('Podciąganie chwytem neutralnym', 'Wariant podciągania z chwytem neutralnym, mniej obciąża nadgarstki.', '/videos/podciaganie-neutralny.mp4', '/images/podciaganie-neutralny.jpg', 'back', 'compound'),
('Podciąganie chwytem wąskim', 'Mocniej angażuje dolne mięśnie pleców.', '/videos/podciaganie-waski.mp4', '/images/podciaganie-waski.jpg', 'back', 'compound'),
('Ściąganie wyciągu szerokim chwytem', 'Ćwiczenie na maszynie imitujące podciąganie.', '/videos/sciaganie-wyciag-szeroki.mp4', '/images/sciaganie-wyciag-szeroki.jpg', 'back', 'compound'),
('Wiosłowanie wyciągiem siedząc', 'Ćwiczenie na maszynie, bezpieczne dla kręgosłupa.', '/videos/wioslowanie-wyciag-siedzac.mp4', '/images/wioslowanie-wyciag-siedzac.jpg', 'back', 'compound'),
('Martwy ciąg rumuński', 'Wariant martwego ciągu mocniej angażujący tył nóg i plecy.', '/videos/martwy-ciag-rumunski.mp4', '/images/martwy-ciag-rumunski.jpg', 'back', 'compound'),
('Pompki australijskie', 'Pompki wykonywane pod kątem, dobre na plecy i biceps.', '/videos/pompki-australijskie.mp4', '/images/pompki-australijskie.jpg', 'back', 'compound'),
('Superman', 'Ćwiczenie izolacyjne na dolny odcinek pleców.', '/videos/superman.mp4', '/images/superman.jpg', 'back', 'isolation');

-- NOGI
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Przysiady ze sztangą', 'Podstawowe ćwiczenie na nogi. Utrzymuj proste plecy.', '/videos/przysiady-sztanga.mp4', '/images/przysiady-sztanga.jpg', 'legs', 'compound'),
('Przysiady przednie', 'Przysiady ze sztangą z przodu, mocniej angażuje mięśnie czworogłowe.', '/videos/przysiady-przednie.mp4', '/images/przysiady-przednie.jpg', 'legs', 'compound'),
('Przysiady', 'Klasyczne przysiady bez obciążenia, dobre na rozgrzewkę.', '/videos/przysiady.mp4', '/images/przysiady.jpg', 'legs', 'compound'),
('Wypady hantle', 'Ćwiczenie jednostronne na nogi. Wykonuj wypad do przodu.', '/videos/wypady-hantle.mp4', '/images/wypady-hantle.jpg', 'legs', 'compound'),
('Wypady', 'Wypady bez obciążenia, dobre dla początkujących.', '/videos/wypady.mp4', '/images/wypady.jpg', 'legs', 'compound'),
('Pistol Squat', 'Zaawansowane przysiady na jednej nodze.', '/videos/pistol-squat.mp4', '/images/pistol-squat.jpg', 'legs', 'compound'),
('Przysiady bułgarskie', 'Wypad z tylną nogą na podwyższeniu.', '/videos/przysiady-bulgarskie.mp4', '/images/przysiady-bulgarskie.jpg', 'legs', 'compound'),
('Prostowanie nóg maszyna', 'Ćwiczenie izolacyjne na mięśnie czworogłowe.', '/videos/prostowanie-nog-maszyna.mp4', '/images/prostowanie-nog-maszyna.jpg', 'legs', 'isolation'),
('Uginanie nóg maszyna', 'Ćwiczenie izolacyjne na mięśnie dwugłowe ud.', '/videos/uginanie-nog-maszyna.mp4', '/images/uginanie-nog-maszyna.jpg', 'legs', 'isolation'),
('Wspięcia na palce', 'Ćwiczenie na łydki. Można wykonywać stojąc lub siedząc.', '/videos/wspiecia-palce.mp4', '/images/wspiecia-palce.jpg', 'legs', 'isolation'),
('Hack Squat', 'Przysiady na maszynie Hack, bezpieczniejsze dla kręgosłupa.', '/videos/hack-squat.mp4', '/images/hack-squat.jpg', 'legs', 'compound'),
('Leg Press', 'Wyciskanie nogami na maszynie, alternatywa dla przysiadów.', '/videos/leg-press.mp4', '/images/leg-press.jpg', 'legs', 'compound');

-- BARKI
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Wyciskanie sztangi nad głową', 'Podstawowe ćwiczenie na barki. Wyciskaj sztangę nad głową.', '/videos/wyciskanie-sztangi-nad-glowa.mp4', '/images/wyciskanie-sztangi-nad-glowa.jpg', 'shoulders', 'compound'),
('Wyciskanie hantli nad głową', 'Wariant z hantlami, pozwala na większy zakres ruchu.', '/videos/wyciskanie-hantli-nad-glowa.mp4', '/images/wyciskanie-hantli-nad-glowa.jpg', 'shoulders', 'compound'),
('Unoszenie bokiem hantle', 'Ćwiczenie izolacyjne na środkowe aktony barków.', '/videos/unoszenie-bokiem-hantle.mp4', '/images/unoszenie-bokiem-hantle.jpg', 'shoulders', 'isolation'),
('Unoszenie przód hantle', 'Ćwiczenie na przednie aktony barków.', '/videos/unoszenie-przod-hantle.mp4', '/images/unoszenie-przod-hantle.jpg', 'shoulders', 'isolation'),
('Unoszenie w opadzie hantle', 'Ćwiczenie na tylnie aktony barków.', '/videos/unoszenie-opad-hantle.mp4', '/images/unoszenie-opad-hantle.jpg', 'shoulders', 'isolation'),
('Arnold Press', 'Wyciskanie hantli z rotacją, kompleksowe ćwiczenie na barki.', '/videos/arnold-press.mp4', '/images/arnold-press.jpg', 'shoulders', 'compound'),
('Wznosy bokiem wyciąg', 'Unoszenie bokiem na wyciągu, ciągłe napięcie mięśni.', '/videos/wznosy-bokiem-wyciag.mp4', '/images/wznosy-bokiem-wyciag.jpg', 'shoulders', 'isolation');

-- BICEPS
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Uginanie ramion ze sztangą', 'Podstawowe ćwiczenie na biceps. Uginaj ramiona ze sztangą.', '/videos/uginanie-ramion-sztanga.mp4', '/images/uginanie-ramion-sztanga.jpg', 'biceps', 'isolation'),
('Uginanie ramion z hantlami', 'Wariant z hantlami, pozwala na większy zakres ruchu.', '/videos/uginanie-ramion-hantle.mp4', '/images/uginanie-ramion-hantle.jpg', 'biceps', 'isolation'),
('Uginanie ramion ze sztangą łamaną', 'Mniej obciąża nadgarstki niż prosta sztanga.', '/videos/uginanie-sztanga-lamana.mp4', '/images/uginanie-sztanga-lamana.jpg', 'biceps', 'isolation'),
('Uginanie ramion młotkowe', 'Mocniej angażuje mięśnie ramienne.', '/videos/uginanie-mlotkowe.mp4', '/images/uginanie-mlotkowe.jpg', 'biceps', 'isolation'),
('Uginanie ramion na modlitewniku', 'Ćwiczenie izolacyjne na maszynie.', '/videos/uginanie-modlitewnik.mp4', '/images/uginanie-modlitewnik.jpg', 'biceps', 'isolation'),
('Uginanie ramion wyciąg', 'Ćwiczenie na wyciągu, ciągłe napięcie mięśni.', '/videos/uginanie-wyciag.mp4', '/images/uginanie-wyciag.jpg', 'biceps', 'isolation'),
('Uginanie ramion jednorącz hantel', 'Pozwala na lepszą koncentrację na każdym ramieniu.', '/videos/uginanie-jednoracz-hantel.mp4', '/images/uginanie-jednoracz-hantel.jpg', 'biceps', 'isolation');

-- TRICEPS
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Wyciskanie francuskie hantle', 'Ćwiczenie izolacyjne na triceps z hantlami.', '/videos/wyciskanie-francuskie-hantle.mp4', '/images/wyciskanie-francuskie-hantle.jpg', 'triceps', 'isolation'),
('Wyciskanie francuskie sztanga', 'Wariant z sztangą, większe obciążenie.', '/videos/wyciskanie-francuskie-sztanga.mp4', '/images/wyciskanie-francuskie-sztanga.jpg', 'triceps', 'isolation'),
('Prostowanie ramion wyciąg', 'Ćwiczenie na wyciągu, ciągłe napięcie mięśni.', '/videos/prostowanie-ramion-wyciag.mp4', '/images/prostowanie-ramion-wyciag.jpg', 'triceps', 'isolation'),
('Prostowanie ramion wyciąg jednorącz', 'Wariant jednorącz, lepsza izolacja.', '/videos/prostowanie-wyciag-jednoracz.mp4', '/images/prostowanie-wyciag-jednoracz.jpg', 'triceps', 'isolation'),
('Wyciskanie wąskim chwytem', 'Wyciskanie sztangi wąskim chwytem mocno angażuje triceps.', '/videos/wyciskanie-waskim-chwytem.mp4', '/images/wyciskanie-waskim-chwytem.jpg', 'triceps', 'compound'),
('Pompki diamentowe', 'Pompki z rękami w kształcie diamentu, mocno angażują triceps.', '/videos/pompki-diamentowe-triceps.mp4', '/images/pompki-diamentowe-triceps.jpg', 'triceps', 'compound');

-- CORE / BRZUCH
INSERT INTO exercises (name, description, video_url, image_url, muscle_group, type) VALUES
('Plank', 'Ćwiczenie izometryczne na cały core. Utrzymuj pozycję przez określony czas.', '/videos/plank.mp4', '/images/plank.jpg', 'core', 'isolation'),
('Russian Twist', 'Ćwiczenie na mięśnie skośne brzucha. Rotacja tułowia.', '/videos/russian-twist.mp4', '/images/russian-twist.jpg', 'core', 'isolation'),
('Brzuszki', 'Klasyczne brzuszki, angażują przednią część brzucha.', '/videos/brzuszki.mp4', '/images/brzuszki.jpg', 'core', 'isolation'),
('Unoszenie nóg w zwisie', 'Zaawansowane ćwiczenie na dolne partie brzucha.', '/videos/unoszenie-nog-zwisie.mp4', '/images/unoszenie-nog-zwisie.jpg', 'core', 'isolation'),
('Mountain Climbers', 'Ćwiczenie cardio i core jednocześnie.', '/videos/mountain-climbers.mp4', '/images/mountain-climbers.jpg', 'core', 'cardio'),
('Dead Bug', 'Ćwiczenie stabilizacyjne na core, bezpieczne dla kręgosłupa.', '/videos/dead-bug.mp4', '/images/dead-bug.jpg', 'core', 'isolation'),
('Side Plank', 'Plank bokiem, mocniej angażuje mięśnie skośne.', '/videos/side-plank.mp4', '/images/side-plank.jpg', 'core', 'isolation'),
('Hollow Body Hold', 'Zaawansowane ćwiczenie izometryczne na cały core.', '/videos/hollow-body-hold.mp4', '/images/hollow-body-hold.jpg', 'core', 'isolation');

-- =================================================================
-- BAZOWE PLANY TRENINGOWE
-- =================================================================

-- Plan 1: Masa 3×/tydz • Podstawy • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Podstawy • Siłownia', 
        'Plan budowy masy dla początkujących na siłowni. Skupia się na podstawowych ćwiczeniach złożonych. Idealny dla osób, które dopiero zaczynają przygodę z treningiem siłowym.',
        'masa', 'poczatkujacy', 3, 'silownia', TRUE, TRUE);

-- Dni planu 1
INSERT INTO plan_days (plan_id, name, day_order, day_of_week) VALUES
((SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia'), 'Push (Pchające)', 1, NULL),
((SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia'), 'Pull (Ciągnące)', 2, NULL),
((SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia'), 'Legs (Nogi)', 3, NULL);

-- Ćwiczenia - Dzień 1 (Push)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie hantli na ławce skośna-góra'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Pompki klasyczne'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie francuskie hantle'
LIMIT 1;

-- Ćwiczenia - Dzień 2 (Pull)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '8-10', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Martwy ciąg'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Wiosłowanie sztangą'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '6-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Podciąganie na drążku'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Uginanie ramion ze sztangą'
LIMIT 1;

-- Ćwiczenia - Dzień 3 (Legs)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Wypady hantle'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Martwy ciąg rumuński'
LIMIT 1;

INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '15-20', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Wspięcia na palce'
LIMIT 1;

-- Plan 2: Siła 3×/tydz • Podstawy • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 3×/tydz • Podstawy • Siłownia',
        'Plan budowy siły dla początkujących - skupienie na podstawowych wzorcach ruchowych. Idealny dla osób chcących zwiększyć siłę maksymalną.',
        'sila', 'poczatkujacy', 3, 'silownia', TRUE, TRUE);

-- Dni planu 2
INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
SELECT tp.id, dn.name, dn.order, NULL
FROM training_plans tp
CROSS JOIN (VALUES ('Full Body A', 1), ('Full Body B', 2), ('Full Body C', 3)) AS dn(name, order)
WHERE tp.name = 'Siła 3×/tydz • Podstawy • Siłownia';

-- Ćwiczenia - Plan 2, Dzień 1 (Full Body A)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Martwy ciąg'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wiosłowanie sztangą'
LIMIT 1;

-- Ćwiczenia - Plan 2, Dzień 2 (Full Body B)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Wyciskanie sztangi nad głową'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Martwy ciąg'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 2
  AND e.name = 'Podciąganie na drążku'
LIMIT 1;

-- Ćwiczenia - Plan 2, Dzień 3 (Full Body C)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Martwy ciąg'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '5', '5', 180, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 3
  AND e.name = 'Wiosłowanie hantlem jednorącz'
LIMIT 1;

-- Plan 3: Spalanie 3×/tydz • Podstawy • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Podstawy • Siłownia',
        'Plan spalania tłuszczu dla początkujących - trening obwodowy łączący ćwiczenia siłowe z elementami cardio.',
        'spalanie', 'poczatkujacy', 3, 'silownia', TRUE, TRUE);

-- Dni planu 3
INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
SELECT tp.id, dn.name, dn.order, NULL
FROM training_plans tp
CROSS JOIN (VALUES ('Full Body Circuit', 1), ('Full Body Circuit 2', 2), ('Full Body Circuit 3', 3)) AS dn(name, order)
WHERE tp.name = 'Spalanie 3×/tydz • Podstawy • Siłownia';

-- Ćwiczenia - Plan 3 (trening obwodowy) - Dzień 1
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '15-20', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wiosłowanie sztangą'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wypady hantle'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie sztangi nad głową'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '30-45s', 45, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Plank'
LIMIT 1;

-- Plan 4: Masa 3×/tydz • Podstawy • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Podstawy • Masa ciała',
        'Budowa masy bez sprzętu - kalistenika dla początkujących. Idealny dla osób trenujących w domu.',
        'masa', 'poczatkujacy', 3, 'masa_ciala', TRUE, TRUE);

-- Dni planu 4
INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
SELECT tp.id, dn.name, dn.order, NULL
FROM training_plans tp
CROSS JOIN (VALUES ('Push Day', 1), ('Pull Day', 2), ('Legs & Core', 3)) AS dn(name, order)
WHERE tp.name = 'Masa 3×/tydz • Podstawy • Masa ciała';

-- Ćwiczenia - Plan 4 - Dzień 1 (Push)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-12', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 1
  AND e.name = 'Pompki klasyczne'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '6-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 1
  AND e.name = 'Pompki na poręczach'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '8-12', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 1
  AND e.name = 'Pompki diamentowe'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 1
  AND e.name = 'Pompki na podwyższeniu'
LIMIT 1;

-- Ćwiczenia - Plan 4 - Dzień 2 (Pull)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '6-10', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 2
  AND e.name = 'Podciąganie na drążku'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '6-10', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 2
  AND e.name = 'Podciąganie chwytem neutralnym'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-15', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 2
  AND e.name = 'Pompki australijskie'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 2
  AND e.name = 'Superman'
LIMIT 1;

-- Ćwiczenia - Plan 4 - Dzień 3 (Legs & Core)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '15-20', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 3
  AND e.name = 'Przysiady'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '12-15', 75, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 3
  AND e.name = 'Wypady'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '30-60s', 60, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 3
  AND e.name = 'Plank'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '20-30', 45, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Masa ciała')
  AND pd.day_order = 3
  AND e.name = 'Russian Twist'
LIMIT 1;

-- Plan 5: Masa 4×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Średni • Siłownia',
        'Czterodniowy split dla średniozaawansowanych - Push/Pull/Legs/Upper Body. Większa objętość treningowa.',
        'masa', 'sredniozaawansowany', 4, 'silownia', TRUE, TRUE);

-- Dni planu 5
INSERT INTO plan_days (plan_id, name, day_order, day_of_week)
SELECT tp.id, dn.name, dn.order, NULL
FROM training_plans tp
CROSS JOIN (VALUES ('Push (Klatka, Barki, Triceps)', 1), ('Pull (Plecy, Biceps)', 2), ('Legs (Nogi)', 3), ('Upper Body', 4)) AS dn(name, order)
WHERE tp.name = 'Masa 4×/tydz • Średni • Siłownia';

-- Ćwiczenia - Plan 5 - Dzień 1 (Push)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia')
  AND pd.day_order = 1
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia')
  AND pd.day_order = 1
  AND e.name IN ('Wyciskanie hantli na ławce skośna-góra', 'Wyciskanie sztangi nad głową', 'Unoszenie bokiem hantle', 'Wyciskanie francuskie hantle')
LIMIT 1;

-- Ćwiczenia - Plan 5 - Dzień 2 (Pull)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '6-8', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia')
  AND pd.day_order = 2
  AND e.name IN ('Martwy ciąg', 'Wiosłowanie sztangą', 'Podciąganie na drążku', 'Wiosłowanie hantlem jednorącz', 'Uginanie ramion ze sztangą')
LIMIT 1;

-- Ćwiczenia - Plan 5 - Dzień 3 (Legs)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '4', '8-10', 120, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia')
  AND pd.day_order = 3
  AND e.name IN ('Przysiady ze sztangą', 'Wypady hantle', 'Martwy ciąg rumuński', 'Prostowanie nóg maszyna', 'Wspięcia na palce')
LIMIT 1;

-- Ćwiczenia - Plan 5 - Dzień 4 (Upper Body)
INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
SELECT pd.id, e.id, '3', '10-12', 90, NULL
FROM plan_days pd, exercises e
WHERE pd.plan_id = (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia')
  AND pd.day_order = 4
  AND e.name IN ('Wyciskanie sztangi na ławce płaska', 'Wiosłowanie sztangą', 'Wyciskanie sztangi nad głową', 'Uginanie ramion ze sztangą', 'Wyciskanie francuskie hantle')
LIMIT 1;

-- =================================================================
-- STATYCZNE KONTA UŻYTKOWNIKÓW
-- Wszystkie hasła: password123
-- Hash Django: pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=
-- =================================================================

INSERT INTO auth_accounts (username, email, password, first_name, is_superuser, is_staff, is_active, is_admin, date_joined, groups, user_permissions) VALUES
-- Admin
('admin', 'admin@lasko.pl', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Administrator', TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),

-- Użytkownicy testowi - różne profile
('jan.kowalski', 'jan.kowalski@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Jan', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('anna.nowak', 'anna.nowak@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Anna', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('piotr.wisniewski', 'piotr.wisniewski@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Piotr', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('magdalena.wojcik', 'magdalena.wojcik@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Magdalena', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('krzysztof.kowalczyk', 'krzysztof.kowalczyk@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Krzysztof', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('agnieszka.kaminska', 'agnieszka.kaminska@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Agnieszka', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('tomasz.zielinski', 'tomasz.zielinski@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Tomasz', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('maria.szymanska', 'maria.szymanska@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Maria', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb),
('mateusz.dabrowski', 'mateusz.dabrowski@example.com', 'pbkdf2_sha256$870000$Fbj3hFawaAVacA3aeLmF23$pq2SXJrKpERX1Kk/cOljFkxdBVwlrEA/oEY2kPOmKJ0=', 'Mateusz', FALSE, FALSE, TRUE, FALSE, CURRENT_TIMESTAMP, '[]'::jsonb, '[]'::jsonb);

-- =================================================================
-- STATYCZNE PROFILE UŻYTKOWNIKÓW
-- =================================================================

INSERT INTO user_profiles (auth_account_id, first_name, date_of_birth, goal, level, training_days_per_week, equipment_preference, preferred_session_duration, recommendation_method, weight_kg, height_cm, injuries, health_conditions, focus_areas, avoid_exercises) VALUES
-- Jan Kowalski - Masa, początkujący, siłownia
((SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'), 'Jan', '1990-05-15', 'masa', 'poczatkujacy', 3, 'silownia', 60, 'hybrid', 85.5, 180, '[]'::jsonb, '[]'::jsonb, ARRAY['chest', 'back', 'legs'], ARRAY[]::TEXT[]),
-- Anna Nowak - Spalanie, średniozaawansowany, dom podstawowy
((SELECT id FROM auth_accounts WHERE username = 'anna.nowak'), 'Anna', '1995-08-22', 'spalanie', 'sredniozaawansowany', 4, 'dom_podstawowy', 45, 'hybrid', 62.0, 165, '["lower_back"]'::jsonb, '[]'::jsonb, ARRAY['cardio', 'core'], ARRAY['martwy ciąg']::TEXT[]),
-- Piotr Wiśniewski - Siła, zaawansowany, siłownia
((SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'), 'Piotr', '1988-03-10', 'sila', 'zaawansowany', 4, 'silownia', 90, 'hybrid', 92.0, 185, '[]'::jsonb, '[]'::jsonb, ARRAY['deadlift', 'squat', 'bench'], ARRAY[]::TEXT[]),
-- Magdalena Wojcik - Zdrowie, początkujący, masa ciała
((SELECT id FROM auth_accounts WHERE username = 'magdalena.wojcik'), 'Magdalena', '1992-11-05', 'zdrowie', 'poczatkujacy', 3, 'masa_ciala', 30, 'hybrid', 58.0, 160, '[]'::jsonb, '[]'::jsonb, ARRAY['mobility', 'stability'], ARRAY[]::TEXT[]),
-- Krzysztof Kowalczyk - Masa, średniozaawansowany, siłownia
((SELECT id FROM auth_accounts WHERE username = 'krzysztof.kowalczyk'), 'Krzysztof', '1991-07-18', 'masa', 'sredniozaawansowany', 4, 'silownia', 75, 'hybrid', 88.0, 178, '["knee"]'::jsonb, '[]'::jsonb, ARRAY['chest', 'shoulders', 'arms'], ARRAY['przysiady ze sztangą']::TEXT[]),
-- Agnieszka Kamińska - Wytrzymałość, początkujący, dom podstawowy
((SELECT id FROM auth_accounts WHERE username = 'agnieszka.kaminska'), 'Agnieszka', '1994-02-28', 'wytrzymalosc', 'poczatkujacy', 3, 'dom_podstawowy', 45, 'hybrid', 65.0, 170, '[]'::jsonb, '["asthma"]'::jsonb, ARRAY['endurance', 'cardio'], ARRAY[]::TEXT[]),
-- Tomasz Zieliński - Siła, średniozaawansowany, siłownia
((SELECT id FROM auth_accounts WHERE username = 'tomasz.zielinski'), 'Tomasz', '1989-09-12', 'sila', 'sredniozaawansowany', 3, 'silownia', 75, 'hybrid', 95.0, 182, '[]'::jsonb, '[]'::jsonb, ARRAY['strength', 'power'], ARRAY[]::TEXT[]),
-- Maria Szymańska - Spalanie, początkujący, masa ciała
((SELECT id FROM auth_accounts WHERE username = 'maria.szymanska'), 'Maria', '1993-06-25', 'spalanie', 'poczatkujacy', 3, 'masa_ciala', 40, 'hybrid', 70.0, 168, '["shoulder"]'::jsonb, '[]'::jsonb, ARRAY['cardio', 'full-body'], ARRAY['wyciskanie nad głową']::TEXT[]),
-- Mateusz Dąbrowski - Masa, zaawansowany, siłownia
((SELECT id FROM auth_accounts WHERE username = 'mateusz.dabrowski'), 'Mateusz', '1987-12-08', 'masa', 'zaawansowany', 5, 'silownia', 90, 'hybrid', 100.0, 190, '[]'::jsonb, '[]'::jsonb, ARRAY['hypertrophy', 'volume'], ARRAY[]::TEXT[]);

-- =================================================================
-- ROZSZERZENIE DO 42 PLANÓW TRENINGOWYCH
-- Planów 1-5 już dodane powyżej, dodajemy plany 6-42
-- =================================================================

-- Funkcja pomocnicza do dodawania ćwiczenia
CREATE OR REPLACE FUNCTION add_ex_to_day(plan_name TEXT, day_num INT, ex_name TEXT, sets TEXT, reps TEXT, rest INT)
RETURNS VOID AS $$
DECLARE p_id INT; d_id INT; e_id INT;
BEGIN
    SELECT id INTO p_id FROM training_plans WHERE name = plan_name;
    SELECT id INTO d_id FROM plan_days WHERE plan_id = p_id AND day_order = day_num;
    SELECT id INTO e_id FROM exercises WHERE name = ex_name LIMIT 1;
    IF p_id IS NOT NULL AND d_id IS NOT NULL AND e_id IS NOT NULL THEN
        INSERT INTO plan_exercises (plan_day_id, exercise_id, target_sets, target_reps, rest_seconds, superset_group)
        VALUES (d_id, e_id, sets, reps, rest, NULL);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========== MASZA - DODATKOWE PLANY ==========

-- Plan 6: Masa 3×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Średni • Siłownia', 'Zaawansowany split Push/Pull/Legs z większą objętością.', 'masa', 'sredniozaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-góra', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 1, 'Rozpiętki hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi nad głową', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie francuskie hantle', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 2, 'Martwy ciąg', '5', '5-6', 180);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 2, 'Podciąganie na drążku', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 2, 'Uginanie ramion ze sztangą', '4', '10-12', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '5', '6-8', 150);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 3, 'Wypady hantle', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 3, 'Martwy ciąg rumuński', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Siłownia', 3, 'Prostowanie nóg maszyna', '3', '12-15', 60);

-- Plan 7: Masa 3×/tydz • Zaawansowany • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Zaawansowany • Siłownia', 'Zaawansowany split dla doświadczonych - wysoka objętość.', 'masa', 'zaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Siłownia';
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '6', '4-6', 180);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-góra', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-dół', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Rozpiętki hantle', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi nad głową', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Unoszenie bokiem hantle', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie francuskie hantle', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Martwy ciąg', '6', '3-5', 240);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie sztangą', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Podciąganie na drążku', '5', '8-12', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Uginanie ramion ze sztangą', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 2, 'Uginanie ramion z hantlami', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Przysiady ze sztangą', '6', '4-6', 180);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Martwy ciąg rumuński', '4', '6-8', 180);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Wypady hantle', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Prostowanie nóg maszyna', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Uginanie nóg maszyna', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Siłownia', 3, 'Wspięcia na palce', '5', '15-20', 60);

-- =================================================================
-- POZOSTAŁE PLANY 8-45 (38 planów)
-- =================================================================


-- Plan 8: Masa 4×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Średni • Siłownia', 'Plan masa dla poziomu sredniozaawansowany na silownia - 4 dni treningowe tygodniowo.', 'masa', 'sredniozaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-góra', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 1, 'Rozpiętki hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie francuskie hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 2, 'Martwy ciąg', '4', '6-8', 180);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 2, 'Podciąganie na drążku', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 2, 'Uginanie ramion ze sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 3, 'Wypady hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 3, 'Martwy ciąg rumuński', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 3, 'Prostowanie nóg maszyna', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 3, 'Wspięcia na palce', '3', '15-20', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 4, 'Wiosłowanie sztangą', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 4, 'Uginanie ramion ze sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie francuskie hantle', '3', '12-15', 60);

-- Plan 9: Masa 4×/tydz • Zaawansowany • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Zaawansowany • Siłownia', 'Plan masa dla poziomu zaawansowany na silownia - 4 dni treningowe tygodniowo.', 'masa', 'zaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Siłownia';
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-góra', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 1, 'Rozpiętki hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie francuskie hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 2, 'Martwy ciąg', '4', '6-8', 180);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie sztangą', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 2, 'Podciąganie na drążku', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 2, 'Uginanie ramion ze sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 3, 'Przysiady ze sztangą', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 3, 'Wypady hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 3, 'Martwy ciąg rumuński', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 3, 'Prostowanie nóg maszyna', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 3, 'Wspięcia na palce', '3', '15-20', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 4, 'Wiosłowanie sztangą', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie sztangi nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 4, 'Uginanie ramion ze sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie francuskie hantle', '3', '12-15', 60);

-- Plan 10: Masa 5×/tydz • Zaawansowany • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 5×/tydz • Zaawansowany • Siłownia', 'Plan masa dla poziomu zaawansowany na silownia - 5 dni treningowe tygodniowo.', 'masa', 'zaawansowany', 5, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Chest', 1 FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Back', 2 FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Shoulders & Arms', 4 FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 5 FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia';
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '8-10', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie hantli na ławce skośna-góra', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 1, 'Rozpiętki hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '8-10', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie francuskie hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 2, 'Martwy ciąg', '4', '6-8', 180);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie sztangą', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 2, 'Podciąganie na drążku', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 2, 'Uginanie ramion ze sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 3, 'Przysiady ze sztangą', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 3, 'Wypady hantle', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 3, 'Martwy ciąg rumuński', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 3, 'Prostowanie nóg maszyna', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 3, 'Wspięcia na palce', '3', '15-20', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 4, 'Wiosłowanie sztangą', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie sztangi nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 4, 'Uginanie ramion ze sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie francuskie hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 5, 'Wyciskanie sztangi na ławce płaska', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 5×/tydz • Zaawansowany • Siłownia', 5, 'Wiosłowanie sztangą', '4', '8-10', 90);

-- Plan 11: Masa 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Podstawy • Dom podstawowy', 'Plan budowy masy dla początkujących trenujących w domu z podstawowym sprzętem. Push/Pull/Legs split z wykorzystaniem masy ciała i podstawowych przyrządów.', 'masa', 'poczatkujacy', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Dom podstawowy';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki klasyczne', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki na podwyższeniu', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki diamentowe', '3', '8-10', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 1, 'Plank', '3', '30-45s', 45);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki australijskie', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 2, 'Superman', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 2, 'Dead Bug', '3', '12-15', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 2, 'Side Plank', '3', '30-45s', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 3, 'Przysiady', '4', '12-15', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 3, 'Wypady', '3', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 3, 'Russian Twist', '3', '15-20', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Podstawy • Dom podstawowy', 3, 'Hollow Body Hold', '3', '20-30s', 45);

-- Plan 12: Masa 3×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Średni • Dom podstawowy', 'Plan budowy masy dla średniozaawansowanych trenujących w domu. Większa objętość i intensywność niż plan podstawowy.', 'masa', 'sredniozaawansowany', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom podstawowy';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki na poręczach', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki diamentowe', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 1, 'Plank', '3', '45-60s', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 1, 'Hollow Body Hold', '3', '30-45s', 45);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 2, 'Pompki australijskie', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 2, 'Superman', '4', '15-20', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 2, 'Dead Bug', '3', '15-20', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 2, 'Side Plank', '3', '45-60s', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 2, 'Russian Twist', '3', '20-25', 30);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 3, 'Przysiady', '4', '15-20', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 3, 'Wypady', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 3, 'Pistol Squat', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 3, 'Russian Twist', '3', '20-25', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom podstawowy', 3, 'Hollow Body Hold', '3', '30-45s', 45);

-- Plan 13: Masa 4×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Średni • Dom podstawowy', 'Czterodniowy plan budowy masy dla średniozaawansowanych trenujących w domu. Push/Pull/Legs/Upper split z większą objętością.', 'masa', 'sredniozaawansowany', 4, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom podstawowy';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 1, 'Pompki na poręczach', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 1, 'Pompki diamentowe', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 1, 'Plank', '3', '45-60s', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 2, 'Pompki australijskie', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 2, 'Superman', '4', '15-20', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 2, 'Side Plank', '3', '45-60s', 45);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 2, 'Dead Bug', '3', '15-20', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 3, 'Przysiady', '4', '15-20', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 3, 'Wypady', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 3, 'Russian Twist', '3', '20-25', 45);
-- Dzień 4: Upper Body
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 4, 'Pompki klasyczne', '3', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 4, 'Pompki australijskie', '3', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 4, 'Pompki diamentowe', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom podstawowy', 4, 'Hollow Body Hold', '3', '30-45s', 45);

-- Plan 14: Masa 3×/tydz • Średni • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Średni • Dom zaawansowany', 'Plan budowy masy dla średniozaawansowanych z dostępem do zaawansowanego sprzętu domowego (hantle, sztanga, ławka). Push/Pull/Legs split.', 'masa', 'sredniozaawansowany', 3, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Dom zaawansowany';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce płaska', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce skośna-góra', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 1, 'Unoszenie bokiem hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie francuskie hantle', '3', '10-12', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 2, 'Wiosłowanie hantlem jednorącz', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 2, 'Pompki australijskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 2, 'Uginanie ramion z hantlami', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 2, 'Uginanie ramion młotkowe', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 2, 'Superman', '3', '15-20', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 3, 'Przysiady ze sztangą', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 3, 'Wypady hantle', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 3, 'Martwy ciąg rumuński', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 3, 'Russian Twist', '3', '20-25', 45);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Dom zaawansowany', 3, 'Plank', '3', '45-60s', 45);

-- Plan 15: Masa 3×/tydz • Zaawansowany • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 'Zaawansowany plan budowy masy z wykorzystaniem pełnego sprzętu domowego. Wysoka objętość i intensywność.', 'masa', 'zaawansowany', 3, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Zaawansowany • Dom zaawansowany';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce płaska', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce skośna-góra', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli nad głową', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Unoszenie bokiem hantle', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie francuskie hantle', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Unoszenie przód hantle', '3', '12-15', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Wiosłowanie hantlem jednorącz', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Pompki australijskie', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion z hantlami', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion młotkowe', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion jednorącz hantel', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Superman', '4', '15-20', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady ze sztangą', '5', '6-8', 150);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady przednie', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Wypady hantle', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Martwy ciąg rumuński', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Hollow Body Hold', '3', '45-60s', 60);

-- Plan 16: Masa 4×/tydz • Średni • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Średni • Dom zaawansowany', 'Czterodniowy plan budowy masy z wykorzystaniem zaawansowanego sprzętu domowego. Push/Pull/Legs/Upper split.', 'masa', 'sredniozaawansowany', 4, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Dom zaawansowany';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce płaska', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce skośna-góra', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie hantli nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 1, 'Unoszenie bokiem hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 1, 'Wyciskanie francuskie hantle', '3', '10-12', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 2, 'Wiosłowanie hantlem jednorącz', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 2, 'Pompki australijskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 2, 'Uginanie ramion z hantlami', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 2, 'Uginanie ramion młotkowe', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 2, 'Superman', '3', '15-20', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 3, 'Przysiady ze sztangą', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 3, 'Wypady hantle', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 3, 'Martwy ciąg rumuński', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 3, 'Russian Twist', '3', '20-25', 45);
-- Dzień 4: Upper Body
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 4, 'Wyciskanie hantli na ławce płaska', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 4, 'Wiosłowanie hantlem jednorącz', '3', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 4, 'Wyciskanie hantli nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 4, 'Uginanie ramion z hantlami', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Dom zaawansowany', 4, 'Wyciskanie francuskie hantle', '3', '12-15', 60);

-- Plan 17: Masa 4×/tydz • Zaawansowany • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 'Zaawansowany czterodniowy plan budowy masy z wysoką objętością treningową. Push/Pull/Legs/Upper split.', 'masa', 'zaawansowany', 4, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Zaawansowany • Dom zaawansowany';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce płaska', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli na ławce skośna-góra', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie hantli nad głową', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Unoszenie bokiem hantle', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Wyciskanie francuskie hantle', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 1, 'Unoszenie przód hantle', '3', '12-15', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Wiosłowanie hantlem jednorącz', '5', '6-8', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Pompki australijskie', '4', '8-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion z hantlami', '4', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion młotkowe', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Uginanie ramion jednorącz hantel', '3', '10-12', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 2, 'Superman', '3', '15-20', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady ze sztangą', '5', '6-8', 150);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady przednie', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Wypady hantle', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Martwy ciąg rumuński', '4', '8-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 3, 'Hollow Body Hold', '3', '45-60s', 60);
-- Dzień 4: Upper Body
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 4, 'Wyciskanie hantli na ławce płaska', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 4, 'Wiosłowanie hantlem jednorącz', '4', '8-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 4, 'Wyciskanie hantli nad głową', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 4, 'Uginanie ramion z hantlami', '3', '12-15', 60);
SELECT add_ex_to_day('Masa 4×/tydz • Zaawansowany • Dom zaawansowany', 4, 'Wyciskanie francuskie hantle', '3', '12-15', 60);

-- Plan 18: Masa 3×/tydz • Średni • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 3×/tydz • Średni • Masa ciała', 'Plan budowy masy kalisteniczny dla średniozaawansowanych. Push/Pull/Legs split wykorzystujący tylko masę ciała.', 'masa', 'sredniozaawansowany', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 3×/tydz • Średni • Masa ciała';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 1, 'Pompki klasyczne', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 1, 'Pompki na poręczach', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 1, 'Pompki diamentowe', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 1, 'Plank', '3', '45-60s', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 1, 'Hollow Body Hold', '3', '30-45s', 45);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 2, 'Podciąganie na drążku', '4', '6-10', 120);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 2, 'Podciąganie chwytem neutralnym', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 2, 'Pompki australijskie', '3', '10-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 2, 'Superman', '3', '15-20', 60);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 2, 'Side Plank', '3', '45-60s', 45);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 3, 'Przysiady', '4', '15-20', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 3, 'Wypady', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 3, 'Pistol Squat', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 3×/tydz • Średni • Masa ciała', 3, 'Russian Twist', '3', '20-25', 45);

-- Plan 19: Masa 4×/tydz • Średni • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Masa 4×/tydz • Średni • Masa ciała', 'Czterodniowy plan budowy masy kalisteniczny dla średniozaawansowanych. Push/Pull/Legs/Upper split z wykorzystaniem tylko masy ciała.', 'masa', 'sredniozaawansowany', 4, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push (Pchające)', 1 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull (Ciągnące)', 2 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs (Nogi & Core)', 3 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Masa ciała';
-- Dzień 1: Push
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 1, 'Pompki klasyczne', '4', '10-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 1, 'Pompki na poręczach', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 1, 'Pompki diamentowe', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 1, 'Plank', '3', '45-60s', 60);
-- Dzień 2: Pull
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 2, 'Podciąganie na drążku', '4', '6-10', 120);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 2, 'Podciąganie chwytem neutralnym', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 2, 'Pompki australijskie', '3', '10-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 2, 'Superman', '3', '15-20', 60);
-- Dzień 3: Legs
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 3, 'Przysiady', '4', '15-20', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 3, 'Wypady', '4', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 3, 'Przysiady bułgarskie', '3', '10-12', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 3, 'Pistol Squat', '3', '6-10', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 3, 'Russian Twist', '3', '20-25', 45);
-- Dzień 4: Upper Body
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 4, 'Pompki klasyczne', '3', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 4, 'Podciąganie na drążku', '3', '8-12', 90);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 4, 'Pompki australijskie', '3', '12-15', 75);
SELECT add_ex_to_day('Masa 4×/tydz • Średni • Masa ciała', 4, 'Hollow Body Hold', '3', '30-45s', 45);

-- Plan 20: Siła 4×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 4×/tydz • Średni • Siłownia', 'Plan sila dla poziomu sredniozaawansowany na silownia - 4 dni treningowe tygodniowo.', 'sila', 'sredniozaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Siła 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Siła 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Siła 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Siła 4×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 1, 'Martwy ciąg', '3', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '3', '5', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 2, 'Przysiady ze sztangą', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 2, 'Martwy ciąg', '3', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '3', '5', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 3, 'Martwy ciąg', '5', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 3, 'Przysiady przednie', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi nad głową', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 3, 'Podciąganie na drążku', '3', '5-8', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 4, 'Martwy ciąg', '5', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 4, 'Przysiady przednie', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi nad głową', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Średni • Siłownia', 4, 'Podciąganie na drążku', '3', '5-8', 180);

-- Plan 21: Siła 4×/tydz • Zaawansowany • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 4×/tydz • Zaawansowany • Siłownia', 'Plan sila dla poziomu zaawansowany na silownia - 4 dni treningowe tygodniowo.', 'sila', 'zaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Siła 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Siła 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Siła 4×/tydz • Zaawansowany • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Siła 4×/tydz • Zaawansowany • Siłownia';
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 1, 'Przysiady ze sztangą', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 1, 'Martwy ciąg', '3', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 1, 'Wiosłowanie sztangą', '3', '5', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 2, 'Przysiady ze sztangą', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 2, 'Martwy ciąg', '3', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 2, 'Wiosłowanie sztangą', '3', '5', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 3, 'Martwy ciąg', '5', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 3, 'Przysiady przednie', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 3, 'Wyciskanie sztangi nad głową', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 3, 'Podciąganie na drążku', '3', '5-8', 180);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 4, 'Martwy ciąg', '5', '3-5', 300);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 4, 'Przysiady przednie', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 4, 'Wyciskanie sztangi nad głową', '4', '3-5', 240);
SELECT add_ex_to_day('Siła 4×/tydz • Zaawansowany • Siłownia', 4, 'Podciąganie na drążku', '3', '5-8', 180);

-- Plan 22: Siła 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 3×/tydz • Podstawy • Dom podstawowy', 'Plan sila dla poziomu poczatkujacy na dom_podstawowy - 3 dni treningowe tygodniowo.', 'sila', 'poczatkujacy', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Siła 3×/tydz • Podstawy • Dom podstawowy';
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 1, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 2, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Podstawy • Dom podstawowy', 3, 'Plank', '3', '30-45s', 45);

-- Plan 23: Siła 3×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 3×/tydz • Średni • Dom podstawowy', 'Plan sila dla poziomu sredniozaawansowany na dom_podstawowy - 3 dni treningowe tygodniowo.', 'sila', 'sredniozaawansowany', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom podstawowy';
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 1, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 2, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom podstawowy', 3, 'Plank', '3', '30-45s', 45);

-- Plan 24: Siła 3×/tydz • Średni • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 3×/tydz • Średni • Dom zaawansowany', 'Plan sila dla poziomu sredniozaawansowany na dom_zaawansowany - 3 dni treningowe tygodniowo.', 'sila', 'sredniozaawansowany', 3, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Dom zaawansowany';
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 1, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 2, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Dom zaawansowany', 3, 'Plank', '3', '30-45s', 45);

-- Plan 25: Spalanie 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 'Plan spalania tłuszczu dla początkujących trenujących w domu. Trening obwodowy łączący ćwiczenia siłowe z elementami cardio.', 'spalanie', 'poczatkujacy', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom podstawowy';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki klasyczne', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Przysiady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Mountain Climbers', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Russian Twist', '3', '20-30', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki na podwyższeniu', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki australijskie', '3', '10-12', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Brzuszki', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Side Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Dead Bug', '3', '12-15', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Wypady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Russian Twist', '3', '25-35', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Hollow Body Hold', '3', '20-30s', 30);

-- Plan 26: Spalanie 4×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 4×/tydz • Średni • Dom podstawowy', 'Czterodniowy plan spalania tłuszczu dla średniozaawansowanych trenujących w domu. Trening obwodowy z większą intensywnością.', 'spalanie', 'sredniozaawansowany', 4, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Cardio & Core', 4 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom podstawowy';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '4', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Przysiady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 1, 'Russian Twist', '3', '25-35', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Pompki na podwyższeniu', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Przysiady', '4', '20-25', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Pompki australijskie', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Brzuszki', '3', '20-25', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Side Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 2, 'Dead Bug', '3', '15-20', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Pompki klasyczne', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Wypady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Mountain Climbers', '4', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Plank', '3', '60-90s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Russian Twist', '3', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 3, 'Hollow Body Hold', '3', '30-45s', 30);
-- Dzień 4: Cardio & Core
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Mountain Climbers', '4', '30-45', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Plank', '4', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Russian Twist', '4', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Side Plank', '3', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Hollow Body Hold', '3', '45-60s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom podstawowy', 4, 'Dead Bug', '3', '20-25', 30);

-- Plan 27: Spalanie 3×/tydz • Podstawy • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 'Trzydniowy plan spalania tłuszczu dla początkujących z dostępem do podstawowego sprzętu domowego. Trening obwodowy z większą intensywnością.', 'spalanie', 'poczatkujacy', 3, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Dom zaawansowany';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Pompki klasyczne', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Przysiady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Mountain Climbers', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 1, 'Russian Twist', '3', '20-30', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Pompki na podwyższeniu', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Pompki australijskie', '3', '10-12', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Brzuszki', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Side Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 2, 'Dead Bug', '3', '12-15', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Wypady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Russian Twist', '3', '25-35', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Dom zaawansowany', 3, 'Hollow Body Hold', '3', '20-30s', 30);

-- Plan 28: Spalanie 4×/tydz • Średni • Dom zaawansowany
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 4×/tydz • Średni • Dom zaawansowany', 'Czterodniowy plan spalania tłuszczu dla średniozaawansowanych z dostępem do podstawowego sprzętu domowego. Intensywny trening obwodowy.', 'spalanie', 'sredniozaawansowany', 4, 'dom_zaawansowany', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom zaawansowany';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Cardio & Core', 4 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom zaawansowany';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Pompki klasyczne', '4', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Przysiady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 1, 'Russian Twist', '3', '25-35', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Pompki na podwyższeniu', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Przysiady', '4', '20-25', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Pompki australijskie', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Brzuszki', '3', '20-25', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Side Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 2, 'Dead Bug', '3', '15-20', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Pompki klasyczne', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Wypady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Mountain Climbers', '4', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Plank', '3', '60-90s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Russian Twist', '3', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 3, 'Hollow Body Hold', '3', '30-45s', 30);
-- Dzień 4: Cardio & Core
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Mountain Climbers', '4', '30-45', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Plank', '4', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Russian Twist', '4', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Side Plank', '3', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Hollow Body Hold', '3', '45-60s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Dom zaawansowany', 4, 'Dead Bug', '3', '20-25', 30);

-- Plan 29: Spalanie 3×/tydz • Podstawy • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Podstawy • Masa ciała', 'Plan spalania tłuszczu kalisteniczny dla początkujących. Trening obwodowy wykorzystujący tylko masę ciała dla efektywnego spalania kalorii.', 'spalanie', 'poczatkujacy', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Masa ciała';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Pompki klasyczne', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Przysiady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Mountain Climbers', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 1, 'Russian Twist', '3', '20-30', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Pompki na podwyższeniu', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Pompki australijskie', '3', '10-12', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Brzuszki', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Side Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 2, 'Dead Bug', '3', '12-15', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Wypady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Russian Twist', '3', '25-35', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Masa ciała', 3, 'Hollow Body Hold', '3', '20-30s', 30);

-- Plan 30: Spalanie 4×/tydz • Średni • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 4×/tydz • Średni • Masa ciała', 'Czterodniowy plan spalania tłuszczu kalisteniczny dla średniozaawansowanych. Intensywny trening obwodowy wykorzystujący tylko masę ciała.', 'spalanie', 'sredniozaawansowany', 4, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Cardio & Core', 4 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Masa ciała';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Pompki klasyczne', '4', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Przysiady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 1, 'Russian Twist', '3', '25-35', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Pompki na podwyższeniu', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Przysiady', '4', '20-25', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Pompki australijskie', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Brzuszki', '3', '20-25', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Side Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 2, 'Dead Bug', '3', '15-20', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Pompki klasyczne', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Wypady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Mountain Climbers', '4', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Plank', '3', '60-90s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Russian Twist', '3', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 3, 'Hollow Body Hold', '3', '30-45s', 30);
-- Dzień 4: Cardio & Core
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Mountain Climbers', '4', '30-45', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Plank', '4', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Russian Twist', '4', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Side Plank', '3', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Hollow Body Hold', '3', '45-60s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Masa ciała', 4, 'Dead Bug', '3', '20-25', 30);

-- Plan 31: Spalanie 3×/tydz • Podstawy • Minimalne
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Podstawy • Minimalne', 'Trzydniowy plan spalania tłuszczu dla początkujących bez sprzętu. Minimalistyczny trening wykorzystujący tylko masę ciała.', 'spalanie', 'poczatkujacy', 3, 'minimalne', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Minimalne';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Minimalne';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Minimalne';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Pompki klasyczne', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Przysiady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Mountain Climbers', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 1, 'Russian Twist', '3', '20-30', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Pompki na podwyższeniu', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Pompki australijskie', '3', '10-12', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Brzuszki', '3', '15-20', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Side Plank', '3', '30-45s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 2, 'Dead Bug', '3', '12-15', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Wypady', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Russian Twist', '3', '25-35', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Podstawy • Minimalne', 3, 'Hollow Body Hold', '3', '20-30s', 30);

-- Plan 32: Spalanie 4×/tydz • Średni • Minimalne
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 4×/tydz • Średni • Minimalne', 'Czterodniowy plan spalania tłuszczu dla średniozaawansowanych bez sprzętu. Intensywny minimalistyczny trening wykorzystujący tylko masę ciała.', 'spalanie', 'sredniozaawansowany', 4, 'minimalne', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Minimalne';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Minimalne';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Minimalne';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Cardio & Core', 4 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Minimalne';
-- Dzień 1: Full Body Circuit A
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Pompki klasyczne', '4', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Przysiady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Wypady', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 1, 'Russian Twist', '3', '25-35', 30);
-- Dzień 2: Full Body Circuit B
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Pompki na podwyższeniu', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Przysiady', '4', '20-25', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Pompki australijskie', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Brzuszki', '3', '20-25', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Side Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 2, 'Dead Bug', '3', '15-20', 30);
-- Dzień 3: Full Body Circuit C
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Pompki klasyczne', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Wypady', '4', '15-20', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Mountain Climbers', '4', '20-30', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Plank', '3', '60-90s', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Russian Twist', '3', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 3, 'Hollow Body Hold', '3', '30-45s', 30);
-- Dzień 4: Cardio & Core
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Mountain Climbers', '4', '30-45', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Plank', '4', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Russian Twist', '4', '30-40', 30);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Side Plank', '3', '60-90s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Hollow Body Hold', '3', '45-60s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Minimalne', 4, 'Dead Bug', '3', '20-25', 30);

-- Plan 33: Spalanie 4×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 4×/tydz • Średni • Siłownia', 'Plan spalanie dla poziomu sredniozaawansowany na silownia - 4 dni treningowe tygodniowo.', 'spalanie', 'sredniozaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '3', '15-20', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Wypady hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 1, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Przysiady ze sztangą', '3', '15-20', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Wypady hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi nad głową', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 2, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '3', '15-20', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Wiosłowanie sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Wypady hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi nad głową', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 3, 'Plank', '3', '30-45s', 45);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Przysiady ze sztangą', '3', '15-20', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi na ławce płaska', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Wiosłowanie sztangą', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Wypady hantle', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi nad głową', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 4×/tydz • Średni • Siłownia', 4, 'Plank', '3', '30-45s', 45);

-- Plan 34: Wytrzymałość 3×/tydz • Podstawy • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 'Trzydniowy plan wytrzymałości siłowej dla początkujących. Wysokie powtórzenia i krótkie przerwy budują wytrzymałość mięśniową.', 'wytrzymalosc', 'poczatkujacy', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body A', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body B', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body C', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Siłownia';
-- Dzień 1: Full Body A
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 1, 'Przysiady ze sztangą', '4', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '4', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 1, 'Wiosłowanie sztangą', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 1, 'Martwy ciąg', '3', '15-20', 60);
-- Dzień 2: Full Body B
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 2, 'Przysiady przednie', '4', '18-22', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 2, 'Wyciskanie hantli na ławce płaska', '4', '18-22', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '18-22', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 2, 'Wyciskanie sztangi nad głową', '3', '15-18', 45);
-- Dzień 3: Full Body C
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 3, 'Leg Press', '4', '25-30', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 3, 'Wyciskanie sztangi na ławce skośna-góra', '4', '18-22', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 3, 'Ściąganie wyciągu szerokim chwytem', '3', '18-22', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Siłownia', 3, 'Martwy ciąg rumuński', '3', '18-22', 60);

-- Plan 35: Wytrzymałość 4×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 4×/tydz • Średni • Siłownia', 'Plan wytrzymalosc dla poziomu sredniozaawansowany na silownia - 4 dni treningowe tygodniowo.', 'wytrzymalosc', 'sredniozaawansowany', 4, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Wytrzymałość 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Wytrzymałość 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Wytrzymałość 4×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Upper Body', 4 FROM training_plans WHERE name = 'Wytrzymałość 4×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 1, 'Martwy ciąg', '3', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 2, 'Przysiady ze sztangą', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 2, 'Martwy ciąg', '3', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 3, 'Wiosłowanie sztangą', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 3, 'Martwy ciąg', '3', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 4, 'Przysiady ze sztangą', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 4, 'Wyciskanie sztangi na ławce płaska', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 4, 'Wiosłowanie sztangą', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 4×/tydz • Średni • Siłownia', 4, 'Martwy ciąg', '3', '15-20', 60);

-- Plan 36: Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 'Plan wytrzymalosc dla poziomu poczatkujacy na dom_podstawowy - 3 dni treningowe tygodniowo.', 'wytrzymalosc', 'poczatkujacy', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy';
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 1, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 1, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 2, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 2, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 3, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 3, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy', 3, 'Mountain Climbers', '3', '20-30', 30);

-- Plan 37: Wytrzymałość 3×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 'Plan wytrzymalosc dla poziomu sredniozaawansowany na dom_podstawowy - 3 dni treningowe tygodniowo.', 'wytrzymalosc', 'sredniozaawansowany', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Dom podstawowy';
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 1, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 1, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 2, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 2, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 2, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 3, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 3, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Dom podstawowy', 3, 'Mountain Climbers', '3', '20-30', 30);

-- Plan 38: Wytrzymałość 3×/tydz • Podstawy • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 'Plan wytrzymalosc dla poziomu poczatkujacy na masa_ciala - 3 dni treningowe tygodniowo.', 'wytrzymalosc', 'poczatkujacy', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Masa ciała';
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 1, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 1, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 1, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 2, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 2, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 2, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 3, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 3, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Podstawy • Masa ciała', 3, 'Mountain Climbers', '3', '20-30', 30);

-- Plan 39: Wytrzymałość 3×/tydz • Średni • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Średni • Masa ciała', 'Plan wytrzymalosc dla poziomu sredniozaawansowany na masa_ciala - 3 dni treningowe tygodniowo.', 'wytrzymalosc', 'sredniozaawansowany', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Masa ciała';
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 1, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 1, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 1, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 2, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 2, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 2, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 2, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 3, 'Pompki klasyczne', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 3, 'Przysiady', '3', '20-25', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 3, 'Podciąganie na drążku', '3', '10-15', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Masa ciała', 3, 'Mountain Climbers', '3', '20-30', 30);

-- Plan 40: Zdrowie 3×/tydz • Podstawy • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Podstawy • Siłownia', 'Plan zdrowie dla poziomu poczatkujacy na silownia - 3 dni treningowe tygodniowo.', 'zdrowie', 'poczatkujacy', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Siłownia';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 1, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 1, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 2, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 2, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 3, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 3, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Siłownia', 3, 'Plank', '3', '30-60s', 45);

-- Plan 41: Zdrowie 3×/tydz • Średni • Siłownia
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Średni • Siłownia', 'Plan zdrowie dla poziomu sredniozaawansowany na silownia - 3 dni treningowe tygodniowo.', 'zdrowie', 'sredniozaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 2, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 2, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '3', '10-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 3, 'Wiosłowanie sztangą', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Siłownia', 3, 'Plank', '3', '30-60s', 45);

-- Plan 42: Zdrowie 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 'Plan zdrowie dla poziomu poczatkujacy na dom_podstawowy - 3 dni treningowe tygodniowo.', 'zdrowie', 'poczatkujacy', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Dom podstawowy';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 1, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 2, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Dom podstawowy', 3, 'Russian Twist', '3', '15-20', 30);

-- Plan 43: Zdrowie 3×/tydz • Średni • Dom podstawowy
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Średni • Dom podstawowy', 'Plan zdrowie dla poziomu sredniozaawansowany na dom_podstawowy - 3 dni treningowe tygodniowo.', 'zdrowie', 'sredniozaawansowany', 3, 'dom_podstawowy', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Dom podstawowy';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Dom podstawowy';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 1, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 2, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 3, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Dom podstawowy', 3, 'Russian Twist', '3', '15-20', 30);

-- Plan 44: Zdrowie 3×/tydz • Podstawy • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Podstawy • Masa ciała', 'Plan zdrowie dla poziomu poczatkujacy na masa_ciala - 3 dni treningowe tygodniowo.', 'zdrowie', 'poczatkujacy', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Masa ciała';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 1, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 2, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 3, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Podstawy • Masa ciała', 3, 'Russian Twist', '3', '15-20', 30);

-- Plan 45: Zdrowie 3×/tydz • Średni • Masa ciała
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Zdrowie 3×/tydz • Średni • Masa ciała', 'Plan zdrowie dla poziomu sredniozaawansowany na masa_ciala - 3 dni treningowe tygodniowo.', 'zdrowie', 'sredniozaawansowany', 3, 'masa_ciala', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Push', 1 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Pull', 2 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Masa ciała';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Legs', 3 FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Średni • Masa ciała';
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 1, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 1, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 1, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 1, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 2, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 2, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 2, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 2, 'Russian Twist', '3', '15-20', 30);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 3, 'Pompki klasyczne', '3', '10-12', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 3, 'Przysiady', '3', '12-15', 60);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 3, 'Plank', '3', '30-60s', 45);
SELECT add_ex_to_day('Zdrowie 3×/tydz • Średni • Masa ciała', 3, 'Russian Twist', '3', '15-20', 30);

-- Plan 46: Siła 3×/tydz • Średni • Siłownia (BRAKUJĄCY)
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Siła 3×/tydz • Średni • Siłownia', 'Plan siły dla średniozaawansowanych - skupienie na zwiększeniu siły maksymalnej w głównych wzorcach ruchowych.', 'sila', 'sredniozaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body A', 1 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body B', 2 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body C', 3 FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '5', '5', 180);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '5', '5', 180);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 1, 'Martwy ciąg', '4', '5', 240);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '4', '6-8', 120);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 2, 'Przysiady przednie', '5', '5', 180);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 2, 'Wyciskanie sztangi nad głową', '5', '5', 180);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 2, 'Martwy ciąg rumuński', '4', '6-8', 180);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 2, 'Podciąganie na drążku', '4', '6-10', 150);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '5', '3-5', 240);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 3, 'Martwy ciąg', '5', '3-5', 300);
SELECT add_ex_to_day('Siła 3×/tydz • Średni • Siłownia', 3, 'Wiosłowanie hantlem jednorącz', '3', '6-8', 120);

-- Plan 47: Spalanie 3×/tydz • Średni • Siłownia (BRAKUJĄCY)
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Spalanie 3×/tydz • Średni • Siłownia', 'Plan spalania tłuszczu dla średniozaawansowanych - trening obwodowy łączący ćwiczenia siłowe z elementami cardio dla efektywnego spalania kalorii.', 'spalanie', 'sredniozaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit A', 1 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit B', 2 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body Circuit C', 3 FROM training_plans WHERE name = 'Spalanie 3×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '4', '15-20', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '4', '12-15', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '4', '12-15', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Wypady hantle', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 1, 'Mountain Climbers', '3', '20-30', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Przysiady przednie', '4', '15-18', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Wyciskanie hantli na ławce skośna-góra', '4', '12-15', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '12-15', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Przysiady bułgarskie', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Unoszenie bokiem hantle', '3', '15-20', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 2, 'Plank', '3', '45-60s', 30);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Martwy ciąg', '4', '12-15', 90);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '4', '12-15', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Podciąganie na drążku', '3', '10-12', 60);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Wypady hantle', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi nad głową', '3', '12-15', 45);
SELECT add_ex_to_day('Spalanie 3×/tydz • Średni • Siłownia', 3, 'Russian Twist', '3', '20-30', 30);

-- Plan 48: Wytrzymałość 3×/tydz • Średni • Siłownia (BRAKUJĄCY)
INSERT INTO training_plans (name, description, goal_type, difficulty_level, training_days_per_week, equipment_required, is_active, is_base_plan)
VALUES ('Wytrzymałość 3×/tydz • Średni • Siłownia', 'Plan budowy wytrzymałości dla średniozaawansowanych - trening z większą liczbą powtórzeń i mniejszymi przerwami dla poprawy wytrzymałości siłowej.', 'wytrzymalosc', 'sredniozaawansowany', 3, 'silownia', TRUE, TRUE);
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body A', 1 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body B', 2 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Siłownia';
INSERT INTO plan_days (plan_id, name, day_order) SELECT id, 'Full Body C', 3 FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Średni • Siłownia';
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 1, 'Przysiady ze sztangą', '4', '20-25', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi na ławce płaska', '4', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 1, 'Wiosłowanie sztangą', '4', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 1, 'Martwy ciąg', '3', '15-20', 90);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 1, 'Wyciskanie sztangi nad głową', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 2, 'Przysiady przednie', '4', '20-25', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 2, 'Wyciskanie hantli na ławce skośna-góra', '4', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 2, 'Wiosłowanie hantlem jednorącz', '3', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 2, 'Wypady hantle', '3', '15-20', 45);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 2, 'Podciąganie na drążku', '3', '12-15', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 3, 'Martwy ciąg', '4', '15-20', 90);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 3, 'Wyciskanie sztangi na ławce płaska', '4', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 3, 'Wiosłowanie sztangą', '4', '15-20', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 3, 'Przysiady ze sztangą', '3', '20-25', 60);
SELECT add_ex_to_day('Wytrzymałość 3×/tydz • Średni • Siłownia', 3, 'Wspięcia na palce', '3', '20-25', 30);

-- =================================================================
-- KONIEC SEEDA - Wszystkie 48 planów dodane (45 + 3 nowe)
-- =================================================================

-- =================================================================
-- ROZSZERZONE DANE UŻYTKOWNIKÓW
-- =================================================================
-- Wszystkie dane profili są już dodane w INSERT powyżej

-- =================================================================
-- AKTYWNE PLANY UŻYTKOWNIKÓW
-- =================================================================

-- Jan Kowalski - Plan Masa 3×/tydz • Podstawy • Siłownia
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT id FROM training_plans WHERE name = 'Masa 3×/tydz • Podstawy • Siłownia'),
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '60 days',
    FALSE,
    NULL,
    NULL,
    '["poniedziałek", "środa", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Anna Nowak - Plan Spalanie 4×/tydz • Średni • Dom podstawowy
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT id FROM training_plans WHERE name = 'Spalanie 4×/tydz • Średni • Dom podstawowy' LIMIT 1),
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '45 days',
    FALSE,
    NULL,
    NULL,
    '["poniedziałek", "wtorek", "czwartek", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Piotr Wiśniewski - Plan Siła 4×/tydz • Zaawansowany • Siłownia
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT id FROM training_plans WHERE name = 'Siła 4×/tydz • Zaawansowany • Siłownia' LIMIT 1),
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '30 days',
    FALSE,
    5,
    CURRENT_DATE - INTERVAL '5 days',
    '["poniedziałek", "wtorek", "czwartek", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Krzysztof Kowalczyk - Plan Masa 4×/tydz • Średni • Siłownia
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'krzysztof.kowalczyk'),
    (SELECT id FROM training_plans WHERE name = 'Masa 4×/tydz • Średni • Siłownia' LIMIT 1),
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '40 days',
    FALSE,
    4,
    CURRENT_DATE - INTERVAL '10 days',
    '["poniedziałek", "wtorek", "czwartek", "sobota"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Magdalena Wojcik - Plan Zdrowie 3×/tydz • Podstawy • Masa ciała
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'magdalena.wojcik'),
    (SELECT id FROM training_plans WHERE name = 'Zdrowie 3×/tydz • Podstawy • Masa ciała' LIMIT 1),
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '50 days',
    FALSE,
    NULL,
    NULL,
    '["poniedziałek", "środa", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Agnieszka Kamińska - Plan Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'agnieszka.kaminska'),
    (SELECT id FROM training_plans WHERE name = 'Wytrzymałość 3×/tydz • Podstawy • Dom podstawowy' LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '55 days',
    FALSE,
    NULL,
    NULL,
    '["poniedziałek", "środa", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Tomasz Zieliński - Plan Siła 3×/tydz • Średni • Siłownia
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'tomasz.zielinski'),
    (SELECT id FROM training_plans WHERE name = 'Siła 3×/tydz • Średni • Siłownia' LIMIT 1),
    CURRENT_DATE - INTERVAL '25 days',
    CURRENT_DATE + INTERVAL '35 days',
    FALSE,
    4,
    CURRENT_DATE - INTERVAL '8 days',
    '["poniedziałek", "środa", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Maria Szymańska - Plan Spalanie 3×/tydz • Podstawy • Masa ciała
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'maria.szymanska'),
    (SELECT id FROM training_plans WHERE name = 'Spalanie 3×/tydz • Podstawy • Masa ciała' LIMIT 1),
    CURRENT_DATE - INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '48 days',
    FALSE,
    NULL,
    NULL,
    '["poniedziałek", "środa", "piątek"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- Mateusz Dąbrowski - Plan Masa 5×/tydz • Zaawansowany • Siłownia
INSERT INTO user_active_plans (auth_account_id, plan_id, start_date, end_date, is_completed, rating, rating_date, training_schedule, notifications_enabled)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'mateusz.dabrowski'),
    (SELECT id FROM training_plans WHERE name = 'Masa 5×/tydz • Zaawansowany • Siłownia' LIMIT 1),
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '15 days',
    FALSE,
    5,
    CURRENT_DATE - INTERVAL '3 days',
    '["poniedziałek", "wtorek", "środa", "piątek", "sobota"]'::jsonb,
    TRUE
ON CONFLICT (auth_account_id) DO NOTHING;

-- =================================================================
-- SESJE TRENINGOWE
-- =================================================================

-- Sesje dla Jana Kowalskiego (ostatnie 2 tygodnie)
INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '13 days',
    65,
    'Dobry trening, czuję postęp w wyciskaniu'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '11 days',
    60,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '9 days',
    70,
    'Trudny trening nóg'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '6 days',
    62,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '4 days',
    58,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    CURRENT_DATE - INTERVAL '2 days',
    65,
    'Świetny trening!'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

-- Sesje dla Anny Nowak
INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    CURRENT_DATE - INTERVAL '10 days',
    45,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    CURRENT_DATE - INTERVAL '8 days',
    48,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    CURRENT_DATE - INTERVAL '5 days',
    42,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    CURRENT_DATE - INTERVAL '3 days',
    50,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

-- Sesje dla Piotra Wiśniewskiego
INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')),
    CURRENT_DATE - INTERVAL '7 days',
    95,
    'Nowy rekord w martwym ciągu!'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')),
    CURRENT_DATE - INTERVAL '5 days',
    88,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'));

INSERT INTO training_sessions (auth_account_id, plan_id, session_date, duration_minutes, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')),
    CURRENT_DATE - INTERVAL '3 days',
    92,
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'));

-- =================================================================
-- POMIARY UŻYTKOWNIKÓW
-- =================================================================

-- Pomiary dla Jana Kowalskiego (ostatnie 3 miesiące)
INSERT INTO user_measurements (auth_account_id, measurement_date, weight_kg, body_fat_percentage, notes)
VALUES
((SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'), CURRENT_DATE - INTERVAL '90 days', 87.0, 18.5, 'Początek planu'),
((SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'), CURRENT_DATE - INTERVAL '60 days', 86.2, 18.0, NULL),
((SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'), CURRENT_DATE - INTERVAL '30 days', 85.8, 17.8, NULL),
((SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'), CURRENT_DATE, 85.5, 17.5, 'Postęp widoczny');

-- Pomiary dla Anny Nowak
INSERT INTO user_measurements (auth_account_id, measurement_date, weight_kg, body_fat_percentage, notes)
VALUES
((SELECT id FROM auth_accounts WHERE username = 'anna.nowak'), CURRENT_DATE - INTERVAL '60 days', 64.0, 25.0, NULL),
((SELECT id FROM auth_accounts WHERE username = 'anna.nowak'), CURRENT_DATE - INTERVAL '30 days', 63.2, 24.5, NULL),
((SELECT id FROM auth_accounts WHERE username = 'anna.nowak'), CURRENT_DATE, 62.0, 24.0, 'Dobry postęp');

-- Pomiary dla Piotra Wiśniewskiego
INSERT INTO user_measurements (auth_account_id, measurement_date, weight_kg, body_fat_percentage, notes)
VALUES
((SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'), CURRENT_DATE - INTERVAL '120 days', 90.0, 12.0, NULL),
((SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'), CURRENT_DATE - INTERVAL '60 days', 91.5, 12.2, 'Zwiększenie masy'),
((SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'), CURRENT_DATE, 92.0, 12.5, NULL);

-- =================================================================
-- REKORDY OSOBISTE
-- =================================================================

-- Rekordy dla Piotra Wiśniewskiego
INSERT INTO personal_records (auth_account_id, exercise_id, reps, weight_kg, record_date)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT id FROM exercises WHERE name = 'Martwy ciąg'),
    1,
    200.0,
    CURRENT_DATE - INTERVAL '7 days'
ON CONFLICT (auth_account_id, exercise_id, reps) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, record_date = EXCLUDED.record_date;

INSERT INTO personal_records (auth_account_id, exercise_id, reps, weight_kg, record_date)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT id FROM exercises WHERE name = 'Przysiady ze sztangą'),
    1,
    180.0,
    CURRENT_DATE - INTERVAL '14 days'
ON CONFLICT (auth_account_id, exercise_id, reps) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, record_date = EXCLUDED.record_date;

INSERT INTO personal_records (auth_account_id, exercise_id, reps, weight_kg, record_date)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski'),
    (SELECT id FROM exercises WHERE name = 'Wyciskanie sztangi na ławce płaska'),
    1,
    140.0,
    CURRENT_DATE - INTERVAL '21 days'
ON CONFLICT (auth_account_id, exercise_id, reps) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, record_date = EXCLUDED.record_date;

-- Rekordy dla Jana Kowalskiego
INSERT INTO personal_records (auth_account_id, exercise_id, reps, weight_kg, record_date)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT id FROM exercises WHERE name = 'Wyciskanie sztangi na ławce płaska'),
    8,
    80.0,
    CURRENT_DATE - INTERVAL '5 days'
ON CONFLICT (auth_account_id, exercise_id, reps) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, record_date = EXCLUDED.record_date;

INSERT INTO personal_records (auth_account_id, exercise_id, reps, weight_kg, record_date)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT id FROM exercises WHERE name = 'Przysiady ze sztangą'),
    8,
    100.0,
    CURRENT_DATE - INTERVAL '10 days'
ON CONFLICT (auth_account_id, exercise_id, reps) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, record_date = EXCLUDED.record_date;

-- =================================================================
-- ŚLEDZENIE POSTĘPÓW
-- =================================================================

-- Postępy dla Jana Kowalskiego
INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    'total_volume',
    12000.0,
    CURRENT_DATE - INTERVAL '30 days',
    'Początek planu'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')),
    'total_volume',
    13500.0,
    CURRENT_DATE,
    'Postęp w objętości treningowej'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'));

-- Postępy dla Anny Nowak
INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    'calories_burned',
    250.0,
    CURRENT_DATE - INTERVAL '15 days',
    NULL
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

INSERT INTO user_progress_tracking (auth_account_id, plan_id, metric_name, metric_value, measurement_date, notes)
SELECT 
    (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'),
    (SELECT plan_id FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak')),
    'calories_burned',
    280.0,
    CURRENT_DATE,
    'Zwiększenie intensywności'
WHERE EXISTS (SELECT 1 FROM user_active_plans WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'anna.nowak'));

-- =================================================================
-- ĆWICZENIA W SESJACH I SERIE
-- =================================================================

-- Ćwiczenia w sesjach dla Jana Kowalskiego (ostatnia sesja)
INSERT INTO session_exercises (session_id, exercise_id, plan_exercise_id)
SELECT 
    ts.id,
    e.id,
    pe.id
FROM training_sessions ts
CROSS JOIN exercises e
LEFT JOIN plan_exercises pe ON pe.plan_day_id = (
    SELECT pd.id FROM plan_days pd 
    WHERE pd.plan_id = ts.plan_id AND pd.day_order = 1 
    LIMIT 1
) AND pe.exercise_id = e.id
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
  AND e.name IN ('Wyciskanie sztangi na ławce płaska', 'Wyciskanie hantli na ławce skośna-góra', 'Pompki klasyczne', 'Wyciskanie francuskie hantle')
LIMIT 4;

-- Serie dla wyciskania sztangi (ostatnia sesja Jana)
INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    1,
    75.0,
    8,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    2,
    75.0,
    8,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    3,
    75.0,
    7,
    'Ostatnia seria - zmęczenie'
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    4,
    75.0,
    6,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
  AND e.name = 'Wyciskanie sztangi na ławce płaska'
LIMIT 1;

-- Serie dla przysiadów (sesja sprzed 9 dni - trening nóg)
INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    1,
    100.0,
    10,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '9 days'
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    2,
    100.0,
    10,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '9 days'
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    3,
    100.0,
    9,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '9 days'
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    4,
    100.0,
    8,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '9 days'
  AND e.name = 'Przysiady ze sztangą'
LIMIT 1;

-- Serie dla Piotra Wiśniewskiego (martwy ciąg - rekord)
INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    1,
    180.0,
    3,
    'Rozgrzewka'
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '7 days'
  AND e.name = 'Martwy ciąg'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    2,
    190.0,
    1,
    NULL
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '7 days'
  AND e.name = 'Martwy ciąg'
LIMIT 1;

INSERT INTO logged_sets (session_id, exercise_id, set_order, weight_kg, reps, notes)
SELECT 
    ts.id,
    e.id,
    3,
    200.0,
    1,
    'NOWY REKORD!'
FROM training_sessions ts, exercises e
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'piotr.wisniewski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '7 days'
  AND e.name = 'Martwy ciąg'
LIMIT 1;

-- Wykonane dni planu
INSERT INTO completed_plan_days (session_id, plan_day_id, completed_at)
SELECT 
    ts.id,
    pd.id,
    ts.session_date
FROM training_sessions ts
JOIN plan_days pd ON pd.plan_id = ts.plan_id AND pd.day_order = 1
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = (SELECT MAX(session_date) FROM training_sessions WHERE auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski'))
LIMIT 1;

INSERT INTO completed_plan_days (session_id, plan_day_id, completed_at)
SELECT 
    ts.id,
    pd.id,
    ts.session_date
FROM training_sessions ts
JOIN plan_days pd ON pd.plan_id = ts.plan_id AND pd.day_order = 3
WHERE ts.auth_account_id = (SELECT id FROM auth_accounts WHERE username = 'jan.kowalski')
  AND ts.session_date = CURRENT_DATE - INTERVAL '9 days'
LIMIT 1;

-- =================================================================
-- KONIEC ROZSZERZONYCH DANYCH UŻYTKOWNIKÓW
-- =================================================================
