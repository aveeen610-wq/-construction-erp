import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicCompany from './pages/PublicCompany';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Permissions from './pages/Permissions';
import CompanyProfile from './pages/CompanyProfile';
import AttendancePage from './pages/AttendancePage';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectReport from './pages/ProjectReport';
import Accounting from './pages/Accounting';
import Inventory from './pages/Inventory';
import Portfolio from './pages/PortfolioWorks';
import Announcements from './pages/AnnouncementsPage';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import SuperAdminLayout from './components/SuperAdminLayout';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role) && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/company/:id" element={<PublicCompany />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/admin" element={
        isSuperAdmin ? <SuperAdminLayout><AdminDashboard /></SuperAdminLayout> : <Navigate to="/login" />
      } />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="company-profile" element={<CompanyProfile />} />
        <Route path="employees" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><Employees /></ProtectedRoute>} />
        <Route path="employees/add" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><EmployeeForm /></ProtectedRoute>} />
        <Route path="employees/:id/edit" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><EmployeeForm /></ProtectedRoute>} />
        <Route path="permissions" element={<ProtectedRoute allowedRoles={['owner', 'manager']}><Permissions /></ProtectedRoute>} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/report" element={<ProjectReport />} />
        <Route path="accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="top-left" rtl />
    </AuthProvider>
  );
}
