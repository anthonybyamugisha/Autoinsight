import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Row, Col, Spinner, Nav, ProgressBar, Alert } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { datasetService } from '../services/datasets';
import { FiArrowLeft, FiTrash2, FiDownload, FiDatabase, FiBarChart2, FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CHART_COLORS = ['#0055BB', '#FFE600', '#D32F2F', '#16A34A', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function DatasetDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [quality, setQuality] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    datasetService.preview(id)
      .then(setData)
      .catch(() => toast.error('Failed to load dataset'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load tab data on tab change
  useEffect(() => {
    if (activeTab === 'preview') return;
    setTabLoading(true);
    const loaders = {
      quality: () => datasetService.quality(id).then(setQuality).catch(() => {}),
      anomalies: () => datasetService.anomalies(id).then(setAnomalies).catch(() => {}),
      analytics: () => datasetService.analytics(id).then(setAnalytics).catch(() => {}),
    };
    (loaders[activeTab]?.() || Promise.resolve()).finally(() => setTabLoading(false));
  }, [activeTab, id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this dataset? This cannot be undone.')) return;
    try {
      await datasetService.delete(id);
      toast.success('Dataset deleted.');
      navigate('/datasets');
    } catch { toast.error('Failed to delete.'); }
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      await datasetService.export(id, type);
      toast.success(`${type.toUpperCase()} report downloaded!`);
    } catch { toast.error('Export failed.'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (!data) return null;

  const { dataset, columns, records, total_rows, masked } = data;
  const canExport = user?.role !== 'assurance';
  const classColor = { public: 'secondary', internal: 'info', confidential: 'warning', restricted: 'danger' };

  const buildQualityChart = () => {
    if (!quality) return null;
    const s = quality.quality_score;
    return {
      labels: ['Quality', 'Issues'],
      datasets: [{ data: [s, 100 - s], backgroundColor: [s >= 75 ? '#16A34A' : s >= 50 ? '#F59E0B' : '#D32F2F', '#E2E8F0'], borderWidth: 0, cutout: '75%' }],
    };
  };

  const buildAnomalyChart = () => {
    if (!anomalies?.anomalies?.length) return null;
    return {
      labels: anomalies.anomalies.map(a => a.column),
      datasets: [{
        label: 'Anomaly %',
        data: anomalies.anomalies.map(a => a.anomaly_pct),
        backgroundColor: anomalies.anomalies.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '40'),
        borderColor: anomalies.anomalies.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 2, borderRadius: 6,
      }],
    };
  };

  const gradeColor = (g) => ({ A: 'success', B: 'primary', C: 'warning', D: 'danger', F: 'danger' }[g] || 'secondary');

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate('/datasets')}>
            <FiArrowLeft className="me-1" /> Back to Datasets
          </Button>
          <h3 className="fw-bold mb-1">{dataset.name}</h3>
          {dataset.description && <p className="text-muted mb-0">{dataset.description}</p>}
        </div>
        <div className="d-flex gap-2">
          {canExport && (
            <>
              <Button variant="outline-primary" size="sm" disabled={exporting} onClick={() => handleExport('excel')}>
                {exporting ? <Spinner size="sm" animation="border" /> : <><FiDownload className="me-1" /> Excel</>}
              </Button>
              <Button variant="outline-danger" size="sm" disabled={exporting} onClick={() => handleExport('pdf')}>
                {exporting ? <Spinner size="sm" animation="border" /> : <><FiDownload className="me-1" /> PDF</>}
              </Button>
            </>
          )}
          {user?.role !== 'assurance' && (
            <Button variant="outline-danger" size="sm" onClick={handleDelete}>
              <FiTrash2 className="me-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Cards */}
      {masked && (
        <Alert variant="warning" className="mb-3 py-2 small">
          Sensitive values are masked in this preview per data classification policy.
        </Alert>
      )}

      <Row className="g-3 mb-4">
        {[
          { label: 'Classification', value: <Badge bg={classColor[dataset.classification] || 'secondary'}>{dataset.classification_display || dataset.classification}</Badge> },
          { label: 'Status', value: <Badge bg="success">{dataset.status}</Badge> },
          { label: 'Total Rows', value: total_rows.toLocaleString() },
          { label: 'Retention', value: dataset.retention_expires_at ? new Date(dataset.retention_expires_at).toLocaleDateString() : `${dataset.retention_days} days` },
          { label: 'Uploaded By', value: dataset.uploaded_by_name },
          { label: 'Sensitive Data', value: dataset.contains_sensitive_data ? <Badge bg="warning">Detected</Badge> : <Badge bg="success">None flagged</Badge> },
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

      {/* Tab Navigation */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 p-0">
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="px-3 pt-2">
            <Nav.Item>
              <Nav.Link eventKey="preview"><FiDatabase className="me-1" /> Data Preview</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="analytics"><FiBarChart2 className="me-1" /> Analytics</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="quality"><FiShield className="me-1" /> Quality</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="anomalies"><FiAlertTriangle className="me-1" /> Anomalies</Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body className="p-0">
          {tabLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <>
              {/* PREVIEW TAB */}
              {activeTab === 'preview' && (
                records.length === 0 ? (
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
                )
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                analytics ? (
                  <div className="p-3">
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Column</th><th>Type</th><th>Non-Null</th>
                          <th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std Dev</th><th>Unique</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analytics.columns).map(([col, info]) => (
                          <tr key={col}>
                            <td className="fw-semibold">{col}</td>
                            <td><Badge bg={info.type === 'numeric' ? 'primary' : 'secondary'}>{info.type}</Badge></td>
                            <td>{info.non_null?.toLocaleString()}</td>
                            <td>{info.mean ?? '-'}</td>
                            <td>{info.median ?? '-'}</td>
                            <td>{info.min ?? '-'}</td>
                            <td>{info.max ?? '-'}</td>
                            <td>{info.std ?? '-'}</td>
                            <td>{info.unique ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : <div className="text-center py-4 text-muted">No analytics data available.</div>
              )}

              {/* QUALITY TAB */}
              {activeTab === 'quality' && (
                quality ? (
                  <div className="p-3">
                    <Row className="g-3 mb-4">
                      <Col md={4} className="text-center">
                        <div style={{ height: 160, width: 160, margin: '0 auto' }}>
                          <Doughnut data={buildQualityChart()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                        <Badge bg={gradeColor(quality.quality_grade)} className="px-3 py-2 fs-5 mt-2">Grade {quality.quality_grade}</Badge>
                        <div className="text-muted small mt-1">{quality.quality_score}/100</div>
                      </Col>
                      <Col md={8}>
                        <Row className="g-3">
                          {[
                            { label: 'Null Values', value: `${quality.null_pct}%`, color: quality.null_pct > 20 ? 'warning' : 'success' },
                            { label: 'Duplicate Rows', value: `${quality.duplicate_pct}%`, color: quality.duplicate_pct > 10 ? 'warning' : 'success' },
                            { label: 'Total Outliers', value: quality.total_outliers, color: quality.total_outliers > 50 ? 'danger' : 'success' },
                            { label: 'Total Rows', value: quality.total_rows.toLocaleString(), color: 'primary' },
                          ].map(({ label, value, color }) => (
                            <Col sm={6} key={label}>
                              <Card className="border-0 bg-light">
                                <Card.Body className="py-2 text-center">
                                  <small className="text-muted">{label}</small>
                                  <div className="fw-bold"><Badge bg={color} className="fs-6">{value}</Badge></div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Col>
                    </Row>
                    <h6 className="fw-semibold mb-3">Column Quality</h6>
                    <Table responsive hover className="mb-0">
                      <thead><tr><th>Column</th><th>Nulls</th><th>Null %</th><th>Unique</th><th>Outliers</th><th>Health</th></tr></thead>
                      <tbody>
                        {quality.column_quality.map(cq => (
                          <tr key={cq.column}>
                            <td className="fw-semibold">{cq.column}</td>
                            <td>{cq.null_count}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <ProgressBar now={cq.null_pct} style={{ width: 50, height: 4 }}
                                  variant={cq.null_pct > 50 ? 'danger' : cq.null_pct > 20 ? 'warning' : 'success'} />
                                <span className="small">{cq.null_pct}%</span>
                              </div>
                            </td>
                            <td>{cq.unique_values}</td>
                            <td>{cq.outlier_count > 0 ? <Badge bg="warning">{cq.outlier_count}</Badge> : '0'}</td>
                            <td><Badge bg={cq.null_pct > 50 ? 'danger' : cq.null_pct > 20 ? 'warning' : 'success'}>
                              {cq.null_pct > 50 ? 'Poor' : cq.null_pct > 20 ? 'Fair' : 'Good'}
                            </Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : <div className="text-center py-4 text-muted">No quality data available.</div>
              )}

              {/* ANOMALIES TAB */}
              {activeTab === 'anomalies' && (
                anomalies ? (
                  <div className="p-3">
                    {anomalies.anomalies?.length === 0 ? (
                      <div className="text-center py-5">
                        <FiCheckCircle size={40} className="text-success mb-3" />
                        <h5 className="fw-bold text-success">No Anomalies Detected</h5>
                        <p className="text-muted">All values are within expected ranges.</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4" style={{ height: 220 }}>
                          <Bar data={buildAnomalyChart()} options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { x: { grid: { display: false } }, y: { grid: { color: '#EDF2F7' } } },
                          }} />
                        </div>
                        <Table responsive hover className="mb-0">
                          <thead><tr><th>Column</th><th>Anomalies</th><th>%</th><th>Mean</th><th>Range</th><th>Samples</th></tr></thead>
                          <tbody>
                            {anomalies.anomalies.map(a => (
                              <tr key={a.column}>
                                <td className="fw-semibold">{a.column}</td>
                                <td><Badge bg={a.anomaly_pct > 10 ? 'danger' : 'warning'}>{a.anomaly_count}</Badge></td>
                                <td>{a.anomaly_pct}%</td>
                                <td>{a.mean} (±{a.std})</td>
                                <td className="small">[{a.lower_bound}, {a.upper_bound}]</td>
                                <td className="small text-danger">{a.sample_anomalies?.join(', ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    )}
                  </div>
                ) : <div className="text-center py-4 text-muted">No anomaly data available.</div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
