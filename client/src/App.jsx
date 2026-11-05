import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BrowseProjects from './pages/BrowseProjects';
import ProjectDetails from './pages/ProjectDetails';
import BrowseFreelancers from './pages/BrowseFreelancers';
import PostProject from './pages/PostProject';
import EditProject from './pages/EditProject';
import CreateProfile from './pages/CreateProfile';
import EditProfile from './pages/EditProfile';
import FreelancerProfile from './pages/FreelancerProfile';
import PublicProfile from './pages/PublicProfile';
import ClientProfile from './pages/ClientProfile';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import './App.css';

// Component to dynamically route /dashboard to the user's role-specific view
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'Client' ? (
    <Navigate to="/dashboard/client" replace />
  ) : (
    <Navigate to="/dashboard/freelancer" replace />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />

          <ErrorBoundary>
            <Routes>
              {/* Public Marketplace Directory Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<BrowseProjects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/freelancers" element={<BrowseFreelancers />} />
              <Route path="/freelancers/:id" element={<PublicProfile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Dashboard Redirector */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Client-Only Protected Routes */}
              <Route
                path="/dashboard/client"
                element={
                  <ProtectedRoute allowedRoles={['Client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-project"
                element={
                  <ProtectedRoute allowedRoles={['Client']}>
                    <PostProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['Client']}>
                    <EditProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/client"
                element={
                  <ProtectedRoute allowedRoles={['Client']}>
                    <ClientProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/client/:id" element={<ClientProfile isPublic={true} />} />

              {/* Freelancer-Only Protected Routes */}
              <Route
                path="/dashboard/freelancer"
                element={
                  <ProtectedRoute allowedRoles={['Freelancer']}>
                    <FreelancerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/me"
                element={
                  <ProtectedRoute allowedRoles={['Freelancer']}>
                    <FreelancerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/create"
                element={
                  <ProtectedRoute allowedRoles={['Freelancer']}>
                    <CreateProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute allowedRoles={['Freelancer']}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>

          <footer className="footer">
            <p>WorkHive Platform © 2026. Built with React, Vite, Express, and MongoDB Atlas.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
