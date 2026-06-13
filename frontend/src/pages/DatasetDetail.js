import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { datasetService } from '../services/datasets';
import { FiArrowLeft, FiTrash2, FiDownload, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.preview(id)
      .then(setData)
      .catch(() => toast.error('Failed to load dataset'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this dataset? This cannot be undone.')) return;
    try {
      await datasetService.delete(id);
      toast.success('Dataset deleted.');
      navigate('/datasets');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  if (!data) return null;

  const { dataset, columns, records, total_rows, preview_rows } = data;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate('/datasets')}>
            <FiArrowLeft className="me-1" /> Back to Datasets
          </Button>
          <h3 className="fw-bold mb-1">{dataset.name}</h3>
          {dataset.description && <p className="text-muted mb-0">{dataset.description}</p>}
        </div>
        <Button variant="outline-danger" onClick={handleDelete}>
          <FiTrash2 className="me-2" /> Delete
        </Button>
      </div>

      {/* Metadata Cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Status', value: <Badge bg="success">{dataset.status}</Badge> },
          { label: 'Total Rows', value: total_rows.toLocaleString() },
          { label: 'Columns', value: dataset.column_count },
          { label: 'Uploaded', value: new Date(dataset.uploaded_at).toLocaleDateString() },
          { label: 'Uploaded By', value: dataset.uploaded_by_name },
          { label: 'File Size', value: (dataset.file_size / 1024).toFixed(1) + ' KB' },
        ].map(({ label, value }) => (
          <Col key={label} sm={6} md={4} lg={2}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="py-2">
                <small className="text-muted">{label}</small>
                <div className="fw-semibold">{value}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Data Preview Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
          <span className="fw-semibold">
            <FiDatabase className="me-2" /> Data Preview ({preview_rows} of {total_rows} rows)
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {records.length === 0 ? (
            <div className="text-center py-4 text-muted">No data records found.</div>
          ) : (
            <Table responsive striped hover className="mb-0 dataset-table">
              <thead>
                <tr>
                  <th className="text-muted small">#</th>
                  {columns.map((col) => <th key={col} className="small">{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.row_index}>
                    <td className="text-muted small">{rec.row_index + 1}</td>
                    {columns.map((col) => (
                      <td key={col} className="small">{rec.data[col] != null ? String(rec.data[col]) : '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
