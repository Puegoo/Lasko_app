# backend/accounts/views.py
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
        "goal": "masa_mięśniowa",
        "level": "początkujący",
        "training_days_per_week": 3,
        "equipment_preference": "siłownia"
    }
    """
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Utwórz użytkownika i profil
            result = serializer.save()
            auth_account = result['auth_account']
            user_profile = result['user_profile']
            
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
            
            logger.info(f"Nowy użytkownik zarejestrowany: {auth_account.username}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(
            {
                'message': 'Błędy walidacji',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"Błąd podczas rejestracji: {str(e)}")
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
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            auth_account = serializer.validated_data['auth_account']
            
            # Pobierz profil użytkownika
            try:
                user_profile = UserProfile.objects.get(auth_account=auth_account)
                profile_data = UserProfileSerializer(user_profile).data
            except UserProfile.DoesNotExist:
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
            
            logger.info(f"Użytkownik zalogowany: {auth_account.username}")
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(
            {
                'message': 'Nieprawidłowe dane logowania',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"Błąd podczas logowania: {str(e)}")
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
            user_profile = UserProfile.objects.get(auth_account=auth_account)
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
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
        logger.error(f"Błąd podczas pobierania profilu: {str(e)}")
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
        "level": "średnio_zaawansowany",
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
            
            return Response(
                {
                    'message': 'Profil zaktualizowany pomyślnie',
                    'profile': serializer.data
                }, 
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'message': 'Błędy walidacji',
                'errors': serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"Błąd podczas aktualizacji profilu: {str(e)}")
        return Response(
            {
                'message': 'Wystąpił błąd serwera podczas aktualizacji profilu',
                'error': str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )