# backend/accounts/views.py - CORRECTED VIEWS
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
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
# REGISTRATION
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        logger.info(f"[Register] Registration attempt: {request.data.get('username')}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            result = serializer.save()
            auth_account = result['auth_account']
            user_profile = result['user_profile']
            
            logger.info(f"[Register] User created: {auth_account.username}")
            
            # Create JWT tokens
            refresh = RefreshToken()
            refresh['user_id'] = auth_account.id
            refresh['username'] = auth_account.username
            
            response_data = {
                'message': 'Registration successful',
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
        
        logger.error(f"[Register] Validation errors: {serializer.errors}")
        return Response({
            'message': 'Validation errors',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"[Register] Exception: {str(e)}")
        return Response({
            'message': 'Server error during registration',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# LOGIN - FIXED LOGIC
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        login_value = request.data.get('login', '').strip().lower()
        password = request.data.get('password', '')
        
        logger.info(f"[Login] Login attempt: {login_value}")
        
        if not login_value or not password:
            return Response({
                'detail': 'Login and password are required',
                'code': 'missing_credentials'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user account
        auth_account = None
        try:
            if '@' in login_value:
                auth_account = AuthAccount.objects.get(email=login_value)
            else:
                auth_account = AuthAccount.objects.get(username=login_value)
            logger.info(f"[Login] Found user: {auth_account.username}")
        except AuthAccount.DoesNotExist:
            logger.warning(f"[Login] User not found: {login_value}")
            return Response({
                'detail': 'User not found',
                'code': 'user_not_found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check password using model method
        if not auth_account.check_password(password):
            logger.warning(f"[Login] Invalid password for: {auth_account.username}")
            return Response({
                'detail': 'Invalid password',
                'code': 'invalid_password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get profile
        profile_data = None
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
            logger.warning(f"[Login] No profile for user: {auth_account.username}")
        
        # Create JWT tokens
        refresh = RefreshToken()
        refresh['user_id'] = auth_account.id
        refresh['username'] = auth_account.username
        
        response_data = {
            'message': 'Login successful',
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
        
        logger.info(f"[Login] Success: {auth_account.username}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[Login] Exception: {str(e)}")
        return Response({
            'detail': 'Server error during login',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# REFRESH TOKEN
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    try:
        logger.info("[RefreshToken] Token refresh attempt")
        
        serializer = TokenRefreshSerializer(data=request.data)
        
        if serializer.is_valid():
            response_data = {
                'access': serializer.validated_data['access']
            }
            
            logger.info("[RefreshToken] Success")
            return Response(response_data, status=status.HTTP_200_OK)
        
        logger.error(f"[RefreshToken] Errors: {serializer.errors}")
        return Response({
            'detail': 'Invalid refresh token',
            'code': 'invalid_token'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"[RefreshToken] Exception: {str(e)}")
        return Response({
            'detail': 'Server error during token refresh',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# USER PROFILE
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        # Get user_id from JWT token
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            logger.error("[Profile] No user_id in token")
            return Response({
                'detail': 'Invalid token - no user_id',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"[Profile] Fetching profile for user_id: {user_id}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            logger.error(f"[Profile] User not found: {user_id}")
            return Response({
                'detail': 'User does not exist',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get profile
        profile_data = None
        try:
            user_profile = auth_account.userprofile
            profile_data = UserProfileSerializer(user_profile).data
        except UserProfile.DoesNotExist:
            logger.warning(f"[Profile] No profile for user: {auth_account.username}")
        
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
        
        logger.info(f"[Profile] Success: {auth_account.username}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[Profile] Exception: {str(e)}")
        return Response({
            'detail': 'Server error fetching profile',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# UPDATE PROFILE
# ============================================================================
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'detail': 'Invalid token - no user_id',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"[UpdateProfile] user_id: {user_id}, data: {request.data}")
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'User does not exist',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update first_name if provided
        if 'first_name' in request.data:
            auth_account.first_name = request.data['first_name']
            auth_account.save()
        
        # Get or create profile
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
            logger.info(f"[UpdateProfile] Created profile: {auth_account.username}")
        
        # Update profile fields
        profile_fields = [
            'goal', 'level', 'training_days_per_week', 'equipment_preference',
            'avoid_exercises', 'focus_areas', 'recommendation_method',
            'preferred_session_duration', 'date_of_birth'
        ]
        
        updated_fields = []
        for field in profile_fields:
            if field in request.data:
                setattr(user_profile, field, request.data[field])
                updated_fields.append(field)
        
        if updated_fields:
            user_profile.save()
        
        response_data = {
            'message': 'Profile updated successfully',
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
        
        logger.info(f"[UpdateProfile] Updated fields: {updated_fields}")
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[UpdateProfile] Exception: {str(e)}")
        return Response({
            'detail': 'Server error updating profile',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# LOGOUT
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if user_id:
            try:
                auth_account = AuthAccount.objects.get(id=user_id)
                logger.info(f"[Logout] User logged out: {auth_account.username}")
            except AuthAccount.DoesNotExist:
                pass
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[Logout] Exception: {str(e)}")
        return Response({
            'detail': 'Server error during logout',
            'code': 'server_error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# RECOMMENDATION METHOD
# ============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_recommendation_method(request):
    try:
        user_id = request.auth.payload.get('user_id')
        
        if not user_id:
            return Response({
                'detail': 'Invalid token',
                'code': 'invalid_token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        method = request.data.get('method')
        
        if method not in ['product', 'user', 'hybrid']:
            return Response({
                'detail': 'Invalid recommendation method',
                'code': 'invalid_method',
                'allowed_methods': ['product', 'user', 'hybrid']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            auth_account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return Response({
                'detail': 'User does not exist',
                'code': 'user_not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user_profile, created = UserProfile.objects.get_or_create(
            auth_account=auth_account,
            defaults={
                'goal': 'zdrowie',
                'level': 'poczatkujacy',
                'training_days_per_week': 3,
                'equipment_preference': 'silownia',
                'recommendation_method': method
            }
        )
        
        user_profile.recommendation_method = method
        user_profile.save()
        
        logger.info(f"[SetRecommendationMethod] {method} for {auth_account.username}")
        
        return Response({
            'message': 'Recommendation method set successfully',
            'method': method
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[SetRecommendationMethod] Exception: {str(e)}")
        return Response({
            'detail': 'Server error setting recommendation method',
            'code': 'server_error'
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
            'message': 'Debug authorization info',
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
                    debug_info['profile_info'] = UserProfileSerializer(user_profile).data
                except UserProfile.DoesNotExist:
                    debug_info['profile_info'] = 'No profile'
                    
            except AuthAccount.DoesNotExist:
                debug_info['user_info'] = 'User does not exist'
        
        return Response(debug_info, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'detail': 'Debug endpoint error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)