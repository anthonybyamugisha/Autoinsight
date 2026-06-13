from django.urls import path

from .views import (
    DatasetUploadView, DatasetListView,
    DatasetDetailView, DatasetPreviewView, DatasetSummaryView
)
from .advanced_views import (
    DatasetAnalyticsView, DatasetTrendView,
    DatasetQualityView, DatasetAnomalyView, ReportExportView
)

urlpatterns = [
    path('upload/', DatasetUploadView.as_view(), name='dataset_upload'),
    path('', DatasetListView.as_view(), name='dataset_list'),
    path('summary/', DatasetSummaryView.as_view(), name='dataset_summary'),
    path('<int:pk>/', DatasetDetailView.as_view(), name='dataset_detail'),
    path('<int:pk>/preview/', DatasetPreviewView.as_view(), name='dataset_preview'),
    path('<int:pk>/analytics/', DatasetAnalyticsView.as_view(), name='dataset_analytics'),
    path('<int:pk>/trends/', DatasetTrendView.as_view(), name='dataset_trends'),
    path('<int:pk>/quality/', DatasetQualityView.as_view(), name='dataset_quality'),
    path('<int:pk>/anomalies/', DatasetAnomalyView.as_view(), name='dataset_anomalies'),
    path('<int:pk>/export/', ReportExportView.as_view(), name='dataset_export'),
]
