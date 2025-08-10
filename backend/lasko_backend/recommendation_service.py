import psycopg2
from collections import defaultdict
from typing import List, Dict, Optional
import logging

class RecommendationService:
    """
    Serwis rekomendacji planów treningowych na podstawie ankiety użytkownika.
    Implementuje algorytmy: content-based, collaborative filtering i hybrydowy.
    """
    
    def __init__(self, db_params: Dict):
        """
        Inicjalizacja serwisu z parametrami bazy danych.
        
        Args:
            db_params: Słownik z parametrami połączenia do bazy PostgreSQL
        """
        try:
            self.conn = psycopg2.connect(**db_params)
            logging.info("✅ Połączono z bazą danych.")
        except psycopg2.OperationalError as e:
            logging.error(f"❌ BŁĄD POŁĄCZENIA Z BAZĄ: {e}")
            self.conn = None

    def _get_user_profile(self, auth_account_id: int) -> Optional[Dict]:
        """
        Pobiera profil użytkownika z ankiety.
        
        Args:
            auth_account_id: ID konta użytkownika
            
        Returns:
            Słownik z danymi profilu lub None jeśli nie znaleziono
        """
        if not self.conn:
            return None
            
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT goal, level, training_days_per_week, equipment_preference 
                FROM user_profiles 
                WHERE auth_account_id = %s
            """, (auth_account_id,))
            
            user_data = cur.fetchone()
            if not user_data:
                return None
                
            return {
                'goal': user_data[0],
                'level': user_data[1], 
                'days': user_data[2],
                'equipment': user_data[3]
            }

    def _recommend_content_based(self, user_profile: Dict) -> List[Dict]:
        """
        ALGORYTM CONTENT-BASED: Rekomenduje na podstawie dopasowania do ankiety.
        
        System punktacji:
        - Cel (goal_type): 10 punktów za dokładne dopasowanie
        - Poziom (difficulty_level): 8 punktów za dokładne dopasowanie  
        - Dni treningowe (training_days_per_week): 12 punktów za dokładne dopasowanie
        - Sprzęt (equipment_required): 5 punktów za dokładne dopasowanie
        
        Args:
            user_profile: Profil użytkownika z ankiety
            
        Returns:
            Lista planów z wynikami dopasowania, posortowana malejąco
        """
        if not self.conn:
            return []
            
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT id, goal_type, difficulty_level, training_days_per_week, equipment_required 
                FROM training_plans
            """)
            all_plans = cur.fetchall()

        plan_scores = []
        for plan_data in all_plans:
            plan_id, goal, level, days, equipment = plan_data
            score = 0
            
            # Punktacja za dopasowanie
            if goal == user_profile['goal']:
                score += 10
            if level == user_profile['level']:
                score += 8
            if days == user_profile['days']:
                score += 12
            if equipment == user_profile['equipment']:
                score += 5

            if score > 0:
                plan_scores.append({'plan_id': plan_id, 'score': score})

        # Sortowanie malejąco po wyniku
        plan_scores.sort(key=lambda x: x['score'], reverse=True)
        return plan_scores

    def _recommend_collaborative(self, auth_account_id: int, user_profile: Dict) -> List[Dict]:
        """
        ALGORYTM COLLABORATIVE FILTERING: Rekomenduje plany popularne wśród podobnych użytkowników.
        
        Logika:
        1. Znajdź użytkowników o podobnym profilu (cel + poziom)
        2. Znajdź plany, które ci użytkownicy najczęściej aktywowali
        3. Zwróć ranking popularności
        
        Args:
            auth_account_id: ID użytkownika (wykluczony z rekomendacji)
            user_profile: Profil użytkownika z ankiety
            
        Returns:
            Lista planów z wynikami popularności wśród podobnych użytkowników
        """
        if not self.conn:
            return []
            
        with self.conn.cursor() as cur:
            # Znajdź podobnych użytkowników (ten sam cel i poziom)
            cur.execute("""
                SELECT up.auth_account_id 
                FROM user_profiles up
                WHERE up.goal = %s AND up.level = %s AND up.auth_account_id != %s
                LIMIT 100
            """, (user_profile['goal'], user_profile['level'], auth_account_id))
            
            similar_users = [row[0] for row in cur.fetchall()]
            if not similar_users:
                return []

            # Znajdź plany popularne wśród podobnych użytkowników
            cur.execute("""
                SELECT plan_id, COUNT(id) as session_count 
                FROM training_sessions
                WHERE auth_account_id = ANY(%s) AND plan_id IS NOT NULL
                GROUP BY plan_id 
                ORDER BY session_count DESC
            """, (similar_users,))
            
            return [{'plan_id': row[0], 'score': row[1]} for row in cur.fetchall()]

    def _recommend_hybrid(self, auth_account_id: int, user_profile: Dict) -> List[Dict]:
        """
        ALGORYTM HYBRYDOWY: Łączy content-based i collaborative filtering.
        
        Strategia:
        1. Oblicz wyniki content-based (dopasowanie do ankiety)
        2. Oblicz wyniki collaborative (popularność wśród podobnych)
        3. Połącz wyniki: content_score + (collaborative_score * 0.5)
        
        Args:
            auth_account_id: ID użytkownika
            user_profile: Profil użytkownika z ankiety
            
        Returns:
            Lista planów z hybrydowymi wynikami dopasowania
        """
        # Pobierz wyniki z obu algorytmów
        content_results = self._recommend_content_based(user_profile)
        collaborative_results = self._recommend_collaborative(auth_account_id, user_profile)
        
        # Przekształć collaborative na słownik dla szybkiego dostępu
        collaborative_scores = {item['plan_id']: item['score'] for item in collaborative_results}
        
        # Połącz wyniki
        hybrid_scores = []
        for plan in content_results:
            plan_id, content_score = plan['plan_id'], plan['score']
            
            # Dodaj bonus z collaborative (z mniejszą wagą)
            collaborative_bonus = collaborative_scores.get(plan_id, 0) * 0.5
            
            hybrid_scores.append({
                'plan_id': plan_id, 
                'score': content_score + collaborative_bonus
            })
            
        # Sortuj według końcowego wyniku
        hybrid_scores.sort(key=lambda x: x['score'], reverse=True)
        return hybrid_scores

    def get_recommendations(self, auth_account_id: int, mode: str = 'hybrydowo') -> List[Dict]:
        """
        Główna metoda publiczna do pobierania rekomendacji.
        
        Args:
            auth_account_id: ID użytkownika
            mode: Tryb algorytmu ('produkt', 'klient', 'hybrydowo')
            
        Returns:
            Lista rekomendowanych planów z wynikami dopasowania
        """
        if not self.conn:
            return []
            
        # Pobierz profil użytkownika
        user_profile = self._get_user_profile(auth_account_id)
        if not user_profile:
            logging.warning(f"Nie znaleziono profilu dla konta o ID: {auth_account_id}")
            return []
        
        logging.info(f"Generowanie rekomendacji dla użytkownika {auth_account_id}, tryb: {mode}")
        
        # Wybierz algorytm
        if mode == 'produkt':
            return self._recommend_content_based(user_profile)
        elif mode == 'klient':
            return self._recommend_collaborative(auth_account_id, user_profile)
        elif mode == 'hybrydowo':
            return self._recommend_hybrid(auth_account_id, user_profile)
        else:
            logging.error(f"Nieznany tryb rekomendacji: {mode}")
            return []

    def get_plan_details(self, plan_ids: List[int]) -> Dict[int, Dict]:
        """
        Pobiera szczegóły planów treningowych.
        
        Args:
            plan_ids: Lista ID planów do pobrania
            
        Returns:
            Słownik {plan_id: szczegóły_planu}
        """
        if not self.conn or not plan_ids:
            return {}
            
        with self.conn.cursor() as cur:
            placeholders = ','.join(['%s'] * len(plan_ids))
            cur.execute(f"""
                SELECT id, name, description, goal_type, difficulty_level, 
                       training_days_per_week, equipment_required
                FROM training_plans 
                WHERE id IN ({placeholders})
            """, plan_ids)
            
            plans = {}
            for row in cur.fetchall():
                plans[row[0]] = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'goal_type': row[3],
                    'difficulty_level': row[4],
                    'training_days_per_week': row[5],
                    'equipment_required': row[6]
                }
            
            return plans

    def close_connection(self):
        """Zamyka połączenie z bazą danych."""
        if self.conn:
            self.conn.close()
            logging.info("🔌 Połączenie z bazą danych zostało zamknięte.")

    def get_user_match_reasons(self, auth_account_id: int, plan_id: int) -> List[str]:
        """
        Generuje listę powodów dopasowania planu do użytkownika.
        
        Args:
            auth_account_id: ID użytkownika
            plan_id: ID planu
            
        Returns:
            Lista stringów z powodami dopasowania
        """
        if not self.conn:
            return []
            
        user_profile = self._get_user_profile(auth_account_id)
        if not user_profile:
            return []
            
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT goal_type, difficulty_level, training_days_per_week, equipment_required
                FROM training_plans 
                WHERE id = %s
            """, (plan_id,))
            
            plan_data = cur.fetchone()
            if not plan_data:
                return []
            
            plan_goal, plan_level, plan_days, plan_equipment = plan_data
            reasons = []
            
            # Sprawdź dopasowania
            if plan_goal == user_profile['goal']:
                goal_labels = {
                    'masa': 'budowanie masy mięśniowej',
                    'redukcja': 'redukcja tkanki tłuszczowej', 
                    'siła': 'zwiększenie siły'
                }
                reasons.append(f"Dopasowany cel: {goal_labels.get(plan_goal, plan_goal)}")
                
            if plan_level == user_profile['level']:
                level_labels = {
                    'poczatkujacy': 'poziom początkujący',
                    'sredniozaawansowany': 'poziom średniozaawansowany',
                    'zaawansowany': 'poziom zaawansowany'
                }
                reasons.append(f"Odpowiedni {level_labels.get(plan_level, plan_level)}")
                
            if plan_days == user_profile['days']:
                reasons.append(f"{plan_days} dni treningowych w tygodniu")
                
            if plan_equipment == user_profile['equipment']:
                equipment_labels = {
                    'silownia_full': 'pełna siłownia',
                    'wolne_ciezary': 'wolne ciężary',
                    'dom_kalistenika': 'ćwiczenia w domu'
                }
                reasons.append(f"Dostosowany do: {equipment_labels.get(plan_equipment, plan_equipment)}")
            
            return reasons

    def get_popularity_score(self, plan_id: int) -> int:
        """
        Oblicza wynik popularności planu na podstawie liczby aktywacji.
        
        Args:
            plan_id: ID planu
            
        Returns:
            Liczba aktywacji planu
        """
        if not self.conn:
            return 0
            
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) as activation_count
                FROM user_active_plans 
                WHERE plan_id = %s
            """, (plan_id,))
            
            result = cur.fetchone()
            return result[0] if result else 0


