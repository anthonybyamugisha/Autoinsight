import pandas as pd
import numpy as np
import json
from io import BytesIO

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.http import HttpResponse

from .models import Dataset, DataRecord
from .utils import get_dataframe_from_dataset
from .access import get_accessible_dataset
from backend.audit.utils import log_action
from backend.audit.models import Alert
from backend.audit.security import check_bulk_export
from backend.users.permissions import IsNotAssurance


# ===== ANALYTICS ENGINE =====

def _safe_float(val):
    """Convert to JSON-safe float (NaN/Inf become None)."""
    if val is None:
        return None
    try:
        f = float(val)
        if f != f or f in (float('inf'), float('-inf')):  # NaN or Inf
            return None
        return round(f, 2)
    except (TypeError, ValueError):
        return None


class DatasetAnalyticsView(APIView):
    """Column-level statistics: mean, median, min, max, std, distribution."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='view')
        df = get_dataframe_from_dataset(dataset)
        if df.empty:
            return Response({'error': 'No data in dataset.'}, status=400)

        analytics = {}
        for col in df.columns:
            series = df[col]
            col_info = {'dtype': str(series.dtype), 'non_null': int(series.notna().sum())}

            if pd.api.types.is_numeric_dtype(series):
                col_info.update({
                    'type': 'numeric',
                    'mean': _safe_float(series.mean()) if series.notna().any() else None,
                    'median': _safe_float(series.median()) if series.notna().any() else None,
                    'min': _safe_float(series.min()) if series.notna().any() else None,
                    'max': _safe_float(series.max()) if series.notna().any() else None,
                    'std': _safe_float(series.std()) if series.notna().any() else None,
                    'sum': _safe_float(series.sum()) if series.notna().any() else None,
                })
            else:
                # Categorical / string column
                value_counts = series.value_counts().head(10)
                col_info.update({
                    'type': 'categorical',
                    'unique': int(series.nunique()),
                    'top_values': {str(k): int(v) for k, v in value_counts.items()},
                    'most_common': str(series.mode().iloc[0]) if not series.mode().empty else None,
                })

            analytics[col] = col_info

        log_action(
            request.user,
            'analytics_view',
            f'Viewed analytics for {dataset.name}',
            'dataset',
            dataset.id,
            request,
        )

        return Response({
            'dataset_id': dataset.id,
            'dataset_name': dataset.name,
            'total_rows': dataset.row_count,
            'total_columns': dataset.column_count,
            'columns': analytics,
        })


class DatasetTrendView(APIView):
    """Trend data for charts — group numeric data by a column."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='view')
        df = get_dataframe_from_dataset(dataset)
        if df.empty:
            return Response({'error': 'No data.'}, status=400)

        group_col = request.query_params.get('group_by')
        value_col = request.query_params.get('value')

        if not group_col or not value_col:
            # Auto-detect: first categorical as group, first numeric as value
            cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
            num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            group_col = group_col or (cat_cols[0] if cat_cols else None)
            value_col = value_col or (num_cols[0] if num_cols else None)

        if not group_col or not value_col or group_col not in df.columns or value_col not in df.columns:
            return Response({
                'error': 'Invalid columns.',
                'available_columns': df.columns.tolist(),
                'numeric_columns': df.select_dtypes(include=[np.number]).columns.tolist(),
                'categorical_columns': df.select_dtypes(include=['object', 'category']).columns.tolist(),
            }, status=400)

        grouped = df.groupby(group_col)[value_col].agg(['mean', 'sum', 'count']).reset_index()
        grouped = grouped.head(50)  # Limit

        return Response({
            'dataset_id': dataset.id,
            'group_by': group_col,
            'value_column': value_col,
            'labels': grouped[group_col].astype(str).tolist(),
            'mean': grouped['mean'].round(2).tolist(),
            'sum': grouped['sum'].round(2).tolist(),
            'count': grouped['count'].tolist(),
        })


# ===== DATA QUALITY ENGINE =====

class DatasetQualityView(APIView):
    """Calculate data quality score per dataset."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='view')
        df = get_dataframe_from_dataset(dataset)
        if df.empty:
            return Response({'error': 'No data.'}, status=400)

        total_cells = df.shape[0] * df.shape[1]
        null_cells = int(df.isna().sum().sum())
        duplicate_rows = int(df.duplicated().sum())

        null_pct = round((null_cells / total_cells) * 100, 2) if total_cells > 0 else 0
        duplicate_pct = round((duplicate_rows / df.shape[0]) * 100, 2) if df.shape[0] > 0 else 0

        # Column-level quality
        column_quality = []
        for col in df.columns:
            col_null = int(df[col].isna().sum())
            col_null_pct = round((col_null / df.shape[0]) * 100, 2) if df.shape[0] > 0 else 0
            unique_vals = int(df[col].nunique())

            # Detect outliers for numeric columns
            outlier_count = 0
            if pd.api.types.is_numeric_dtype(df[col]):
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outlier_count = int(((df[col] < lower) | (df[col] > upper)).sum())

            column_quality.append({
                'column': col,
                'null_count': col_null,
                'null_pct': col_null_pct,
                'unique_values': unique_vals,
                'outlier_count': outlier_count,
            })

        # Quality score: 100 = perfect, deduct for issues
        score = 100
        score -= min(null_pct * 1.5, 40)      # Penalize nulls (max -40)
        score -= min(duplicate_pct * 1.0, 20)  # Penalize duplicates (max -20)

        # Penalize outlier-heavy columns
        total_outliers = sum(c['outlier_count'] for c in column_quality)
        outlier_ratio = (total_outliers / total_cells * 100) if total_cells > 0 else 0
        score -= min(outlier_ratio * 1.0, 20)

        # Penalize columns with >50% nulls
        bad_columns = sum(1 for c in column_quality if c['null_pct'] > 50)
        score -= min(bad_columns * 5, 20)

        score = round(max(0, score), 1)

        # Grade
        if score >= 90:
            grade = 'A'
        elif score >= 75:
            grade = 'B'
        elif score >= 60:
            grade = 'C'
        elif score >= 40:
            grade = 'D'
        else:
            grade = 'F'

        # Create alert if quality is poor
        if score < 60:
            Alert.objects.get_or_create(
                dataset=dataset,
                title=f'Low Data Quality: {dataset.name}',
                alert_type='quality',
                defaults={
                    'message': f'Data quality score is {score}/100 (Grade {grade}). '
                               f'{null_pct}% null values, {duplicate_pct}% duplicate rows.',
                    'severity': 'warning' if score >= 40 else 'critical',
                }
            )

        log_action(
            request.user,
            'quality_view',
            f'Viewed quality report for {dataset.name} (score {score})',
            'dataset',
            dataset.id,
            request,
        )

        return Response({
            'dataset_id': dataset.id,
            'dataset_name': dataset.name,
            'quality_score': score,
            'quality_grade': grade,
            'total_rows': df.shape[0],
            'total_columns': df.shape[1],
            'null_pct': null_pct,
            'duplicate_pct': duplicate_pct,
            'total_outliers': total_outliers,
            'column_quality': column_quality,
        })


# ===== ANOMALY DETECTION =====

class DatasetAnomalyView(APIView):
    """Detect anomalies in dataset columns using IQR and Z-score methods."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='view')
        df = get_dataframe_from_dataset(dataset)
        if df.empty:
            return Response({'error': 'No data.'}, status=400)

        anomalies = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) < 10:
                continue

            mean = float(series.mean())
            std = float(series.std())

            if std == 0:
                continue

            # Z-score method (|z| > 3)
            z_scores = ((series - mean) / std).abs()
            z_anomalies = series[z_scores > 3]

            # IQR method
            q1 = float(series.quantile(0.25))
            q3 = float(series.quantile(0.75))
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            iqr_anomalies = series[(series < lower_bound) | (series > upper_bound)]

            # Combine (union of both methods)
            anomaly_indices = sorted(set(z_anomalies.index) | set(iqr_anomalies.index))
            anomaly_count = len(anomaly_indices)

            if anomaly_count > 0:
                anomaly_pct = round((anomaly_count / len(series)) * 100, 2)
                anomalies.append({
                    'column': col,
                    'anomaly_count': anomaly_count,
                    'anomaly_pct': anomaly_pct,
                    'mean': round(mean, 2),
                    'std': round(std, 2),
                    'lower_bound': round(lower_bound, 2),
                    'upper_bound': round(upper_bound, 2),
                    'sample_anomalies': series.loc[anomaly_indices[:5]].round(2).tolist(),
                })

        # Create alert for significant anomalies
        significant = [a for a in anomalies if a['anomaly_pct'] > 5]
        for a in significant:
            Alert.objects.get_or_create(
                dataset=dataset,
                title=f'Anomaly Detected: {a["column"]}',
                alert_type='anomaly',
                defaults={
                    'message': f'{a["anomaly_count"]} anomalies ({a["anomaly_pct"]}%) in column "{a["column"]}". '
                               f'Expected range: [{a["lower_bound"]}, {a["upper_bound"]}].',
                    'severity': 'warning' if a['anomaly_pct'] <= 10 else 'critical',
                }
            )

        log_action(
            request.user,
            'anomaly_view',
            f'Viewed anomaly report for {dataset.name}',
            'dataset',
            dataset.id,
            request,
        )

        return Response({
            'dataset_id': dataset.id,
            'dataset_name': dataset.name,
            'total_anomalies': sum(a['anomaly_count'] for a in anomalies),
            'columns_with_anomalies': len(anomalies),
            'anomalies': anomalies,
        })


