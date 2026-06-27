from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('upload', 'Dataset Uploaded'),
        ('view', 'Dataset Viewed'),
        ('delete', 'Dataset Deleted'),
        ('login', 'User Logged In'),
        ('login_failed', 'Login Failed'),
        ('logout', 'User Logged Out'),
        ('register', 'User Registered'),
        ('export', 'Report Exported'),
        ('password_change', 'Password Changed'),
        ('password_reset_request', 'Password Reset Requested'),
        ('profile_update', 'Profile Updated'),
        ('access_denied', 'Access Denied'),
        ('analytics_view', 'Analytics Viewed'),
        ('quality_view', 'Quality Report Viewed'),
        ('anomaly_view', 'Anomaly Report Viewed'),
        ('retention_expired', 'Dataset Retention Expired'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=40, choices=ACTION_CHOICES)
    description = models.TextField(blank=True, default='')
    resource_type = models.CharField(max_length=50, blank=True, default='')
    resource_id = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.created_at:%Y-%m-%d %H:%M}"


class Alert(models.Model):
    SEVERITY_CHOICES = (
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    )

    ALERT_TYPE_CHOICES = (
        ('quality', 'Data Quality'),
        ('anomaly', 'Anomaly'),
        ('security', 'Security'),
    )

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, default='quality')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alerts',
        null=True,
        blank=True,
    )
    dataset = models.ForeignKey(
        'datasets.Dataset',
        on_delete=models.CASCADE,
        related_name='alerts',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"
