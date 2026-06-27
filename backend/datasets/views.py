from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
import os

from .models import Dataset, DataRecord
from .serializers import (
    DatasetUploadSerializer, DatasetListSerializer,
    DatasetDetailSerializer, DataRecordSerializer
)
from .utils import (
    process_uploaded_file, MAX_DB_ROWS, validate_classification,
    mask_record_data, should_mask_preview,
)
from .access import (
    datasets_for_user, get_accessible_dataset, apply_retention_expiry,
)
from backend.users.permissions import IsAnalystOrManager
from backend.users.throttling import UploadRateThrottle
from backend.audit.utils import log_action
from backend.audit.security import on_restricted_upload

MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE_MB', 500)) * 1024 * 1024


class DatasetUploadView(APIView):
    permission_classes = (IsAuthenticated, IsAnalystOrManager)
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = (UploadRateThrottle,)

    def post(self, request):
        serializer = DatasetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > MAX_UPLOAD_SIZE:
            max_mb = MAX_UPLOAD_SIZE // (1024 * 1024)
            return Response(
                {'error': f'File too large. Maximum allowed size is {max_mb} MB.'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        classification = serializer.validated_data.get('classification', 'internal')
        dataset = serializer.save(
            uploaded_by=request.user,
            file_size=file_obj.size,
            status='processing',
        )

        try:
            result = process_uploaded_file(file_obj)
            validate_classification(classification, result['sensitivity'])

            dataset.row_count = result['row_count']
            dataset.column_count = result['column_count']
            dataset.columns = result['columns']
            dataset.contains_sensitive_data = result['sensitivity']['contains_pii']
            dataset.sensitive_columns = result['sensitivity']['sensitive_columns']
            dataset.status = 'completed'
            dataset.set_retention_expiry()
            dataset.save()

            records = [
                DataRecord(dataset=dataset, row_index=r['row_index'], data=r['data'])
                for r in result['records']
            ]
            CHUNK_SIZE = 5000
            for i in range(0, len(records), CHUNK_SIZE):
                DataRecord.objects.bulk_create(records[i:i + CHUNK_SIZE])

            capped_note = (
                f' (DB preview capped at {MAX_DB_ROWS:,} rows)' if result.get('records_capped') else ''
            )
            sens_note = (
                f' Sensitive columns: {", ".join(dataset.sensitive_columns)}.'
                if dataset.contains_sensitive_data else ''
            )
            log_action(
                request.user,
                'upload',
                f'Uploaded [{dataset.get_classification_display()}] {dataset.name} '
                f'({dataset.row_count:,} rows){capped_note}{sens_note}',
                'dataset',
                dataset.id,
                request,
            )

            if dataset.classification == 'restricted':
                on_restricted_upload(request.user, dataset)

        except Exception as e:
            dataset.status = 'failed'
            dataset.save()
            return Response(
                {'error': f'Failed to process file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(DatasetDetailSerializer(dataset).data, status=status.HTTP_201_CREATED)


class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        apply_retention_expiry()
        qs = datasets_for_user(self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        user_filter = self.request.query_params.get('user')
        if user_filter and self.request.user.role == 'manager':
            qs = qs.filter(uploaded_by_id=user_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        classification = self.request.query_params.get('classification')
        if classification:
            qs = qs.filter(classification=classification)
        return qs


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DatasetDetailSerializer
    permission_classes = (IsAuthenticated, IsAnalystOrManager)

    def get_queryset(self):
        apply_retention_expiry()
        return datasets_for_user(self.request.user)

    def get_object(self):
        return get_accessible_dataset(
            self.request.user,
            self.kwargs['pk'],
            self.request,
            permission='modify' if self.request.method == 'DELETE' else 'view',
        )

    def retrieve(self, request, *args, **kwargs):
        dataset = self.get_object()
        serializer = self.get_serializer(dataset)
        log_action(
            request.user,
            'view',
            f'Viewed dataset {dataset.name}',
            'dataset',
            dataset.id,
            request,
        )
        return Response(serializer.data)

    def perform_destroy(self, instance):
        log_action(
            self.request.user,
            'delete',
            f'Deleted dataset {instance.name}',
            'dataset',
            instance.id,
            self.request,
        )
        instance.delete()


class DatasetPreviewView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='preview')

        rows = int(request.query_params.get('rows', 50))
        rows = min(rows, 200)

        records = DataRecord.objects.filter(dataset=dataset)[:rows]
        record_data = []
        mask = should_mask_preview(request.user, dataset)
        for rec in records:
            data = rec.data
            if mask:
                data = mask_record_data(data, dataset.sensitive_columns)
            record_data.append({'id': rec.id, 'row_index': rec.row_index, 'data': data})

        log_action(
            request.user,
            'view',
            f'Previewed dataset {dataset.name} ({rows} rows)',
            'dataset',
            dataset.id,
            request,
        )

        return Response({
            'dataset': DatasetDetailSerializer(dataset).data,
            'columns': dataset.columns,
            'total_rows': dataset.row_count,
            'preview_rows': len(record_data),
            'records': record_data,
            'masked': mask,
        })


class DatasetSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        apply_retention_expiry()
        qs = datasets_for_user(request.user)
        total_datasets = qs.count()
        dataset_ids = qs.values_list('id', flat=True)
        total_records = DataRecord.objects.filter(dataset_id__in=dataset_ids).count()
        total_size = sum(qs.values_list('file_size', flat=True))

        return Response({
            'total_datasets': total_datasets,
            'total_records': total_records,
            'total_file_size': total_size,
        })
