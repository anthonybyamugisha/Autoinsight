import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Form } from 'react-bootstrap';
import { datasetService } from '../services/datasets';
import { auditService } from '../services/audit';
import { FiFileText, FiDownload, FiFile, FiClock, FiUser, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Reports() {
  const [datasets, setDatasets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => {
    Promise.all([
      datasetService.list().then((d) => (d.results || d).filter(ds => ds.status === 'completed')),
      auditService.getLogs({ action: 'export' }).then((d) => d.results || d).catch(() => []),
    ]).then(([ds, logs]) => {
      setDatasets(ds);
      setAuditLogs(logs.slice(0, 20));
    }).finally(() => setLoading(false));
  }, []);

  const handleExport = async (id, name, type) => {
    setExportingId(`${id}-${type}`);
    try {
      await datasetService.export(id, type);
      toast.success(`${type.toUpperCase()} report for "${name}" downloaded!`);
      // Refresh audit logs to show new export
      const logs = await auditService.getLogs({ action: 'export' }).then((d) => d.results || d).catch(() => []);
      setAuditLogs(logs.slice(0, 20));
    } catch {
      toast.error(`Failed to export ${type} report.`);
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-0"><FiFileText className="me-2" />Reports</h3>
        <p className="text-muted mb-0">Generate and export data reports</p>
      </div>

      <Row className="g-4">
        {/* Export Datasets */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 fw-semibold">
              <FiDatabase className="me-2" />Available Datasets
            </Card.Header>
            <Card.Body className="p-0">
              {datasets.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FiFile size={40} className="mb-3 d-block mx-auto" />
                  <p>No datasets available for export. Upload a dataset first.</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Dataset</th>
                      <th>Rows</th>
                      <th>Columns</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th className="text-end">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((ds) => (
                      <tr key={ds.id}>
                        <td>
                          <div className="fw-semibold">{ds.name}</div>
                          {ds.description && <small className="text-muted">{ds.description}</small>}
                        </td>
                        <td>{ds.row_count.toLocaleString()}</td>
                        <td>{ds.column_count}</td>
                        <td>{(ds.file_size / 1024).toFixed(1)} KB</td>
                        <td>{new Date(ds.uploaded_at).toLocaleDateString()}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              disabled={!!exportingId}
                              onClick={() => handleExport(ds.id, ds.name, 'excel')}
                            >
                              {exportingId === `${ds.id}-excel` ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                <><FiDownload className="me-1" /> Excel</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={!!exportingId}
                              onClick={() => handleExport(ds.id, ds.name, 'pdf')}
                            >
                              {exportingId === `${ds.id}-pdf` ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                <><FiDownload className="me-1" /> PDF</>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Export History */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 fw-semibold">
              <FiClock className="me-2" />Export History
            </Card.Header>
            <Card.Body className="p-0">
              {auditLogs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FiClock size={32} className="mb-2 d-block mx-auto" />
                  <p className="small">No exports yet</p>
                </div>
              ) : (
                <div className="export-history-list">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="export-history-item d-flex align-items-start gap-3 px-3 py-3">
                      <div className="export-history-icon">
                        <FiDownload size={14} />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="small fw-semibold text-truncate">{log.description}</div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            <FiUser size={10} className="me-1" />{log.user_name}
                          </small>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
