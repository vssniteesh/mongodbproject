import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Login from './pages/Login';
import API from './services/api';

// Import icons from a CDN (you can also use other icon libraries)
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
import AdminDashboard from './pages/AdminDashboard';
import TwoFactor from './pages/TwoFactor';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import DoctorsList from './pages/DoctorsList';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDoctors from './pages/AdminDoctors';
import BookAppointment from './pages/BookAppointment';
import Profile from './pages/Profile';

import { useLocation, useNavigate } from 'react-router-dom';

// Header component with improved layout and user details
function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const isDashboard = location.pathname.includes('dashboard');

  useEffect(() => {
    const fetchUserData = async () => {
      if (isDashboard) {
        setLoadingProfile(true);
        try {
          const response = await API.get('/auth/me');
          setUserData(response.data.user);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserData();
  }, [isDashboard]);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <header className="header" style={{ 
      borderBottom: '1px solid var(--surface)',
      backgroundColor: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div className="container" style={{ 
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo and Site Name */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '32px', color: '#2d3748', fontWeight: 'bold', letterSpacing: '1px' }}>
            MediBooker
          </h1>
          <p style={{ margin: '0 0 0 15px', fontSize: 14, color: 'var(--muted)' }}>
            Find trusted healthcare professionals and book appointments
          </p>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => navigate('/me')}
                className="btn btn-primary"
                disabled={loadingProfile}
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: loadingProfile ? 'none' : 'floaty 6s ease-in-out infinite',
                  opacity: loadingProfile ? 0.7 : 1,
                  cursor: loadingProfile ? 'not-allowed' : 'pointer'
                }}
                title="View Profile"
              >
                {loadingProfile ? (
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                ) : (
                  <UserIcon />
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Footer - credits with dynamic year
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="container site-footer" style={{ padding: '18px 20px', marginTop: 40, background: '#f7fafc', color: '#2d3748', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
  <div style={{ fontWeight: '500', fontSize: '18px' }}>Developed and Designed by Niteesh</div>
        <div style={{ fontWeight: '500', fontSize: '16px' }}>© {year} Book a Doctor. All rights reserved.</div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main style={{ paddingBottom: 20 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/me" element={<Profile />} />
          <Route path="/doctors" element={<DoctorsList />} />
          {/* Dashboard routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-doctors" element={<AdminDoctors />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<BookAppointment />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
