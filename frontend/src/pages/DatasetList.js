import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { datasetService } from '../services/datasets';
import { FiSearch, FiEye, FiTrash2, FiUploadCloud, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Skeleton } from '../components/PageTransition';

const classBadge = (c) => {
  const map = { public: 'secondary', internal: 'info', confidential: 'warning', restricted: 'danger' };
  return <Badge bg={map[c] || 'secondary'}>{c}</Badge>;
};

export default function DatasetList() {
  const { user } = useContext(AuthContext);
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
        {['analyst', 'admin'].includes(user?.role) && (
          <Button className="btn-primary-custom" onClick={() => navigate('/upload')}>
            <FiUploadCloud className="me-2" /> Upload New
          </Button>
        )}
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
            <div className="p-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="d-flex align-items-center gap-3 py-3 border-bottom">
                  <div className="flex-grow-1">
                    <Skeleton variant="text" width="md" />
                    <div className="d-flex gap-2 mt-2">
                      <Skeleton variant="badge" width={60} height={18} />
                      <Skeleton variant="badge" width={40} height={18} />
                    </div>
                  </div>
                  <Skeleton variant="text" width={80} />
                  <Skeleton variant="text" width={70} />
                  <Skeleton variant="text" width={60} />
                  <Skeleton variant="badge" width={70} />
                  <div className="d-flex gap-1">
                    <Skeleton variant="badge" width={32} height={32} />
                    <Skeleton variant="badge" width={32} height={32} />
                  </div>
                </div>
              ))}
            </div>
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
                  <th>Classification</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds, idx) => (
                  <tr key={ds.id} className={`table-row-enter stagger-item stagger-item-delay-${Math.min(idx + 1, 8)}`}>
                    <td>
                      <div className="fw-semibold">{ds.name}</div>
                      {ds.is_expired && <Badge bg="secondary" className="me-1">Expired</Badge>}
                      {ds.contains_sensitive_data && <Badge bg="warning" className="me-1">PII</Badge>}
                    </td>
                    <td>{classBadge(ds.classification)}</td>
                    <td>{ds.uploaded_by_name || ds.uploaded_by}</td>
                    <td>{new Date(ds.uploaded_at).toLocaleDateString()}</td>
                    <td>{ds.row_count.toLocaleString()}</td>
                    <td>{statusBadge(ds.status)}</td>
                    <td className="text-end">
                      <Button variant="outline-primary" size="sm" className="me-1 btn-press" onClick={() => navigate(`/datasets/${ds.id}`)}>
                        <FiEye />
                      </Button>
                      {user?.role !== 'assurance' && (
                        <Button variant="outline-danger" size="sm" className="btn-press" onClick={() => handleDelete(ds.id, ds.name)}>
                          <FiTrash2 />
                        </Button>
                      )}
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
