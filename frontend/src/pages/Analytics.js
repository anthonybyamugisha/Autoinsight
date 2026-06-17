import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Badge, Table, Spinner, ProgressBar } from 'react-bootstrap';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { datasetService } from '../services/datasets';
import { FiBarChart2, FiAlertTriangle, FiCheckCircle, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_COLORS = ['#0066CC', '#FFE600', '#D32F2F', '#16A34A', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [quality, setQuality] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  // Load dataset list
  useEffect(() => {
    datasetService.list()
      .then((data) => {
        const list = data.results || data;
        setDatasets(list.filter(d => d.status === 'completed'));
      })
      .catch(() => toast.error('Failed to load datasets'))
      .finally(() => setLoadingList(false));
  }, []);

  // Load analytics for selected dataset
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setAnalytics(null); setTrends(null); setQuality(null); setAnomalies(null);

    Promise.all([
      datasetService.analytics(selectedId).catch(() => null),
      datasetService.trends(selectedId).catch(() => null),
      datasetService.quality(selectedId).catch(() => null),
      datasetService.anomalies(selectedId).catch(() => null),
    ]).then(([a, t, q, an]) => {
      setAnalytics(a);
      setTrends(t);
      setQuality(q);
      setAnomalies(an);
    }).finally(() => setLoading(false));
  }, [selectedId]);

  // Chart data builders
  const buildTrendChart = () => {
    if (!trends) return null;
    return {
      labels: trends.labels,
      datasets: [{
        label: `Mean ${trends.value_column}`,
        data: trends.mean,
        backgroundColor: 'rgba(0,102,204,0.2)',
        borderColor: '#0066CC',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#0066CC',
      }, {
        label: `Sum ${trends.value_column}`,
        data: trends.sum,
        backgroundColor: 'rgba(255,230,0,0.2)',
        borderColor: '#FFE600',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        yAxisID: 'y1',
      }],
    };
  };

  const buildQualityChart = () => {
    if (!quality) return null;
    const score = quality.quality_score;
    return {
      labels: ['Quality', 'Issues'],
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [score >= 75 ? '#16A34A' : score >= 50 ? '#F59E0B' : '#D32F2F', '#E2E8F0'],
        borderWidth: 0,
        cutout: '75%',
      }],
    };
  };

  const buildAnomalyChart = () => {
    if (!anomalies || !anomalies.anomalies?.length) return null;
    return {
      labels: anomalies.anomalies.map(a => a.column),
      datasets: [{
        label: 'Anomaly %',
        data: anomalies.anomalies.map(a => a.anomaly_pct),
        backgroundColor: anomalies.anomalies.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '40'),
        borderColor: anomalies.anomalies.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 2,
        borderRadius: 6,
      }],
    };
  };

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, padding: 16 } },
      title: { display: !!title, text: title, font: { size: 13, weight: '600', family: "'Inter', sans-serif" }, color: '#1A202C' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
      y: { grid: { color: '#EDF2F7' }, ticks: { font: { size: 10 } } },
    },
  });

  const trendChartOptions = {
    ...chartOptions(),
    scales: {
      ...chartOptions().scales,
      y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  const getGradeColor = (grade) => {
    const map = { A: 'success', B: 'primary', C: 'warning', D: 'danger', F: 'danger' };
    return map[grade] || 'secondary';
  };

  if (loadingList) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0"><FiBarChart2 className="me-2" />Analytics</h3>
          <p className="text-muted mb-0">Deep-dive into your dataset statistics</p>
        </div>
        <Form.Select
          style={{ maxWidth: 300 }}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="fw-semibold"
        >
          <option value="">Select a dataset...</option>
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name} ({ds.row_count} rows)</option>
          ))}
        </Form.Select>
      </div>

      {!selectedId && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FiActivity size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-muted">Select a dataset to view analytics</h5>
            <p className="text-muted small">Choose from the dropdown above to see statistics, trends, quality scores, and anomaly detection.</p>
          </Card.Body>
        </Card>
      )}

      {selectedId && loading && (
        <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>
      )}

      {selectedId && !loading && (
        <>
          {/* KPI Overview */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total Rows', value: analytics?.total_rows?.toLocaleString() || '-', icon: FiBarChart2, color: 'var(--primary)' },
              { label: 'Columns', value: analytics?.total_columns || '-', icon: FiActivity, color: 'var(--info)' },
              { label: 'Quality Score', value: quality ? `${quality.quality_score}/100` : '-', icon: FiCheckCircle, color: 'var(--success)' },
              { label: 'Anomalies', value: anomalies?.total_anomalies || '0', icon: FiAlertTriangle, color: 'var(--warning)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Col key={label} sm={6} lg={3}>
                <Card className="kpi-card border-0 shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center gap-3">
                    <div className="kpi-icon" style={{ backgroundColor: color + '15', color }}><Icon size={22} /></div>
                    <div>
                      <div className="text-muted small">{label}</div>
                      <div className="fw-bold fs-5">{value}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Trend Chart */}
          {trends && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3 d-flex align-items-center gap-2">
                <FiTrendingUp /> <span className="fw-semibold">Trends — {trends.value_column} by {trends.group_by}</span>
              </Card.Header>
              <Card.Body style={{ height: 320 }}>
                <Line data={buildTrendChart()} options={trendChartOptions} />
              </Card.Body>
            </Card>
          )}

          <Row className="g-4 mb-4">
            {/* Quality Doughnut */}
            {quality && (
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 py-3 fw-semibold">Data Quality</Card.Header>
                  <Card.Body className="d-flex flex-column align-items-center">
                    <div style={{ height: 180, width: 180 }}>
                      <Doughnut data={buildQualityChart()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                    <div className="text-center mt-3">
                      <Badge bg={getGradeColor(quality.quality_grade)} className="px-3 py-2 fs-5 mb-2">Grade {quality.quality_grade}</Badge>
                      <div className="text-muted small">
                        {quality.null_pct}% nulls &middot; {quality.duplicate_pct}% duplicates &middot; {quality.total_outliers} outliers
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Anomaly Bar Chart */}
            {anomalies && anomalies.anomalies?.length > 0 && (
              <Col lg={quality ? 8 : 12}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 py-3 d-flex align-items-center gap-2">
                    <FiAlertTriangle /> <span className="fw-semibold">Anomaly Detection</span>
                    <Badge bg="warning" className="ms-auto">{anomalies.columns_with_anomalies} columns</Badge>
                  </Card.Header>
                  <Card.Body style={{ height: 220 }}>
                    <Bar data={buildAnomalyChart()} options={chartOptions()} />
                  </Card.Body>
                </Card>
              </Col>
            )}

            {anomalies && anomalies.anomalies?.length === 0 && (
              <Col lg={quality ? 8 : 12}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-5">
                    <FiCheckCircle size={32} className="text-success" />
                    <div>
                      <h5 className="fw-bold mb-0 text-success">No Anomalies Detected</h5>
                      <p className="text-muted small mb-0">All numeric columns are within expected ranges.</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {/* Column Statistics Table */}
          {analytics?.columns && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3 fw-semibold">Column Statistics</Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Non-Null</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Std Dev</th>
                      <th>Unique</th>
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
              </Card.Body>
            </Card>
          )}

          {/* Quality Column Breakdown */}
          {quality?.column_quality?.length > 0 && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3 fw-semibold">Column Quality Breakdown</Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Null Count</th>
                      <th>Null %</th>
                      <th>Unique Values</th>
                      <th>Outliers</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quality.column_quality.map(cq => (
                      <tr key={cq.column}>
                        <td className="fw-semibold">{cq.column}</td>
                        <td>{cq.null_count}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ProgressBar
                              now={cq.null_pct}
                              style={{ width: 60, height: 4 }}
                              variant={cq.null_pct > 50 ? 'danger' : cq.null_pct > 20 ? 'warning' : 'success'}
                            />
                            <span className="small">{cq.null_pct}%</span>
                          </div>
                        </td>
                        <td>{cq.unique_values}</td>
                        <td>
                          {cq.outlier_count > 0 ? (
                            <Badge bg="warning">{cq.outlier_count}</Badge>
                          ) : <span className="text-muted">0</span>}
                        </td>
                        <td>
                          <Badge bg={cq.null_pct > 50 ? 'danger' : cq.null_pct > 20 ? 'warning' : 'success'}>
                            {cq.null_pct > 50 ? 'Poor' : cq.null_pct > 20 ? 'Fair' : 'Good'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Anomaly Details */}
          {anomalies?.anomalies?.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3 fw-semibold">Anomaly Details</Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Anomalies</th>
                      <th>%</th>
                      <th>Mean</th>
                      <th>Std Dev</th>
                      <th>Expected Range</th>
                      <th>Sample Anomalies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.anomalies.map(a => (
                      <tr key={a.column}>
                        <td className="fw-semibold">{a.column}</td>
                        <td><Badge bg={a.anomaly_pct > 10 ? 'danger' : 'warning'}>{a.anomaly_count}</Badge></td>
                        <td>{a.anomaly_pct}%</td>
                        <td>{a.mean}</td>
                        <td>{a.std}</td>
                        <td className="small">[{a.lower_bound}, {a.upper_bound}]</td>
                        <td className="small text-danger">{a.sample_anomalies?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}