# Przykład użycia i testowanie
if __name__ == '__main__':
    # Parametry połączenia z bazą
    db_parameters = {
        "dbname": "LaskoDB", 
        "user": "postgres", 
        "password": "postgres", 
        "host": "localhost", 
        "port": "5432"
    }

    # Scenariusze testowe
    test_scenarios = [
        {"account_id": 10, "description": "Konto testowe 1"},
        {"account_id": 55, "description": "Konto testowe 2"},
    ]

    # Inicjalizacja serwisu
    reco_service = RecommendationService(db_parameters)

    if reco_service.conn:
        for scenario in test_scenarios:
            account_id = scenario["account_id"]
            print(f"\n{'='*70}")
            print(f"Test dla Konta ID: {account_id} ({scenario['description']})")
            print(f"{'='*70}")
            
            # Pobierz profil użytkownika
            user_profile = reco_service._get_user_profile(account_id)
            if user_profile:
                print("👤 Profil użytkownika:")
                print(f"   - Cel: {user_profile['goal']}")
                print(f"   - Poziom: {user_profile['level']}")
                print(f"   - Dni: {user_profile['days']}")
                print(f"   - Sprzęt: {user_profile['equipment']}")
            else:
                print(f"👤 Nie znaleziono profilu dla konta o ID {account_id}.")
                continue
            
            # Test wszystkich trybów
            for mode in ['produkt', 'klient', 'hybrydowo']:
                recommendations = reco_service.get_recommendations(account_id, mode=mode)
                
                print(f"\n--- Tryb: {mode.upper()} ---")
                if recommendations:
                    print("✨ Top 5 rekomendacji:")
                    top_plan_ids = [r['plan_id'] for r in recommendations[:5]]
                    plan_details = reco_service.get_plan_details(top_plan_ids)
                    
                    for reco in recommendations[:5]:
                        plan_id = reco['plan_id']
                        score = reco['score']
                        plan = plan_details.get(plan_id, {})
                        popularity = reco_service.get_popularity_score(plan_id)
                        match_reasons = reco_service.get_user_match_reasons(account_id, plan_id)
                        
                        print(f"   - Plan ID: {plan_id:<5} | Wynik: {score:.2f} | Popularność: {popularity}")
                        print(f"     Nazwa: {plan.get('name', 'Nieznany plan')}")
                        if match_reasons:
                            print(f"     Dopasowanie: {', '.join(match_reasons)}")
                        print()
                else:
                    print("   - Brak rekomendacji.")
    
    reco_service.close_connection()
    print("\n🎯 Testowanie algorytmów rekomendacji zakończone.")