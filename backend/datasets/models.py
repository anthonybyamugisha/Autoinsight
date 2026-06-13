from django.db import models
from django.conf import settings


class Dataset(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
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
    columns = models.JSONField(default=list, blank=True)  # Store column names
    file_size = models.IntegerField(default=0)  # File size in bytes

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.name} ({self.row_count} rows)"


class DataRecord(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='records')
    row_index = models.IntegerField()
    data = models.JSONField()  # Store row as JSON

    class Meta:
        ordering = ['row_index']
        indexes = [
            models.Index(fields=['dataset', 'row_index']),
        ]

    def __str__(self):
        return f"Dataset {self.dataset_id} - Row {self.row_index}"
