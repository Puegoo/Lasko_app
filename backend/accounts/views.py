# backend/accounts/views.py (POPRAWIONE Z NOWYMI ENDPOINTAMI)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.contrib.auth.hashers import check_password
import logging

from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer,
    UserProfileSerializer
)
from .models import AuthAccount, UserProfile

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Endpoint rejestracji nowego użytkownika
    
    POST /api/auth/register/
    {
        "username": "jankowalski",
        "email": "jan@example.com",
        "password": "SecurePass123",
        "password_confirm": "SecurePass123",
        "first_name": "Jan",
        "date_of_birth": "1990-05-15",
        "goal": "masa",
        "level": "początkujący",
        "training_days_per_week": 3,
        "equipment_preference": "siłownia"
    }
    """
    try:
        logger.info(f"🔥 Rejestracja - otrzymane dane: {request.data}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            logger.info(f"✅ Walidacja przeszła pomyślnie")
            
            # Utwórz użytkownika i profil
            result = serializer.save()
            auth_account = result['auth_account']
            user_profile = result['user_profile']
            
            logger.info(f"✅ Użytkownik utworzony: {auth_account.username}")
            
            # Wygeneruj tokeny JWT
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            # Przygotuj odpowiedź
            response_data = {
                'message': 'Rejestracja zakończyła się sukcesem',
                'user': {
                    'id': auth_account.id,
                    'username': auth_account.username,
                    'email': auth_account.email,
                    'first_name': auth_account.first_name,
                    'created_at': auth_account.created_at.isoformat(),
                },
                'profile': UserProfileSerializer(user_profile).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
            
            logger.info(f"🎉 Rejestracja zakończona sukcesem dla: {auth_account.username}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        logger.error(f"❌ Błędy walidacji: {serializer.errors}")
        return Response(
            {
                'message': 'Błędy walidacji',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"❌ Błąd podczas rejestracji: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas rejestracji',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint logowania użytkownika
    
    POST /api/auth/login/
    {
        "login": "jankowalski",  // lub email: "jan@example.com"
        "password": "SecurePass123"
    }
    """
    try:
        logger.info(f"🔐 Logowanie - próba dla: {request.data.get('login')}")
        
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            auth_account = serializer.validated_data['auth_account']
            
            logger.info(f"✅ Logowanie udane dla: {auth_account.username}")
            
            # Pobierz profil użytkownika
            try:
                user_profile = auth_account.userprofile  # Używamy 'userprofile' zgodnie z related_name
                profile_data = UserProfileSerializer(user_profile).data
            except UserProfile.DoesNotExist:
                logger.warning(f"⚠️ Brak profilu dla użytkownika: {auth_account.username}")
                profile_data = None
            
            # Wygeneruj tokeny JWT
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            response_data = {
                'message': 'Logowanie zakończyło się sukcesem',
                'user': {
                    'id': auth_account.id,
                    'username': auth_account.username,
                    'email': auth_account.email,
                    'first_name': auth_account.first_name,
                    'is_admin': auth_account.is_admin,
                },
                'profile': profile_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        logger.error(f"❌ Błędy logowania: {serializer.errors}")
        return Response(
            {
                'message': 'Nieprawidłowe dane logowania',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"❌ Błąd podczas logowania: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas logowania',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Endpoint pobierania profilu aktualnie zalogowanego użytkownika
    
    GET /api/auth/profile/
    Headers: Authorization: Bearer <access_token>
    """
    try:
        # JWT powinien zawierać user_id
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response(
                {'message': 'Nieprawidłowy token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Pobierz konto użytkownika
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response(
                {'message': 'Użytkownik nie istnieje'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Pobierz profil użytkownika
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
            logger.warning(f"⚠️ Brak profilu dla użytkownika: {auth_account.username}")
            profile_data = None
        
        response_data = {
            'user': {
                'id': auth_account.id,
                'username': auth_account.username,
                'email': auth_account.email,
                'first_name': auth_account.first_name,
                'is_admin': auth_account.is_admin,
                'created_at': auth_account.created_at.isoformat(),
            },
            'profile': profile_data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"❌ Błąd podczas pobierania profilu: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas pobierania profilu',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Endpoint aktualizacji profilu użytkownika
    
    PUT /api/auth/profile/
    Headers: Authorization: Bearer <access_token>
    {
        "first_name": "Jan",
        "goal": "siła",
        "level": "sredniozaawansowany",
        "training_days_per_week": 4,
        "equipment_preference": "siłownia"
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response(
                {'message': 'Nieprawidłowy token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Pobierz konto użytkownika
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response(
                {'message': 'Użytkownik nie istnieje'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Pobierz lub utwórz profil użytkownika
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account
        )
        
        if created:
            logger.info(f"✅ Utworzono nowy profil dla użytkownika: {auth_account.username}")
        
        # Aktualizuj profil
        serializer = UserProfileSerializer(
            user_profile, 
            data=request.data, 
            partial=True  # Pozwala na częściowe aktualizacje
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Jeśli first_name zostało zaktualizowane, zaktualizuj też w auth_account
            if 'first_name' in request.data:
                auth_account.first_name = request.data['first_name']
                auth_account.save()
                logger.info(f"✅ Zaktualizowano first_name w auth_account dla: {auth_account.username}")
            
            logger.info(f"✅ Profil zaktualizowany dla: {auth_account.username}")
            
            return Response(
                {
                    'message': 'Profil zaktualizowany pomyślnie',
                    'profile': serializer.data
                }, 
                status=status.HTTP_200_OK
            )
        
        logger.error(f"❌ Błędy walidacji profilu: {serializer.errors}")
        return Response(
            {
                'message': 'Błędy walidacji',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"❌ Błąd podczas aktualizacji profilu: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas aktualizacji profilu',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Endpoint wylogowania użytkownika (opcjonalnie można dodać blacklistę tokenów)
    
    POST /api/auth/logout/
    Headers: Authorization: Bearer <access_token>
    """
    try:
        user_id = request.auth.payload.get('user_id')
        
        if user_id:
            try:
                auth_account = AuthAccount.objects.get(id=user_id)
                logger.info(f"✅ Użytkownik wylogowany: {auth_account.username}")
            except AuthAccount.DoesNotExist:
                pass
        
        return Response(
            {'message': 'Wylogowano pomyślnie'}, 
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"❌ Błąd podczas wylogowania: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas wylogowania',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# NOWE ENDPOINTY DLA METODY REKOMENDACJI
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_recommendation_method(request):
    """
    Ustaw metodę rekomendacji dla użytkownika
    
    POST /api/auth/set-recommendation-method/
    Headers: Authorization: Bearer <access_token>
    {
        "method": "hybrid"  // "product" | "user" | "hybrid"
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response(
                {'message': 'Nieprawidłowy token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        method = request.data.get('method')
        
        if method not in ['product', 'user', 'hybrid']:
            return Response(
                {'message': 'Nieprawidłowa metoda rekomendacji. Dozwolone: product, user, hybrid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pobierz konto użytkownika
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response(
                {'message': 'Użytkownik nie istnieje'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Pobierz lub utwórz profil użytkownika
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account
        )
        
        # Ustaw metodę rekomendacji
        user_profile.recommendation_method = method
        user_profile.save()
        
        logger.info(f"✅ Ustawiono metodę rekomendacji '{method}' dla użytkownika: {auth_account.username}")
        
        return Response(
            {
                'message': 'Metoda rekomendacji ustawiona pomyślnie',
                'method': method
            }, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"❌ Błąd podczas ustawiania metody rekomendacji: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas ustawiania metody rekomendacji',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_recommendations(request):
    """
    Generuj rekomendacje planów dla użytkownika
    
    POST /api/auth/generate-recommendations/
    Headers: Authorization: Bearer <access_token>
    {
        "method": "hybrid"  // opcjonalne - jeśli nie podane, użyje z profilu
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response(
                {'message': 'Nieprawidłowy token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Pobierz konto użytkownika
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response(
                {'message': 'Użytkownik nie istnieje'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Pobierz profil użytkownika
        try:
            user_profile = auth_account.userprofile
        except UserProfile.DoesNotExist:
            return Response(
                {'message': 'Brak profilu użytkownika. Uzupełnij dane profilu.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pobierz metodę rekomendacji
        method = request.data.get('method') or user_profile.recommendation_method
        
        if not method:
            return Response(
                {'message': 'Brak metody rekomendacji. Ustaw metodę w profilu lub przekaż w żądaniu.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tu będzie logika algorytmu rekomendującego
        # Na razie zwracamy mock data dostosowane do profilu użytkownika
        recommended_plan = generate_mock_recommendation(user_profile, method)
        
        logger.info(f"✅ Wygenerowano rekomendację metodą '{method}' dla użytkownika: {auth_account.username}")
        
        return Response(
            {
                'message': 'Rekomendacje wygenerowane pomyślnie',
                'method': method,
                'recommended_plan': recommended_plan
            }, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"❌ Błąd podczas generowania rekomendacji: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas generowania rekomendacji',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def generate_mock_recommendation(user_profile, method):
    """
    Generuje mock rekomendacji na podstawie profilu użytkownika
    W przyszłości zostanie zastąpione przez prawdziwy algorytm
    """
    
    # Podstawowe dane
    goal = user_profile.goal or 'zdrowie'
    level = user_profile.level or 'początkujący'
    days_per_week = user_profile.training_days_per_week or 3
    equipment = user_profile.equipment_preference or 'siłownia'
    
    # Generuj nazwę planu na podstawie profilu
    plan_name = f"Plan {goal.title()}"
    if level == 'początkujący':
        plan_name += " dla Początkujących"
    elif level == 'zaawansowany':
        plan_name += " Zaawansowany"
    else:
        plan_name += " Średniozaawansowany"
    
    # Dostosuj czas trwania na podstawie poziomu
    duration_weeks = 6 if level == 'początkujący' else 8 if level == 'średniozaawansowany' else 12
    
    # Generuj procent dopasowania (wyższy dla lepszej metody)
    if method == 'hybrid':
        match_percentage = 94
    elif method == 'user':
        match_percentage = 89
    else:  # product
        match_percentage = 82
    
    # Cechy planu na podstawie celu
    features = ['Instrukcje wideo', 'Progresywne obciążenie']
    if goal == 'masa':
        features.extend(['Wysokie powtórzenia', 'Hipertrofia'])
    elif goal == 'siła':
        features.extend(['Niskie powtórzenia', 'Duże obciążenia'])
    elif goal == 'redukcja':
        features.extend(['Cardio intervals', 'Superset workouts'])
    else:
        features.extend(['Wszystkie grupy mięśniowe', 'Funkcjonalność'])
    
    return {
        'id': 1,
        'name': plan_name,
        'duration': f'{duration_weeks} tygodni',
        'frequency': f'{days_per_week} razy w tygodniu',
        'match_percentage': match_percentage,
        'description': f'Kompleksowy plan treningowy dostosowany do Twoich preferencji: {goal}, poziom {level}, {equipment}.',
        'features': features,
        'method': method,
        'goal': goal,
        'level': level,
        'equipment': equipment
    }