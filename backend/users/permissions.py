from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrAssurance(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'assurance')


class IsAnalystOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('analyst', 'admin')


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('manager', 'admin')


class IsNotAssurance(BasePermission):
    """Block write operations for read-only assurance role."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'assurance' and request.method not in SAFE_METHODS:
            return False
        return True


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.uploaded_by == request.user
