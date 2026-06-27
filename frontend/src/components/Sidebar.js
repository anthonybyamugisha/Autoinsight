import React, { useContext } from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiGrid, FiUploadCloud, FiDatabase, FiBarChart2, FiFileText, FiShield } from 'react-icons/fi';

const baseNavItems = [
  { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { path: '/datasets', icon: FiDatabase, label: 'Datasets' },
  { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
  { path: '/reports', icon: FiFileText, label: 'Reports' },
];

export default function Sidebar() {
  const { user } = useContext(AuthContext);

  const navItems = [...baseNavItems];
  if (user?.role === 'analyst' || user?.role === 'manager') {
    navItems.splice(1, 0, { path: '/upload', icon: FiUploadCloud, label: 'Upload Data' });
  }
  if (user?.role === 'manager') {
    navItems.push({ path: '/assurance', icon: FiShield, label: 'Security Assurance' });
  }

  return (
    <div className="sidebar d-flex flex-column">
      <Nav className="flex-column gap-1 p-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Nav.Link
            key={path}
            as={NavLink}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} className="me-2" />
            {label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="sidebar-footer p-3 mt-auto">
        <div className="sidebar-footer-card text-center">
          <img src="/images/centenary%20bank%20logo.png" alt="Centenary Bank" className="sidebar-logo mb-2" />
          <small className="d-block" style={{color: 'rgba(255,230,0,0.8)', fontWeight: 600}}>AutoInsight v1.0</small>
          <small className="d-block" style={{color: 'rgba(255,255,255,0.5)'}}>Centenary Bank QA</small>
        </div>
      </div>
    </div>
  );
}
