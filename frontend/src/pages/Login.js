import React, { useState, useContext } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
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
              <h2 className="fw-bold" style={{color: '#FFFFFF'}}>AutoInsight</h2>
              <p style={{color: 'rgba(255,255,255,0.6)'}}>Business Intelligence and Analytics Platform</p>
            </div>

            <Card className="auth-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h4 className="mb-4 text-center">Sign In</h4>

                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
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

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-semibold">Password</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiLock className="input-icon" />
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-5"
                        required
                      />
                    </div>
                  </Form.Group>

                  <Button type="submit" className="w-100 btn-primary-custom" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : <><FiLogIn className="me-2" /> Sign In</>}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    <Link to="/forgot-password" className="link-custom">Forgot password?</Link>
                  </small>
                </div>

                <div className="text-center mt-2">
                  <small className="text-muted">
                    Don't have an account? <Link to="/register" className="link-custom">Create Account</Link>
                  </small>
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <small style={{color: 'rgba(255,255,255,0.4)'}}>
                <span style={{color: '#FFE600', fontWeight: 600}}>Centenary Bank</span> Quality Assurance Department
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
