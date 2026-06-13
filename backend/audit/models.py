from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('upload', 'Dataset Uploaded'),
        ('view', 'Dataset Viewed'),
        ('delete', 'Dataset Deleted'),
        ('login', 'User Logged In'),
        ('logout', 'User Logged Out'),
        ('register', 'User Registered'),
        ('export', 'Report Exported'),
        ('password_change', 'Password Changed'),
        ('profile_update', 'Profile Updated'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    description = models.TextField(blank=True, default='')
    resource_type = models.CharField(max_length=50, blank=True, default='')  # e.g. 'dataset'
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

    dataset = models.ForeignKey('datasets.Dataset', on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"
