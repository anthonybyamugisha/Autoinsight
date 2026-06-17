import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Navbar as BsNavbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { auditService } from '../services/audit';
import { FiUser, FiLogOut, FiSettings, FiBell, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertData, countData] = await Promise.all([
        auditService.getAlerts().catch(() => []),
        auditService.getUnreadCount().catch(() => ({ unread_count: 0 })),
      ]);
      setAlerts((alertData.results || alertData).slice(0, 8));
      setUnreadCount(countData.unread_count);
    } catch {}
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleMarkRead = async (id) => {
    await auditService.markAlertRead(id);
    fetchAlerts();
  };

  const handleMarkAllRead = async () => {
    await auditService.markAllAlertsRead();
    fetchAlerts();
  };

  const getRoleBadge = (role) => {
    const variants = { admin: 'danger', analyst: 'primary', manager: 'success' };
    return variants[role] || 'secondary';
  };

  const severityColor = (s) => ({ critical: 'danger', warning: 'warning', info: 'info' }[s] || 'secondary');

  return (
    <BsNavbar expand="lg" className="navbar-main shadow-sm" sticky="top">
      <Container fluid>
        <BsNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <span className="brand-text">AutoInsight</span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/upload">Upload Data</Nav.Link>
            <Nav.Link as={Link} to="/datasets">Datasets</Nav.Link>
            <Nav.Link as={Link} to="/analytics">Analytics</Nav.Link>
            <Nav.Link as={Link} to="/reports">Reports</Nav.Link>
          </Nav>

          <Nav className="align-items-center gap-2">
            {/* Notification Bell with Alerts */}
            <Dropdown align="end" onToggle={(open) => { if (open) fetchAlerts(); }}>
              <Dropdown.Toggle variant="link" className="notification-toggle" noCaret>
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                {unreadCount === 0 && <span className="notification-dot"></span>}
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-end shadow notification-dropdown" style={{ minWidth: 340 }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                  <Dropdown.Header className="p-0">Alerts</Dropdown.Header>
                  {unreadCount > 0 && (
                    <button className="btn btn-sm btn-link text-primary p-0 small fw-semibold" onClick={handleMarkAllRead}>
                      <FiCheckCircle className="me-1" />Mark all read
                    </button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FiBell size={24} className="mb-2 d-block mx-auto" />
                    <small>No alerts</small>
                  </div>
                ) : (
                  <div className="notification-list">
                    {alerts.map((alert) => (
                      <Dropdown.Item
                        key={alert.id}
                        className={`notification-item px-3 py-2 ${!alert.is_read ? 'unread' : ''}`}
                        onClick={() => !alert.is_read && handleMarkRead(alert.id)}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <FiAlertTriangle className={`mt-1 flex-shrink-0 text-${severityColor(alert.severity)}`} size={14} />
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="small fw-semibold text-truncate">{alert.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                              {alert.message?.substring(0, 80)}{alert.message?.length > 80 ? '...' : ''}
                            </div>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(alert.created_at).toLocaleString()}
                            </small>
                          </div>
                          {!alert.is_read && (
                            <div className="unread-indicator flex-shrink-0" />
                          )}
                        </div>
                      </Dropdown.Item>
                    ))}
                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* User Menu */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="user-toggle d-flex align-items-center gap-2" noCaret>
                <div className="user-avatar">
                  {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="d-none d-md-block text-start">
                  <div className="user-name">{user?.first_name || user?.username || 'User'}</div>
                  <div className={`badge bg-${getRoleBadge(user?.role)} role-badge`}>{user?.role || 'User'}</div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-end shadow" style={{ minWidth: 200 }}>
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-semibold">{user?.first_name} {user?.last_name}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <FiUser className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  <FiSettings className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FiLogOut className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
