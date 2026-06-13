import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth';
import { FiUser, FiMail, FiBriefcase, FiPhone, FiSave, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);

  const roleColors = { admin: 'danger', analyst: 'primary', manager: 'success' };

  const infoFields = [
    { icon: FiUser, label: 'Full Name', value: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '-' },
    { icon: FiUser, label: 'Username', value: user?.username || '-' },
    { icon: FiMail, label: 'Email', value: user?.email || '-' },
    { icon: FiShield, label: 'Role', value: <Badge bg={roleColors[user?.role] || 'secondary'} className="px-2 py-1">{user?.role || 'User'}</Badge> },
    { icon: FiBriefcase, label: 'Department', value: user?.department || 'Not set' },
    { icon: FiPhone, label: 'Phone', value: user?.phone || 'Not set' },
    { icon: FiUser, label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
  ];

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h3 className="fw-bold">My Profile</h3>
        <p className="text-muted mb-0">View your account information</p>
      </div>

      <Row className="g-4">
        {/* Profile Card */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-4">
              <div className="profile-avatar-lg mx-auto mb-3">
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <h4 className="fw-bold mb-1">{user?.first_name} {user?.last_name}</h4>
              <p className="text-muted small mb-2">{user?.email}</p>
              <Badge bg={roleColors[user?.role] || 'secondary'} className="px-3 py-1 text-uppercase" style={{fontSize: '0.7rem'}}>
                {user?.role}
              </Badge>
              {user?.department && (
                <p className="text-muted small mt-2 mb-0">
                  <FiBriefcase className="me-1" /> {user.department}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Info Details */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 fw-semibold py-3">Account Details</Card.Header>
            <Card.Body className="p-0">
              <div className="profile-info-list">
                {infoFields.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="profile-info-row d-flex align-items-center px-4 py-3">
                    <div className="profile-info-icon">
                      <Icon size={16} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted">{label}</div>
                      <div className="fw-semibold">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
