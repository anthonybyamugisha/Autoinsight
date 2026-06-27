"""Security monitoring alerts triggered from audit events."""

from datetime import timedelta

from django.utils import timezone

from .models import Alert, AuditLog
from .utils import log_action


def create_security_alert(title, message, severity='warning', user=None, dataset=None):
    Alert.objects.create(
        alert_type='security',
        title=title,
        message=message,
        severity=severity,
        user=user,
        dataset=dataset,
    )


def on_access_denied(user, dataset, request):
    """Alert after repeated denied access to the same dataset."""
    since = timezone.now() - timedelta(minutes=15)
    count = AuditLog.objects.filter(
        user=user,
        action='access_denied',
        resource_type='dataset',
        resource_id=dataset.id,
        created_at__gte=since,
    ).count()
    if count >= 3:
        create_security_alert(
            title=f'Repeated Access Denied: {dataset.name}',
            message=(
                f'User {user.email} was denied access to dataset "{dataset.name}" '
                f'{count} times in 15 minutes.'
            ),
            severity='warning',
            user=user,
            dataset=dataset,
        )


def on_failed_login(email, request, attempt_count):
    """Alert security team on account lockout."""
    if attempt_count < 5:
        return
    create_security_alert(
        title=f'Account Lockout: {email}',
        message=f'Multiple failed login attempts for {email}. Account temporarily locked.',
        severity='critical',
    )
    if request and request.user.is_authenticated:
        log_action(
            request.user,
            'login_failed',
            f'Account lockout triggered for {email}',
            request=request,
        )


def on_restricted_upload(user, dataset):
    create_security_alert(
        title=f'Restricted Data Uploaded: {dataset.name}',
        message=(
            f'Restricted-classification dataset uploaded by {user.email}. '
            f'Sensitive columns: {", ".join(dataset.sensitive_columns) or "none flagged"}.'
        ),
        severity='warning',
        user=user,
        dataset=dataset,
    )


def check_bulk_export(user, dataset):
    """Alert when a user exports more than threshold in one hour."""
    since = timezone.now() - timedelta(hours=1)
    count = AuditLog.objects.filter(
        user=user,
        action='export',
        created_at__gte=since,
    ).count()
    if count >= 3:
        create_security_alert(
            title=f'Bulk Export Activity: {user.email}',
            message=(
                f'User {user.email} exported {count} reports within one hour. '
                f'Latest: {dataset.name}.'
            ),
            severity='warning',
            user=user,
            dataset=dataset,
        )
