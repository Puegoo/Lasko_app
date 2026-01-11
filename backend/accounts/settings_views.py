"""
Settings Views - Ustawienia Użytkownika
Upload zdjęcia profilowego, edycja profilu, zmiana hasła
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
import logging
import traceback
import base64
import os
import uuid
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# Ścieżka do zapisu zdjęć profilowych
MEDIA_ROOT = Path(__file__).resolve().parent.parent / 'media' / 'profile_pictures'
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


# ============================================================================
# GET SETTINGS - Pobierz ustawienia użytkownika
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_settings(request):
    """
    GET /api/settings/
    Pobierz ustawienia użytkownika
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    aa.id,
                    aa.username,
                    aa.email,
                    aa.first_name,
                    aa.date_joined,
                    up.date_of_birth,
                    up.goal,
                    up.level,
                    up.training_days_per_week,
                    up.equipment_preference,
                    up.preferred_session_duration,
                    up.profile_picture,
                    up.bio,
                    up.avoid_exercises,
                    up.focus_areas,
                    up.recommendation_method
                FROM auth_accounts aa
                LEFT JOIN user_profiles up ON aa.id = up.auth_account_id
                WHERE aa.id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            settings = {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "first_name": row[3],
                "date_joined": row[4].isoformat() if row[4] else None,
                "date_of_birth": row[5].isoformat() if row[5] else None,
                "goal": row[6],
                "level": row[7],
                "training_days_per_week": row[8],
                "equipment_preference": row[9],
                "preferred_session_duration": row[10],
                "profile_picture": row[11],
                "bio": row[12],
                "avoid_exercises": row[13] or [],
                "focus_areas": row[14] or [],
                "recommendation_method": row[15]
            }
            
            logger.info(f"[GetUserSettings] Retrieved settings for user {user_id}")
            
            return Response({
                "success": True,
                "settings": settings
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[GetUserSettings] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error fetching user settings",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# UPDATE PROFILE - Aktualizuj profil
# ============================================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    PUT/PATCH /api/settings/profile/
    Aktualizuj profil użytkownika
    Body: {
        "first_name": string,
        "bio": string,
        "date_of_birth": "YYYY-MM-DD",
        "goal": string,
        "level": string,
        "training_days_per_week": int,
        "equipment_preference": string,
        "preferred_session_duration": int
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        
        # Update auth_accounts
        if 'first_name' in data:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE auth_accounts
                    SET first_name = %s
                    WHERE id = %s
                """, [data['first_name'], user_id])
        
        # Update user_profiles
        profile_fields = []
        profile_values = []
        
        if 'bio' in data:
            profile_fields.append("bio = %s")
            profile_values.append(data['bio'])
        
        if 'date_of_birth' in data:
            profile_fields.append("date_of_birth = %s")
            profile_values.append(data['date_of_birth'])
        
        if 'goal' in data:
            profile_fields.append("goal = %s")
            profile_values.append(data['goal'])
        
        if 'level' in data:
            profile_fields.append("level = %s")
            profile_values.append(data['level'])
        
        if 'training_days_per_week' in data:
            profile_fields.append("training_days_per_week = %s")
            profile_values.append(data['training_days_per_week'])
        
        if 'equipment_preference' in data:
            profile_fields.append("equipment_preference = %s")
            profile_values.append(data['equipment_preference'])
        
        if 'preferred_session_duration' in data:
            profile_fields.append("preferred_session_duration = %s")
            profile_values.append(data['preferred_session_duration'])
        
        # Dane biometryczne
        if 'weight_kg' in data:
            profile_fields.append("weight_kg = %s")
            profile_values.append(data['weight_kg'])
        
        if 'height_cm' in data:
            profile_fields.append("height_cm = %s")
            profile_values.append(data['height_cm'])
        
        # Dane zdrowotne
        if 'injuries' in data:
            profile_fields.append("injuries = %s")
            profile_values.append(json.dumps(data['injuries']) if isinstance(data['injuries'], list) else data['injuries'])
        
        if 'health_conditions' in data:
            profile_fields.append("health_conditions = %s")
            profile_values.append(json.dumps(data['health_conditions']) if isinstance(data['health_conditions'], list) else data['health_conditions'])
        
        if 'health_notes' in data:
            profile_fields.append("health_notes = %s")
            profile_values.append(data['health_notes'])
        
        if profile_fields:
            profile_values.append(user_id)
            with connection.cursor() as cursor:
                cursor.execute(f"""
                    UPDATE user_profiles
                    SET {', '.join(profile_fields)}
                    WHERE auth_account_id = %s
                """, profile_values)
        
        logger.info(f"[UpdateProfile] Profile updated for user {user_id}")
        
        return Response({
            "success": True,
            "message": "Profile updated successfully"
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[UpdateProfile] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error updating profile",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# UPLOAD PROFILE PICTURE - Upload zdjęcia profilowego
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """
    POST /api/settings/profile-picture/
    Upload zdjęcia profilowego (Base64)
    Body: {
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        image_data = request.data.get('image')
        if not image_data:
            return Response({
                "error": "No image provided"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse Base64 image
        try:
            # Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
            if ',' in image_data:
                header, encoded = image_data.split(',', 1)
                # Extract extension from header
                if 'jpeg' in header or 'jpg' in header:
                    ext = 'jpg'
                elif 'png' in header:
                    ext = 'png'
                elif 'gif' in header:
                    ext = 'gif'
                elif 'webp' in header:
                    ext = 'webp'
                else:
                    ext = 'jpg'  # default
            else:
                encoded = image_data
                ext = 'jpg'
            
            # Decode Base64
            image_bytes = base64.b64decode(encoded)
            
            # Generate unique filename
            filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
            filepath = MEDIA_ROOT / filename
            
            # Save file
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # Update database with relative path
            relative_path = f"/media/profile_pictures/{filename}"
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE user_profiles
                    SET profile_picture = %s
                    WHERE auth_account_id = %s
                """, [relative_path, user_id])
            
            logger.info(f"[UploadProfilePicture] Uploaded picture for user {user_id}: {filename}")
            
            return Response({
                "success": True,
                "message": "Profile picture uploaded successfully",
                "profile_picture": relative_path
            }, status=status.HTTP_200_OK)
            
        except Exception as decode_error:
            logger.error(f"[UploadProfilePicture] Error decoding image: {decode_error}")
            return Response({
                "error": "Invalid image format"
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"[UploadProfilePicture] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error uploading profile picture",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# CHANGE PASSWORD - Zmiana hasła
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/settings/change-password/
    Zmiana hasła
    Body: {
        "current_password": string,
        "new_password": string
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                "error": "Both current and new password are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                "error": "New password must be at least 8 characters long"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT password
                FROM auth_accounts
                WHERE id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            stored_password = row[0]
            
            # Check current password
            if not check_password(current_password, stored_password):
                return Response({
                    "error": "Current password is incorrect"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update password
            hashed_password = make_password(new_password)
            cursor.execute("""
                UPDATE auth_accounts
                SET password = %s
                WHERE id = %s
            """, [hashed_password, user_id])
        
        logger.info(f"[ChangePassword] Password changed for user {user_id}")
        
        return Response({
            "success": True,
            "message": "Password changed successfully"
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[ChangePassword] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error changing password",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# DELETE ACCOUNT - Usunięcie konta
# ============================================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    DELETE /api/settings/account/
    Usuń konto użytkownika
    Body: {
        "password": string,
        "confirmation": "DELETE"
    }
    """
    try:
        user_id = request.auth.payload.get('user_id')
        if not user_id:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        password = request.data.get('password')
        confirmation = request.data.get('confirmation')
        
        if not password or confirmation != 'DELETE':
            return Response({
                "error": "Password and confirmation required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify password
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT password
                FROM auth_accounts
                WHERE id = %s
            """, [user_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            stored_password = row[0]
            
            if not check_password(password, stored_password):
                return Response({
                    "error": "Password is incorrect"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Delete user (CASCADE will handle related records)
            cursor.execute("""
                DELETE FROM auth_accounts
                WHERE id = %s
            """, [user_id])
        
        logger.info(f"[DeleteAccount] Account deleted for user {user_id}")
        
        return Response({
            "success": True,
            "message": "Account deleted successfully"
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[DeleteAccount] Exception: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "Server error deleting account",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

