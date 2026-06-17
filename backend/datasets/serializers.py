from rest_framework import serializers
from .models import Dataset, DataRecord


class DatasetUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ('name', 'description', 'file')


class DatasetListSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = (
            'id', 'name', 'description', 'uploaded_by', 'uploaded_by_name',
            'uploaded_at', 'row_count', 'column_count', 'status', 'columns', 'file_size'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'row_count', 'column_count', 'status', 'columns', 'file_size')

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


class DatasetDetailSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = (
            'id', 'name', 'description', 'file', 'uploaded_by', 'uploaded_by_name',
            'uploaded_at', 'updated_at', 'row_count', 'column_count', 'status',
            'columns', 'file_size'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'updated_at', 'row_count', 'column_count', 'status', 'columns', 'file_size')

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


class DataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataRecord
        fields = ('id', 'row_index', 'data')
