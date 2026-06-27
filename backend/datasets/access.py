"""Dataset access control helpers for role- and classification-based permissions."""

from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied

from backend.audit.utils import log_action  # noqa: F401


def datasets_for_user(user):
    """Return datasets visible to the given user."""
    from .models import Dataset

    qs = Dataset.objects.select_related('uploaded_by')
    if user.role == 'manager':
        return qs
    if user.role == 'analyst':
        if user.department:
            return qs.filter(uploaded_by__department=user.department)
        return qs.filter(uploaded_by=user)
    return qs.filter(uploaded_by=user)


def can_access_dataset(user, dataset):
    if user.role == 'manager':
        return True
    if user.role == 'analyst':
        if user.department and dataset.uploaded_by.department == user.department:
            return True
        return dataset.uploaded_by_id == user.id
    return dataset.uploaded_by_id == user.id


def can_modify_dataset(user, dataset):
    if dataset.is_expired:
        return user.role == 'manager'
    if user.role == 'manager':
        return True
    return dataset.uploaded_by_id == user.id and user.role == 'analyst'


def can_export_dataset(user, dataset):
    if not can_access_dataset(user, dataset):
        return False
    if dataset.is_expired:
        return False
    classification = dataset.classification
    if classification == 'restricted':
        return user.role == 'manager' or (
            dataset.uploaded_by_id == user.id and user.role == 'analyst'
        )
    if classification == 'confidential':
        return user.role in ('manager', 'analyst') or dataset.uploaded_by_id == user.id
    return True


def can_preview_dataset(user, dataset):
    if not can_access_dataset(user, dataset):
        return False
    if dataset.is_expired and user.role != 'manager':
        return False
    return True


def _deny(user, dataset, request, permission, message):
    if request:
        log_action(
            user,
            'access_denied',
            f'Denied {permission} on dataset "{dataset.name}" (id={dataset.id})',
            'dataset',
            dataset.id,
            request,
        )
        from backend.audit.security import on_access_denied

        on_access_denied(user, dataset, request)
    raise PermissionDenied(message)


def get_accessible_dataset(user, pk, request=None, permission='view'):
    """
    Load a dataset and enforce access. permission: view | preview | export | modify
    """
    from .models import Dataset

    try:
        dataset = Dataset.objects.select_related('uploaded_by').get(pk=pk)
    except Dataset.DoesNotExist:
        raise NotFound('Dataset not found.')

    if dataset.is_expired and permission != 'modify' and user.role != 'manager':
        raise PermissionDenied('This dataset has expired and is no longer accessible.')

    if not can_access_dataset(user, dataset):
        _deny(user, dataset, request, permission, 'You do not have permission to access this dataset.')

    if permission == 'preview' and not can_preview_dataset(user, dataset):
        _deny(
            user,
            dataset,
            request,
            permission,
            'You do not have permission to preview this dataset.',
        )
    if permission == 'export' and not can_export_dataset(user, dataset):
        _deny(
            user,
            dataset,
            request,
            permission,
            'You do not have permission to export this dataset.',
        )
    if permission == 'modify' and not can_modify_dataset(user, dataset):
        _deny(
            user,
            dataset,
            request,
            permission,
            'You do not have permission to modify this dataset.',
        )
    return dataset


def apply_retention_expiry():
    """Mark datasets past retention as expired (called on list/summary)."""
    from .models import Dataset

    now = timezone.now()
    Dataset.objects.filter(
        retention_expires_at__lt=now,
        is_expired=False,
    ).update(is_expired=True)
