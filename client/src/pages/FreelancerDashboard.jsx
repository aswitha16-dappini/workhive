import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  authService,
  profileService,
  projectService,
  proposalService,
  milestoneService,
  statsService,
} from '../services/api';
import { getCategoryMeta } from '../utils/categoryMeta';

const FreelancerDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'proposals' | 'contracts' | 'skills' | 'security'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Data states
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [myMilestones, setMyMilestones] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // RBAC test states
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testingRbac, setTestingRbac] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profRes, projRes, propRes, mileRes, statsRes] = await Promise.all([
        profileService.getMyProfile().catch(() => ({ data: { data: null } })),
        projectService.getAll().catch(() => ({ data: { data: [] } })),
        proposalService.getMyProposals().catch(() => ({ data: { data: [] } })),
        milestoneService.getMyMilestones().catch(() => ({ data: { data: [] } })),
        statsService.getStats().catch(() => ({ data: { data: null } })),
      ]);

      setProfile(profRes.data?.data || null);
      setProjects(projRes.data?.data || []);
      setMyProposals(propRes.data?.data || []);
      setMyMilestones(mileRes.data?.data || []);
      setPlatformStats(statsRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load freelancer dashboard data:', err);
      setFeedback({ type: 'error', message: 'Unable to synchronize workspace data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Submit Milestone Deliverable Work
  const handleSubmitWork = async (milestoneId) => {
    if (!submissionNotes.trim()) {
      alert('Please describe your delivered work, code repository links, or staging URLs.');
      return;
    }
    setActionLoading(true);
    try {
      await milestoneService.submitWork(milestoneId, { submissionNotes });
      setFeedback({
        type: 'success',
        message: 'Milestone deliverable submitted successfully! Client has been notified for review.',
      });
      setSubmittingMilestoneId(null);
      setSubmissionNotes('');
      await fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit milestone deliverable.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // RBAC Live Verification
  const testRoleEndpoint = async (type) => {
    setTestingRbac(true);
    setApiTestResult(null);
    try {
      if (type === 'freelancer') {
        const res = await authService.getFreelancerData();
        setApiTestResult({
          type: 'success',
          status: res.status,
          message: res.data?.message || 'Authorized as Freelancer',
        });
      } else {
        const res = await authService.getClientData();
        setApiTestResult({
          type: 'success',
          status: res.status,
          message: res.data?.message || 'Access granted',
        });
      }
    } catch (err) {
      setApiTestResult({
        type: 'forbidden',
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setTestingRbac(false);
    }
  };

  // Profile Completion Calculation
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.fullName) score += 15;
    if (profile.professionalTitle) score += 15;
    if (profile.bio) score += 15;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.hourlyRate) score += 15;
    if (profile.collegeName || profile.education) score += 10;
    if (profile.portfolioLinks?.length > 0 || profile.githubLink || profile.linkedinLink) score += 10;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion();

  // Statistics
  const totalSubmitted = myProposals.length;
  const pendingProposals = myProposals.filter((p) => p.status === 'Pending').length;
  const acceptedProposals = myProposals.filter((p) => p.status === 'Accepted').length;
  const acceptedList = myProposals.filter((p) => p.status === 'Accepted');
  const activeContractsCount = myMilestones.filter(
    (m) => m.status === 'Funded_Escrow' || m.status === 'In_Progress' || m.status === 'Submitted'
  ).length;
  const completedContractsCount = myMilestones.filter(
    (m) => m.escrowStatus === 'Released_To_Freelancer'
  ).length;
  const totalEarnedInEscrow = myMilestones
    .filter((m) => m.escrowStatus === 'Released_To_Freelancer')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  const currentInEscrow = myMilestones
    .filter((m) => m.escrowStatus === 'Funded_In_Escrow')
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const displayName = profile?.fullName || user?.name || 'Freelancer';
  const displayAvatar =
    user?.profileImage ||
    profile?.profileImage ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
  const displayTitle = profile?.professionalTitle || 'Professional Freelancer';
  const displayRating = Number(profile?.rating ?? 5.0).toFixed(1);

  return (
    <div className="dashboard-container">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} mb-4`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* PART B.1: Professional Welcome & Profile Completion Banner */}
      <div className="freelancer-hero-banner">
        <div className="freelancer-hero-left">
          <img src={displayAvatar} alt={displayName} className="freelancer-hero-avatar" />
          <div>
            <div className="freelancer-hero-title-row">
              <h1 className="freelancer-hero-name">Welcome back, {displayName}</h1>
              <span className="role-pill role-freelancer">Freelancer Workspace</span>
            </div>
            <p className="freelancer-hero-sub">
              ⭐ <strong>{displayTitle}</strong> • 💰 ${profile?.hourlyRate || 50}/hr • ⭐ {displayRating} Rating
            </p>

            {/* Profile Completion Bar */}
            <div className="profile-completion-wrap mt-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span className="text-muted">Profile Strength: {profileCompletion}% Complete</span>
                <Link to="/profile/edit" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {profileCompletion < 100 ? 'Boost Profile →' : 'Edit Profile'}
                </Link>
              </div>
              <div className="completion-bar-bg">
                <div
                  className="completion-bar-fill"
                  style={{
                    width: `${profileCompletion}%`,
                    background:
                      profileCompletion === 100
                        ? '#10b981'
                        : profileCompletion > 60
                        ? 'var(--primary)'
                        : '#f97316',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="freelancer-hero-actions">
          <Link to="/projects" className="btn btn-primary btn-post-cta">
            🔍 Browse Open Jobs
          </Link>
          <Link to="/profile/me" className="btn btn-secondary">
            👤 View My Profile
          </Link>
          <Link to="/profile/edit" className="btn btn-secondary">
            ✏️ Edit Profile
          </Link>
        </div>
      </div>

      {/* PART B.2: Modern SaaS Statistics Cards Grid */}
      <div className="saas-stats-grid mb-4">
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(36, 87, 197, 0.15)', color: '#3b82f6' }}>
              📄
            </span>
            <span className="saas-stat-label">Submitted Bids</span>
          </div>
          <div className="saas-stat-value">{totalSubmitted}</div>
          <div className="saas-stat-sub">Active & historical proposals</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              ⏳
            </span>
            <span className="saas-stat-label">Pending Review</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#f59e0b' }}>
            {pendingProposals}
          </div>
          <div className="saas-stat-sub">Awaiting client decision</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              🤝
            </span>
            <span className="saas-stat-label">Accepted Contracts</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#10b981' }}>
            {acceptedProposals}
          </div>
          <div className="saas-stat-sub">Hired proposals</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              ⚡
            </span>
            <span className="saas-stat-label">Active Milestones</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#a855f7' }}>
            {activeContractsCount}
          </div>
          <div className="saas-stat-sub">Deliverables in progress</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              🏆
            </span>
            <span className="saas-stat-label">Completed Deliverables</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#34d399' }}>
            {completedContractsCount}
          </div>
          <div className="saas-stat-sub">Approved & paid</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              🛡️
            </span>
            <span className="saas-stat-label">Simulated Escrow</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#f97316' }}>
            ${currentInEscrow.toLocaleString()}
          </div>
          <div className="saas-stat-sub">${totalEarnedInEscrow.toLocaleString()} total released</div>
        </div>
      </div>

      {/* 🎉 Accepted Proposal Celebration Alert */}
      {acceptedProposals > 0 && (
        <div
          className="content-card mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                🎉
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.2rem', fontWeight: 700 }}>
                  🎉 Congratulations – Your Proposal Has Been Accepted!
                </h3>
                <p className="text-muted text-sm" style={{ margin: '0.25rem 0 0 0' }}>
                  You have been hired for{' '}
                  <strong>{acceptedList[0]?.project?.title || 'a client project'}</strong> by{' '}
                  <strong>{acceptedList[0]?.project?.client?.name || 'Client'}</strong> with an agreed bid of{' '}
                  <strong style={{ color: '#10b981' }}>${acceptedList[0]?.bidAmount}</strong>.
                  {acceptedList.length > 1 && ` (+${acceptedList.length - 1} other accepted contracts)`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab('contracts')}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                🚀 View Escrow & Deliverables
              </button>
              {acceptedList[0]?.project?._id && (
                <Link
                  to={`/projects/${acceptedList[0]?.project?._id}`}
                  className="btn btn-secondary"
                >
                  View Project Room
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Navigation Tabs */}
      <div className="dashboard-tab-bar mb-4">
        <button
          className={`dashboard-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          🔍 Discover Jobs ({projects.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📄 My Submitted Proposals ({myProposals.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          🛡️ Active Contracts & Escrow ({myMilestones.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          ⭐ Skills & Credentials
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Role Authorization Check
        </button>
      </div>

      {/* TAB 1: VISUAL PROJECT DISCOVERY */}
      {activeTab === 'projects' && (
        <div>
          {/* Category Quick Filter */}
          <div className="dashboard-subfilter-row mb-4">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Web Development', 'Mobile App Development', 'UI/UX Design', 'Data Analytics', 'DevOps & Cloud'].map(
                (cat) => (
                  <button
                    key={cat}
                    className={`subfilter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <Link to="/projects" className="btn btn-secondary btn-sm">
              All 10 Marketplace Categories →
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Fetching opportunities from database...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📁</div>
              <h3>No jobs found in this category</h3>
              <p>Check other categories or browse all jobs in the marketplace.</p>
              <button className="btn btn-primary mt-2" onClick={() => setSelectedCategory('All')}>
                View All Categories
              </button>
            </div>
          ) : (
            <div className="visual-project-grid">
              {filteredProjects.slice(0, 12).map((project) => {
                const meta = getCategoryMeta(project.category);
                const isBidSubmitted = myProposals.some(
                  (p) => (p.project?._id || p.project) === project._id
                );

                return (
                  <div key={project._id} className="visual-project-card">
                    {/* Visual Category Thumbnail with Fallback */}
                    <div className="visual-card-thumb-wrap">
                      <img
                        src={meta.image}
                        alt={project.category}
                        className="visual-card-thumb"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="visual-card-overlay">
                        <span className="visual-card-cat-badge">
                          {meta.icon} {project.category}
                        </span>
                        <span className={`status-pill status-${project.status.toLowerCase().replace(' ', '-')}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <div className="visual-card-body">
                      <h3 className="visual-card-title">
                        <Link to={`/projects/${project._id}`}>{project.title}</Link>
                      </h3>

                      <p className="visual-card-desc">
                        {project.description?.length > 120
                          ? `${project.description.slice(0, 120)}...`
                          : project.description}
                      </p>

                      <div className="visual-card-client-row">
                        <span className="text-muted text-sm">
                          Posted by: <strong>{project.client?.name || 'Verified Client'}</strong>
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="skills-pill-group mb-3">
                        {project.skillsRequired?.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="skill-tag skill-tag-sm">
                            {skill}
                          </span>
                        ))}
                        {project.skillsRequired?.length > 4 && (
                          <span className="text-muted text-sm">+{project.skillsRequired.length - 4}</span>
                        )}
                      </div>

                      {/* Financial Meta */}
                      <div className="visual-card-meta-row">
                        <div>
                          <div className="meta-label">Budget</div>
                          <div className="meta-value">${project.budget} USD</div>
                        </div>
                        <div>
                          <div className="meta-label">Est. Timeline</div>
                          <div className="meta-value">⏱️ {project.deadlineDays} Days</div>
                        </div>
                        <div>
                          <div className="meta-label">Proposals</div>
                          <div className="meta-value">📄 {project.proposalsCount || 0}</div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="visual-card-actions">
                        <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm">
                          View Scope
                        </Link>

                        {isBidSubmitted ? (
                          <span className="badge badge-success" style={{ padding: '0.45rem 0.75rem' }}>
                            ✓ Proposal Submitted
                          </span>
                        ) : project.status === 'Open' ? (
                          <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
                            🚀 Submit Proposal
                          </Link>
                        ) : (
                          <span className="badge badge-warning" style={{ padding: '0.45rem 0.75rem' }}>
                            {project.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPOSAL TRACKING */}
      {activeTab === 'proposals' && (
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">My Submitted Proposals & Statuses</h3>
              <p className="text-muted text-sm">
                Track all incoming client decisions, accepted contracts, and proposed bids.
              </p>
            </div>
            <span className="badge-level">{myProposals.length} Proposals Submitted</span>
          </div>

          {myProposals.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📄</div>
              <h3>No proposals submitted yet</h3>
              <p>Explore marketplace jobs and submit your proposal with your proposed milestone budget.</p>
              <Link to="/projects" className="btn btn-primary mt-2">
                Browse Open Projects
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>My Bid</th>
                    <th>Est. Delivery</th>
                    <th>Status</th>
                    <th>Submitted On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myProposals.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <strong>{p.project?.title || 'Project'}</strong>
                        {p.coverLetter && (
                          <div className="text-muted text-sm mt-1" style={{ maxWidth: '300px' }}>
                            "{p.coverLetter.length > 80 ? `${p.coverLetter.slice(0, 80)}...` : p.coverLetter}"
                          </div>
                        )}
                      </td>
                      <td>{p.project?.client?.name || 'Verified Client'}</td>
                      <td>
                        <strong>${p.bidAmount} USD</strong>
                      </td>
                      <td>⏱️ {p.deliveryDays} Days</td>
                      <td>
                        <span className={`status-pill status-${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link
                          to={`/projects/${p.project?._id || p.project}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Project →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE CONTRACTS & ESCROW MILESTONES */}
      {activeTab === 'contracts' && (
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Active Contracts & Deliverable Submissions</h3>
              <p className="text-muted text-sm">
                Deliver work for funded milestones. Clients approve deliverables to release simulated escrow payouts.
              </p>
            </div>
            <span className="badge badge-success">
              ${myMilestones.reduce((s, m) => s + (m.amount || 0), 0).toLocaleString()} Total Contract Value
            </span>
          </div>

          {myMilestones.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">🛡️</div>
              <h3>No active contracts yet</h3>
              <p>Once a client accepts your proposal, your project milestones and escrow deposit will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myMilestones.map((m, idx) => (
                <div
                  key={m._id}
                  className="content-card"
                  style={{
                    borderLeft:
                      m.escrowStatus === 'Released_To_Freelancer'
                        ? '4px solid #10b981'
                        : m.status === 'Submitted'
                        ? '4px solid #f59e0b'
                        : '4px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700 }}>#{idx + 1}</span>
                        <h4 style={{ margin: 0 }}>{m.title}</h4>
                      </div>
                      <p className="text-muted text-sm mt-1">{m.description}</p>
                      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge-rate">💰 Escrow: ${m.amount} USD</span>
                        <span className="badge-level">Project: {m.project?.title || 'Project'}</span>
                        <span className={`status-pill status-${m.status.toLowerCase().replace('_', '-')}`}>
                          Status: {m.status.replace('_', ' ')}
                        </span>
                        <span className={`status-pill ${m.escrowStatus === 'Released_To_Freelancer' ? 'status-completed' : 'status-open'}`}>
                          🛡️ {m.escrowStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Submit Deliverable button */}
                      {(m.status === 'Funded_Escrow' || m.status === 'In_Progress') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSubmittingMilestoneId(m._id)}
                        >
                          📤 Submit Deliverable
                        </button>
                      )}

                      <Link to={`/projects/${m.project?._id || m.project}`} className="btn btn-secondary btn-sm">
                        View Project Scope →
                      </Link>
                    </div>
                  </div>

                  {/* Submission Notes display if already submitted */}
                  {m.submissionNotes && (
                    <div className="mt-3 p-2" style={{ background: 'var(--bg-input)', borderRadius: '6px' }}>
                      <p className="text-sm" style={{ margin: 0 }}>
                        <strong>Delivered Notes:</strong> {m.submissionNotes}
                      </p>
                      {m.submittedAt && (
                        <span className="text-sm text-muted">
                          Submitted on {new Date(m.submittedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Deliverable submission dialog */}
                  {submittingMilestoneId === m._id && (
                    <div className="mt-3 p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: '8px' }}>
                      <h5>Submit Work Deliverable for Milestone #{idx + 1}</h5>
                      <textarea
                        className="form-input mt-2"
                        rows="3"
                        placeholder="Provide git repository links, staging URLs, or notes on completed deliverables for the client to review..."
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                      ></textarea>
                      <div className="mt-2" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleSubmitWork(m._id)}
                        >
                          {actionLoading ? 'Submitting...' : 'Submit to Client for Escrow Release'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSubmittingMilestoneId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PORTFOLIO & SKILLS */}
      {activeTab === 'skills' && (
        <div className="profile-layout-grid">
          <div className="profile-main-col">
            <div className="content-card">
              <div className="content-card-header">
                <h3 className="content-card-title">Professional Overview</h3>
                <Link to="/profile/edit" className="btn btn-secondary btn-sm">
                  ✏️ Edit Profile
                </Link>
              </div>
              <p className="profile-bio-text" style={{ whiteSpace: 'pre-wrap' }}>
                {profile?.bio || 'No biography provided yet. Add an about me section in Edit Profile.'}
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Tech Stack & Verified Skills</h3>
              <div className="skills-badge-grid">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag skill-tag-lg">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-muted">No skills listed yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-side-col">
            <div className="content-card">
              <h3 className="content-card-title">Credentials</h3>
              <div className="profile-meta-list">
                <div className="profile-meta-item">
                  <span className="profile-meta-label">Hourly Rate:</span>
                  <span className="profile-meta-value">${profile?.hourlyRate || 50}/hr</span>
                </div>
                <div className="profile-meta-item">
                  <span className="profile-meta-label">Experience:</span>
                  <span className="profile-meta-value">{profile?.experienceLevel || 'Expert'}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="profile-meta-label">Location:</span>
                  <span className="profile-meta-value">{profile?.location || 'Remote'}</span>
                </div>
                {profile?.collegeName && (
                  <div className="profile-meta-item">
                    <span className="profile-meta-label">Education:</span>
                    <span className="profile-meta-value">{profile?.collegeName}</span>
                  </div>
                )}
              </div>

              {/* Social and Portfolio links */}
              {(profile?.githubLink || profile?.linkedinLink) && (
                <div className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {profile.githubLink && (
                    <a
                      href={profile.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm text-center"
                    >
                      GitHub Profile ↗
                    </a>
                  )}
                  {profile.linkedinLink && (
                    <a
                      href={profile.linkedinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm text-center"
                    >
                      LinkedIn Profile ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RBAC AUTHORIZATION TEST CARD */}
      {activeTab === 'security' && (
        <div className="rbac-card">
          <div className="rbac-header">
            <div className="rbac-icon">🛡️</div>
            <div>
              <h3 className="rbac-title">Role-Based Authorization Verification (Module 1 Guard)</h3>
              <p className="rbac-desc">
                Test your JWT token permissions against protected Express API endpoints in real-time.
              </p>
            </div>
          </div>

          <div className="rbac-actions">
            <button
              className="btn btn-secondary"
              onClick={() => testRoleEndpoint('freelancer')}
              disabled={testingRbac}
            >
              {testingRbac ? 'Testing...' : 'Test Freelancer-Only Endpoint (Expect 200 OK)'}
            </button>

            <button
              className="btn btn-outline-danger"
              onClick={() => testRoleEndpoint('client')}
              disabled={testingRbac}
            >
              {testingRbac ? 'Testing...' : 'Test Client-Only Endpoint (Expect 403 Forbidden)'}
            </button>
          </div>

          {apiTestResult && (
            <div
              className={`api-test-banner ${
                apiTestResult.type === 'success'
                  ? 'api-test-success'
                  : 'api-test-forbidden'
              }`}
            >
              <div className="api-test-status">
                HTTP {apiTestResult.status}{' '}
                {apiTestResult.status === 200 ? 'SUCCESS' : 'FORBIDDEN (PROTECTED)'}
              </div>
              <div className="api-test-msg">{apiTestResult.message}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelancerDashboard;
