import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { datasetService } from '../services/datasets';
import { FiSearch, FiEye, FiTrash2, FiUploadCloud, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DatasetList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchDatasets = useCallback(() => {
    setLoading(true);
    datasetService.list({ search })
      .then((data) => setDatasets(data.results || data))
      .catch(() => toast.error('Failed to load datasets'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete dataset "${name}"? This cannot be undone.`)) return;
    try {
      await datasetService.delete(id);
      toast.success('Dataset deleted.');
      fetchDatasets();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const statusBadge = (status) => {
    const variants = { completed: 'success', processing: 'warning', pending: 'secondary', failed: 'danger' };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Datasets</h3>
          <p className="text-muted mb-0">Manage your uploaded data</p>
        </div>
        <Button className="btn-primary-custom" onClick={() => navigate('/upload')}>
          <FiUploadCloud className="me-2" /> Upload New
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="p-3 border-bottom">
            <InputGroup>
              <InputGroup.Text><FiSearch /></InputGroup.Text>
              <Form.Control
                placeholder="Search datasets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-5">
              <FiDatabase size={48} className="text-muted mb-3" />
              <p className="text-muted">No datasets found. Upload your first dataset to get started.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Rows</th>
                  <th>Columns</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr key={ds.id}>
                    <td>
                      <div className="fw-semibold">{ds.name}</div>
                      {ds.description && <small className="text-muted">{ds.description}</small>}
                    </td>
                    <td>{ds.uploaded_by_name || ds.uploaded_by}</td>
                    <td>{new Date(ds.uploaded_at).toLocaleDateString()}</td>
                    <td>{ds.row_count.toLocaleString()}</td>
                    <td>{ds.column_count}</td>
                    <td>{statusBadge(ds.status)}</td>
                    <td className="text-end">
                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => navigate(`/datasets/${ds.id}`)}>
                        <FiEye />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(ds.id, ds.name)}>
                        <FiTrash2 />
                      </Button>
                    </td>
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
