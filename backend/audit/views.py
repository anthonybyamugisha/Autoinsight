from django.db.models import Q

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog, Alert
from .serializers import AuditLogSerializer, AlertSerializer
from backend.users.permissions import IsAdminOrAssurance
from backend.datasets.access import datasets_for_user


SECURITY_ACTIONS = (
    'login_failed', 'access_denied', 'export', 'password_reset_request',
    'register', 'retention_expired',
)


def alerts_for_user(user):
    qs = Alert.objects.select_related('dataset', 'user')
    if user.role in ('admin', 'assurance'):
        return qs
    dataset_ids = datasets_for_user(user).values_list('id', flat=True)
    return qs.filter(Q(dataset_id__in=dataset_ids) | Q(user=user))


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        if self.request.user.role not in ('admin', 'assurance'):
            qs = qs.filter(user=self.request.user)
        action_filter = self.request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)
        user_filter = self.request.query_params.get('user')
        if user_filter and self.request.user.role in ('admin', 'assurance'):
            qs = qs.filter(user_id=user_filter)
        security_only = self.request.query_params.get('security')
        if security_only and security_only.lower() in ('true', '1', 'yes'):
            qs = qs.filter(action__in=SECURITY_ACTIONS)
        return qs


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = alerts_for_user(self.request.user)
        alert_type = self.request.query_params.get('type')
        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        return qs


class AlertMarkReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        try:
            alert = alerts_for_user(request.user).get(pk=pk)
            alert.is_read = True
            alert.save()
            return Response({'message': 'Alert marked as read.'})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=status.HTTP_404_NOT_FOUND)


class AlertMarkAllReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        alerts_for_user(request.user).filter(is_read=False).update(is_read=True)
        return Response({'message': 'All alerts marked as read.'})


class UnreadAlertCountView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        qs = alerts_for_user(request.user).filter(is_read=False)
        return Response({
            'unread_count': qs.count(),
            'security_count': qs.filter(alert_type='security').count(),
            'quality_count': qs.filter(alert_type='quality').count(),
        })


class SecuritySummaryView(APIView):
    """Assurance dashboard metrics — admin and assurance roles only."""
    permission_classes = (IsAuthenticated, IsAdminOrAssurance)

    def get(self, request):
        from backend.datasets.models import Dataset

        since_days = int(request.query_params.get('days', 7))
        from django.utils import timezone
        from datetime import timedelta
        since = timezone.now() - timedelta(days=since_days)

        security_logs = AuditLog.objects.filter(
            action__in=SECURITY_ACTIONS,
            created_at__gte=since,
        )
        return Response({
            'period_days': since_days,
            'failed_logins': security_logs.filter(action='login_failed').count(),
            'access_denied': security_logs.filter(action='access_denied').count(),
            'exports': security_logs.filter(action='export').count(),
            'password_resets': security_logs.filter(action='password_reset_request').count(),
            'security_alerts': Alert.objects.filter(alert_type='security', created_at__gte=since).count(),
            'restricted_datasets': Dataset.objects.filter(classification='restricted').count(),
            'expired_datasets': Dataset.objects.filter(is_expired=True).count(),
            'recent_security_logs': AuditLogSerializer(
                security_logs.order_by('-created_at')[:10],
                many=True,
            ).data,
        })
