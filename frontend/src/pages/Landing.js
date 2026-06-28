import React, { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiDatabase, FiBarChart2, FiShield, FiDownload, FiAlertCircle, FiActivity, FiArrowRight } from 'react-icons/fi';

const features = [
  {
    icon: FiDatabase,
    title: 'Smart Data Upload',
    desc: 'Upload CSV or Excel files of any schema. The system auto-detects columns, cleans data, and stores it ready for analysis.',
  },
  {
    icon: FiBarChart2,
    title: 'Instant Analytics',
    desc: 'Column-level statistics, trend analysis, and interactive charts — all generated automatically from your data.',
  },
  {
    icon: FiShield,
    title: 'Data Quality Scoring',
    desc: 'Every dataset gets a quality score from 0–100 with grade A–F, flagging nulls, duplicates, and outliers.',
  },
  {
    icon: FiAlertCircle,
    title: 'Anomaly Detection',
    desc: 'Z-score and IQR methods detect statistical anomalies and alert you to unusual patterns in your data.',
  },
  {
    icon: FiDownload,
    title: 'Report Export',
    desc: 'Generate professional PDF and Excel reports with summaries, statistics, and full data previews.',
  },
  {
    icon: FiActivity,
    title: 'Audit Trail',
    desc: 'Every action is logged — uploads, views, exports, and deletions — for full transparency and compliance.',
  },
];

export default function Landing() {
  const { user } = useContext(AuthContext);

  // Redirect authenticated users to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img src="/images/centenary%20bank%20logo.png" alt="Centenary Bank" className="landing-nav-logo" />
            <span className="landing-brand">AutoInsight</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="landing-nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-sm btn-landing-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-container text-center">
          <div className="hero-badge hero-fade-up hero-fade-up-delay-1">Centenary Bank Quality Assurance</div>
          <h1 className="hero-title hero-fade-up hero-fade-up-delay-2">
            Business Intelligence<br />
            <span className="hero-highlight">&amp; Analytics Platform</span>
          </h1>
          <p className="hero-subtitle hero-fade-up hero-fade-up-delay-3">
            Upload any dataset and get instant analytics, data quality scores,
            anomaly detection, and professional reports — no data science degree required.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4" style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/register" className="btn btn-landing-primary-white btn-lg px-4">
              Get Started <FiArrowRight className="ms-2" />
            </Link>
            <Link to="/login" className="btn btn-landing-ghost btn-lg px-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="text-center mb-5">
            <span className="features-section-badge">Features</span>
            <h2 className="features-title">Everything you need for data-driven QA</h2>
            <p className="features-subtitle text-muted">
              Powerful tools designed for quality assurance teams
            </p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc }, idx) => (
              <div key={title} className={`feature-card feature-card-entrance stagger-item-delay-${Math.min(idx + 1, 8)}`}>
                <div className="feature-icon"><Icon size={22} /></div>
                <h5 className="feature-title">{title}</h5>
                <p className="feature-desc text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        <div className="landing-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">Any</div>
              <div className="stat-label">CSV or Excel format</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0–100</div>
              <div className="stat-label">Data quality scoring</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2x</div>
              <div className="stat-label">Anomaly detection methods</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">PDF + XLSX</div>
              <div className="stat-label">Report export formats</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container text-center">
          <h2 className="cta-title">Ready to unlock your data?</h2>
          <p className="cta-subtitle">
            Start uploading datasets and get actionable insights in seconds.
          </p>
          <Link to="/register" className="btn btn-landing-primary btn-lg px-5 mt-3">
            Create Free Account <FiArrowRight className="ms-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <img src="/images/centenary%20bank%20logo.png" alt="Centenary Bank" className="footer-logo" />
            <span className="footer-text">AutoInsight</span>
          </div>
          <div className="footer-links d-flex gap-3">
            <Link to="/login" className="footer-link">Sign In</Link>
            <Link to="/register" className="footer-link">Register</Link>
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Centenary Bank QA Department
          </div>
        </div>
      </footer>
    </div>
  );
}
