import pandas as pd
import io


def process_uploaded_file(file_obj):
    """
    Read uploaded Excel/CSV file, clean data, and return processed info.
    Returns dict with: columns, row_count, column_count, records (list of dicts)
    """
    file_name = file_obj.name.lower()

    try:
        if file_name.endswith('.csv'):
            df = pd.read_csv(file_obj)
        elif file_name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_obj, engine='openpyxl')
        else:
            raise ValueError("Unsupported file format. Use CSV or Excel files.")
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

    # Clean data
    df = df.dropna(how='all')  # Remove completely empty rows
    df = df.drop_duplicates()  # Remove duplicate rows

    # Replace NaN with None for JSON serialization
    df = df.where(pd.notna(df), None)

    # Convert numpy types to Python native types
    columns = df.columns.tolist()
    records = []
    for idx, row in df.iterrows():
        record = {}
        for col in columns:
            val = row[col]
            if val is None:
                record[col] = None
            elif hasattr(val, 'item'):  # numpy types
                record[col] = val.item()
            else:
                record[col] = val
        records.append({
            'row_index': len(records),
            'data': record
        })

    return {
        'columns': columns,
        'row_count': len(records),
        'column_count': len(columns),
        'records': records,
    }


def get_dataframe_from_dataset(dataset):
    """Load dataset records into a pandas DataFrame for analytics."""
    records = dataset.records.all().values_list('data', flat=True)
    if not records:
        return pd.DataFrame()
    return pd.DataFrame(list(records))
