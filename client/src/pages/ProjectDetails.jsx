import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { projectService, proposalService, milestoneService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [myProposal, setMyProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'proposals' | 'milestones'

  // Proposal Submission Form state
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState(null);
  const [proposalSuccess, setProposalSuccess] = useState('');

  // Milestone Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState('');
  const [newMilestoneDays, setNewMilestoneDays] = useState(7);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getById(id);
      const proj = res.data.data;
      setProject(proj);

      if (proj && !bidAmount) {
        setBidAmount(proj.budget);
      }

      // If authenticated, fetch proposals and milestones
      if (isAuthenticated) {
        try {
          const propRes = await proposalService.getByProject(id);
          const propList = propRes.data.data || [];
          setProposals(propList);

          if (user?.role === 'Freelancer') {
            const mine = propList.find((p) => p.freelancer?._id === user._id || p.freelancer === user._id);
            setMyProposal(mine || null);
          }
        } catch (e) {
          // May 403 or empty if unprivileged
        }

        try {
          const mileRes = await milestoneService.getByProject(id);
          setMilestones(mileRes.data.data || []);
        } catch (e) {
          // Empty if no milestones yet
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, isAuthenticated]);

  const isOwner = user && project && project.client?._id === user._id;
  const isHired = user && project && project.hiredFreelancer?._id === user._id;

  // Handle Proposal Submission
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setProposalError(null);
    setProposalSuccess('');

    if (!bidAmount || Number(bidAmount) <= 0) {
      setProposalError('Please provide a valid bid amount.');
      return;
    }
    if (!deliveryDays || Number(deliveryDays) < 1) {
      setProposalError('Delivery time must be at least 1 day.');
      return;
    }
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      setProposalError('Cover letter must be at least 20 characters explaining your approach.');
      return;
    }

    setSubmittingProposal(true);
    try {
      const res = await proposalService.submit({
        projectId: project._id,
        bidAmount: Number(bidAmount),
        deliveryDays: Number(deliveryDays),
        coverLetter: coverLetter.trim(),
      });
      setProposalSuccess('Your proposal was submitted successfully!');
      setMyProposal(res.data.data);
      setProposals([res.data.data, ...proposals]);
    } catch (err) {
      setProposalError(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Client Accepts Proposal
  const handleAcceptProposal = async (proposalId, freelancerName, amount) => {
    if (
      !window.confirm(
        `Accept proposal from ${freelancerName} for $${amount}?\n\nThis will fund $${amount} into simulated Escrow and update project to 'In Progress'.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await proposalService.accept(proposalId);
      alert(res.data.message || 'Proposal accepted! Escrow funded.');
      await fetchProjectData();
      setActiveTab('milestones');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Rejects Proposal
  const handleRejectProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to decline this proposal?')) return;
    setActionLoading(true);
    try {
      await proposalService.reject(proposalId);
      await fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Freelancer Submits Milestone Work
  const handleSubmitWork = async (milestoneId) => {
    if (!submissionNotes.trim()) {
      alert('Please provide notes or a link describing your delivered milestone work.');
      return;
    }
    setActionLoading(true);
    try {
      await milestoneService.submitWork(milestoneId, { submissionNotes });
      alert('Work submitted for client review!');
      setSubmittingMilestoneId(null);
      setSubmissionNotes('');
      await fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit milestone work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Approves Milestone & Releases Escrow
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
      alert(res.data.message || 'Milestone approved and escrow funds released!');
      await fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Creates Custom Milestone
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    const trimmedTitle = newMilestoneTitle.trim();
    if (!trimmedTitle) {
      alert('Milestone title is required');
      return;
    }
    if (trimmedTitle.length > 120) {
      alert(`Milestone title cannot exceed 120 characters (currently ${trimmedTitle.length} characters). Please enter a concise title.`);
      return;
    }
    if (!newMilestoneAmount || Number(newMilestoneAmount) <= 0) {
      alert('Milestone amount must be greater than $0');
      return;
    }

    setActionLoading(true);
    try {
      const res = await milestoneService.create({
        projectId: project._id,
        title: trimmedTitle,
        amount: Number(newMilestoneAmount),
        deliveryDays: Number(newMilestoneDays),
      });
      alert(res.data?.message || 'Milestone added and escrow deposit simulated!');
      setNewMilestoneTitle('');
      setNewMilestoneAmount('');
      await fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Funds Milestone
  const handleFundMilestone = async (milestoneId, amount, milestoneTitle) => {
    if (!window.confirm(`Fund $${amount} into simulated Escrow for "${milestoneTitle}"?`)) return;

    setActionLoading(true);
    try {
      const res = await milestoneService.fund(milestoneId);
      alert(res.data?.message || 'Milestone funded and locked in simulated Escrow!');
      await fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">📁</div>
          <h2>Project Not Found</h2>
          <p>{error || 'This project does not exist or may have been removed.'}</p>
          <Link to="/projects" className="btn btn-primary mt-3">
            Browse All Projects
          </Link>
        </div>
      </div>
    );
  }

  const totalEscrow = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const releasedEscrow = milestones
    .filter((m) => m.escrowStatus === 'Released_To_Freelancer')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  const inEscrow = milestones
    .filter((m) => m.escrowStatus === 'Funded_In_Escrow')
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  return (
    <div className="page-container">
      {/* Project Hero Header */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-hero-info">
            <div className="profile-hero-title-row">
              <span className="project-category-badge">{project.category}</span>
              <span className={`status-pill status-${project.status.toLowerCase().replace(' ', '-')}`}>
                {project.status}
              </span>
            </div>
            <h1 className="profile-hero-name mt-2">{project.title}</h1>
            <p className="project-date">
              Posted on {new Date(project.createdAt).toLocaleDateString()} by{' '}
              <strong>{project.client?.name || 'Verified Client'}</strong>
            </p>

            <div className="profile-hero-tags mt-3">
              <span className="badge-rate">💰 Budget: ${project.budget} USD</span>
              <span className="badge-level">⏱️ Est. Timeline: {project.deadlineDays} Days</span>
              <span className="badge-location">📄 {project.proposalsCount} Proposal(s)</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          {isOwner && (
            <>
              <span className="role-pill role-client">You are Project Creator</span>
              {project.status === 'Open' && (
                <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary btn-sm">
                  ✏️ Edit Project
                </Link>
              )}
            </>
          )}
          {isHired && (
            <span className="role-pill role-freelancer">🎉 You are Hired for this Job</span>
          )}
          <Link to="/projects" className="btn btn-secondary">
            ← Back to Jobs
          </Link>
        </div>
      </div>

      {/* Contracted Talent Banner (when project has a hired freelancer) */}
      {project.hiredFreelancer && (
        <div
          className="content-card mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(36, 87, 197, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid #2457c5',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={
                  project.hiredFreelancer.profileImage ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${project.hiredFreelancer.name}`
                }
                alt={project.hiredFreelancer.name}
                className="dashboard-avatar"
                style={{ width: '60px', height: '60px', border: '2px solid #10b981' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{project.hiredFreelancer.name}</h3>
                  <span className="badge badge-success">✓ Hired Talent</span>
                </div>
                <p className="text-muted" style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  {project.hiredFreelancer.email}
                </p>
                {project.acceptedProposal && (
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge-rate">💰 Agreed Bid: ${project.acceptedProposal.bidAmount} USD</span>
                    <span className="badge-level">⏱️ Est: {project.acceptedProposal.deliveryDays} Days</span>
                    <span className="status-pill status-in-progress">Project: {project.status}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('milestones')}
              >
                🛡️ View Escrow Milestones →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Owner or Hired Freelancer */}
      {(isOwner || isHired || milestones.length > 0) && (
        <div className="filter-card mb-4" style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem' }}>
          <button
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Project Scope
          </button>
          {isOwner && (
            <button
              className={`btn btn-sm ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('proposals')}
            >
              📥 Proposals Received ({proposals.length})
            </button>
          )}
          {(isOwner || isHired || milestones.length > 0) && (
            <button
              className={`btn btn-sm ${activeTab === 'milestones' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('milestones')}
            >
              🛡️ Escrow & Milestones ({milestones.length})
            </button>
          )}
        </div>
      )}

      {/* TAB 1: Project Overview & Proposal Form */}
      {activeTab === 'overview' && (
        <div className="profile-layout-grid">
          {/* Main Description */}
          <div className="profile-main-col">
            <div className="content-card">
              <h3 className="content-card-title">Project Description</h3>
              <p className="profile-bio-text" style={{ whiteSpace: 'pre-wrap' }}>
                {project.description}
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Required Skills & Tech Stack</h3>
              <div className="skills-badge-grid">
                {project.skillsRequired?.map((skill, index) => (
                  <span key={index} className="skill-tag skill-tag-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Freelancer Bidding Area */}
            {user?.role === 'Freelancer' && !isOwner && (
              <div className="content-card" style={{ borderColor: 'var(--primary)' }}>
                <h3 className="content-card-title">🚀 Submit Your Bid & Proposal</h3>

                {project.status !== 'Open' ? (
                  <div className="alert alert-warning">
                    <span>⚠️ This project is {project.status} and is no longer accepting proposals.</span>
                  </div>
                ) : myProposal ? (
                  <div className="proposal-submitted-card" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1.25rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="badge-rate">Your Bid: ${myProposal.bidAmount} USD</span>
                      <span className={`status-pill status-${myProposal.status.toLowerCase()}`}>
                        Status: {myProposal.status}
                      </span>
                    </div>
                    <p><strong>Timeline:</strong> {myProposal.deliveryDays} Days</p>
                    <p className="mt-2"><strong>Cover Letter:</strong></p>
                    <p className="text-muted" style={{ fontStyle: 'italic' }}>"{myProposal.coverLetter}"</p>
                    <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                      Submitted on {new Date(myProposal.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProposal}>
                    {proposalError && (
                      <div className="alert alert-danger mb-3">
                        <span>⚠️ {proposalError}</span>
                      </div>
                    )}
                    {proposalSuccess && (
                      <div className="alert alert-success mb-3">
                        <span>✅ {proposalSuccess}</span>
                      </div>
                    )}

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Your Bid Amount ($ USD)</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estimated Delivery (Days)</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          max="365"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group mt-3">
                      <label className="form-label">Proposal Cover Letter</label>
                      <textarea
                        className="form-input"
                        rows="5"
                        placeholder="Detail your relevant experience, proposed technical architecture, deliverables, and why you are the best fit..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                      ></textarea>
                      <span className="form-help-text">Minimum 20 characters.</span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary mt-3"
                      disabled={submittingProposal}
                    >
                      {submittingProposal ? 'Submitting Proposal...' : '🚀 Submit Proposal & Lock In'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <div className="content-card text-center" style={{ padding: '2rem' }}>
                <h4>Want to bid on this job?</h4>
                <p className="text-muted mb-3">Sign in as a freelancer to submit a proposal and escrow milestone bid.</p>
                <Link to="/login" state={{ from: location }} className="btn btn-primary">
                  Sign In to Submit Proposal
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="profile-side-col">
            <div className="content-card">
              <h3 className="content-card-title">About the Client</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <img
                  src={
                    project.client?.profileImage ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${project.client?.name}`
                  }
                  alt={project.client?.name}
                  className="dashboard-avatar"
                  style={{ width: '56px', height: '56px' }}
                />
                <div>
                  <h4 style={{ margin: 0 }}>{project.client?.name || 'Verified Client'}</h4>
                  <span className="role-pill role-client mt-1">Client</span>
                </div>
              </div>
              <p className="text-sm text-muted">
                🛡️ Verified payment simulation ready for escrow milestones.
              </p>
            </div>

            {/* Escrow Quick Card */}
            <div className="content-card">
              <h3 className="content-card-title">🛡️ Escrow Protection</h3>
              <p className="text-sm text-muted mb-3">
                All WorkHive milestones are secured in demo escrow. Funds are only released upon explicit client review and approval.
              </p>
              <div className="metric-card" style={{ padding: '1rem', background: 'var(--bg-input)' }}>
                <div className="metric-label">Escrow Security</div>
                <div className="metric-value" style={{ fontSize: '1.25rem', color: '#10b981' }}>
                  100% Protected
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Client View of Proposals Received */}
      {activeTab === 'proposals' && isOwner && (
        <div className="proposals-container">
          <div className="page-header-row mb-3">
            <div>
              <h2>Proposals Received ({proposals.length})</h2>
              <p className="text-muted">Review incoming bids, evaluate talent, and accept the ideal candidate.</p>
            </div>
          </div>

          {proposals.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📬</div>
              <h3>No proposals yet</h3>
              <p>Freelancers browsing the marketplace will submit their bids here shortly.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {proposals.map((prop) => (
                <div key={prop._id} className="content-card" style={{ borderLeft: prop.status === 'Accepted' ? '4px solid #10b981' : '4px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={
                          prop.freelancer?.profileImage ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${prop.freelancer?.name}`
                        }
                        alt={prop.freelancer?.name}
                        className="dashboard-avatar"
                        style={{ width: '54px', height: '54px' }}
                      />
                      <div>
                        <h3 style={{ margin: 0 }}>{prop.freelancer?.name}</h3>
                        <p className="text-muted" style={{ margin: '0.25rem 0' }}>
                          {prop.freelancerProfile?.professionalTitle || 'Software Engineer'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="badge-rate">${prop.bidAmount} Bid</span>
                          <span className="badge-level">⏱️ {prop.deliveryDays} Days</span>
                          {prop.freelancerProfile?.hourlyRate && (
                            <span className="badge-location">Rate: ${prop.freelancerProfile.hourlyRate}/hr</span>
                          )}
                          {prop.freelancerProfile?.rating && (
                            <span className="badge-rate" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                              ⭐ {Number(prop.freelancerProfile.rating).toFixed(1)}
                            </span>
                          )}
                          <span className={`status-pill status-${prop.status.toLowerCase()}`}>
                            {prop.status}
                          </span>
                        </div>
                        {prop.freelancerProfile?.skills && prop.freelancerProfile.skills.length > 0 && (
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

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {prop.freelancerProfile?._id && (
                        <Link
                          to={`/freelancers/${prop.freelancerProfile._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Profile
                        </Link>
                      )}
                      {project.status === 'Open' && prop.status === 'Pending' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleAcceptProposal(prop._id, prop.freelancer?.name, prop.bidAmount)
                            }
                          >
                            🤝 Accept & Fund Escrow
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleRejectProposal(prop._id)}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{prop.coverLetter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Escrow & Milestones Tracker */}
      {activeTab === 'milestones' && (
        <div className="milestones-container">
          {/* Escrow Financial Summary */}
          <div className="metrics-grid mb-4">
            <div className="metric-card">
              <div className="metric-label">Total Escrow Value</div>
              <div className="metric-value">${totalEscrow.toLocaleString()}</div>
              <div className="metric-sub">Across all milestones</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Secured In Escrow</div>
              <div className="metric-value" style={{ color: '#f59e0b' }}>
                ${inEscrow.toLocaleString()}
              </div>
              <div className="metric-sub">Locked until client approves</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Released to Freelancer</div>
              <div className="metric-value" style={{ color: '#10b981' }}>
                ${releasedEscrow.toLocaleString()}
              </div>
              <div className="metric-sub">Completed & paid</div>
            </div>
          </div>

          {/* Escrow Progress Bar & Security Disclosure */}
          {totalEscrow > 0 && (
            <div className="content-card mb-4" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Escrow Release Progress ({totalEscrow > 0 ? Math.round((releasedEscrow / totalEscrow) * 100) : 0}%)
                </span>
                <span className="text-muted text-sm">
                  ${releasedEscrow.toLocaleString()} of ${totalEscrow.toLocaleString()} Released
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${totalEscrow > 0 ? Math.min(100, Math.round((releasedEscrow / totalEscrow) * 100)) : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                    borderRadius: '5px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <p className="text-muted text-sm" style={{ margin: '0.65rem 0 0 0' }}>
                🛡️ <strong>Simulated Escrow Protection:</strong> Funds are locked in WorkHive simulated escrow upon proposal acceptance and are transferred only after you review and approve deliverables.
              </p>
            </div>
          )}

          {/* Milestones List */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Project Milestone Pipeline</h3>
              {isOwner && project.status === 'In Progress' && (
                <span className="badge-level">+ Escrow Protected</span>
              )}
            </div>

            {milestones.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🛡️</div>
                <h3>No Milestones Initialized Yet</h3>
                <p>
                  {isOwner && project.status === 'In Progress'
                    ? 'A freelancer is hired for this project. Initialize and fund the primary escrow milestone to lock simulated funds.'
                    : 'Accepting a proposal automatically sets up the initial escrow milestone.'}
                </p>
                {isOwner && project.status === 'In Progress' && (
                  <button
                    className="btn btn-primary mt-3"
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      try {
                        await milestoneService.create({
                          projectId: project._id,
                          amount: project.budget,
                          deliveryDays: project.deadlineDays || 7,
                        });
                        alert('Escrow milestone funded and locked in simulated Escrow!');
                        await fetchProjectData();
                      } catch (err) {
                        alert(err.response?.data?.message || 'Failed to initialize milestone.');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                  >
                    🛡️ Initialize & Fund Escrow Milestone (${project.budget})
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {milestones.map((m, idx) => (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold' }}>#{idx + 1}</span>
                          <h4 style={{ margin: 0 }}>{m.title}</h4>
                        </div>
                        <p className="text-muted text-sm mt-1">{m.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="badge-rate">${m.amount} USD</span>
                          <span className={`status-pill status-${m.status.toLowerCase().replace('_', '-')}`}>
                            Status: {m.status.replace('_', ' ')}
                          </span>
                          <span className={`status-pill ${m.escrowStatus === 'Released_To_Freelancer' ? 'status-completed' : 'status-open'}`}>
                            🛡️ {m.escrowStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Client Action: Fund Milestone */}
                        {isOwner && (m.escrowStatus === 'Awaiting_Funding' || m.status === 'Pending') && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                            style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                            onClick={() => handleFundMilestone(m._id, m.amount, m.title)}
                          >
                            💳 Fund Milestone
                          </button>
                        )}

                        {/* Freelancer Action: Submit Work */}
                        {isHired && (m.status === 'Funded_Escrow' || m.status === 'In_Progress') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSubmittingMilestoneId(m._id)}
                          >
                            📤 Submit Deliverable
                          </button>
                        )}

                        {/* Client Action: Approve & Release */}
                        {isOwner && m.status === 'Submitted' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                            style={{ background: '#10b981', borderColor: '#10b981' }}
                            onClick={() =>
                              handleApproveMilestone(m._id, m.amount, m.freelancer?.name || 'Freelancer')
                            }
                          >
                            ✅ Approve & Release ${m.amount}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Work submission notes display */}
                    {m.submissionNotes && (
                      <div className="mt-3 p-2" style={{ background: 'var(--bg-input)', borderRadius: '6px' }}>
                        <p className="text-sm" style={{ margin: 0 }}>
                          <strong>Deliverable Notes:</strong> {m.submissionNotes}
                        </p>
                        {m.submittedAt && (
                          <span className="text-sm text-muted">
                            Submitted on {new Date(m.submittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Freelancer Submission Dialog */}
                    {submittingMilestoneId === m._id && (
                      <div className="mt-3 p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: '8px' }}>
                        <h5>Submit Work Deliverable for Milestone #{idx + 1}</h5>
                        <textarea
                          className="form-input mt-2"
                          rows="3"
                          placeholder="Provide git repository links, staging URLs, or notes on deliverables..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                        ></textarea>
                        <div className="mt-2" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleSubmitWork(m._id)}
                          >
                            {actionLoading ? 'Submitting...' : 'Submit to Client for Review'}
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

          {/* Client: Add New Milestone Form */}
          {isOwner && project.status === 'In Progress' && (
            <div className="content-card mt-4">
              <h3 className="content-card-title">+ Fund Additional Milestone</h3>
              <form onSubmit={handleCreateMilestone}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Milestone Title</label>
                      <span className="text-muted text-sm">{newMilestoneTitle.length}/120</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      maxLength={120}
                      placeholder="e.g. Phase 2: Frontend Integration"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Escrow Amount ($ USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      placeholder="500"
                      value={newMilestoneAmount}
                      onChange={(e) => setNewMilestoneAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Est. Days</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={newMilestoneDays}
                      onChange={(e) => setNewMilestoneDays(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary mt-3"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : '🛡️ Lock & Deposit in Escrow'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;

