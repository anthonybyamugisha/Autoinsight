import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition } from './components/PageTransition';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DatasetList from './pages/DatasetList';
import DatasetDetail from './pages/DatasetDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Assurance from './pages/Assurance';

function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/upload" element={<PageTransition><Upload /></PageTransition>} />
            <Route path="/datasets" element={<PageTransition><DatasetList /></PageTransition>} />
            <Route path="/datasets/:id" element={<PageTransition><DatasetDetail /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
            <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
            <Route path="/assurance" element={<PageTransition><Assurance /></PageTransition>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
