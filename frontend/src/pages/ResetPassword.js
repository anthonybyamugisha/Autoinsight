import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { FiLock, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(uid, token, password);
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.token?.[0]
        || err.response?.data?.uid?.[0]
        || err.response?.data?.new_password?.[0]
        || err.response?.data?.detail
        || 'Reset link is invalid or has expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={5} lg={4}>
            <div className="text-center mb-4">
              <h2 className="fw-bold" style={{ color: '#FFFFFF' }}>AutoInsight</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Set New Password</p>
            </div>

            <Card className="auth-card border-0 shadow-sm">
              <Card.Body className="p-4">
                {done ? (
                  <div className="text-center py-3">
                    <FiCheckCircle size={48} className="text-success mb-3" />
                    <h4 className="mb-3">Password Reset!</h4>
                    <p className="text-muted mb-4">
                      Your password has been changed. Redirecting to sign in…
                    </p>
                    <Link to="/login" className="link-custom fw-semibold">
                      <FiArrowLeft className="me-1" /> Go to Sign In
                    </Link>
                  </div>
                ) : (
                  <>
                    <h4 className="mb-2 text-center">New Password</h4>
                    <p className="text-muted text-center small mb-4">
                      Enter and confirm your new password below.
                    </p>

                    {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">New Password</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiLock className="input-icon" />
                          <Form.Control
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="ps-5"
                            required
                            minLength={8}
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-semibold">Confirm Password</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiLock className="input-icon" />
                          <Form.Control
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="ps-5"
                            required
                            minLength={8}
                          />
                        </div>
                      </Form.Group>

                      <Button type="submit" className="w-100 btn-primary-custom" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : <><FiLock className="me-2" /> Reset Password</>}
                      </Button>
                    </Form>

                    <div className="text-center mt-3">
                      <small className="text-muted">
                        <Link to="/login" className="link-custom">Back to Sign In</Link>
                      </small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <small style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#FFE600', fontWeight: 600 }}>Centenary Bank</span> — Quality Assurance Department
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
