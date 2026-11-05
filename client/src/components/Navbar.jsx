import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    return user.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer';
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand">
          <svg className="brand-icon" viewBox="0 0 100 100">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#f59e0b" stroke="#d97706" strokeWidth="4" />
            <polygon points="50,22 75,35 75,65 50,78 25,65 25,35" fill="#0f172a" />
            <circle cx="50" cy="50" r="10" fill="#f59e0b" />
          </svg>
          <span className="brand-name">Work<span className="brand-highlight">Hive</span></span>
        </Link>

        {/* Global Directory Links */}
        <div className="nav-links">
          <Link to="/projects" className="nav-link">
            Find Work
          </Link>
          <Link to="/freelancers" className="nav-link">
            Find Talent
          </Link>
        </div>
      </div>

      <div className="nav-actions">
        {isAuthenticated && user ? (
          <div className="user-nav-group">
            {user.role === 'Client' ? (
              <>
                <Link to="/profile/client" className="nav-btn nav-btn-outline">
                  Company Profile
                </Link>
                <Link to="/post-project" className="nav-btn nav-btn-primary">
                  + Post Job
                </Link>
              </>
            ) : (
              <Link to="/profile/me" className="nav-btn nav-btn-outline">
                My Profile
              </Link>
            )}

            <Link to={getDashboardPath()} className="nav-btn nav-btn-outline">
              Dashboard
            </Link>
            
            <div className="user-profile-badge">
              <img
                src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="user-avatar"
              />
              <div className="user-info-text">
                <span className="user-name">{user.name}</span>
                <span className={`role-pill role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <button onClick={handleLogout} className="nav-btn nav-btn-danger">
              Logout
            </button>
          </div>
        ) : (
          <div className="guest-nav-group">
            <Link to="/login" className="nav-btn nav-btn-ghost">
              Sign In
            </Link>
            <Link to="/register" className="nav-btn nav-btn-primary">
              Join WorkHive
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
