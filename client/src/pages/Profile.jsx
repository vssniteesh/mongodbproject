import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await API.get('/auth/me');
        setUserData(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Patient';
      default: return role;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'pending_approval': return 'var(--accent-500)';
      case 'rejected': return 'var(--danger)';
      default: return 'var(--muted)';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '3px solid rgba(255,255,255,0.3)', 
            borderTop: '3px solid var(--primary-500)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <div style={{ color: 'var(--muted)', fontSize: '16px' }}>Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--danger)' }}>
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <h3>No Profile Data</h3>
          <p>Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '20px' }}>
      {/* Header */}
      <div className="header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Profile
          </h1>
          <p className="text-muted" style={{ fontSize: '16px', marginTop: '8px' }}>
            Manage your account information and settings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate('/account')}
            className="btn btn-ghost"
          >
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="btn btn-accent"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid cols-2" style={{ gap: '32px' }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px', 
            marginBottom: '32px',
            padding: '24px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            borderRadius: 'var(--radius)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(50px, -50px)'
            }}></div>
            <div className="avatar" style={{ 
              background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
              width: '80px',
              height: '80px',
              fontSize: '32px',
              position: 'relative',
              zIndex: 1
            }}>
              {userData.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '24px', marginBottom: '8px' }}>{userData.name}</div>
              <div style={{ opacity: 0.9, fontSize: '16px', marginBottom: '12px' }}>{userData.email}</div>
              <div style={{ 
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {getRoleDisplayName(userData.role)}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: 600, 
              color: 'var(--text)'
            }}>
              Account Information
            </h3>
            <div style={{ 
              display: 'grid', 
              gap: '12px',
              fontSize: '14px',
              color: 'var(--muted)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Member since:</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {new Date(userData.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Account status:</span>
                <span style={{ 
                  color: getStatusColor(userData.status), 
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {userData.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Last updated:</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {new Date(userData.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Information */}
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ 
            margin: '0 0 24px 0', 
            fontSize: '18px', 
            fontWeight: 600, 
            color: 'var(--text)'
          }}>
            {userData.role === 'doctor' ? 'Professional Information' : 
             userData.role === 'patient' ? 'Personal Information' : 
             'Administrative Information'}
          </h3>

          {userData.role === 'doctor' && userData.doctorInfo && (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              fontSize: '14px',
              color: 'var(--muted)'
            }}>
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Specialization</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  {userData.doctorInfo.specialization || 'Not specified'}
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Years of Experience</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  {userData.doctorInfo.yearsOfExperience || '—'} years
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Charges per Hour</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  ₹{userData.doctorInfo.chargePerHour || '—'}
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Available Hours</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  {userData.doctorInfo.availableHours || 'Not specified'}
                </div>
              </div>
            </div>
          )}
          
          {userData.role === 'patient' && userData.patientInfo && (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              fontSize: '14px',
              color: 'var(--muted)'
            }}>
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Age</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  {userData.patientInfo.age || '—'} years
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Gender</div>
                <div style={{ fontSize: '16px', color: 'var(--text)', textTransform: 'capitalize' }}>
                  {userData.patientInfo.gender || '—'}
                </div>
              </div>
            </div>
          )}
          
          {userData.role === 'admin' && (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              fontSize: '14px',
              color: 'var(--muted)'
            }}>
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Role</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  System Administrator
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Access Level</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  Full Access
                </div>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Permissions</div>
                <div style={{ fontSize: '16px', color: 'var(--text)' }}>
                  Manage all users, doctors, and appointments
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '32px', padding: '24px' }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '18px', 
          fontWeight: 600, 
          color: 'var(--text)'
        }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/account')}
            className="btn btn-primary"
          >
            Edit Profile
          </button>
          {userData.role === 'patient' && (
            <button 
              onClick={() => navigate('/patient-dashboard')}
              className="btn btn-ghost"
            >
              View Appointments
            </button>
          )}
          {userData.role === 'doctor' && (
            <button 
              onClick={() => navigate('/doctor-dashboard')}
              className="btn btn-ghost"
            >
              View Schedule
            </button>
          )}
          {userData.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin-dashboard')}
              className="btn btn-ghost"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
