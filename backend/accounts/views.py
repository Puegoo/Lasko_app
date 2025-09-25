# backend/accounts/views.py - KOMPLETNIE NAPRAWIONY - ZASTĄP CAŁY PLIK
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer  # ✅ DODANO
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

# ============================================================================
# REJESTRACJA
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        logger.info(f"🔥 [Register] Dane: {request.data}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            result = serializer.save()
            auth_account = result['auth_account']
            user_profile = result['user_profile']
            
            logger.info(f"✅ [Register] Utworzony: {auth_account.username}")
            
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            response_data = {
                'message': 'Rejestracja zakończona sukcesem',
                'user': {
                    'id': auth_account.id,
                    'username': auth_account.username,
                    'email': auth_account.email,
                    'first_name': auth_account.first_name,
                    'is_admin': auth_account.is_admin,
                },
                'profile': UserProfileSerializer(user_profile).data if user_profile else None,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        logger.error(f"❌ [Register] Błędy: {serializer.errors}")
        return Response({
            'message': 'Błędy walidacji',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"❌ [Register] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas rejestracji',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# LOGOWANIE
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        logger.info(f"🔑 [Login] Próba: {request.data.get('login')}")
        
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            login_value = serializer.validated_data['login']
            password = serializer.validated_data['password']
            
            # Znajdź użytkownika
            auth_account = None
            try:
                if '@' in login_value:
                    auth_account = AuthAccount.objects.get(email=login_value)
                else:
                    auth_account = AuthAccount.objects.get(username=login_value)
                logger.info(f"🔍 [Login] Znaleziony: {auth_account.username}")
            except AuthAccount.DoesNotExist:
                logger.warning(f"❌ [Login] Nie znaleziono: {login_value}")
                return Response({
                    'message': 'Nieprawidłowy login lub hasło'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Sprawdź hasło - ✅ UŻYWAMY POPRAWNEGO POLA 'password'
            if not check_password(password, auth_account.password):
                logger.warning(f"❌ [Login] Złe hasło: {auth_account.username}")
                return Response({
                    'message': 'Nieprawidłowy login lub hasło'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Pobierz profil
            profile_data = None
            try:
                user_profile = auth_account.userprofile
                profile_data = UserProfileSerializer(user_profile).data
            except UserProfile.DoesNotExist:
                logger.warning(f"⚠️ [Login] Brak profilu: {auth_account.username}")
            
            # Tokeny
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            response_data = {
                'message': 'Logowanie zakończone sukcesem',
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
            
            logger.info(f"✅ [Login] Sukces: {auth_account.username}")
            return Response(response_data, status=status.HTTP_200_OK)
        
        logger.error(f"❌ [Login] Walidacja: {serializer.errors}")
        return Response({
            'message': 'Nieprawidłowe dane logowania',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"❌ [Login] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas logowania',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# REFRESH TOKEN - ✅ NAPRAWIONE
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    try:
        logger.info("🔄 [RefreshToken] Próba odświeżenia")
        
        serializer = TokenRefreshSerializer(data=request.data)
        
        if serializer.is_valid():
            response_data = {
                'access': serializer.validated_data['access']
            }
            
            logger.info("✅ [RefreshToken] Sukces")
            return Response(response_data, status=status.HTTP_200_OK)
        
        logger.error(f"❌ [RefreshToken] Błędy: {serializer.errors}")
        return Response({
            'message': 'Nieprawidłowy refresh token',
            'errors': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"❌ [RefreshToken] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas odświeżania tokenu',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# PROFIL UŻYTKOWNIKA
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            logger.error("❌ [Profile] Brak user_id w tokenie")
            return Response({
                'message': 'Nieprawidłowy token - brak user_id'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"👤 [Profile] Pobieranie dla user_id: {user_id}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            logger.error(f"❌ [Profile] Nie znaleziono user_id: {user_id}")
            return Response({
                'message': 'Użytkownik nie istnieje'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Profil
        profile_data = None
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
            logger.warning(f"⚠️ [Profile] Brak profilu: {auth_account.username}")
        
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
        
        logger.info(f"✅ [Profile] Pobrano: {auth_account.username}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"❌ [Profile] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas pobierania profilu',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# AKTUALIZACJA PROFILU
# ============================================================================
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'message': 'Nieprawidłowy token - brak user_id'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"🔄 [UpdateProfile] user_id: {user_id}, dane: {request.data}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'message': 'Użytkownik nie istnieje'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Aktualizuj first_name jeśli podane
        if 'first_name' in request.data:
            auth_account.first_name = request.data['first_name']
            auth_account.save()
        
        # Pobierz lub utwórz profil
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account,
            defaults={
                'goal': 'zdrowie',
                'level': 'początkujący',
                'training_days_per_week': 3,
                'equipment_preference': 'siłownia'
            }
        )
        
        if created:
            logger.info(f"✅ [UpdateProfile] Utworzono profil: {auth_account.username}")
        
        # Aktualizuj pola profilu
        profile_fields = [
            'goal', 'level', 'training_days_per_week', 'equipment_preference',
            'avoid_exercises', 'focus_areas', 'recommendation_method'
        ]
        
        updated_fields = []
        for field in profile_fields:
            if field in request.data:
                setattr(user_profile, field, request.data[field])
                updated_fields.append(field)
        
        if updated_fields:
            user_profile.save()
        
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
            'updated_fields': updated_fields
        }
        
        logger.info(f"✅ [UpdateProfile] Zaktualizowano: {updated_fields}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"❌ [UpdateProfile] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas aktualizacji profilu',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# WYLOGOWANIE
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if user_id:
            try:
                auth_account = AuthAccount.objects.get(id=user_id)
                logger.info(f"✅ [Logout] Wylogowany: {auth_account.username}")
            except AuthAccount.DoesNotExist:
                pass
        
        return Response({
            'message': 'Wylogowano pomyślnie'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"❌ [Logout] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas wylogowania',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# METODA REKOMENDACJI
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_recommendation_method(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'message': 'Nieprawidłowy token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        method = request.data.get('method')
        
        if method not in ['product', 'user', 'hybrid']:
            return Response({
                'message': 'Nieprawidłowa metoda rekomendacji',
                'allowed_methods': ['product', 'user', 'hybrid']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'message': 'Użytkownik nie istnieje'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account,
            defaults={
                'goal': 'zdrowie',
                'level': 'początkujący',
                'training_days_per_week': 3,
                'equipment_preference': 'siłownia',
                'recommendation_method': method
            }
        )
        
        user_profile.recommendation_method = method
        user_profile.save()
        
        logger.info(f"✅ [SetRecommendationMethod] {method} dla {auth_account.username}")
        
        return Response({
            'message': 'Metoda rekomendacji ustawiona pomyślnie',
            'method': method
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"❌ [SetRecommendationMethod] Exception: {str(e)}")
        return Response({
            'message': 'Błąd serwera podczas ustawiania metody rekomendacji',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# DEBUG ENDPOINT
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_auth(request):
    try:
        user_id = request.auth.payload.get('user_id')
        username = request.auth.payload.get('username')
        
        debug_info = {
            'message': 'Debug informacje o autoryzacji',
            'token_payload': {
                'user_id': user_id,
                'username': username,
                'exp': request.auth.payload.get('exp'),
                'token_type': request.auth.payload.get('token_type')
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
                    'created_at': auth_account.created_at.isoformat()
                }
                
                try:
                    user_profile = auth_account.userprofile
                    debug_info['profile_info'] = {
                        'goal': user_profile.goal,
                        'level': user_profile.level,
                        'training_days_per_week': user_profile.training_days_per_week,
                        'equipment_preference': user_profile.equipment_preference,
                        'recommendation_method': user_profile.recommendation_method
                    }
                except UserProfile.DoesNotExist:
                    debug_info['profile_info'] = 'Brak profilu'
                    
            except AuthAccount.DoesNotExist:
                debug_info['user_info'] = 'Użytkownik nie istnieje'
        
        return Response(debug_info, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'message': 'Błąd debug endpoint',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)