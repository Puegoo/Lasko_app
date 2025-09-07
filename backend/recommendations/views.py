# backend/recommendations/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from accounts.models import UserProfile
from .engine import fetch_user_profile, content_based, collaborative, hybrid, plan_details, explain_match

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_recommendations(request):
    """
    POST /api/recommendations/
    Body: {"mode": "product|user|hybrid", "top": 10}
    """
    # UWAGA: w projekcie używasz request.auth.payload (SimpleJWT) – trzymamy to samo
    user_id = getattr(getattr(request, 'auth', None), 'payload', {}).get('user_id')
    if not user_id:
        return Response({"message": "Nieprawidłowy token"}, status=status.HTTP_401_UNAUTHORIZED)

    mode = (request.data.get('mode') or '').lower()
    if mode not in ('product', 'user', 'hybrid'):
        # domyślnie z profilu lub 'hybrid'
        try:
            prof = UserProfile.objects.get(auth_account_id=user_id)
            mode = (prof.recommendation_method or 'hybrid').lower()
        except UserProfile.DoesNotExist:
            mode = 'hybrid'

    profile = fetch_user_profile(user_id)
    if not profile:
        return Response({"message": "Brak profilu użytkownika (ankieta)."}, status=status.HTTP_400_BAD_REQUEST)

    if mode == 'product':
        raw = content_based(profile)
    elif mode == 'user':
        raw = collaborative(user_id)
    else:
        raw = hybrid(user_id, profile)

    top = int(request.data.get('top') or 10)
    plan_ids = [r['plan_id'] for r in raw[:top]]
    details = plan_details(plan_ids)

    enriched = []
    for r in raw[:top]:
        pid = r['plan_id']
        det = details.get(pid)
        if not det:
            continue
        meta = r.get('meta', {})
        reasons = explain_match(profile, det, meta.get('total_users'), meta.get('avg_rating'))
        enriched.append({
            "planId": pid,
            "name": det['name'],
            "description": det['description'],
            "goalType": det['goal_type'],
            "difficultyLevel": det['difficulty_level'],
            "trainingDaysPerWeek": det['training_days_per_week'],
            "equipmentRequired": det['equipment_required'],
            "score": round(float(r['score']), 2),
            "matchReasons": reasons
        })

    return Response({
        "success": True,
        "mode": mode,
        "recommendations": enriched,
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_plan(request):
    """
    POST /api/recommendations/activate/
    Body: {"planId": 123}
    """
    user_id = getattr(getattr(request, 'auth', None), 'payload', {}).get('user_id')
    if not user_id:
        return Response({"message": "Nieprawidłowy token"}, status=status.HTTP_401_UNAUTHORIZED)

    plan_id = request.data.get('planId')
    if not plan_id:
        return Response({"message": "Wymagane: planId"}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cur:
        cur.execute("SELECT id FROM training_plans WHERE id=%s", [plan_id])
        if not cur.fetchone():
            return Response({"message": "Plan nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

        cur.execute("""
            UPDATE user_active_plans
               SET is_completed = TRUE, end_date = CURRENT_DATE
             WHERE auth_account_id=%s AND is_completed=FALSE
        """, [user_id])

        cur.execute("""
            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
            VALUES (%s, %s, CURRENT_DATE)
        """, [user_id, plan_id])

    return Response({"success": True, "message": "Plan aktywowany", "planId": plan_id}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_custom_plan(request):
    """
    POST /api/recommendations/create-custom-plan/
    Body: {"name": "...", "goal": "...", "trainingDays": 4, "equipment": "..." , "notes": "..."}
    """
    user_id = getattr(getattr(request, 'auth', None), 'payload', {}).get('user_id')
    if not user_id:
        return Response({"message": "Nieprawidłowy token"}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data or {}
    required = ('name', 'goal', 'trainingDays', 'equipment')
    if any(not data.get(k) for k in required):
        return Response({"message": f"Wymagane pola: {', '.join(required)}"}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO training_plans
              (name, description, auth_account_id, goal_type, difficulty_level,
               training_days_per_week, equipment_required, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id
        """, [
            data['name'], data.get('notes', ''), user_id, data['goal'],
            'niestandardowy', data['trainingDays'], data['equipment']
        ])
        new_plan_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO user_active_plans (auth_account_id, plan_id, start_date)
            VALUES (%s, %s, CURRENT_DATE)
        """, [user_id, new_plan_id])

    return Response({"success": True, "planId": new_plan_id}, status=status.HTTP_201_CREATED)
