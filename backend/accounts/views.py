# backend/accounts/views.py - NAPRAWIONA WERSJA Z REFRESH_TOKEN
import logging
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer  # DODANE!
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import AuthAccount, UserProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    AuthAccountSerializer
)

# Konfiguracja logowania
logger = logging.getLogger(__name__)


# ============================================================================
# REJESTRACJA - NAPRAWIONA WERSJA
# ============================================================================
@extend_schema(
    request=UserRegistrationSerializer,
    responses={
        201: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT,
    },
    examples=[
        OpenApiExample(
            'Przykład rejestracji',
            value={
                'username': 'test_user',
                'email': 'test@example.com',
                'password': 'test123456',
                'password_confirm': 'test123456',
                'first_name': 'Test',
                'goal': 'masa_mięśniowa',
                'level': 'początkujący',
                'training_days_per_week': 3,
                'equipment_preference': 'siłownia'
            },
            request_only=True,
        ),
    ],
    summary='Rejestracja nowego użytkownika',
    description='Rejestracja nowego użytkownika z opcjonalnym profilem treningowym. Zwraca tokeny JWT po pomyślnej rejestracji.'
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Rejestracja nowego użytkownika - używa tylko Django ORM"""
    try:
        logger.info(f"[Register] Rejestracja użytkownika: {request.data.get('username', 'unknown')}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            logger.info(f"[Register] Walidacja przeszła pomyślnie")
            
            try:
                # Utwórz użytkownika przez serializer
                result = serializer.save()
                auth_account = result['auth_account']
                user_profile = result['user_profile']
                
                logger.info(f"[Register] Użytkownik utworzony: ID {auth_account.id}")
                
                # Utwórz JWT tokeny
                refresh = RefreshToken()
                refresh['user_id'] = auth_account.id
                refresh['username'] = auth_account.username
                
                response_data = {
                    'message': 'Rejestracja pomyślna',
                    'user': {
                        'id': auth_account.id,
                        'username': auth_account.username,
                        'email': auth_account.email,
                        'first_name': auth_account.first_name,
                        'is_admin': auth_account.is_admin,
                    },
                    'profile': UserProfileSerializer(user_profile).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }
                
                logger.info(f"[Register] Rejestracja udana: {auth_account.username}")
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"[Register] Błąd podczas tworzenia użytkownika: {str(e)}")
                return Response({
                    'message': 'Błąd serwera podczas rejestracji',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            logger.warning(f"[Register] Błędy walidacji: {serializer.errors}")
            return Response({
                'message': 'Błędy walidacji',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"[Register] Nieoczekiwany błąd: {str(e)}")
        import traceback
        logger.error(f"[Register] Traceback: {traceback.format_exc()}")
        return Response({
            'message': 'Błąd serwera podczas rejestracji',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# LOGOWANIE - NAPRAWIONA WERSJA
# ============================================================================
@extend_schema(
    request=UserLoginSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
    },
    examples=[
        OpenApiExample(
            'Przykład logowania',
            value={
                'username': 'test_user',
                'password': 'test123456'
            },
            request_only=True,
        ),
        OpenApiExample(
            'Przykład logowania przez email',
            value={
                'email': 'test@example.com',
                'password': 'test123456'
            },
            request_only=True,
        ),
    ],
    summary='Logowanie użytkownika',
    description='Logowanie użytkownika przez username lub email. Zwraca tokeny JWT (access i refresh).'
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Akceptuje {login,password} albo {email,password} albo {username,password}."""
    try:
        logger.info("[Login] Próba logowania")

        # 🔧 NORMALIZACJA: jeśli nie ma 'login', użyj 'username' lub 'email'
        data = request.data.copy()
        if 'login' not in data:
            data['login'] = (data.get('username') or data.get('email') or '').strip()

        serializer = UserLoginSerializer(data=data)
        if not serializer.is_valid():
            logger.warning(f"[Login] Błędy walidacji: {serializer.errors}")
            return Response(
                {'detail': 'Nieprawidłowe dane logowania', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        login_value = serializer.validated_data['login']
        password = serializer.validated_data['password']
        
        logger.info(f"[Login] Login attempt: {login_value}")
        
        # Znajdź konto użytkownika
        auth_account = None
        try:
            if '@' in login_value:
                auth_account = AuthAccount.objects.get(email=login_value)
            else:
                auth_account = AuthAccount.objects.get(username=login_value)
            logger.info(f"[Login] Znaleziono użytkownika: {auth_account.username}")
        except AuthAccount.DoesNotExist:
            logger.warning(f"[Login] Użytkownik nie znaleziony: {login_value}")
            return Response({
                'detail': 'Nieprawidłowe dane logowania',
                'code': 'invalid_credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Sprawdź hasło
        if not auth_account.check_password(password):
            logger.warning(f"[Login] Nieprawidłowe hasło dla: {auth_account.username}")
            return Response({
                'detail': 'Nieprawidłowe dane logowania',
                'code': 'invalid_credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Pobierz profil użytkownika
        profile_data = None
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
            logger.info(f"[Login] Profil załadowany dla: {auth_account.username}")
        except UserProfile.DoesNotExist:
            logger.warning(f"[Login] Brak profilu dla użytkownika: {auth_account.username}")
            # Nie blokuj logowania z powodu braku profilu
        except Exception as e:
            logger.error(f"[Login] Błąd ładowania profilu: {str(e)}")
            # Nie blokuj logowania
        
        # Utwórz JWT tokeny
        try:
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            response_data = {
                'message': 'Logowanie pomyślne',
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
            
            # Aktualizuj last_login
            auth_account.last_login = timezone.now()
            auth_account.save(update_fields=['last_login'])
            
            logger.info(f"[Login] Logowanie udane: {auth_account.username}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[Login] Błąd tworzenia tokenów: {str(e)}")
            return Response({
                'detail': 'Błąd serwera podczas logowania',
                'code': 'token_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"[Login] Nieoczekiwany błąd: {str(e)}")
        import traceback
        logger.error(f"[Login] Traceback: {traceback.format_exc()}")
        return Response({
            'detail': 'Błąd serwera podczas logowania',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# WYLOGOWANIE
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Wylogowanie użytkownika"""
    try:
        logger.info("[Logout] Wylogowywanie użytkownika")
        
        # W Simple JWT nie ma blacklisting w podstawowej wersji
        # Można dodać refresh token do blacklisty jeśli jest w request
        
        return Response({
            'message': 'Wylogowanie pomyślne'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[Logout] Błąd: {str(e)}")
        return Response({
            'detail': 'Błąd podczas wylogowania',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ODŚWIEŻANIE TOKENU - BRAKUJĄCA FUNKCJA!
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Odświeżanie access tokenu"""
    try:
        logger.info("[RefreshToken] Odświeżanie tokenu")
        
        serializer = TokenRefreshSerializer(data=request.data)
        
        if serializer.is_valid():
            response_data = {
                'access': serializer.validated_data['access']
            }
            
            logger.info("[RefreshToken] Token odświeżony pomyślnie")
            return Response(response_data, status=status.HTTP_200_OK)
        
        logger.error(f"[RefreshToken] Błędy: {serializer.errors}")
        return Response({
            'detail': 'Nieprawidłowy refresh token',
            'code': 'invalid_token'
        }, status=status.HTTP_401_UNAUTHORIZED)
        
    except TokenError as e:
        logger.error(f"[RefreshToken] TokenError: {str(e)}")
        return Response({
            'detail': 'Token wygasł lub jest nieprawidłowy',
            'code': 'token_expired'
        }, status=status.HTTP_401_UNAUTHORIZED)
        
    except Exception as e:
        logger.error(f"[RefreshToken] Błąd: {str(e)}")
        return Response({
            'detail': 'Błąd serwera podczas odświeżania tokenu',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PROFIL UŻYTKOWNIKA
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Pobieranie profilu użytkownika"""
    try:
        # Pobierz user_id z JWT tokenu
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        
        if not user_id:
            logger.error("[Profile] Brak user_id w tokenie")
            return Response({
                'detail': 'Nieprawidłowy token - brak user_id',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"[Profile] Pobieranie profilu dla user_id: {user_id}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            logger.error(f"[Profile] Użytkownik nie istnieje: {user_id}")
            return Response({
                'detail': 'Użytkownik nie istnieje',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Pobierz profil
        profile_data = None
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
            logger.warning(f"[Profile] Brak profilu dla użytkownika: {auth_account.username}")
        
        response_data = {
            'user': {
                'id': auth_account.id,
                'username': auth_account.username,
                'email': auth_account.email,
                'first_name': auth_account.first_name,
                'is_admin': auth_account.is_admin,
                'created_at': auth_account.created_at.isoformat() if auth_account.created_at else None,
            },
            'profile': profile_data
        }
        
        logger.info(f"[Profile] Profil zwrócony pomyślnie: {auth_account.username}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[Profile] Błąd: {str(e)}")
        return Response({
            'detail': 'Błąd serwera podczas pobierania profilu',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# AKTUALIZACJA PROFILU
# ============================================================================
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Aktualizacja profilu użytkownika"""
    try:
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        
        if not user_id:
            return Response({
                'detail': 'Nieprawidłowy token',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"[UpdateProfile] Aktualizacja profilu dla user_id: {user_id}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
            user_profile = auth_account.userprofile
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'Użytkownik nie istnieje',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            # Utwórz profil jeśli nie istnieje
            user_profile = UserProfile.objects.create(auth_account=auth_account)
            logger.info(f"[UpdateProfile] Utworzono nowy profil dla: {auth_account.username}")
        
        serializer = UserProfileUpdateSerializer(
            user_profile, 
            data=request.data, 
            partial=(request.method == 'PATCH')
        )
        
        if serializer.is_valid():
            serializer.save()
            
            response_data = {
                'message': 'Profil zaktualizowany pomyślnie',
                'profile': UserProfileSerializer(user_profile).data
            }
            
            logger.info(f"[UpdateProfile] Profil zaktualizowany: {auth_account.username}")
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            logger.warning(f"[UpdateProfile] Błędy walidacji: {serializer.errors}")
            return Response({
                'detail': 'Błędy walidacji',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"[UpdateProfile] Błąd: {str(e)}")
        return Response({
            'detail': 'Błąd serwera podczas aktualizacji profilu',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# USTAWIENIE METODY REKOMENDACJI
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_recommendation_method(request):
    """Ustawienie metody rekomendacji dla użytkownika"""
    try:
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        
        if not user_id:
            return Response({
                'detail': 'Nieprawidłowy token',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        method = request.data.get('method')
        if method not in ['ai', 'collaborative', 'content_based', 'hybrid']:
            return Response({
                'detail': 'Nieprawidłowa metoda rekomendacji',
                'code': 'invalid_method'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
            user_profile = auth_account.userprofile
            user_profile.recommendation_method = method
            user_profile.save()
            
            logger.info(f"[SetRecommendationMethod] Ustawiono metodę {method} dla {auth_account.username}")
            
            return Response({
                'message': 'Metoda rekomendacji ustawiona pomyślnie',
                'method': method
            }, status=status.HTTP_200_OK)
            
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'Użytkownik nie istnieje',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({
                'detail': 'Profil użytkownika nie istnieje',
                'code': 'profile_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"[SetRecommendationMethod] Błąd: {str(e)}")
        return Response({
            'detail': 'Błąd serwera podczas ustawiania metody rekomendacji',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# DEBUG ENDPOINT
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_auth(request):
    """Debug endpoint dla autoryzacji"""
    try:
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        username = getattr(request.auth, 'payload', {}).get('username')
        
        debug_info = {
            'message': 'Debug informacje o autoryzacji',
            'token_payload': {
                'user_id': user_id,
                'username': username,
                'exp': getattr(request.auth, 'payload', {}).get('exp'),
                'token_type': getattr(request.auth, 'payload', {}).get('token_type')
            },
            'request_info': {
                'method': request.method,
                'path': request.path,
                'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown')
            }
        }
        
        if user_id:
            try:
                auth_account = AuthAccount.objects.get(id=user_id)
                debug_info['user_info'] = {
                    'id': auth_account.id,
                    'username': auth_account.username,
                    'email': auth_account.email,
                    'is_admin': auth_account.is_admin,
                    'created_at': auth_account.created_at.isoformat() if auth_account.created_at else None
                }
                
                try:
                    user_profile = auth_account.userprofile
                    debug_info['profile_info'] = UserProfileSerializer(user_profile).data
                except UserProfile.DoesNotExist:
                    debug_info['profile_info'] = 'Brak profilu'
                    
            except AuthAccount.DoesNotExist:
                debug_info['user_info'] = 'Użytkownik nie istnieje'
        
        return Response(debug_info, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'detail': 'Błąd debug endpoint',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def check_email(request):
    """
    Zwraca {"available": true/false}
    Sprawdza istnienie e-maila case-insensitive.
    """
    email = (request.GET.get('email') or '').strip()
    if not email:
        return Response({'available': False}, status=status.HTTP_400_BAD_REQUEST)

    exists = AuthAccount.objects.filter(email__iexact=email).exists()
    return Response({'available': not exists}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    """
    Zwraca {"available": true/false}
    Sprawdza istnienie nazwy użytkownika case-insensitive.
    """
    username = (request.GET.get('username') or '').strip()
    if not username:
        return Response({'available': False}, status=status.HTTP_400_BAD_REQUEST)

    exists = AuthAccount.objects.filter(username__iexact=username).exists()
    return Response({'available': not exists}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    POST /api/auth/forgot-password/
    Resetowanie hasła - wyśle email z nowym hasłem (lub resetuje na domyślne)
    Body: {"email": "user@example.com"}
    """
    try:
        email = (request.data.get('email') or '').strip().lower()
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email jest wymagany'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            account = AuthAccount.objects.get(email__iexact=email)
        except AuthAccount.DoesNotExist:
            # Dla bezpieczeństwa nie ujawniamy, czy email istnieje
            return Response({
                'success': True,
                'message': 'Jeśli podany email istnieje w systemie, wysłaliśmy link do resetowania hasła.'
            }, status=status.HTTP_200_OK)
        
        # Resetuj hasło na domyślne (w przyszłości można wysłać email)
        account.set_password('password123')
        account.save()
        
        logger.info(f"[ForgotPassword] Hasło zresetowane dla użytkownika: {account.username}")
        
        return Response({
            'success': True,
            'message': 'Hasło zostało zresetowane. Sprawdź swoją skrzynkę pocztową.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        logger.error(f"[ForgotPassword] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            'success': False,
            'error': 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie później.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# HARMONOGRAM I POWIADOMIENIA
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_schedule(request):
    """Zapisz harmonogram treningów użytkownika w bazie danych"""
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'success': False,
                'message': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        schedule = request.data.get('schedule', [])
        notifications_enabled = request.data.get('notifications_enabled', True)
        
        # Zapisz harmonogram w bazie danych (w tabeli user_active_plans)
        from django.db import connection
        import json
        
        with connection.cursor() as cursor:
            # Sprawdź czy użytkownik ma aktywny plan
            cursor.execute("""
                SELECT id FROM user_active_plans 
                WHERE auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            
            if row:
                # Zaktualizuj istniejący rekord
                cursor.execute("""
                    UPDATE user_active_plans
                    SET training_schedule = %s::jsonb,
                        notifications_enabled = %s
                    WHERE auth_account_id = %s
                """, [json.dumps(schedule), notifications_enabled, user_id])
                logger.info(f"[Schedule] User {user_id} updated schedule: {schedule}")
            else:
                logger.warning(f"[Schedule] User {user_id} has no active plan - schedule not saved")
                return Response({
                    'success': False,
                    'message': 'Brak aktywnego planu - najpierw aktywuj plan'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Harmonogram został zapisany',
            'schedule': schedule,
            'notifications_enabled': notifications_enabled
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[Schedule] Error saving schedule: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'success': False,
            'message': 'Nie udało się zapisać harmonogramu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_schedule(request):
    """Pobierz harmonogram użytkownika z bazy danych"""
    try:
        user_id = None
        if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
            user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'success': False,
                'message': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        from django.db import connection
        import json
        
        with connection.cursor() as cursor:
            # Pobierz harmonogram z bazy danych
            cursor.execute("""
                SELECT training_schedule, notifications_enabled 
                FROM user_active_plans 
                WHERE auth_account_id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            
            if row:
                # Deserializuj JSONB do Python list
                schedule_jsonb = row[0]
                schedule = json.loads(schedule_jsonb) if isinstance(schedule_jsonb, str) else (schedule_jsonb or [])
                notifications_enabled = row[1] if row[1] is not None else True
                
                logger.info(f"[Schedule] User {user_id} loaded schedule: {schedule}")
            else:
                # Brak aktywnego planu - zwróć pusty harmonogram
                schedule = []
                notifications_enabled = True
                logger.info(f"[Schedule] User {user_id} has no active plan")
        
        return Response({
            'success': True,
            'schedule': schedule,
            'notifications_enabled': notifications_enabled
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[Schedule] Error getting schedule: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'success': False,
            'message': 'Nie udało się pobrać harmonogramu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)