# ===== REPORT EXPORT =====

class ReportExportView(APIView):
    """Export dataset report as PDF or Excel."""
    permission_classes = (IsAuthenticated, IsNotAssurance)

    def get(self, request, pk):
        dataset = get_accessible_dataset(request.user, pk, request, permission='export')
        export_type = request.query_params.get('type', 'excel')
        df = get_dataframe_from_dataset(dataset)

        log_action(
            request.user,
            'export',
            f'Exported {export_type} report for [{dataset.get_classification_display()}] {dataset.name}',
            'dataset',
            dataset.id,
            request,
        )
        check_bulk_export(request.user, dataset)

        if export_type == 'excel':
            return self._export_excel(dataset, df)
        elif export_type == 'pdf':
            return self._export_pdf(dataset, df)
        else:
            return Response({'error': 'Invalid type. Use "excel" or "pdf".'}, status=400)

    def _export_excel(self, dataset, df):
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Main data sheet
            df.to_excel(writer, sheet_name='Data', index=False)

            # Summary sheet
            summary_data = {
                'Metric': ['Dataset Name', 'Total Rows', 'Total Columns', 'Uploaded', 'Uploaded By', 'File Size'],
                'Value': [
                    dataset.name,
                    dataset.row_count,
                    dataset.column_count,
                    dataset.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                    dataset.uploaded_by.get_full_name() or dataset.uploaded_by.username,
                    f'{dataset.file_size / 1024:.1f} KB',
                ]
            }
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)

            # Statistics sheet for numeric columns
            numeric_df = df.select_dtypes(include=[np.number])
            if not numeric_df.empty:
                stats_df = numeric_df.describe().round(2)
                stats_df.to_excel(writer, sheet_name='Statistics')

            # Format worksheets
            workbook = writer.book
            header_fmt = workbook.add_format({
                'bold': True, 'bg_color': '#0055BB', 'font_color': 'white',
                'border': 1, 'text_wrap': True
            })
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                worksheet.set_column('A:Z', 18)

        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{dataset.name}_report.xlsx"'
        return response

    def _export_pdf(self, dataset, df):
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        output = BytesIO()
        doc = SimpleDocTemplate(output, pagesize=landscape(A4),
                                leftMargin=0.5*inch, rightMargin=0.5*inch,
                                topMargin=0.75*inch, bottomMargin=0.5*inch)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=20,
                                      textColor=colors.HexColor('#0055BB'), spaceAfter=6)
        subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10,
                                         textColor=colors.grey, spaceAfter=20)
        heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14,
                                        textColor=colors.HexColor('#1A202C'), spaceAfter=10, spaceBefore=16)

        elements = []

        # Title
        elements.append(Paragraph('AutoInsight Report', title_style))
        elements.append(Paragraph(
            f'{dataset.name} | Generated {dataset.uploaded_at.strftime("%Y-%m-%d")} | Centenary Bank QA',
            subtitle_style
        ))

        # Summary table
        elements.append(Paragraph('Summary', heading_style))
        summary_data = [
            ['Metric', 'Value'],
            ['Dataset', dataset.name],
            ['Total Rows', str(dataset.row_count)],
            ['Total Columns', str(dataset.column_count)],
            ['Uploaded', dataset.uploaded_at.strftime('%Y-%m-%d %H:%M')],
            ['Uploaded By', dataset.uploaded_by.get_full_name() or dataset.uploaded_by.username],
        ]
        summary_table = Table(summary_data, colWidths=[3*inch, 5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055BB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F4F6F9')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(summary_table)

        # Statistics
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            elements.append(Paragraph('Column Statistics', heading_style))
            stats = numeric_df.describe().round(2)
            stats_data = [['Column'] + stats.columns.tolist()]
            for col in stats.index:
                stats_data.append([col] + [str(v) for v in stats.loc[col].tolist()])

            col_w = min(1.5*inch, 9*inch / len(stats_data[0]))
            stats_table = Table(stats_data, colWidths=[col_w]*len(stats_data[0]))
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055BB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F4F6F9')]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(stats_table)

        # Data preview (first 30 rows)
        elements.append(Paragraph('Data Preview (First 30 Rows)', heading_style))
        preview = df.head(30)
        preview_data = [df.columns.tolist()] + preview.values.tolist()
        preview_data = [[str(v) if v is not None else '-' for v in row] for row in preview_data]

        col_w = min(1.2*inch, 9*inch / len(df.columns))
        data_table = Table(preview_data, colWidths=[col_w]*len(df.columns))
        data_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0055BB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F4F6F9')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(data_table)

        doc.build(elements)
        output.seek(0)

        response = HttpResponse(output.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{dataset.name}_report.pdf"'
        return response
