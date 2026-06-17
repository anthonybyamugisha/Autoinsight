from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
import os

from .models import Dataset, DataRecord
from .serializers import (
    DatasetUploadSerializer, DatasetListSerializer,
    DatasetDetailSerializer, DataRecordSerializer
)
from .utils import process_uploaded_file, MAX_DB_ROWS
from backend.users.permissions import IsAnalystOrAdmin, IsOwnerOrAdmin
from backend.audit.utils import log_action

# Max upload file size (default 500 MB)
MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE_MB', 500)) * 1024 * 1024


class DatasetUploadView(APIView):
    permission_classes = (IsAuthenticated, IsAnalystOrAdmin)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = DatasetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # File size guard
        if file_obj.size > MAX_UPLOAD_SIZE:
            max_mb = MAX_UPLOAD_SIZE // (1024 * 1024)
            return Response(
                {'error': f'File too large. Maximum allowed size is {max_mb} MB.'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )

        # Create dataset record
        dataset = serializer.save(
            uploaded_by=request.user,
            file_size=file_obj.size,
            status='processing'
        )

        try:
            # Process the file
            result = process_uploaded_file(file_obj)

            # Update dataset metadata
            dataset.row_count = result['row_count']
            dataset.column_count = result['column_count']
            dataset.columns = result['columns']
            dataset.status = 'completed'
            dataset.save()

            # Bulk-create DB records in chunks for performance
            records = [
                DataRecord(
                    dataset=dataset,
                    row_index=r['row_index'],
                    data=r['data']
                )
                for r in result['records']
            ]
            CHUNK_SIZE = 5000
            for i in range(0, len(records), CHUNK_SIZE):
                DataRecord.objects.bulk_create(records[i:i + CHUNK_SIZE])

            # Audit log
            capped_note = ' (DB preview capped at {:,} rows)'.format(MAX_DB_ROWS) if result.get('records_capped') else ''
            log_action(request.user, 'upload',
                       f'Uploaded dataset {dataset.name} ({dataset.row_count:,} rows){capped_note}',
                       'dataset', dataset.id, request)

        except Exception as e:
            dataset.status = 'failed'
            dataset.save()
            return Response(
                {'error': f'Failed to process file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            DatasetDetailSerializer(dataset).data,
            status=status.HTTP_201_CREATED
        )


class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = Dataset.objects.all()
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # Filter by uploaded_by
        user_filter = self.request.query_params.get('user')
        if user_filter:
            qs = qs.filter(uploaded_by_id=user_filter)
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    queryset = Dataset.objects.all()
    serializer_class = DatasetDetailSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrAdmin)

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        log_action(request.user, 'view', f'Viewed dataset {self.get_object().name}',
                   'dataset', self.get_object().id, request)
        return response

    def perform_destroy(self, instance):
        log_action(self.request.user, 'delete', f'Deleted dataset {instance.name}',
                   'dataset', instance.id, self.request)
        instance.delete()


class DatasetPreviewView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk)
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset not found.'}, status=status.HTTP_404_NOT_FOUND)

        rows = int(request.query_params.get('rows', 50))
        rows = min(rows, 200)  # Max 200 rows

        records = DataRecord.objects.filter(dataset=dataset)[:rows]
        serializer = DataRecordSerializer(records, many=True)

        return Response({
            'dataset': DatasetDetailSerializer(dataset).data,
            'columns': dataset.columns,
            'total_rows': dataset.row_count,
            'preview_rows': len(serializer.data),
            'records': serializer.data,
        })


class DatasetSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        total_datasets = Dataset.objects.count()
        total_records = DataRecord.objects.count()
        total_size = sum(Dataset.objects.values_list('file_size', flat=True))

        return Response({
            'total_datasets': total_datasets,
            'total_records': total_records,
            'total_file_size': total_size,
        })
