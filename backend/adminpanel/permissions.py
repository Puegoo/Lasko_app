from rest_framework.permissions import BasePermission
from accounts.models import AuthAccount


class IsAdmin(BasePermission):
    """Pozwala tylko użytkownikom z flagą is_admin lub is_superuser."""

    message = 'Tylko administrator ma dostęp do panelu admina.'

    def has_permission(self, request, view):
        user_id = None
        payload = getattr(request, 'auth', None)
        if isinstance(payload, dict):
            user_id = payload.get('user_id') or payload.get('id') or payload.get('user')

        if not user_id and request.user and request.user.is_authenticated:
            user_id = request.user.id

        if not user_id:
            return False

        try:
            account = AuthAccount.objects.get(id=user_id)
        except AuthAccount.DoesNotExist:
            return False
        request.admin_account = account
        return bool(account.is_admin or account.is_superuser)

