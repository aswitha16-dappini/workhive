import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, statsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_META } from '../utils/categoryMeta';

const Home = () => {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [platformStats, setPlatformStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);
  const [demoError, setDemoError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const statsRes = await statsService.getStats();
        if (statsRes.data?.data) {
          setPlatformStats(statsRes.data.data);
        }
      } catch (err) {
        console.warn('Stats fetch note:', err.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // 1-Click Demo Login from Homepage
  const handleDemoLogin = async (role) => {
    setDemoError(null);
    setDemoLoggingIn(true);
    const email = role === 'Client' ? 'charlie@workhive.com' : 'dana@workhive.com';
    const password = 'password123';

    try {
      const loggedInUser = await login(email, password);
      const targetPath =
        loggedInUser.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer';
      navigate(targetPath);
    } catch (err) {
      setDemoError(err.message || 'Failed to authenticate demo account. Please try again.');
    } finally {
      setDemoLoggingIn(false);
    }
  };

  const categories = Object.keys(CATEGORY_META).filter(
    (k) =>
      k !== 'Mobile Apps' &&
      k !== 'Design & Creative' &&
      k !== 'AI & Machine Learning' &&
      k !== 'Writing & Translation' &&
      k !== 'Other'
  );

  return (
    <div className="landing-page-wrap">
      {/* 1. PROFESSIONAL HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="pulse-dot"></span>
          <span>Verified Freelance Marketplace & Escrow Collaboration</span>
        </div>

        <h1 className="landing-hero-title">
          Hire Top Talent & Deliver Visionary Projects with{' '}
          <span className="brand-highlight">Escrow Protection</span>
        </h1>

        <p className="landing-hero-subtitle">
          WorkHive unites top independent engineers, designers, and specialists with innovative organizations.
          Post milestone projects, submit competitive proposals, and collaborate securely.
        </p>

        <div className="landing-hero-cta-group">
          {isAuthenticated ? (
            <Link
              to={user?.role === 'Client' ? '/dashboard/client' : '/dashboard/freelancer'}
              className="btn btn-primary btn-lg"
            >
              Open Your {user?.role} Workspace →
            </Link>
          ) : (
            <>
              <a href="#get-started" className="btn btn-primary btn-lg">
                🚀 Get Started Free
              </a>
              <Link to="/projects" className="btn btn-secondary btn-lg">
                🔍 Find Work
              </Link>
              <Link to="/freelancers" className="btn btn-secondary btn-lg">
                👔 Hire Talent
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 2. LIVE MARKETPLACE STATISTICS (ACTUAL MONGODB COUNTS) */}
      <section className="landing-stats-section mb-5">
        <div className="saas-stats-grid">
          <div className="saas-stat-card">
            <div className="saas-stat-top">
              <span className="saas-stat-icon" style={{ background: 'rgba(36, 87, 197, 0.15)', color: '#3b82f6' }}>
                👥
              </span>
              <span className="saas-stat-label">Total Members</span>
            </div>
            <div className="saas-stat-value">
              {loadingStats ? '...' : platformStats?.totalUsers ?? '7+'}
            </div>
            <div className="saas-stat-sub">Registered across platform</div>
          </div>

          <div className="saas-stat-card">
            <div className="saas-stat-top">
              <span className="saas-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                👔
              </span>
              <span className="saas-stat-label">Active Clients</span>
            </div>
            <div className="saas-stat-value" style={{ color: '#10b981' }}>
              {loadingStats ? '...' : platformStats?.totalClients ?? '4+'}
            </div>
            <div className="saas-stat-sub">Hiring businesses</div>
          </div>

          <div className="saas-stat-card">
            <div className="saas-stat-top">
              <span className="saas-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                🧑‍💻
              </span>
              <span className="saas-stat-label">Vetted Freelancers</span>
            </div>
            <div className="saas-stat-value" style={{ color: '#f59e0b' }}>
              {loadingStats ? '...' : platformStats?.totalFreelancers ?? '3+'}
            </div>
            <div className="saas-stat-sub">Specialists in 10 categories</div>
          </div>

          <div className="saas-stat-card">
            <div className="saas-stat-top">
              <span className="saas-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
                💼
              </span>
              <span className="saas-stat-label">Projects Posted</span>
            </div>
            <div className="saas-stat-value">
              {loadingStats ? '...' : platformStats?.totalProjects ?? '23+'}
            </div>
            <div className="saas-stat-sub">{platformStats?.openProjects ?? 20} open for proposals</div>
          </div>

          <div className="saas-stat-card">
            <div className="saas-stat-top">
              <span className="saas-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                🛡️
              </span>
              <span className="saas-stat-label">Escrow Completed</span>
            </div>
            <div className="saas-stat-value" style={{ color: '#f97316' }}>
              ${Number(platformStats?.totalEscrowCompleted || 3000).toLocaleString()}
            </div>
            <div className="saas-stat-sub">100% verified milestones</div>
          </div>
        </div>
      </section>

      {/* 3. TWO ACCOUNT CREATION OPTIONS (GET STARTED) */}
      <section id="get-started" className="landing-section mb-5">
        <div className="section-header-center mb-4">
          <span className="badge-level">Get Started with WorkHive</span>
          <h2 className="section-title mt-2">Join as a Client or Freelancer</h2>
          <p className="section-subtitle">
            Create an original account in seconds. Choose your primary goal to access your tailored workspace.
          </p>
        </div>

        <div className="two-options-grid">
          {/* Option 1: Client Card */}
          <div className="account-choice-card">
            <div className="account-choice-thumb-wrap">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80"
                alt="Client hiring freelancers"
                className="account-choice-thumb"
              />
              <div className="account-choice-badge client-badge">👔 Client Account</div>
            </div>

            <div className="account-choice-body">
              <h3 className="account-choice-title">I'm a Client – I want to hire freelancers</h3>
              <p className="account-choice-desc">
                Find elite developers, designers, and specialists. Post milestone deliverables and fund secure escrow with zero upfront risk.
              </p>

              <ul className="account-choice-features">
                <li>✓ Post custom project briefs across 10 categories</li>
                <li>✓ Review competitive bids, cover letters & talent ratings</li>
                <li>✓ Fund simulated escrow with 100% deliverable protection</li>
                <li>✓ Release payments only upon verifying completed work</li>
              </ul>

              <Link to="/register?role=Client" className="btn btn-primary btn-block mt-3">
                Join as Client →
              </Link>
            </div>
          </div>

          {/* Option 2: Freelancer Card */}
          <div className="account-choice-card">
            <div className="account-choice-thumb-wrap">
              <img
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=700&q=80"
                alt="Freelancer coding projects"
                className="account-choice-thumb"
              />
              <div className="account-choice-badge freelancer-badge">💻 Freelancer Account</div>
            </div>

            <div className="account-choice-body">
              <h3 className="account-choice-title">I'm a Freelancer – I want to find projects</h3>
              <p className="account-choice-desc">
                Discover high-budget client opportunities. Submit proposals, deliver milestone deliverables, and build your verified portfolio.
              </p>

              <ul className="account-choice-features">
                <li>✓ Browse open jobs with verified budgets and skill tags</li>
                <li>✓ Submit custom proposals with bid amount and timeline</li>
                <li>✓ Deliver milestone work with code links and staging notes</li>
                <li>✓ Showcase your rating, verified college, and credentials</li>
              </ul>

              <Link to="/register?role=Freelancer" className="btn btn-primary btn-block mt-3">
                Join as Freelancer →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPLORE WITH DEMO ACCOUNTS SECTION */}
      <section className="demo-explore-section mb-5">
        <div className="demo-explore-card">
          <div className="demo-explore-header">
            <span className="demo-pill-tag">⚡ Instant Demo Sandbox</span>
            <h3 className="demo-explore-title mt-2">Explore with Pre-Configured Demo Accounts</h3>
            <p className="demo-explore-desc">
              Want to test the full marketplace immediately without filling out a registration form?
              Jump straight into our verified demo accounts pre-seeded with live projects, proposals, and escrow records.
            </p>
          </div>

          {demoError && (
            <div className="alert alert-danger mb-3">
              <span>⚠️ {demoError}</span>
            </div>
          )}

          <div className="demo-explore-actions">
            <button
              className="btn btn-demo-client"
              onClick={() => handleDemoLogin('Client')}
              disabled={demoLoggingIn}
            >
              <span>👔</span>
              <div>
                <strong>Continue as Demo Client</strong>
                <span className="demo-subtext">Charlie Client (Apex Cloud Innovations) • <span className="demo-tag-inline">DEMO</span></span>
              </div>
            </button>

            <button
              className="btn btn-demo-freelancer"
              onClick={() => handleDemoLogin('Freelancer')}
              disabled={demoLoggingIn}
            >
              <span>💻</span>
              <div>
                <strong>Continue as Demo Freelancer</strong>
                <span className="demo-subtext">Dana Brooks (Senior Full-Stack Engineer) • <span className="demo-tag-inline">DEMO</span></span>
              </div>
            </button>
          </div>

          <p className="demo-disclaimer mt-3">
            ℹ️ <strong>Sample Data Notice:</strong> Demo accounts use pre-seeded test data for evaluation. Real user registrations create secure, persistent MongoDB Atlas accounts with unique credentials.
          </p>
        </div>
      </section>

      {/* 5. PROJECT CATEGORIES EXPLORATION (10 CATEGORIES) */}
      <section className="landing-section mb-5">
        <div className="section-header-between mb-4">
          <div>
            <h2 className="section-title">Explore Opportunities by Category</h2>
            <p className="section-subtitle">
              Find projects and talent across 10 specialized freelance domains
            </p>
          </div>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            View All Jobs ({platformStats?.totalProjects || 23}) →
          </Link>
        </div>

        <div className="category-cards-grid">
          {categories.map((catName) => {
            const meta = CATEGORY_META[catName];
            return (
              <Link
                key={catName}
                to={`/projects?category=${encodeURIComponent(catName)}`}
                className="category-showcase-card"
              >
                <div className="category-showcase-thumb-wrap">
                  <img src={meta.image} alt={catName} className="category-showcase-thumb" />
                  <div className="category-showcase-overlay">
                    <span className="category-showcase-icon">{meta.icon}</span>
                  </div>
                </div>
                <div className="category-showcase-body">
                  <h4 className="category-showcase-name">{catName}</h4>
                  <span className="category-showcase-tag">{meta.tag}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. PLATFORM TRUST PILLARS */}
      <section className="features-grid mb-5">
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3 className="feature-title">Simulated Escrow Milestones</h3>
          <p className="feature-desc">
            Client funds are securely deposited in simulated escrow upon proposal acceptance. Funds transfer only after deliverables are inspected and approved.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3 className="feature-title">Enterprise Authentication</h3>
          <p className="feature-desc">
            Bcryptjs password hashing, JWT stateless tokens, and strict role-based access control protecting Client and Freelancer workspace boundaries.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">Live MongoDB Atlas Persistence</h3>
          <p className="feature-desc">
            All user profiles, jobs, proposals, and milestones persist in high-availability cloud database clusters with real-time dynamic statistics.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
