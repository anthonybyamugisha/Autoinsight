from django.urls import path
from .views import (
    AuditLogListView, AlertListView,
    AlertMarkReadView, AlertMarkAllReadView, UnreadAlertCountView,
    SecuritySummaryView,
)

urlpatterns = [
    path('logs/', AuditLogListView.as_view(), name='audit_logs'),
    path('alerts/', AlertListView.as_view(), name='alert_list'),
    path('alerts/<int:pk>/read/', AlertMarkReadView.as_view(), name='alert_mark_read'),
    path('alerts/read-all/', AlertMarkAllReadView.as_view(), name='alert_mark_all_read'),
    path('alerts/unread-count/', UnreadAlertCountView.as_view(), name='alert_unread_count'),
    path('security-summary/', SecuritySummaryView.as_view(), name='security_summary'),
]
