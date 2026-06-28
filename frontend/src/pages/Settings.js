import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth';
import { FiLock, FiEye, FiEyeOff, FiShield, FiBell } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);


  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.old_password?.[0] || data?.new_password?.[0] || data?.message || 'Failed to change password.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', width: 0, color: 'secondary' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: 'Weak', width: 20, color: 'danger' };
    if (score <= 2) return { label: 'Fair', width: 40, color: 'warning' };
    if (score <= 3) return { label: 'Good', width: 60, color: 'info' };
    if (score <= 4) return { label: 'Strong', width: 80, color: 'primary' };
    return { label: 'Very Strong', width: 100, color: 'success' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold">Settings</h3>
        <p className="text-muted mb-0">Manage your account preferences</p>
      </div>

      <Row className="g-4">
        {/* Change Password */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center gap-2">
                <FiLock /> <span className="fw-semibold">Change Password</span>
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" className="py-2">{error}</Alert>}

              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Current Password</Form.Label>
                  <div className="input-icon-wrapper position-relative">
                    <Form.Control
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={() => setShowOld(!showOld)}
                    >
                      {showOld ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">New Password</Form.Label>
                  <div className="input-icon-wrapper position-relative">
                    <Form.Control
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </span>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1" style={{height: '4px', borderRadius: '2px', background: 'var(--border-light)'}}>
                          <div style={{
                            height: '100%',
                            width: `${strength.width}%`,
                            borderRadius: '2px',
                            background: `var(--${strength.color === 'danger' ? 'accent' : strength.color === 'warning' ? 'warning' : strength.color === 'info' ? 'info' : strength.color === 'primary' ? 'primary' : 'success'})`,
                            transition: 'width 0.3s, background 0.3s',
                          }} />
                        </div>
                        <small className={`text-${strength.color === 'danger' ? 'danger' : strength.color}`} style={{fontSize: '0.75rem', fontWeight: 600}}>
                          {strength.label}
                        </small>
                      </div>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold">Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <small className="text-danger" style={{fontSize: '0.75rem'}}>Passwords do not match</small>
                  )}
                </Form.Group>

                <Button type="submit" className="btn-primary-custom" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" /> : <><FiLock className="me-2" /> Update Password</>}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Notifications & Preferences */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center gap-2">
                <FiBell /> <span className="fw-semibold">Notifications</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <div className="fw-semibold small">Upload Confirmations</div>
                  <div className="text-muted" style={{fontSize: '0.8rem'}}>Get notified when a dataset is uploaded</div>
                </div>
                <Form.Check type="switch" id="notify-upload" defaultChecked />
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <div className="fw-semibold small">KPI Alerts</div>
                  <div className="text-muted" style={{fontSize: '0.8rem'}}>Alerts when KPIs drop or anomalies detected</div>
                </div>
                <Form.Check type="switch" id="notify-kpi" defaultChecked />
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <div>
                  <div className="fw-semibold small">System Updates</div>
                  <div className="text-muted" style={{fontSize: '0.8rem'}}>News about platform updates and features</div>
                </div>
                <Form.Check type="switch" id="notify-system" defaultChecked />
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center gap-2">
                <FiShield /> <span className="fw-semibold">Account Info</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <small className="text-muted d-block">Account Type</small>
                <span className="fw-semibold text-capitalize">{user?.role || 'User'}</span>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Department</small>
                <span className="fw-semibold">{user?.department || 'Not set'}</span>
              </div>
              <div>
                <small className="text-muted d-block">Last Login</small>
                <span className="fw-semibold">{user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
