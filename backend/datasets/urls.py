from django.urls import path

from .views import (
    DatasetUploadView, DatasetListView,
    DatasetDetailView, DatasetPreviewView, DatasetSummaryView
)

urlpatterns = [
    path('upload/', DatasetUploadView.as_view(), name='dataset_upload'),
    path('', DatasetListView.as_view(), name='dataset_list'),
    path('summary/', DatasetSummaryView.as_view(), name='dataset_summary'),
    path('<int:pk>/', DatasetDetailView.as_view(), name='dataset_detail'),
    path('<int:pk>/preview/', DatasetPreviewView.as_view(), name='dataset_preview'),
]
