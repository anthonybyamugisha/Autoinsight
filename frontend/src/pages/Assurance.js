import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { auditService } from '../services/audit';
import { FiShield, FiAlertTriangle, FiLock, FiDownload, FiUserX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Assurance() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'manager') return;
    Promise.all([
      auditService.getSecuritySummary().catch(() => null),
      auditService.getAlerts({ type: 'security' }).then((d) => d.results || d).catch(() => []),
    ]).then(([s, alerts]) => {
      setSummary(s);
      setSecurityAlerts(alerts.slice(0, 15));
    }).finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'manager') {
    return (
      <Container fluid className="py-5 text-center">
        <FiLock size={40} className="text-muted mb-3" />
        <h5 className="text-muted">Security Assurance view requires manager role.</h5>
      </Container>
    );
  }

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  const kpis = [
    { icon: FiUserX, label: 'Failed Logins', value: summary?.failed_logins ?? 0, color: 'var(--accent)' },
    { icon: FiLock, label: 'Access Denied', value: summary?.access_denied ?? 0, color: 'var(--warning)' },
    { icon: FiDownload, label: 'Exports', value: summary?.exports ?? 0, color: 'var(--primary)' },
    { icon: FiAlertTriangle, label: 'Security Alerts', value: summary?.security_alerts ?? 0, color: 'var(--danger)' },
  ];

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold"><FiShield className="me-2" />Security Assurance</h3>
        <p className="text-muted mb-0">
          Monitoring dashboard — last {summary?.period_days ?? 7} days
        </p>
      </div>

      <Row className="g-3 mb-4">
        {kpis.map(({ icon: Icon, label, value, color }) => (
          <Col key={label} sm={6} lg={3}>
            <Card className="kpi-card border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="kpi-icon" style={{ backgroundColor: color + '15', color }}><Icon size={22} /></div>
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
        <Col lg={7}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Recent Security Events</Card.Header>
            <Card.Body className="p-0">
              {!summary?.recent_security_logs?.length ? (
                <div className="text-center py-5 text-muted">No security events in this period.</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Description</th>
                      <th>User</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_security_logs.map((log) => (
                      <tr key={log.id}>
                        <td><Badge bg="secondary">{log.action}</Badge></td>
                        <td className="small">{log.description}</td>
                        <td className="small">{log.user_name}</td>
                        <td className="small text-muted">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Data Governance</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Restricted datasets</span>
                <Badge bg="danger">{summary?.restricted_datasets ?? 0}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Expired datasets</span>
                <Badge bg="warning">{summary?.expired_datasets ?? 0}</Badge>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Password reset requests</span>
                <Badge bg="info">{summary?.password_resets ?? 0}</Badge>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 fw-semibold py-3 d-flex justify-content-between align-items-center">
              Security Alerts
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => auditService.markAllAlertsRead().then(() => toast.success('Alerts marked read')).catch(() => {})}
              >
                Mark all read
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {securityAlerts.length === 0 ? (
                <div className="text-center py-4 text-muted small">No security alerts.</div>
              ) : (
                securityAlerts.map((alert) => (
                  <div key={alert.id} className="px-3 py-3 border-bottom">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Badge bg={alert.severity === 'critical' ? 'danger' : 'warning'}>{alert.severity}</Badge>
                      {!alert.is_read && <Badge bg="primary">New</Badge>}
                    </div>
                    <div className="fw-semibold small">{alert.title}</div>
                    <div className="text-muted small">{alert.message}</div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
