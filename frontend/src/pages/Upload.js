import React, { useState, useCallback } from 'react';
import { Container, Card, Form, Button, ProgressBar, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { datasetService } from '../services/datasets';
import { FiUploadCloud, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = (f) => {
    const valid = ['.csv', '.xlsx', '.xls'].some(ext => f?.name?.toLowerCase().endsWith(ext));
    if (!valid) {
      toast.error('Please upload a CSV or Excel file.');
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name);
    formData.append('description', description);

    try {
      const data = await datasetService.upload(formData, setProgress);
      toast.success(`Dataset "${data.name}" uploaded with ${data.row_count} rows!`);
      navigate(`/datasets/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold">Upload Dataset</h3>
        <p className="text-muted mb-0">Upload Excel or CSV files for analysis</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                {/* Drop Zone */}
                <div
                  className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="d-none"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                  {file ? (
                    <div className="text-center">
                      <FiCheckCircle size={48} className="text-success mb-3" />
                      <h5 className="fw-semibold">{file.name}</h5>
                      <p className="text-muted small mb-0">{(file.size / 1024).toFixed(1)} KB</p>
                      <Button variant="link" className="small mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); setName(''); }}>
                        Choose a different file
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FiUploadCloud size={48} className="text-muted mb-3" />
                      <h5 className="fw-semibold">Drag & drop your file here</h5>
                      <p className="text-muted small">or click to browse — Supports .csv, .xlsx, .xls</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <Form.Group className="mt-4 mb-3">
                  <Form.Label className="fw-semibold">Dataset Name</Form.Label>
                  <Form.Control
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Loan Performance Q1 2026"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the dataset..."
                  />
                </Form.Group>

                {uploading && <ProgressBar now={progress} label={`${progress}%`} className="mb-3" animated />}

                <div className="d-flex gap-2">
                  <Button type="submit" className="btn-primary-custom flex-grow-1" disabled={!file || uploading}>
                    {uploading ? 'Uploading...' : <><FiUploadCloud className="me-2" /> Upload & Process</>}
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate('/datasets')}>Cancel</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
