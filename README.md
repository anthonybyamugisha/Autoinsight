# AutoInsight

**Automated Data Quality Analytics & Assurance Platform**

AutoInsight is a full-stack web application developed for **Centenary Bank's Quality Assurance (QA)** department. It enables analysts and managers to upload datasets, perform automated quality checks, detect anomalies, generate analytical reports, and maintain a comprehensive audit trail all within a secure, role-based environment.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Security Features](#security-features)
- [Data Retention & Classification](#data-retention--classification)
- [Audit & Alerts](#audit--alerts)
- [Development](#development)
- [License](#license)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  localhost:3000                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Dashboard│ │ Datasets │ │Analytics │ │ Reports  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / JSON (JWT Auth)
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Django)                       │
│  localhost:8000/api                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Users   │ │ Datasets │ │  Audit   │ │ Security │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Database (SQLite)              │
└─────────────────────────────────────────────────────────┘
```

- **Frontend**: React SPA communicating with the backend via REST API
- **Backend**: Django REST Framework providing a RESTful API
- **Database**: SQLite for development, PostgreSQL for production
- **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt`

---

## Features

### Data Management
- **Upload datasets** — CSV, Excel, and other tabular formats (up to 500 MB)
- **Automatic processing** — Column detection, row counting, data type inference
- **Data preview** — View sample rows with sensitive data masking
- **Export reports** — Download as Excel or PDF

### Analytics & Quality
- **Automated quality checks** — Completeness, consistency, validity, and accuracy metrics
- **Anomaly detection** — Statistical outlier identification across numerical columns
- **Trend analysis** — Time-series visualisation of data patterns
- **Interactive dashboards** — Chart.js powered visual analytics

### Security & Compliance
- **Role-based access control** — Analyst and Manager roles with distinct permissions
- **Data classification** — Public, Internal, Confidential, Restricted
- **Sensitive data masking** — Automatic detection and masking of PII columns
- **Data retention policies** — Configurable retention periods with automatic expiry
- **Login lockout** — Account lockout after configurable failed attempts
- **Rate limiting** — Per-endpoint throttling (login, upload, password reset)

### Audit & Monitoring
- **Comprehensive audit log** — All user actions recorded with timestamps and IP addresses
- **Real-time alerts** — Security, quality, and anomaly alerts with severity levels
- **Security assurance dashboard** — Manager-level security overview

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.14** | Runtime |
| **Django 6.0** | Web framework |
| **Django REST Framework 3.15** | REST API |
| **SimpleJWT** | JWT authentication |
| **Pandas / NumPy** | Data processing & analysis |
| **OpenPyXL / XlsxWriter** | Excel file handling |
| **ReportLab** | PDF report generation |
| **psycopg2-binary** | PostgreSQL adapter |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **React Router 7** | Client-side routing |
| **Bootstrap 5 / React-Bootstrap** | UI components & styling |
| **Chart.js / react-chartjs-2** | Data visualisation |
| **Axios** | HTTP client |
| **React Icons** | Icon library |
| **React Toastify** | Toast notifications |

---

## Project Structure

```
AutoInsight/
├── README.md
├── backend/
│   ├── __init__.py
│   ├── asgi.py                  
│   ├── wsgi.py                  
│   ├── manage.py               
│   ├── settings.py            
│   ├── urls.py                 
│   ├── requirements.txt        
│   ├── .gitignore
│   ├── db.sqlite3               
│   ├── users/                  
│   │   ├── models.py           
│   │   ├── serializers.py       
│   │   ├── views.py             
│   │   ├── urls.py             
│   │   ├── permissions.py       
│   │   ├── security.py          
│   │   ├── throttling.py        
│   │   └── migrations/
│   ├── datasets/               
│   │   ├── models.py           
│   │   ├── serializers.py       
│   │   ├── views.py             
│   │   ├── urls.py              
│   │   ├── utils.py             
│   │   ├── access.py            
│   │   ├── advanced_views.py    
│   │   ├── management/          
│   │   │   └── commands/
│   │   │       └── enforce_retention.py
│   │   └── migrations/
│   └── audit/                  
│       ├── models.py           
│       ├── serializers.py       
│       ├── views.py             
│       ├── urls.py              
│       ├── utils.py             
│       ├── security.py          
│       └── migrations/
└── frontend/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── public/
    │   ├── index.html
    │   ├── images/
    │   │   └── centenary bank logo.png
    │   └── ...
    └── src/
        ├── index.js            
        ├── App.js              
        ├── context/
        │   └── AuthContext.js   
        ├── services/
        │   ├── api.js           
        │   ├── auth.js         
        │   ├── datasets.js      
        │   └── audit.js        
        ├── components/
        │   ├── Navbar.js       
        │   ├── Sidebar.js       
        │   ├── ProtectedRoute.js 
        │   └── PageTransition.js 
        └── pages/
            ├── Landing.js     
            ├── Login.js        
            ├── Register.js     
            ├── Dashboard.js    
            ├── Upload.js       
            ├── DatasetList.js   
            ├── DatasetDetail.js 
            ├── Analytics.js    
            ├── Reports.js     
            ├── Assurance.js   
            ├── Profile.js     
            ├── Settings.js
            ├── ForgotPassword.js
            └── ResetPassword.js
```

---

## Getting Started

### Prerequisites

- **Python 3.12+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate   # Linux/macOS
# venv\Scripts\activate    # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. (Optional) Create a superuser for admin access
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
```

The backend API will be available at **http://localhost:8000/api/**.

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. (Optional) Configure API URL
#    Edit .env or create .env.local:
#    REACT_APP_API_URL=http://localhost:8000/api

# 4. Start the development server
npm start
```

The frontend will be available at **http://localhost:3000**.

---

## Configuration

### Environment Variables (Backend)

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(auto-generated)* | Django secret key |
| `DJANGO_DEBUG` | `True` | Enable debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hostnames |
| `DATABASE_URL` | *(none)* | PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL (for emails) |
| `EMAIL_BACKEND` | `console` | Email backend |
| `MAX_UPLOAD_SIZE_MB` | `500` | Maximum upload file size |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failed attempts before lockout |
| `LOGIN_LOCKOUT_SECONDS` | `900` | Lockout duration (15 min) |
| `DEFAULT_RETENTION_DAYS` | `90` | Default data retention period |
| `THROTTLE_ANON` | `60/hour` | Anonymous rate limit |
| `THROTTLE_USER` | `1000/hour` | Authenticated user rate limit |
| `THROTTLE_LOGIN` | `10/minute` | Login endpoint rate limit |
| `THROTTLE_UPLOAD` | `20/hour` | Upload endpoint rate limit |

### Environment Variables (Frontend)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000/api` | Backend API base URL |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/users/register/` | Register a new user | No |
| `POST` | `/api/users/login/` | Login (returns JWT tokens) | No |
| `POST` | `/api/users/token/refresh/` | Refresh JWT access token | No |
| `GET` | `/api/users/profile/` | Get current user profile | Yes |
| `PUT` | `/api/users/profile/` | Update user profile | Yes |
| `POST` | `/api/users/change-password/` | Change password | Yes |
| `POST` | `/api/users/forgot-password/` | Request password reset | No |
| `POST` | `/api/users/reset-password/` | Reset password with token | No |

### Datasets

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/datasets/upload/` | Upload a new dataset | Yes |
| `GET` | `/api/datasets/` | List datasets | Yes |
| `GET` | `/api/datasets/summary/` | Dataset summary statistics | Yes |
| `GET` | `/api/datasets/:id/` | Dataset detail | Yes |
| `GET` | `/api/datasets/:id/preview/` | Preview dataset rows | Yes |
| `DELETE` | `/api/datasets/:id/` | Delete a dataset | Yes |
| `GET` | `/api/datasets/:id/analytics/` | Dataset analytics | Yes |
| `GET` | `/api/datasets/:id/trends/` | Trend analysis | Yes |
| `GET` | `/api/datasets/:id/quality/` | Quality report | Yes |
| `GET` | `/api/datasets/:id/anomalies/` | Anomaly detection | Yes |
| `GET` | `/api/datasets/:id/export/` | Export report (Excel/PDF) | Yes |

### Audit

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/audit/logs/` | List audit logs | Yes |
| `GET` | `/api/audit/alerts/` | List alerts | Yes |
| `GET` | `/api/audit/alerts/unread-count/` | Unread alert count | Yes |
| `POST` | `/api/audit/alerts/:id/read/` | Mark alert as read | Yes |
| `POST` | `/api/audit/alerts/read-all/` | Mark all alerts as read | Yes |
| `GET` | `/api/audit/security-summary/` | Security summary | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/admin/` | Django admin interface | Admin |

---

## User Roles & Permissions

### Analyst
- Upload and manage datasets
- View analytics, quality reports, and anomaly detection
- Export reports
- View own profile and audit logs

### Manager
- All Analyst permissions
- Access to Security Assurance dashboard
- View all users and datasets
- Elevated alert visibility

---

## Security Features

### Authentication
- **JWT-based** — Access tokens (1 hour) and refresh tokens (7 days)
- **Email-based login** — Users authenticate with email and password
- **Password validation** — Django's built-in password strength validation

### Access Control
- **Role-based permissions** — `IsAnalystOrManager`, `IsManager` permission classes
- **Dataset-level access** — Users can only access datasets they uploaded (analysts) or all datasets (managers)
- **Data classification** — Restricted datasets require manager approval

### Threat Protection
- **Login lockout** — Account locked after 5 failed attempts (15-minute cooldown)
- **Rate limiting** — Per-endpoint throttling prevents abuse
- **Sensitive data masking** — Automatic PII detection and masking in previews
- **Audit logging** — All actions logged with IP address and user agent

### Data Protection
- **Data retention** — Automatic expiry and deletion based on configurable policies
- **Classification-based handling** — Different handling rules per classification level
- **Secure file upload** — File type and size validation

---

## Data Retention & Classification

### Classification Levels

| Level | Description | Example |
|---|---|---|
| **Public** | No restrictions | Published reports |
| **Internal** | Internal use only | Department metrics |
| **Confidential** | Sensitive business data | Customer analytics |
| **Restricted** | Highly sensitive | PII, financial data |

### Retention Policies

Datasets have configurable retention periods (30, 90, 180, or 365 days). The `enforce_retention` management command automatically marks and handles expired datasets:

```bash
# Run manually
python manage.py enforce_retention

# Or schedule via cron (daily recommended)
0 2 * * * cd /path/to/backend && venv/bin/python manage.py enforce_retention
```

---

## Audit & Alerts

### Audit Logging

Every significant action is recorded in the audit log:
- User authentication events (login, logout, failed login)
- Dataset operations (upload, view, delete, export)
- Profile changes (update, password change)
- Security events (access denied, retention expiry)

### Alert System

Alerts are generated for:
- **Data Quality** — Issues detected during quality checks
- **Anomalies** — Statistical outliers found in datasets
- **Security** — Suspicious activity, access violations, login lockouts

Alerts have three severity levels: **Info**, **Warning**, and **Critical**.

---

## Development

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Management Commands

```bash
# Enforce data retention policies
python manage.py enforce_retention
```

### Code Quality

```bash
# Backend linting (install flake8 first)
pip install flake8
flake8 backend/

# Frontend linting
cd frontend
npm run lint
```

---

## License

Proprietary — **Centenary Bank QA Department**

Developed for internal use by Centenary Bank's Quality Assurance team. All rights reserved.