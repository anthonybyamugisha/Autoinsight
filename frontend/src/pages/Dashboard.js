import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { datasetService } from '../services/datasets';
import { FiDatabase, FiFile, FiHardDrive, FiTrendingUp } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.summary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { icon: FiDatabase, label: 'Total Datasets', value: summary?.total_datasets || 0, color: 'var(--primary)' },
    { icon: FiFile, label: 'Total Records', value: summary?.total_records?.toLocaleString() || 0, color: 'var(--success)' },
    { icon: FiHardDrive, label: 'Storage Used', value: formatSize(summary?.total_file_size || 0), color: 'var(--warning)' },
    { icon: FiTrendingUp, label: 'Active Users', value: '-', color: 'var(--info)' },
  ];

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold">Welcome back, {user?.first_name || user?.username}</h3>
        <p className="text-muted mb-0">Here's your data overview</p>
      </div>

      <Row className="g-4 mb-4">
        {kpiCards.map(({ icon: Icon, label, value, color }) => (
          <Col key={label} sm={6} lg={3}>
            <Card className="kpi-card border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="kpi-icon" style={{ backgroundColor: color + '15', color }}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className="text-muted small">{label}</div>
                  <div className="fw-bold fs-4">{value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Recent Activity</Card.Header>
            <Card.Body>
              <p className="text-muted text-center py-4">Upload datasets to see activity here.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <a href="/upload" className="btn btn-primary-custom">Upload New Dataset</a>
                <a href="/datasets" className="btn btn-outline-custom">View All Datasets</a>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
