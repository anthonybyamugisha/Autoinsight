from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Dataset(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    CLASSIFICATION_CHOICES = (
        ('public', 'Public'),
        ('internal', 'Internal'),
        ('confidential', 'Confidential'),
        ('restricted', 'Restricted'),
    )

    RETENTION_CHOICES = (
        (30, '30 days'),
        (90, '90 days'),
        (180, '180 days'),
        (365, '1 year'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    approved_use = models.TextField(
        blank=True,
        default='',
        help_text='Business purpose and approved use case for this data.',
    )
    classification = models.CharField(
        max_length=20,
        choices=CLASSIFICATION_CHOICES,
        default='internal',
    )
    retention_days = models.PositiveIntegerField(default=90)
    retention_expires_at = models.DateTimeField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    contains_sensitive_data = models.BooleanField(default=False)
    sensitive_columns = models.JSONField(default=list, blank=True)
    file = models.FileField(upload_to='datasets/%Y/%m/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='datasets'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    row_count = models.IntegerField(default=0)
    column_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    columns = models.JSONField(default=list, blank=True)
    file_size = models.IntegerField(default=0)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.name} ({self.row_count} rows)"

    def set_retention_expiry(self):
        if self.retention_days:
            base = self.uploaded_at or timezone.now()
            self.retention_expires_at = base + timedelta(days=self.retention_days)


class DataRecord(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='records')
    row_index = models.IntegerField()
    data = models.JSONField()

    class Meta:
        ordering = ['row_index']
        indexes = [
            models.Index(fields=['dataset', 'row_index']),
        ]

    def __str__(self):
        return f"Dataset {self.dataset_id} - Row {self.row_index}"
