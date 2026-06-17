import pandas as pd
import numpy as np
import io
import os


# Max rows to store in DB for preview; full data stays in the saved file
MAX_DB_ROWS = int(os.environ.get('MAX_DB_ROWS', 50000))


def process_uploaded_file(file_obj):
    """
    Read uploaded Excel/CSV file, clean data, and return processed info.
    Uses vectorised Pandas operations instead of slow iterrows().
    Returns dict with: columns, row_count, column_count, records (capped).
    """
    file_name = file_obj.name.lower()

    try:
        if file_name.endswith('.csv'):
            df = pd.read_csv(file_obj, low_memory=False)
        elif file_name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_obj, engine='openpyxl')
        else:
            raise ValueError("Unsupported file format. Use CSV or Excel (.xlsx/.xls) only.")
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

    # --- Clean data (vectorised) ---
    df = df.dropna(how='all')
    df = df.drop_duplicates()

    total_rows = len(df)
    columns = df.columns.tolist()

    # --- Convert to native Python types in one vectorised pass ---
    # Convert numpy ints/floats to Python types
    for col in df.select_dtypes(include=[np.integer]).columns:
        df[col] = df[col].astype('Int64')  # nullable integer
    for col in df.select_dtypes(include=[np.floating]).columns:
        df[col] = df[col].astype(float)

    # Convert datetime/timestamp columns to ISO strings for JSON serialization
    for col in df.select_dtypes(include=['datetime64', 'datetimetz']).columns:
        df[col] = df[col].astype(str)

    # Also try to parse object columns that contain date-like values
    for col in df.select_dtypes(include=['object']).columns:
        try:
            if df[col].dropna().head(50).apply(lambda x: isinstance(x, (pd.Timestamp, np.datetime64))).any():
                df[col] = df[col].astype(str)
        except Exception:
            pass

    # Replace NaN/NaT with None for JSON
    df = df.where(pd.notna(df), None)

    # --- Build records using to_dict (100x faster than iterrows) ---
    all_dicts = df.to_dict(orient='records')

    # Cap DB-stored rows to MAX_DB_ROWS for performance
    capped_dicts = all_dicts[:MAX_DB_ROWS]

    # Safety net: convert any remaining non-serializable values (Timestamps, etc.)
    def _sanitize(val):
        if val is None or isinstance(val, (str, int, float, bool)):
            return val
        if isinstance(val, (pd.Timestamp, np.datetime64)):
            return str(val)
        if hasattr(val, 'item'):  # numpy scalars
            return val.item()
        return str(val)

    capped_dicts = [
        {k: _sanitize(v) for k, v in row.items()}
        for row in capped_dicts
    ]
    records = [
        {'row_index': i, 'data': row}
        for i, row in enumerate(capped_dicts)
    ]

    return {
        'columns': columns,
        'row_count': total_rows,
        'column_count': len(columns),
        'records': records,
        'records_capped': total_rows > MAX_DB_ROWS,
    }


def get_dataframe_from_dataset(dataset):
    """
    Load dataset into a DataFrame.
    Priority: 1) Read the saved file directly (fast, full data)
              2) Fall back to DB records if file is missing
    """
    # Try reading from the saved file first
    if dataset.file and dataset.file.name:
        try:
            file_path = dataset.file.path
            if os.path.exists(file_path):
                if file_path.lower().endswith('.csv'):
                    df = pd.read_csv(file_path, low_memory=False)
                else:
                    df = pd.read_excel(file_path, engine='openpyxl')
                df = df.dropna(how='all')
                df = df.drop_duplicates()
                return df
        except Exception:
            pass  # Fall back to DB

    # Fallback: load from DB records
    records = list(dataset.records.all().values_list('data', flat=True))
    if not records:
        return pd.DataFrame()
    return pd.DataFrame(records)
