import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { datasetService } from '../services/datasets';
import { auditService } from '../services/audit';
import { FiDatabase, FiFile, FiHardDrive, FiActivity, FiUploadCloud, FiEye, FiTrash2, FiDownload, FiAlertCircle, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CountUp, Skeleton } from '../components/PageTransition';

const ACTION_ICONS = {
  upload: FiUploadCloud, view: FiEye, delete: FiTrash2,
  export: FiDownload, login: FiActivity, register: FiActivity,
  login_failed: FiAlertCircle, access_denied: FiShield,
};

function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [securityCount, setSecurityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      datasetService.summary().catch(() => null),
      auditService.getLogs().then((d) => (d.results || d).slice(0, 8)).catch(() => []),
      auditService.getUnreadCount().catch(() => ({ unread_count: 0, security_count: 0 })),
    ]).then(([s, logs, counts]) => {
      setSummary(s);
      setRecentLogs(logs);
      setAlertCount(counts.unread_count || 0);
      setSecurityCount(counts.security_count || 0);
    }).finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { icon: FiDatabase, label: 'Total Datasets', value: summary?.total_datasets ?? 0, color: 'var(--primary)', raw: summary?.total_datasets ?? 0 },
    { icon: FiFile, label: 'Total Records', value: summary?.total_records?.toLocaleString() || '0', color: 'var(--success)', raw: summary?.total_records ?? 0 },
    { icon: FiHardDrive, label: 'Storage Used', value: formatSize(summary?.total_file_size || 0), color: 'var(--warning)', raw: summary?.total_file_size ?? 0 },
    { icon: FiAlertCircle, label: 'Alerts', value: alertCount, color: alertCount > 0 ? 'var(--accent)' : 'var(--info)', raw: alertCount },
  ];

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <Container fluid className="py-4">
        <Row className="g-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <Col key={i} sm={6} lg={3}>
              <Skeleton variant="kpi" />
            </Col>
          ))}
        </Row>
        <Row className="g-4">
          <Col lg={8}>
            <Skeleton variant="card" height={320} />
          </Col>
          <Col lg={4}>
            <Skeleton variant="card" height={320} />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold">Welcome back, {user?.first_name || user?.username}</h3>
        <p className="text-muted mb-0">Here's your data overview</p>
      </div>

      {/* KPI Cards */}
      <Row className="g-4 mb-4">
        {kpiCards.map(({ icon: Icon, label, value, color, raw }) => (
          <Col key={label} sm={6} lg={3}>
            <Card className="kpi-card border-0 shadow-sm h-100 card-hover-lift">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="kpi-icon" style={{ backgroundColor: color + '15', color }}><Icon size={24} /></div>
                <div>
                  <div className="text-muted small">{label}</div>
                  <div className="fw-bold fs-4">
                    {label === 'Total Records' || label === 'Storage Used' ? value : <CountUp end={raw} />}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        {/* Recent Activity */}
        <Col lg={alertCount > 0 ? 8 : 12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Recent Activity</Card.Header>
            <Card.Body className="p-0">
              {recentLogs.length === 0 ? (
                <div className="text-center py-5">
                  <FiActivity size={36} className="text-muted mb-3 d-block mx-auto" />
                  <p className="text-muted">Upload datasets to see activity here.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentLogs.map((log) => {
                    const ActionIcon = ACTION_ICONS[log.action] || FiActivity;
                    return (
                      <div key={log.id} className="activity-item d-flex align-items-center gap-3 px-4 py-3">
                        <div className="activity-icon" data-action={log.action}>
                          <ActionIcon size={14} />
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="small fw-semibold text-truncate">{log.description}</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {log.user_name} &middot; {new Date(log.created_at).toLocaleString()}
                          </small>
                        </div>
                        <Badge bg={
                          log.action === 'upload' ? 'success' :
                          log.action === 'delete' ? 'danger' :
                          log.action === 'export' ? 'info' : 'secondary'
                        } className="activity-badge">
                          {formatAction(log.action)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Alerts */}
        {alertCount > 0 && (
          <Col lg={4}>
            <Card className="border-0 shadow-sm alert-card h-100">
              <Card.Header className="bg-white border-0 fw-semibold py-3 d-flex align-items-center gap-2">
                <FiAlertCircle size={18} className="text-warning" /> Alerts
              </Card.Header>
              <Card.Body className="pt-0">
                <div className="mb-3">
                  <div className="fw-bold fs-2">{alertCount}</div>
                  <div className="text-muted small">
                    Unread alert{alertCount > 1 ? 's' : ''}
                    {securityCount > 0 && (
                      <span className="text-danger"> — {securityCount} security</span>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline-custom w-100 btn-sm mb-2" onClick={() => navigate('/analytics')}>
                  View Analytics
                </button>
                {user?.role === 'manager' && securityCount > 0 && (
                  <Button variant="outline-danger" size="sm" className="w-100" onClick={() => navigate('/assurance')}>
                    <FiShield className="me-1" /> Security Assurance
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}
