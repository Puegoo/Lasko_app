# backend/accounts/views.py - NAPRAWIONA WERSJA
import logging
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

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
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Logowanie użytkownika - naprawiona obsługa błędów"""
    try:
        logger.info(f"[Login] Próba logowania")
        
        # Walidacja danych wejściowych
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"[Login] Błędy walidacji: {serializer.errors}")
            return Response({
                'detail': 'Nieprawidłowe dane logowania',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        login_value = validated_data['login']
        password = validated_data['password']
        
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
            auth_account.last_login = timezone.now() if 'timezone' in globals() else None
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
# ODŚWIEŻANIE TOKENU
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
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Aktualizacja profilu użytkownika"""
    try:
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        
        if not user_id:
            return Response({
                'detail': 'Nieprawidłowy token - brak user_id',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"[UpdateProfile] user_id: {user_id}, data keys: {list(request.data.keys())}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'Użytkownik nie istnieje',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Aktualizuj first_name na koncie jeśli podane
        if 'first_name' in request.data:
            auth_account.first_name = request.data['first_name']
            auth_account.save()
        
        # Pobierz lub utwórz profil
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account,
            defaults={
                'goal': 'zdrowie',
                'level': 'poczatkujacy',
                'training_days_per_week': 3,
                'equipment_preference': 'silownia',
                'recommendation_method': 'hybrid'
            }
        )
        
        if created:
            logger.info(f"[UpdateProfile] Utworzono profil: {auth_account.username}")
        
        # Aktualizuj profil przez serializer
        profile_serializer = UserProfileUpdateSerializer(
            user_profile, 
            data=request.data, 
            partial=True
        )
        
        if profile_serializer.is_valid():
            profile_serializer.save()
            
            response_data = {
                'message': 'Profil zaktualizowany pomyślnie',
                'user': {
                    'id': auth_account.id,
                    'username': auth_account.username,
                    'email': auth_account.email,
                    'first_name': auth_account.first_name,
                    'is_admin': auth_account.is_admin,
                },
                'profile': UserProfileSerializer(user_profile).data,
            }
            
            logger.info(f"[UpdateProfile] Profil zaktualizowany: {auth_account.username}")
            return Response(response_data, status=status.HTTP_200_OK)
        
        else:
            logger.warning(f"[UpdateProfile] Błędy walidacji: {profile_serializer.errors}")
            return Response({
                'message': 'Błędy walidacji profilu',
                'errors': profile_serializer.errors
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
    """Ustawienie metody rekomendacji"""
    try:
        user_id = getattr(request.auth, 'payload', {}).get('user_id')
        method = request.data.get('method')
        
        if not user_id:
            return Response({
                'detail': 'Nieprawidłowy token - brak user_id',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not method or method not in dict(UserProfile.RECO_CHOICES):
            return Response({
                'detail': 'Nieprawidłowa metoda rekomendacji',
                'code': 'invalid_method'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'Użytkownik nie istnieje',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Aktualizuj metodę rekomendacji
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account,
            defaults={'recommendation_method': method}
        )
        
        if not created:
            user_profile.recommendation_method = method
            user_profile.save()
        
        logger.info(f"[SetRecommendationMethod] Ustawiono {method} dla {auth_account.username}")
        
        return Response({
            'message': 'Metoda rekomendacji ustawiona pomyślnie',
            'method': method
        }, status=status.HTTP_200_OK)
        
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


# ============================================================================
# IMPORTY NA KOŃCU (dla uniknięcia circular imports)
# ============================================================================
from django.utils import timezone