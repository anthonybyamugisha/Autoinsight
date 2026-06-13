import React, { useContext } from 'react';
import { Navbar as BsNavbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLogOut, FiSettings, FiBell } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const variants = { admin: 'danger', analyst: 'primary', manager: 'success' };
    return variants[role] || 'secondary';
  };

  return (
    <BsNavbar expand="lg" className="navbar-main shadow-sm" sticky="top">
      <Container fluid>
        <BsNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <div className="brand-icon">AI</div>
          <span className="brand-text">AutoInsight</span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/upload">Upload Data</Nav.Link>
            <Nav.Link as={Link} to="/datasets">Datasets</Nav.Link>
          </Nav>

          <Nav className="align-items-center gap-2">
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="notification-toggle" noCaret>
                <FiBell size={18} />
                <span className="notification-dot"></span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-end shadow">
                <Dropdown.Header>Notifications</Dropdown.Header>
                <Dropdown.Item>No new notifications</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="user-toggle d-flex align-items-center gap-2" noCaret>
                <div className="user-avatar">
                  {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="d-none d-md-block text-start">
                  <div className="user-name">{user?.first_name || user?.username || 'User'}</div>
                  <div className={`badge bg-${getRoleBadge(user?.role)} role-badge`}>
                    {user?.role || 'User'}
                  </div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-end shadow" style={{ minWidth: '200px' }}>
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
