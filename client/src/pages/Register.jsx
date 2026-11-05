import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'Client' ? 'Client' : 'Freelancer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'Client' || roleParam === 'Freelancer') {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setValidationError('');
    setError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({
      ...formData,
      role: selectedRole,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    // Form validations
    if (!cleanName) {
      setValidationError('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setValidationError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await register(
        cleanName,
        cleanEmail,
        formData.password,
        formData.role
      );

      // Redirect to role dashboard
      const targetPath =
        newUser.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer';
      navigate(targetPath);
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">🚀</div>
          <h2 className="auth-title">Join WorkHive</h2>
          <p className="auth-subtitle">Create your account and choose your path</p>
        </div>

        {/* Error Banners */}
        {(validationError || error) && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selection Cards */}
          <div className="form-group">
            <label className="form-label">I want to join WorkHive as:</label>
            <div className="role-selector-grid">
              <div
                className={`role-card ${formData.role === 'Client' ? 'role-card-active' : ''}`}
                onClick={() => handleRoleSelect('Client')}
              >
                <div className="role-card-icon">👔</div>
                <div className="role-card-content">
                  <h4 className="role-card-title">I'm a Client</h4>
                  <p className="role-card-desc">I want to hire freelancers & post projects.</p>
                </div>
                <div className="role-radio-check">
                  {formData.role === 'Client' && '✓'}
                </div>
              </div>

              <div
                className={`role-card ${formData.role === 'Freelancer' ? 'role-card-active' : ''}`}
                onClick={() => handleRoleSelect('Freelancer')}
              >
                <div className="role-card-icon">💻</div>
                <div className="role-card-content">
                  <h4 className="role-card-title">I'm a Freelancer</h4>
                  <p className="role-card-desc">I want to find projects & submit proposals.</p>
                </div>
                <div className="role-radio-check">
                  {formData.role === 'Freelancer' && '✓'}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              className="form-input"
              autoComplete="name"
              required
            />
          </div>

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

          <div className="form-row">
            <div className="form-group form-col">
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
                placeholder="Min 6 characters"
                className="form-input"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="form-input"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : `Register as ${formData.role}`}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted">
            Want to test without registering?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Use 1-Click Demo Accounts →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

