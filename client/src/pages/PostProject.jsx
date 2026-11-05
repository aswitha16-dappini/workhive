import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

const PostProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const prefilled = location.state || {};

  // Form State
  const [formData, setFormData] = useState({
    title: prefilled.prefilledFreelancer
      ? `Project Milestone for ${prefilled.prefilledFreelancer}`
      : '',
    category: 'Web Development',
    budget: '',
    minBudget: '',
    maxBudget: '',
    deadlineDays: 14,
    skillsRequired: prefilled.prefilledSkills || '',
    description: prefilled.prefilledFreelancer
      ? `Milestone deliverable assignment specifically for ${prefilled.prefilledFreelancer}.`
      : '',
  });

  // UI States (explicitly declared to prevent any ReferenceErrors)
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please provide a project title.');
      return;
    }

    if (formData.title.trim().length < 5) {
      setError('Project title must be at least 5 characters long.');
      return;
    }

    if (!formData.budget || Number(formData.budget) < 10) {
      setError('Minimum project budget is $10 USD.');
      return;
    }

    if (!formData.skillsRequired.trim()) {
      setError('Please enter at least one required skill (comma-separated).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setError('Please provide a detailed project description (minimum 20 characters).');
      return;
    }

    const projectBudget = Number(formData.budget);
    const minB = formData.minBudget ? Number(formData.minBudget) : projectBudget;
    const maxB = formData.maxBudget ? Number(formData.maxBudget) : projectBudget;

    if (minB > maxB) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await projectService.create({
        title: formData.title.trim(),
        category: formData.category,
        budget: projectBudget,
        minBudget: minB,
        maxBudget: maxB,
        deadlineDays: Number(formData.deadlineDays) || 14,
        skillsRequired: formData.skillsRequired,
        description: formData.description.trim(),
      });

      if (response.data && response.data.success) {
        setSuccessMessage('Project Published Successfully! Redirecting to your workspace...');
        // Wait briefly so user sees the explicit success confirmation
        setTimeout(() => {
          navigate('/dashboard/client');
        }, 1200);
      } else {
        throw new Error(response.data?.message || 'Failed to publish project');
      }
    } catch (err) {
      console.error('Project creation failed:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to publish project. Please check connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">💼</div>
          <h2 className="auth-title">Post a New Project</h2>
          <p className="auth-subtitle">
            Find and hire vetted freelancers with simulated escrow protection
          </p>
          {user && (
            <span className="text-muted text-sm" style={{ display: 'block', marginTop: '0.35rem' }}>
              Posting as: <strong>{user.name}</strong> ({user.email})
            </span>
          )}
        </div>

        {/* Dynamic Feedback Banners */}
        {error && (
          <div className="alert alert-danger mb-4">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success mb-4">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Project Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Full-Stack E-Commerce Platform with React & Node.js"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              required
            />
            <span className="form-help-text">Clear, descriptive title for freelancers (max 120 chars)</span>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                className="form-input"
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

            <div className="form-group form-col">
              <label className="form-label" htmlFor="budget">
                Total Budget ($ USD) *
              </label>
              <input
                id="budget"
                type="number"
                name="budget"
                className="form-input"
                placeholder="e.g. 1500"
                value={formData.budget}
                onChange={handleChange}
                min="10"
                required
              />
              <span className="form-help-text">Fixed escrow project budget</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="minBudget">
                Min Budget Range (Optional $)
              </label>
              <input
                id="minBudget"
                type="number"
                name="minBudget"
                className="form-input"
                placeholder="e.g. 1200"
                value={formData.minBudget}
                onChange={handleChange}
                min="10"
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="maxBudget">
                Max Budget Range (Optional $)
              </label>
              <input
                id="maxBudget"
                type="number"
                name="maxBudget"
                className="form-input"
                placeholder="e.g. 1800"
                value={formData.maxBudget}
                onChange={handleChange}
                min="10"
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="deadlineDays">
                Expected Timeline (Days) *
              </label>
              <input
                id="deadlineDays"
                type="number"
                name="deadlineDays"
                className="form-input"
                value={formData.deadlineDays}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skillsRequired">
              Required Skills (Comma-separated) *
            </label>
            <input
              id="skillsRequired"
              type="text"
              name="skillsRequired"
              className="form-input"
              placeholder="e.g. React, Node.js, Express, MongoDB, Tailwind CSS"
              value={formData.skillsRequired}
              onChange={handleChange}
              required
            />
            <span className="form-help-text">
              Specify tech stack or expertise tags to help matching freelancers find your listing
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Detailed Project Description *
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              rows="6"
              placeholder="Describe deliverables, required features, scope of work, timeline milestones, and expected outputs..."
              value={formData.description}
              onChange={handleChange}
              maxLength={3000}
              required
            />
            <span className="form-help-text">Detailed scope of work (minimum 20 characters)</span>
          </div>

          <div className="form-actions-row" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Link to="/dashboard/client" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Publishing Project...' : '🚀 Publish Project to WorkHive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostProject;
