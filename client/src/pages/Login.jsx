import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setValidationError('');
    setError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !formData.password) {
      setValidationError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(cleanEmail, formData.password);
      
      // Redirect to intended location or role dashboard
      const intendedDestination = location.state?.from?.pathname;
      if (intendedDestination && !intendedDestination.includes('/login')) {
        navigate(intendedDestination);
      } else {
        const targetPath =
          loggedInUser.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer';
        navigate(targetPath);
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click direct login for Demo accounts
  const handleQuickDemoLogin = async (role) => {
    setValidationError('');
    setError(null);
    setSubmitting(true);
    const email = role === 'Client' ? 'charlie@workhive.com' : 'dana@workhive.com';
    const password = 'password123';
    try {
      const loggedInUser = await login(email, password);
      const targetPath =
        loggedInUser.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer';
      navigate(targetPath);
    } catch (err) {
      setValidationError('Failed to sign in to demo account. Please try manual entry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to fill demo account credentials into form
  const fillDemoAccount = (role) => {
    if (role === 'Client') {
      setFormData({
        email: 'charlie@workhive.com',
        password: 'password123',
      });
    } else {
      setFormData({
        email: 'dana@workhive.com',
        password: 'password123',
      });
    }
    setValidationError('');
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">🐝</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Log in to your WorkHive workspace</p>
        </div>

        {/* Error Banners */}
        {(validationError || error) && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="form-input"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="form-input"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Explore with Demo Accounts Section */}
        <div className="demo-accounts-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span className="demo-box-title" style={{ margin: 0 }}>⚡ Explore with Demo Accounts</span>
            <span className="demo-tag-inline">SAMPLE DATA</span>
          </div>
          <p className="text-muted text-sm" style={{ marginBottom: '0.85rem' }}>
            Log in immediately to test pre-loaded projects, proposals, and milestones:
          </p>
          <div className="demo-btn-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-client"
              onClick={() => handleQuickDemoLogin('Client')}
              disabled={submitting}
              title="Sign in as Charlie Client (charlie@workhive.com)"
            >
              👔 Continue as Demo Client <span className="demo-tag-inline" style={{ marginLeft: '4px' }}>DEMO</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-freelancer"
              onClick={() => handleQuickDemoLogin('Freelancer')}
              disabled={submitting}
              title="Sign in as Dana Brooks (dana@workhive.com)"
            >
              💻 Continue as Demo Freelancer <span className="demo-tag-inline" style={{ marginLeft: '4px' }}>DEMO</span>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

