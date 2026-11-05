import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Graphic Design',
  'Data Analytics',
  'Artificial Intelligence & Machine Learning',
  'Content Writing',
  'Digital Marketing',
  'DevOps & Cloud',
  'Video Editing',
  'Other',
];

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    budget: '',
    deadlineDays: 14,
    skillsRequired: '',
    description: '',
    status: 'Open',
  });

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await projectService.getById(id);
        const p = res.data.data;

        if (!p) {
          setError('Project not found');
          return;
        }

        // Verify ownership
        const clientId = p.client?._id || p.client;
        if (user && clientId && clientId.toString() !== user._id.toString()) {
          setError('Unauthorized: You are not the client who posted this project.');
          return;
        }

        setFormData({
          title: p.title || '',
          category: p.category || 'Web Development',
          budget: p.budget || '',
          deadlineDays: p.deadlineDays || 14,
          skillsRequired: Array.isArray(p.skillsRequired)
            ? p.skillsRequired.join(', ')
            : p.skillsRequired || '',
          description: p.description || '',
          status: p.status || 'Open',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project details for editing');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, user]);

  const handleChange = (e) => {
    setError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError('Please provide a project title.');
      return;
    }

    if (!formData.budget || Number(formData.budget) < 10) {
      setError('Minimum project budget is $10 USD.');
      return;
    }

    if (!formData.skillsRequired.trim()) {
      setError('Please provide at least one required skill (comma-separated).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setError('Please provide a detailed project description (minimum 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await projectService.update(id, {
        title: formData.title.trim(),
        category: formData.category,
        budget: Number(formData.budget),
        deadlineDays: Number(formData.deadlineDays),
        skillsRequired: formData.skillsRequired,
        description: formData.description.trim(),
        status: formData.status,
      });

      setSuccess('Project updated successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/projects/${id}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project details for editing...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">⚠️</div>
          <h2>Cannot Edit Project</h2>
          <p>{error}</p>
          <div className="mt-3" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/dashboard/client" className="btn btn-primary">
              Return to Client Dashboard
            </Link>
            <Link to="/projects" className="btn btn-secondary">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">✏️</div>
          <h2 className="auth-title">Edit Project Posting</h2>
          <p className="auth-subtitle">
            Update your project scope, budget, required tech stack, or milestone timeline
          </p>
        </div>

        {error && (
          <div className="alert alert-danger mb-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-3">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Full-Stack React & Node.js Application Development"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              required
            />
            <span className="form-help-text">Clear, professional title (max 120 chars)</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Project Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Open">Open (Accepting Bids)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget ($ USD)</label>
              <input
                type="number"
                name="budget"
                className="form-input"
                placeholder="500"
                min="10"
                value={formData.budget}
                onChange={handleChange}
                required
              />
              <span className="form-help-text">Total project budget</span>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Timeline (Days)</label>
              <input
                type="number"
                name="deadlineDays"
                className="form-input"
                placeholder="14"
                min="1"
                value={formData.deadlineDays}
                onChange={handleChange}
                required
              />
              <span className="form-help-text">Target delivery timeframe</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills (comma separated)</label>
            <input
              type="text"
              name="skillsRequired"
              className="form-input"
              placeholder="React, Node.js, Express, MongoDB, Tailwind CSS"
              value={formData.skillsRequired}
              onChange={handleChange}
              required
            />
            <span className="form-help-text">
              Enter specific skills separated by commas to help freelancers find your project
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Project Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="6"
              placeholder="Describe your requirements, deliverables, milestones, tech stack and scope..."
              value={formData.description}
              onChange={handleChange}
              maxLength={3000}
              required
            ></textarea>
            <span className="form-help-text">Comprehensive overview of project objectives</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : '💾 Save Changes & Update'}
            </button>
            <Link
              to={`/projects/${id}`}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;

