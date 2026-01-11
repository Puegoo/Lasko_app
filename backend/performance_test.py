#!/usr/bin/env python
"""
⚠️ TEN PLIK JEST PRZESTARZAŁY ⚠️

Użyj zamiast tego Django management command:
    python manage.py performance_test

Lub jeśli używasz środowiska wirtualnego:
    cd Lasko_app/backend
    source venv/bin/activate  # lub: venv\Scripts\activate na Windows
    python manage.py performance_test

Plik został przeniesiony do: accounts/management/commands/performance_test.py
"""
import sys

print("=" * 60)
print("⚠️  TEN PLIK JEST PRZESTARZAŁY")
print("=" * 60)
print("")
print("Użyj zamiast tego Django management command:")
print("")
print("  cd Lasko_app/backend")
print("  python manage.py performance_test")
print("")
print("Lub z opcjonalną liczbą iteracji:")
print("")
print("  python manage.py performance_test --iterations 20")
print("")
print("Plik został przeniesiony do: accounts/management/commands/performance_test.py")
print("=" * 60)
sys.exit(1)

def measure_time(func, *args, **kwargs):
    """Mierzy czas wykonania funkcji"""
    start = time.perf_counter()
    result = func(*args, **kwargs)
    end = time.perf_counter()
    return (end - start) * 1000, result  # zwraca czas w ms

def run_performance_tests():
    """Uruchamia testy wydajnościowe"""
    print("=" * 60)
    print("TESTY WYDAJNOŚCIOWE ALGORYTMÓW REKOMENDACJI")
    print("=" * 60)
    
    # Znajdź użytkownika z pełnym profilem
    try:
        user_profile = UserProfile.objects.filter(
            goal__isnull=False,
            level__isnull=False,
            training_days_per_week__isnull=False,
            equipment_preference__isnull=False
        ).first()
        
        if not user_profile:
            print("❌ Brak użytkownika z pełnym profilem w bazie danych")
            return
        
        user_id = user_profile.auth_account_id
        print(f"✓ Używam użytkownika ID: {user_id}")
        print(f"  Profil: {user_profile.goal}, {user_profile.level}, {user_profile.training_days_per_week} dni, {user_profile.equipment_preference}")
        print()
        
        # Pobierz profil użytkownika
        profile = fetch_user_profile(user_id)
        print(f"✓ Profil użytkownika pobrany")
        print()
        
        # Liczba powtórzeń testu
        iterations = 10
        
        # Test 1: Content-based filtering
        print("TEST 1: Content-based filtering")
        print("-" * 60)
        cb_times = []
        for i in range(iterations):
            elapsed, result = measure_time(content_based, profile)
            cb_times.append(elapsed)
            print(f"  Iteracja {i+1}: {elapsed:.2f} ms")
        
        cb_avg = statistics.mean(cb_times)
        cb_median = statistics.median(cb_times)
        cb_min = min(cb_times)
        cb_max = max(cb_times)
        cb_stdev = statistics.stdev(cb_times) if len(cb_times) > 1 else 0
        
        print(f"\n  Średnia: {cb_avg:.2f} ms")
        print(f"  Mediana: {cb_median:.2f} ms")
        print(f"  Min: {cb_min:.2f} ms")
        print(f"  Max: {cb_max:.2f} ms")
        print(f"  Odchylenie std: {cb_stdev:.2f} ms")
        print(f"  Liczba rekomendacji: {len(result)}")
        print()
        
        # Test 2: Collaborative filtering
        print("TEST 2: Collaborative filtering")
        print("-" * 60)
        cf_times = []
        for i in range(iterations):
            elapsed, result = measure_time(collaborative, profile)
            cf_times.append(elapsed)
            print(f"  Iteracja {i+1}: {elapsed:.2f} ms")
        
        cf_avg = statistics.mean(cf_times)
        cf_median = statistics.median(cf_times)
        cf_min = min(cf_times)
        cf_max = max(cf_times)
        cf_stdev = statistics.stdev(cf_times) if len(cf_times) > 1 else 0
        
        print(f"\n  Średnia: {cf_avg:.2f} ms")
        print(f"  Mediana: {cf_median:.2f} ms")
        print(f"  Min: {cf_min:.2f} ms")
        print(f"  Max: {cf_max:.2f} ms")
        print(f"  Odchylenie std: {cf_stdev:.2f} ms")
        print(f"  Liczba rekomendacji: {len(result)}")
        print()
        
        # Test 3: Hybrid approach
        print("TEST 3: Hybrid approach")
        print("-" * 60)
        hy_times = []
        for i in range(iterations):
            elapsed, result = measure_time(hybrid, profile)
            hy_times.append(elapsed)
            print(f"  Iteracja {i+1}: {elapsed:.2f} ms")
        
        hy_avg = statistics.mean(hy_times)
        hy_median = statistics.median(hy_times)
        hy_min = min(hy_times)
        hy_max = max(hy_times)
        hy_stdev = statistics.stdev(hy_times) if len(hy_times) > 1 else 0
        
        print(f"\n  Średnia: {hy_avg:.2f} ms")
        print(f"  Mediana: {hy_median:.2f} ms")
        print(f"  Min: {hy_min:.2f} ms")
        print(f"  Max: {hy_max:.2f} ms")
        print(f"  Odchylenie std: {hy_stdev:.2f} ms")
        print(f"  Liczba rekomendacji: {len(result)}")
        print()
        
        # Podsumowanie
        print("=" * 60)
        print("PODSUMOWANIE")
        print("=" * 60)
        print(f"Content-based:      {cb_avg:.2f} ms (średnia)")
        print(f"Collaborative:      {cf_avg:.2f} ms (średnia)")
        print(f"Hybrid:             {hy_avg:.2f} ms (średnia)")
        print()
        
        # Sprawdź liczbę planów w bazie
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM base_plans WHERE is_active = true")
            plan_count = cursor.fetchone()[0]
        
        print(f"Liczba aktywnych planów w bazie: {plan_count}")
        print()
        
        # Zwróć wyniki jako słownik
        return {
            'content_based': {
                'avg': cb_avg,
                'median': cb_median,
                'min': cb_min,
                'max': cb_max,
                'stdev': cb_stdev,
                'times': cb_times
            },
            'collaborative': {
                'avg': cf_avg,
                'median': cf_median,
                'min': cf_min,
                'max': cf_max,
                'stdev': cf_stdev,
                'times': cf_times
            },
            'hybrid': {
                'avg': hy_avg,
                'median': hy_median,
                'min': hy_min,
                'max': hy_max,
                'stdev': hy_stdev,
                'times': hy_times
            },
            'plan_count': plan_count
        }
        
    except Exception as e:
        print(f"❌ Błąd podczas testowania: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    results = run_performance_tests()

