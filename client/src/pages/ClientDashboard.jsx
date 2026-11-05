import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  authService,
  projectService,
  proposalService,
  milestoneService,
  clientProfileService,
  statsService,
} from '../services/api';
import { getCategoryMeta } from '../utils/categoryMeta';

const ClientDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'proposals' | 'contracts' | 'security'
  const [projectStatusFilter, setProjectStatusFilter] = useState('All'); // 'All' | 'Open' | 'In Progress' | 'Completed'

  // Data states
  const [myProjects, setMyProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [clientProfile, setClientProfile] = useState(null);
  const [clientMetrics, setClientMetrics] = useState({});
  const [platformStats, setPlatformStats] = useState(null);

  // UI / Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // RBAC test states
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testingRbac, setTestingRbac] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, profRes, propRes, mileRes, statsRes] = await Promise.all([
        projectService.getMyClientProjects().catch(() => ({ data: { data: [] } })),
        clientProfileService.getMyProfile().catch(() => ({ data: { data: {} } })),
        proposalService.getClientProposals().catch(() => ({ data: { data: [] } })),
        milestoneService.getClientMilestones().catch(() => ({ data: { data: [] } })),
        statsService.getStats().catch(() => ({ data: { data: null } })),
      ]);

      setMyProjects(projRes.data?.data || []);
      setClientProfile(profRes.data?.data?.profile || null);
      setClientMetrics(profRes.data?.data?.metrics || {});
      setProposals(propRes.data?.data || []);
      setMilestones(mileRes.data?.data || []);
      setPlatformStats(statsRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load client workspace data:', err);
      setFeedback({ type: 'error', message: 'Failed to synchronize workspace records from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Project Deletion
  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"?\nThis cannot be undone.`)) {
      return;
    }
    setDeletingId(projectId);
    try {
      await projectService.delete(projectId);
      setMyProjects((prev) => prev.filter((p) => p._id !== projectId));
      setFeedback({ type: 'success', message: `Project "${projectTitle}" was successfully deleted.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete project.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Proposal Accept
  const handleAcceptProposal = async (proposalId, freelancerName, bidAmount, projectTitle) => {
    if (
      !window.confirm(
        `Accept proposal from ${freelancerName} for $${bidAmount}?\n\nThis will fund $${bidAmount} into simulated Escrow and transition "${projectTitle}" to In Progress.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await proposalService.accept(proposalId);
      setFeedback({
        type: 'success',
        message: res.data?.message || `Proposal from ${freelancerName} accepted and escrow funded!`,
      });
      await fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to accept proposal.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Proposal Decline
  const handleRejectProposal = async (proposalId, freelancerName) => {
    if (!window.confirm(`Decline proposal from ${freelancerName}?`)) return;

    setActionLoading(true);
    try {
      await proposalService.reject(proposalId);
      setFeedback({ type: 'success', message: `Proposal from ${freelancerName} marked as declined.` });
      await fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to decline proposal.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Milestone & Release Escrow
  const handleApproveMilestone = async (milestoneId, amount, freelancerName) => {
    if (
      !window.confirm(
        `Approve milestone and release $${amount} from Escrow to ${freelancerName}?\n\nFunds will immediately transfer to the freelancer.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await milestoneService.approve(milestoneId);
      setFeedback({
        type: 'success',
        message: res.data?.message || `Milestone approved and $${amount} released from Escrow!`,
      });
      await fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve milestone.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fund Milestone into Simulated Escrow
  const handleFundMilestone = async (milestoneId, amount, milestoneTitle) => {
    if (!window.confirm(`Fund $${amount} into simulated Escrow for "${milestoneTitle}"?`)) return;

    setActionLoading(true);
    try {
      const res = await milestoneService.fund(milestoneId);
      setFeedback({
        type: 'success',
        message: res.data?.message || `Milestone funded successfully! $${amount} locked in Escrow.`,
      });
      await fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fund milestone.',
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
      if (type === 'client') {
        const res = await authService.getClientData();
        setApiTestResult({
          type: 'success',
          status: res.status,
          message: res.data?.message || 'Authorized as Client',
        });
      } else {
        const res = await authService.getFreelancerData();
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

  // Calculated Statistics
  const totalProjects = myProjects.length;
  const openProjects = myProjects.filter((p) => p.status === 'Open').length;
  const activeProjects = myProjects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = myProjects.filter((p) => p.status === 'Completed').length;
  const totalProposalsCount = proposals.length;
  const totalSpent = Number(clientMetrics.totalSpent || 0);

  // Filtered projects for tab view
  const filteredProjects = myProjects.filter((p) => {
    if (projectStatusFilter === 'All') return true;
    return p.status === projectStatusFilter;
  });

  const companyDisplayName = clientProfile?.companyName || `${user?.name}'s Organization`;
  const companyIndustry = clientProfile?.industry || 'Technology & Software';
  const companyLocation = clientProfile?.location || 'Remote / Global';

  return (
    <div className="dashboard-container">
      {/* Toast Feedback Banner */}
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

      {/* PART A.1: Modern Welcome Hero Section */}
      <div className="client-hero-banner">
        <div className="client-hero-left">
          <img
            src={
              user?.profileImage ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Client'}`
            }
            alt={user?.name}
            className="client-hero-avatar"
          />
          <div>
            <div className="client-hero-title-row">
              <h1 className="client-hero-name">Welcome back, {user?.name || 'Client'}</h1>
              <span className="role-pill role-client">Client Workspace</span>
            </div>
            <p className="client-hero-org">
              🏢 <strong>{companyDisplayName}</strong> • {companyIndustry} • 📍 {companyLocation}
            </p>
            {user?.lastLogin && (
              <span className="client-hero-last-login">
                🕒 Last active: {new Date(user.lastLogin).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="client-hero-actions">
          <Link to="/post-project" className="btn btn-primary btn-post-cta">
            <span>+</span> Post New Project
          </Link>
          <Link to="/profile/client" className="btn btn-secondary">
            🏢 Company Profile
          </Link>
          <Link to="/freelancers" className="btn btn-secondary">
            🔍 Find Talent
          </Link>
        </div>
      </div>

      {/* PART A.2: Modern SaaS Statistics Cards Grid */}
      <div className="saas-stats-grid mb-4">
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(36, 87, 197, 0.15)', color: '#3b82f6' }}>
              💼
            </span>
            <span className="saas-stat-label">Total Projects</span>
          </div>
          <div className="saas-stat-value">{totalProjects}</div>
          <div className="saas-stat-sub">Across all categories</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              🟢
            </span>
            <span className="saas-stat-label">Open for Bidding</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#10b981' }}>
            {openProjects}
          </div>
          <div className="saas-stat-sub">Accepting proposals</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              ⚡
            </span>
            <span className="saas-stat-label">Active Contracts</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#f59e0b' }}>
            {activeProjects}
          </div>
          <div className="saas-stat-sub">In Progress with talent</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              📥
            </span>
            <span className="saas-stat-label">Received Proposals</span>
          </div>
          <div className="saas-stat-value">{totalProposalsCount}</div>
          <div className="saas-stat-sub">Bids awaiting review</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              🏆
            </span>
            <span className="saas-stat-label">Completed</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#34d399' }}>
            {completedProjects}
          </div>
          <div className="saas-stat-sub">Milestones verified</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              🛡️
            </span>
            <span className="saas-stat-label">Verified Escrow Paid</span>
          </div>
          <div className="saas-stat-value" style={{ color: '#f97316' }}>
            ${totalSpent.toLocaleString()}
          </div>
          <div className="saas-stat-sub">Released to hired freelancers</div>
        </div>
      </div>

      {/* Live Marketplace Activity Bar from MongoDB Atlas */}
      {platformStats && (
        <div className="status-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="status-item">
            <div className="status-label">Total WorkHive Members</div>
            <div className="status-value" style={{ color: 'var(--primary)' }}>
              👥 {platformStats.totalUsers} Registered
            </div>
          </div>
          <div className="status-item">
            <div className="status-label">Clients on Platform</div>
            <div className="status-value">👔 {platformStats.totalClients} Clients</div>
          </div>
          <div className="status-item">
            <div className="status-label">Vetted Freelancers</div>
            <div className="status-value">🧑‍💻 {platformStats.totalFreelancers} Freelancers</div>
          </div>
          <div className="status-item">
            <div className="status-label">Marketplace Projects</div>
            <div className="status-value">💼 {platformStats.totalProjects} Posted</div>
          </div>
        </div>
      )}

      {/* Main Workspace Navigation Tabs */}
      <div className="dashboard-tab-bar mb-4">
        <button
          className={`dashboard-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          💼 My Projects ({myProjects.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📥 Received Proposals ({proposals.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          🛡️ Active Contracts & Milestones ({milestones.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Role Authorization Check
        </button>
      </div>

      {/* TAB 1: VISUAL PROJECT MANAGEMENT */}
      {activeTab === 'projects' && (
        <div>
          {/* Status Sub-Filters */}
          <div className="dashboard-subfilter-row mb-4">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Open', 'In Progress', 'Completed'].map((st) => (
                <button
                  key={st}
                  className={`subfilter-pill ${projectStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setProjectStatusFilter(st)}
                >
                  {st === 'All' ? `All (${myProjects.length})` : `${st} (${myProjects.filter((p) => p.status === st).length})`}
                </button>
              ))}
            </div>

            <Link to="/post-project" className="btn btn-primary btn-sm">
              + Post New Project
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Fetching your posted projects from database...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📁</div>
              <h3>No {projectStatusFilter === 'All' ? '' : projectStatusFilter} projects found</h3>
              <p>Post a project to connect with expert freelancers and fund milestone deliverables.</p>
              <Link to="/post-project" className="btn btn-primary mt-3">
                + Post Your First Project
              </Link>
            </div>
          ) : (
            <div className="visual-project-grid">
              {filteredProjects.map((project) => {
                const meta = getCategoryMeta(project.category);
                return (
                  <div
                    key={project._id}
                    className={`visual-project-card status-border-${project.status.toLowerCase().replace(' ', '-')}`}
                  >
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

                      {/* Hired Freelancer Indicator if assigned */}
                      {project.hiredFreelancer && (
                        <div className="visual-card-hired-row">
                          <img
                            src={
                              project.hiredFreelancer.profileImage ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${project.hiredFreelancer.name}`
                            }
                            alt={project.hiredFreelancer.name}
                            className="visual-card-hired-avatar"
                          />
                          <div>
                            <span className="visual-card-hired-label">Hired Talent:</span>
                            <span className="visual-card-hired-name">{project.hiredFreelancer.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Required Skills */}
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
                          <div className="meta-label">Timeline</div>
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
                          👁️ View Scope
                        </Link>

                        {project.status === 'Open' && (
                          <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary btn-sm">
                            ✏️ Edit
                          </Link>
                        )}

                        <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
                          Proposals ({project.proposalsCount || 0}) →
                        </Link>

                        <button
                          className="btn-table-danger"
                          onClick={() => handleDeleteProject(project._id, project.title)}
                          disabled={deletingId === project._id}
                          title="Delete Project"
                        >
                          {deletingId === project._id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPOSAL MANAGEMENT */}
      {activeTab === 'proposals' && (
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Received Proposals Across Your Projects</h3>
              <p className="text-muted text-sm">
                Evaluate candidate bids, review credentials, and hire the top candidate.
              </p>
            </div>
            <span className="badge badge-success">{proposals.length} Total Submissions</span>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading candidate proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📬</div>
              <h3>No proposals received yet</h3>
              <p>As freelancers browse your open projects in the marketplace, their proposals will appear here.</p>
              <Link to="/post-project" className="btn btn-primary mt-2">
                + Post Another Project
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {proposals.map((prop) => (
                <div
                  key={prop._id}
                  className="proposal-review-card"
                  style={{
                    borderLeft:
                      prop.status === 'Accepted'
                        ? '4px solid #10b981'
                        : prop.status === 'Rejected'
                        ? '4px solid #ef4444'
                        : '4px solid #3b82f6',
                  }}
                >
                  <div className="proposal-review-header">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <img
                        src={
                          prop.freelancer?.profileImage ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${prop.freelancer?.name}`
                        }
                        alt={prop.freelancer?.name}
                        className="dashboard-avatar"
                        style={{ width: '56px', height: '56px' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0 }}>{prop.freelancer?.name}</h4>
                          <span className={`status-pill status-${prop.status.toLowerCase()}`}>
                            {prop.status}
                          </span>
                          {prop.project && (
                            <span className="badge-level">
                              Project: <strong>{prop.project.title}</strong>
                            </span>
                          )}
                        </div>

                        <p className="text-muted text-sm" style={{ margin: '0.2rem 0' }}>
                          {prop.freelancerProfile?.professionalTitle || 'Software Engineer'} •{' '}
                          {prop.freelancer?.email}
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                          <span className="badge-rate">💰 Proposed Bid: ${prop.bidAmount} USD</span>
                          <span className="badge-level">⏱️ Est. Delivery: {prop.deliveryDays} Days</span>
                          {prop.freelancerProfile?.hourlyRate && (
                            <span className="badge-location">Rate: ${prop.freelancerProfile.hourlyRate}/hr</span>
                          )}
                          {prop.freelancerProfile?.rating && (
                            <span className="badge-rate" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                              ⭐ {Number(prop.freelancerProfile.rating).toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Skills */}
                        {prop.freelancerProfile?.skills && (
                          <div className="skills-pill-group mt-2">
                            {prop.freelancerProfile.skills.slice(0, 6).map((s, idx) => (
                              <span key={idx} className="skill-tag skill-tag-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {prop.freelancerProfile?._id && (
                        <Link
                          to={`/freelancers/${prop.freelancerProfile._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          👤 View Profile
                        </Link>
                      )}

                      {prop.project?._id && (
                        <Link to={`/projects/${prop.project._id}`} className="btn btn-secondary btn-sm">
                          View Project Scope →
                        </Link>
                      )}

                      {/* Accept / Reject actions if proposal is Pending and project is Open */}
                      {prop.status === 'Pending' && prop.project?.status === 'Open' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleAcceptProposal(
                                prop._id,
                                prop.freelancer?.name,
                                prop.bidAmount,
                                prop.project?.title
                              )
                            }
                          >
                            🤝 Accept & Fund Escrow
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleRejectProposal(prop._id, prop.freelancer?.name)}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}

                      {prop.status === 'Accepted' && (
                        <span className="badge badge-success" style={{ padding: '0.5rem 0.85rem' }}>
                          ✓ Hired Talent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 p-3" style={{ background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <p className="text-sm" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      <strong>Cover Letter:</strong> "{prop.coverLetter}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE CONTRACTS & ESCROW MILESTONES */}
      {activeTab === 'contracts' && (
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Active Contracts & Escrow Milestones</h3>
              <p className="text-muted text-sm">
                Track deliverables, review submissions, and release escrow payouts upon approval.
              </p>
            </div>
            <span className="badge-level">
              ${milestones.reduce((sum, m) => sum + (m.amount || 0), 0).toLocaleString()} Total Contract Value
            </span>
          </div>

          {milestones.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">🛡️</div>
              <h3>No active milestone contracts yet</h3>
              <p>When you accept a freelancer proposal, the project contract and escrow milestone are created automatically.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Milestone Title</th>
                    <th>Project</th>
                    <th>Hired Freelancer</th>
                    <th>Escrow Deposit</th>
                    <th>Status</th>
                    <th>Escrow Protection</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <strong>{m.title}</strong>
                        {m.description && (
                          <div className="text-muted text-sm" style={{ maxWidth: '280px' }}>
                            {m.description}
                          </div>
                        )}
                        {m.submissionNotes && (
                          <div className="mt-1 p-1" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>
                            💬 <em>"{m.submissionNotes}"</em>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{m.project?.title || 'Project'}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img
                            src={
                              m.freelancer?.profileImage ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${m.freelancer?.name}`
                            }
                            alt={m.freelancer?.name}
                            className="dashboard-avatar"
                            style={{ width: '28px', height: '28px' }}
                          />
                          <span>{m.freelancer?.name || 'Freelancer'}</span>
                        </div>
                      </td>
                      <td>
                        <strong>${m.amount} USD</strong>
                      </td>
                      <td>
                        <span className={`status-pill status-${m.status.toLowerCase().replace('_', '-')}`}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${m.escrowStatus === 'Released_To_Freelancer' ? 'status-completed' : 'status-open'}`}>
                          🛡️ {m.escrowStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {(m.escrowStatus === 'Awaiting_Funding' || m.status === 'Pending') && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading}
                              style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                              onClick={() => handleFundMilestone(m._id, m.amount, m.title)}
                            >
                              💳 Fund Milestone
                            </button>
                          )}
                          {m.status === 'Submitted' && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading}
                              style={{ background: '#10b981', borderColor: '#10b981' }}
                              onClick={() =>
                                handleApproveMilestone(
                                  m._id,
                                  m.amount,
                                  m.freelancer?.name || 'Freelancer'
                                )
                              }
                            >
                              ✅ Approve & Release ${m.amount}
                            </button>
                          )}
                          <Link
                            to={`/projects/${m.project?._id || m.project}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Project →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RBAC AUTHORIZATION TEST CARD */}
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
              onClick={() => testRoleEndpoint('client')}
              disabled={testingRbac}
            >
              {testingRbac ? 'Testing...' : 'Test Client-Only Endpoint (Expect 200 OK)'}
            </button>

            <button
              className="btn btn-outline-danger"
              onClick={() => testRoleEndpoint('freelancer')}
              disabled={testingRbac}
            >
              {testingRbac ? 'Testing...' : 'Test Freelancer-Only Endpoint (Expect 403 Forbidden)'}
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

export default ClientDashboard;
