from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'


class IsAnalystOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('analyst', 'manager')


class IsManagerOrAnalyst(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('manager', 'analyst')


class IsOwnerOrManager(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'manager':
            return True
        return obj.uploaded_by == request.user
