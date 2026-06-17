from .models import AuditLog


def log_action(user, action, description='', resource_type='', resource_id=None, request=None):
    """Helper to create audit log entries."""
    kwargs = {
        'user': user,
        'action': action,
        'description': description,
        'resource_type': resource_type,
        'resource_id': resource_id,
    }
    if request:
        kwargs['ip_address'] = get_client_ip(request)
        kwargs['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
    AuditLog.objects.create(**kwargs)


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
