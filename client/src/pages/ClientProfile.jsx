import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clientProfileService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = [
  'Technology & Software',
  'Fintech & Financial Services',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'Education & EdTech',
  'Marketing & Media',
  'Artificial Intelligence & Web3',
  'Other',
];

const ClientProfile = ({ isPublic = false }) => {
  const { id } = useParams();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    industry: 'Technology & Software',
    location: 'Remote / Global',
    companyDescription: '',
    hiringRequirements: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (isPublic && id) {
        res = await clientProfileService.getById(id);
      } else {
        res = await clientProfileService.getMyProfile();
      }

      const d = res.data.data;
      setProfileData(d);

      if (d?.profile) {
        setFormData({
          companyName: d.profile.companyName || '',
          companyWebsite: d.profile.companyWebsite || '',
          industry: d.profile.industry || 'Technology & Software',
          location: d.profile.location || 'Remote / Global',
          companyDescription: d.profile.companyDescription || '',
          hiringRequirements: d.profile.hiringRequirements || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, isPublic]);

  const handleInputChange = (e) => {
    setError(null);
    setSuccessMsg('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      const res = await clientProfileService.updateProfile(formData);
      setSuccessMsg('Company profile updated successfully in MongoDB Atlas!');
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading company profile details...</p>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">🏢</div>
          <h2>Company Profile Unavailable</h2>
          <p>{error}</p>
          <Link to="/dashboard/client" className="btn btn-primary mt-3">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const clientUser = profileData?.user || user;
  const metrics = profileData?.metrics || {};
  const projects = profileData?.projects || profileData?.openProjects || [];

  return (
    <div className="page-container">
      {/* Hero Header */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <img
            src={
              clientUser?.profileImage ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                profile.companyName || clientUser?.name || 'Company'
              )}`
            }
            alt={profile.companyName || clientUser?.name}
            className="profile-hero-avatar"
            style={{ borderRadius: '12px' }}
          />
          <div className="profile-hero-info">
            <div className="profile-hero-title-row">
              <h1 className="profile-hero-name">
                {profile.companyName || `${clientUser?.name}'s Organization`}
              </h1>
              <span className="role-pill role-client">Verified Client</span>
            </div>
            <p className="profile-hero-headline">
              {profile.industry || 'Technology & Software'} • 📍 {profile.location || 'Remote'}
            </p>

            <div className="profile-hero-tags">
              <span className="badge-rate">
                💰 Verified Paid: ${Number(metrics.totalSpent || 0).toLocaleString()} USD
              </span>
              <span className="badge-level">
                📁 {metrics.totalProjects || projects.length} Projects Posted
              </span>
              {profile.companyWebsite && (
                <a
                  href={profile.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge-location"
                  style={{ textDecoration: 'none' }}
                >
                  🌐 {profile.companyWebsite.replace(/^https?:\/\//, '')} ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          {!isPublic && (
            <button
              className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setEditing(!editing)}
            >
              {editing ? '✕ Cancel Edit' : '✏️ Edit Company Profile'}
            </button>
          )}
          <Link to="/post-project" className="btn btn-primary">
            + Post Project
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success mb-3">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      {editing ? (
        <div className="content-card mb-4" style={{ borderColor: 'var(--primary)' }}>
          <div className="content-card-header">
            <h3 className="content-card-title">✏️ Edit Client & Company Details</h3>
          </div>
          <form onSubmit={handleSaveProfile}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Company / Organization Name</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  placeholder="e.g. Acme Cloud Systems"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Website (https://...)</label>
                <input
                  type="url"
                  name="companyWebsite"
                  className="form-input"
                  placeholder="https://example.com"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row mt-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select
                  name="industry"
                  className="form-input"
                  value={formData.industry}
                  onChange={handleInputChange}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Headquarters / Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g. San Francisco, CA (Remote)"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">About the Company</label>
              <textarea
                name="companyDescription"
                className="form-input"
                rows="4"
                placeholder="Describe your organization, mission, and the products you build..."
                value={formData.companyDescription}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Typical Hiring Requirements & Tech Stack</label>
              <textarea
                name="hiringRequirements"
                className="form-input"
                rows="3"
                placeholder="e.g. Looking for experienced full-stack engineers proficient in React, Node.js, and MongoDB Atlas for milestone-based contracts..."
                value={formData.hiringRequirements}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="mt-3" style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving to MongoDB...' : '💾 Save Profile Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Main Layout Grid */}
      <div className="profile-layout-grid">
        {/* Left Column: Company Background & Requirements */}
        <div className="profile-main-col">
          {/* About Company */}
          <div className="content-card">
            <h3 className="content-card-title">About the Organization</h3>
            <p className="profile-bio-text" style={{ whiteSpace: 'pre-wrap' }}>
              {profile.companyDescription ||
                'No company description provided yet. Click "Edit Company Profile" above to share details about your organization.'}
            </p>
          </div>

          {/* Hiring Requirements */}
          <div className="content-card">
            <h3 className="content-card-title">Hiring Requirements & Preferences</h3>
            <p className="profile-bio-text" style={{ whiteSpace: 'pre-wrap' }}>
              {profile.hiringRequirements ||
                'No specific hiring requirements listed yet. You can specify preferred skills, timezones, and communication tools.'}
            </p>
          </div>

          {/* Posted Projects by this Client */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Posted Projects ({projects.length})</h3>
              <Link to="/post-project" className="btn btn-sm btn-primary">
                + Post Job
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">📁</div>
                <h4>No projects posted yet</h4>
                <p>Create your first job posting to attract proposals from vetted talent.</p>
                <Link to="/post-project" className="btn btn-primary mt-2">
                  Post a Project
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="p-3"
                    style={{
                      background: 'var(--bg-input)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <Link
                        to={`/projects/${p._id}`}
                        style={{ fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}
                      >
                        {p.title}
                      </Link>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                        <span className="badge-rate">${p.budget} USD</span>
                        <span className={`status-pill status-${(p.status || 'open').toLowerCase().replace(' ', '-')}`}>
                          {p.status}
                        </span>
                        <span className="text-muted text-sm">
                          {p.proposalsCount || 0} Proposal(s)
                        </span>
                      </div>
                    </div>

                    <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm">
                      View Project Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column: Financial Summary & Verification */}
        <div className="profile-side-col">
          {/* Live Dynamic Financial Statistics */}
          <div className="content-card">
            <h3 className="content-card-title">📊 Client Financial Statistics</h3>
            <p className="text-sm text-muted mb-3">
              Calculated dynamically from verified MongoDB Atlas milestone and payment records.
            </p>

            <div className="metric-card mb-2" style={{ background: 'var(--bg-input)' }}>
              <div className="metric-label">Total Verified Payouts</div>
              <div className="metric-value" style={{ color: '#10b981' }}>
                ${Number(metrics.totalSpent || 0).toLocaleString()}
              </div>
              <div className="metric-sub">Released from Escrow to Freelancers</div>
            </div>

            <div className="metric-card mb-2" style={{ background: 'var(--bg-input)' }}>
              <div className="metric-label">Committed Project Budget</div>
              <div className="metric-value">
                ${Number(metrics.totalCommittedBudget || 0).toLocaleString()}
              </div>
              <div className="metric-sub">Across all posted projects</div>
            </div>

            <div className="metric-card" style={{ background: 'var(--bg-input)' }}>
              <div className="metric-label">Total Proposals Received</div>
              <div className="metric-value">
                {Number(metrics.totalProposalsReceived || 0)}
              </div>
              <div className="metric-sub">From marketplace freelancers</div>
            </div>
          </div>

          {/* Contact & Verification Info */}
          <div className="content-card">
            <h3 className="content-card-title">Company Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <strong className="text-sm">Contact Name:</strong>
                <p className="text-muted" style={{ margin: 0 }}>{clientUser?.name}</p>
              </div>
              <div>
                <strong className="text-sm">Email Address:</strong>
                <p className="text-muted" style={{ margin: 0 }}>{clientUser?.email}</p>
              </div>
              <div>
                <strong className="text-sm">Member Since:</strong>
                <p className="text-muted" style={{ margin: 0 }}>
                  {new Date(clientUser?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
              {clientUser?.lastLogin && (
                <div>
                  <strong className="text-sm">Last Active:</strong>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {new Date(clientUser.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

