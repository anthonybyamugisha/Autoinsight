from rest_framework import serializers
from .models import Dataset, DataRecord


class DatasetUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = (
            'name', 'description', 'file', 'classification',
            'approved_use', 'retention_days',
        )

    def validate_approved_use(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Approved use case is required for data governance.')
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Please provide a meaningful approved use description (min 10 characters).')
        return value.strip()

    def validate_retention_days(self, value):
        allowed = {30, 90, 180, 365}
        if value not in allowed:
            raise serializers.ValidationError(f'Retention must be one of: {sorted(allowed)} days.')
        return value


class DatasetListSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    classification_display = serializers.CharField(source='get_classification_display', read_only=True)

    class Meta:
        model = Dataset
        fields = (
            'id', 'name', 'description', 'approved_use', 'classification', 'classification_display',
            'retention_days', 'retention_expires_at', 'is_expired',
            'contains_sensitive_data', 'sensitive_columns',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'row_count', 'column_count',
            'status', 'columns', 'file_size',
        )
        read_only_fields = fields

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


class DatasetDetailSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    classification_display = serializers.CharField(source='get_classification_display', read_only=True)

    class Meta:
        model = Dataset
        fields = (
            'id', 'name', 'description', 'approved_use', 'classification', 'classification_display',
            'retention_days', 'retention_expires_at', 'is_expired',
            'contains_sensitive_data', 'sensitive_columns',
            'file', 'uploaded_by', 'uploaded_by_name',
            'uploaded_at', 'updated_at', 'row_count', 'column_count', 'status',
            'columns', 'file_size',
        )
        read_only_fields = fields

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


class DataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataRecord
        fields = ('id', 'row_index', 'data')
