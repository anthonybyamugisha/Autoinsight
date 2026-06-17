import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiUploadCloud, FiDatabase, FiBarChart2, FiFileText } from 'react-icons/fi';

const navItems = [
  { path: '/', icon: FiGrid, label: 'Dashboard' },
  { path: '/upload', icon: FiUploadCloud, label: 'Upload Data' },
  { path: '/datasets', icon: FiDatabase, label: 'Datasets' },
  { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
  { path: '/reports', icon: FiFileText, label: 'Reports' },
];

export default function Sidebar() {
  return (
    <div className="sidebar d-flex flex-column">
      <Nav className="flex-column gap-1 p-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Nav.Link
            key={path}
            as={NavLink}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} className="me-2" />
            {label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="sidebar-footer p-3 mt-auto">
        <div className="sidebar-footer-card">
          <small className="d-block" style={{color: 'rgba(255,230,0,0.8)', fontWeight: 600}}>AutoInsight v1.0</small>
          <small className="d-block" style={{color: 'rgba(255,255,255,0.5)'}}>Centenary Bank QA</small>
        </div>
      </div>
    </div>
  );
}
