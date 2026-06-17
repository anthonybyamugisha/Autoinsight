import React, { useState, useContext } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUserPlus, FiMail, FiLock, FiUser, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', password_confirm: '',
    first_name: '', last_name: '', role: 'analyst', department: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(' ');
        setError(messages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100 py-5">
          <Col md={6} lg={5}>
            <div className="text-center mb-4">
              <img src="/images/centenary%20bank%20logo.png" alt="Centenary Bank" className="auth-logo mb-3" />
              <h2 className="fw-bold" style={{color: '#FFFFFF'}}>AutoInsight</h2>
              <p style={{color: 'rgba(255,255,255,0.6)'}}>Create your account</p>
            </div>

            <Card className="auth-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h4 className="mb-4 text-center">Register</h4>

                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">First Name</Form.Label>
                        <Form.Control name="first_name" value={form.first_name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Last Name</Form.Label>
                        <Form.Control name="last_name" value={form.last_name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Username</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiUser className="input-icon" />
                      <Form.Control name="username" value={form.username} onChange={handleChange} className="ps-5" required />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Email</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiMail className="input-icon" />
                      <Form.Control type="email" name="email" value={form.email} onChange={handleChange} className="ps-5" required />
                    </div>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Password</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiLock className="input-icon" />
                          <Form.Control type="password" name="password" value={form.password} onChange={handleChange} className="ps-5" required />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Confirm Password</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiLock className="input-icon" />
                          <Form.Control type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} className="ps-5" required />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Role</Form.Label>
                        <Form.Select name="role" value={form.role} onChange={handleChange}>
                          <option value="analyst">Analyst</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Department</Form.Label>
                        <div className="input-icon-wrapper">
                          <FiBriefcase className="input-icon" />
                          <Form.Control name="department" value={form.department} onChange={handleChange} className="ps-5" placeholder="e.g. QA" />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button type="submit" className="w-100 btn-primary-custom mt-2" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : <><FiUserPlus className="me-2" /> Create Account</>}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Already have an account? <Link to="/login" className="link-custom">Sign In</Link>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
