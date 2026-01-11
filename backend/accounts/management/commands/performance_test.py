from django.core.management.base import BaseCommand
from accounts.models import AuthAccount, UserProfile
from recommendations.engine import content_based, collaborative, hybrid, fetch_user_profile
from django.db import connection
import time
import statistics


class Command(BaseCommand):
    help = 'Test wydajności algorytmów rekomendacji'

    def add_arguments(self, parser):
        parser.add_argument(
            '--iterations',
            type=int,
            default=10,
            help='Liczba iteracji testu (domyślnie: 10)',
        )

    def measure_time(self, func, *args, **kwargs):
        """Mierzy czas wykonania funkcji"""
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        return (end - start) * 1000, result  # zwraca czas w ms

    def handle(self, *args, **options):
        """Uruchamia testy wydajnościowe"""
        iterations = options['iterations']
        
        self.stdout.write("=" * 60)
        self.stdout.write("TESTY WYDAJNOŚCIOWE ALGORYTMÓW REKOMENDACJI")
        self.stdout.write("=" * 60)
        
        # Znajdź użytkownika z pełnym profilem
        try:
            user_profile = UserProfile.objects.filter(
                goal__isnull=False,
                level__isnull=False,
                training_days_per_week__isnull=False,
                equipment_preference__isnull=False
            ).first()
            
            if not user_profile:
                self.stdout.write(
                    self.style.ERROR('❌ Brak użytkownika z pełnym profilem w bazie danych')
                )
                return
            
            user_id = user_profile.auth_account_id
            self.stdout.write(self.style.SUCCESS(f'✓ Używam użytkownika ID: {user_id}'))
            self.stdout.write(
                f'  Profil: {user_profile.goal}, {user_profile.level}, '
                f'{user_profile.training_days_per_week} dni, {user_profile.equipment_preference}'
            )
            self.stdout.write('')
            
            # Pobierz profil użytkownika
            profile = fetch_user_profile(user_id)
            self.stdout.write(self.style.SUCCESS('✓ Profil użytkownika pobrany'))
            self.stdout.write('')
            
            # Test 1: Content-based filtering
            self.stdout.write("TEST 1: Content-based filtering")
            self.stdout.write("-" * 60)
            cb_times = []
            for i in range(iterations):
                elapsed, result = self.measure_time(content_based, profile)
                cb_times.append(elapsed)
                self.stdout.write(f"  Iteracja {i+1}: {elapsed:.2f} ms")
            
            cb_avg = statistics.mean(cb_times)
            cb_median = statistics.median(cb_times)
            cb_min = min(cb_times)
            cb_max = max(cb_times)
            cb_stdev = statistics.stdev(cb_times) if len(cb_times) > 1 else 0
            
            self.stdout.write('')
            self.stdout.write(f"  Średnia: {cb_avg:.2f} ms")
            self.stdout.write(f"  Mediana: {cb_median:.2f} ms")
            self.stdout.write(f"  Min: {cb_min:.2f} ms")
            self.stdout.write(f"  Max: {cb_max:.2f} ms")
            self.stdout.write(f"  Odchylenie std: {cb_stdev:.2f} ms")
            self.stdout.write(f"  Liczba rekomendacji: {len(result)}")
            self.stdout.write('')
            
            # Test 2: Collaborative filtering
            self.stdout.write("TEST 2: Collaborative filtering")
            self.stdout.write("-" * 60)
            cf_times = []
            for i in range(iterations):
                elapsed, result = self.measure_time(collaborative, user_id)
                cf_times.append(elapsed)
                self.stdout.write(f"  Iteracja {i+1}: {elapsed:.2f} ms")
            
            cf_avg = statistics.mean(cf_times)
            cf_median = statistics.median(cf_times)
            cf_min = min(cf_times)
            cf_max = max(cf_times)
            cf_stdev = statistics.stdev(cf_times) if len(cf_times) > 1 else 0
            
            self.stdout.write('')
            self.stdout.write(f"  Średnia: {cf_avg:.2f} ms")
            self.stdout.write(f"  Mediana: {cf_median:.2f} ms")
            self.stdout.write(f"  Min: {cf_min:.2f} ms")
            self.stdout.write(f"  Max: {cf_max:.2f} ms")
            self.stdout.write(f"  Odchylenie std: {cf_stdev:.2f} ms")
            self.stdout.write(f"  Liczba rekomendacji: {len(result)}")
            self.stdout.write('')
            
            # Test 3: Hybrid approach
            self.stdout.write("TEST 3: Hybrid approach")
            self.stdout.write("-" * 60)
            hy_times = []
            for i in range(iterations):
                elapsed, result = self.measure_time(hybrid, user_id, profile)
                hy_times.append(elapsed)
                self.stdout.write(f"  Iteracja {i+1}: {elapsed:.2f} ms")
            
            hy_avg = statistics.mean(hy_times)
            hy_median = statistics.median(hy_times)
            hy_min = min(hy_times)
            hy_max = max(hy_times)
            hy_stdev = statistics.stdev(hy_times) if len(hy_times) > 1 else 0
            
            self.stdout.write('')
            self.stdout.write(f"  Średnia: {hy_avg:.2f} ms")
            self.stdout.write(f"  Mediana: {hy_median:.2f} ms")
            self.stdout.write(f"  Min: {hy_min:.2f} ms")
            self.stdout.write(f"  Max: {hy_max:.2f} ms")
            self.stdout.write(f"  Odchylenie std: {hy_stdev:.2f} ms")
            self.stdout.write(f"  Liczba rekomendacji: {len(result)}")
            self.stdout.write('')
            
            # Podsumowanie
            self.stdout.write("=" * 60)
            self.stdout.write("PODSUMOWANIE")
            self.stdout.write("=" * 60)
            self.stdout.write(f"Content-based:      {cb_avg:.2f} ms (średnia)")
            self.stdout.write(f"Collaborative:      {cf_avg:.2f} ms (średnia)")
            self.stdout.write(f"Hybrid:             {hy_avg:.2f} ms (średnia)")
            self.stdout.write('')
            
            # Sprawdź liczbę planów w bazie
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM training_plans 
                    WHERE COALESCE(is_active, TRUE) = TRUE 
                      AND COALESCE(is_base_plan, TRUE) = TRUE
                """)
                plan_count = cursor.fetchone()[0]
            
            self.stdout.write(f"Liczba aktywnych planów w bazie: {plan_count}")
            self.stdout.write('')
            
            # Wyświetl wyniki w formacie gotowym do wklejenia do tabeli LaTeX
            self.stdout.write("=" * 60)
            self.stdout.write("WYNIKI DO TABELI (LaTeX)")
            self.stdout.write("=" * 60)
            self.stdout.write(f"Content-based filtering & {cb_avg:.1f} & {cb_median:.1f} & {cb_min:.1f} & {cb_max:.1f} \\\\")
            self.stdout.write(f"Collaborative filtering & {cf_avg:.1f} & {cf_median:.1f} & {cf_min:.1f} & {cf_max:.1f} \\\\")
            self.stdout.write(f"Hybrid approach & {hy_avg:.1f} & {hy_median:.1f} & {hy_min:.1f} & {hy_max:.1f} \\\\")
            
        except Exception as e:
            error_msg = str(e)
            
            # Sprawdź czy to błąd połączenia z bazą danych
            if 'could not translate host name "db"' in error_msg or 'OperationalError' in str(type(e)):
                self.stdout.write('')
                self.stdout.write(
                    self.style.ERROR('❌ Błąd połączenia z bazą danych')
                )
                self.stdout.write('')
                self.stdout.write('Upewnij się, że:')
                self.stdout.write('  1. Uruchamiasz testy w kontenerze Docker:')
                self.stdout.write('     docker-compose exec backend python manage.py performance_test')
                self.stdout.write('')
                self.stdout.write('  2. LUB masz lokalną bazę danych i odpowiednią konfigurację w settings.py')
                self.stdout.write('')
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ Błąd podczas testowania: {error_msg}')
                )
            
            # Pokaż pełny traceback tylko w trybie verbose
            if options.get('verbosity', 1) >= 2:
                import traceback
                traceback.print_exc()

