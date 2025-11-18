import logging
import json
from django.utils.deprecation import MiddlewareMixin


aud_logger = logging.getLogger('admin.audit')


class AdminAuditLogMiddleware(MiddlewareMixin):
    """Loguje żądania i odpowiedzi związane z panelem admina."""

    def process_view(self, request, view_func, view_args, view_kwargs):
        if not request.path.startswith('/api/admin/'):
            return None
        user = getattr(request, 'user', None)
        payload = getattr(request, 'auth', None)
        if payload is None and hasattr(request, 'successful_authenticator'):
            try:
                payload = request.successful_authenticator.get_validated_token(request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1])
            except Exception:
                payload = None

        user_id = None
        if payload and isinstance(payload, dict):
            user_id = payload.get('user_id')
        elif user and user.is_authenticated:
            user_id = getattr(user, 'id', None)
        metadata = {
            'path': request.path,
            'method': request.method,
            'user_id': user_id,
            'view': getattr(view_func, '__name__', 'unknown'),
            'query_params': request.GET.dict() if request.GET else {},
        }
        try:
            if request.body:
                body = request.body.decode('utf-8')
                metadata['body'] = body[:2048]
        except Exception:
            metadata['body'] = '<non-decodable>'
        request._admin_audit_metadata = metadata
        return None

    def process_response(self, request, response):
        metadata = getattr(request, '_admin_audit_metadata', None)
        if metadata:
            metadata = metadata.copy()
            metadata.update({
                'status_code': response.status_code,
            })
            try:
                metadata['response_preview'] = json.dumps(getattr(response, 'data', None), default=str)[:2048]
            except Exception:
                metadata['response_preview'] = '<unserializable>'
            aud_logger.info(json.dumps(metadata, default=str))
        return response

