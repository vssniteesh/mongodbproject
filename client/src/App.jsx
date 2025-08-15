import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TwoFactor from './pages/TwoFactor';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import DoctorsList from './pages/DoctorsList';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDoctors from './pages/AdminDoctors';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/two-factor" element={<TwoFactor />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/doctors" element={<DoctorsList />} />
        {/* Dashboard routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-doctors" element={<AdminDoctors />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient-dashboard" element={<DoctorsList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
