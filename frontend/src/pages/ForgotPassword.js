import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
              <img src="/images/centenary%20bank%20logo.png" alt="Centenary Bank" className="auth-logo mb-3" />
              <h2 className="fw-bold" style={{ color: '#FFFFFF' }}>AutoInsight</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Password Recovery</p>
            </div>

            <Card className="auth-card border-0 shadow-sm">
              <Card.Body className="p-4">
                {sent ? (
                  <div className="text-center py-3">
                    <FiCheckCircle size={48} className="text-success mb-3" />
                    <h4 className="mb-3">Check Your Email</h4>
                    <p className="text-muted mb-4">
                      If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                      Please check your inbox and spam folder.
                    </p>
                    <Link to="/login" className="link-custom fw-semibold">
                      <FiArrowLeft className="me-1" /> Back to Sign In
                    </Link>
                  </div>
                ) : (
                  <>
                    <h4 className="mb-2 text-center">Forgot Password?</h4>
                    <p className="text-muted text-center small mb-4">
                      Enter your email and we'll send you a link to reset your password.
                    </p>

                    {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-semibold">Email Address</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiMail className="input-icon" />
                          <Form.Control
                            type="email"
                            placeholder="name@centenarybank.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="ps-5"
                            required
                          />
                        </div>
                      </Form.Group>

                      <Button type="submit" className="w-100 btn-primary-custom" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : <><FiMail className="me-2" /> Send Reset Link</>}
                      </Button>
                    </Form>

                    <div className="text-center mt-3">
                      <small className="text-muted">
                        Remember your password? <Link to="/login" className="link-custom">Sign In</Link>
                      </small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <small style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#FFE600', fontWeight: 600 }}>Centenary Bank</span> Quality Assurance Department
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
