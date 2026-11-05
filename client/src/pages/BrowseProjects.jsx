import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'All', label: 'All Categories', icon: '🌐' },
  { id: 'Web Development', label: 'Web Development', icon: '💻' },
  { id: 'Mobile App Development', label: 'Mobile App Dev', icon: '📱' },
  { id: 'UI/UX Design', label: 'UI/UX Design', icon: '🎨' },
  { id: 'Graphic Design', label: 'Graphic Design', icon: '✨' },
  { id: 'Data Analytics', label: 'Data Analytics', icon: '📊' },
  { id: 'Artificial Intelligence & Machine Learning', label: 'AI & Machine Learning', icon: '🤖' },
  { id: 'Content Writing', label: 'Content Writing', icon: '✍️' },
  { id: 'Digital Marketing', label: 'Digital Marketing', icon: '📈' },
  { id: 'DevOps & Cloud', label: 'DevOps & Cloud', icon: '☁️' },
  { id: 'Video Editing', label: 'Video Editing', icon: '🎬' },
];

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'Figma',
  'Docker',
  'Flutter',
  'SQL',
  'AWS',
  'SEO',
  'After Effects',
];

const BrowseProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (minBudget) params.minBudget = Number(minBudget);
      if (maxBudget) params.maxBudget = Number(maxBudget);
      if (selectedSkill && selectedSkill !== 'All') params.skill = selectedSkill;
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      else if (statusFilter === 'All') params.status = 'All';

      const res = await projectService.getAll(params);
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, statusFilter, selectedSkill]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setMinBudget('');
    setMaxBudget('');
    setSelectedSkill('');
    setStatusFilter('Open');
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (minBudget ? 1 : 0) +
    (maxBudget ? 1 : 0) +
    (selectedSkill ? 1 : 0) +
    (statusFilter !== 'Open' ? 1 : 0);

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Explore Project Opportunities</h1>
          <p className="page-subtitle">
            Browse verified opportunities across all 10 specialized categories with escrow milestone protection.
          </p>
        </div>
        {user?.role === 'Client' && (
          <Link to="/post-project" className="btn btn-primary">
            + Post a New Project
          </Link>
        )}
      </div>

      {/* Filter / Search Control Card */}
      <div className="filter-card mb-4">
        {/* Row 1: Keyword Search & Budget Range */}
        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by keywords, title, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <input
            type="number"
            className="form-input budget-input"
            placeholder="Min Budget ($)"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />

          <input
            type="number"
            className="form-input budget-input"
            placeholder="Max Budget ($)"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Open">Status: Open</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="Completed">Status: Completed</option>
            <option value="All">All Statuses</option>
          </select>

          <button type="submit" className="btn btn-primary">
            🔍 Search
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              title="Reset all search filters"
            >
              ✕ Reset
            </button>
          )}
        </form>

        {/* Row 2: 10 Categories Navigation Pills */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Browse 10 Specialized Disciplines:
            </span>
            <span className="text-sm text-muted">
              {loading ? 'Updating...' : `${projects.length} opportunity(ies) found`}
            </span>
          </div>

          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'cat-pill-active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Quick Skill Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-sm text-muted">Filter by Skill:</span>
          {POPULAR_SKILLS.map((sk) => (
            <button
              key={sk}
              type="button"
              className={`skill-tag ${selectedSkill === sk ? 'skill-tag-active' : ''}`}
              style={{
                cursor: 'pointer',
                borderColor: selectedSkill === sk ? 'var(--primary)' : undefined,
                background: selectedSkill === sk ? 'rgba(245, 158, 11, 0.2)' : undefined,
                color: selectedSkill === sk ? '#f59e0b' : undefined,
              }}
              onClick={() => setSelectedSkill(selectedSkill === sk ? '' : sk)}
            >
              {sk}
            </button>
          ))}
          {selectedSkill && (
            <button
              type="button"
              className="text-sm text-muted"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setSelectedSkill('')}
            >
              Clear skill filter
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading projects from MongoDB Atlas...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📂</div>
          <h3>No matching opportunities found</h3>
          <p>
            No projects matched your filter criteria in category <strong>"{selectedCategory}"</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Reset All Filters
            </button>
            {user?.role === 'Client' && (
              <Link to="/post-project" className="btn btn-primary">
                + Post a Project in this Category
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => {
            const isDemo = proj.isDemo || proj.title?.startsWith('[DEMO');
            const cleanTitle = proj.title?.replace(/^\[DEMO Opportunity\]\s*/i, '');
            const budgetDisplay =
              proj.minBudget && proj.maxBudget && proj.minBudget !== proj.maxBudget
                ? `$${proj.minBudget.toLocaleString()} - $${proj.maxBudget.toLocaleString()}`
                : `$${proj.budget?.toLocaleString()}`;

            return (
              <div key={proj._id} className="project-card">
                <div className="project-header">
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="project-category-badge">{proj.category}</span>
                    {isDemo && (
                      <span className="badge-demo" title="Verified demonstration listing for testing">
                        🔬 DEMO
                      </span>
                    )}
                    <span className={`status-pill status-${(proj.status || 'open').toLowerCase().replace(' ', '-')}`}>
                      {proj.status}
                    </span>
                  </div>

                  <span className="project-budget-badge">{budgetDisplay} USD</span>
                </div>

                <h2 className="project-title">
                  <Link to={`/projects/${proj._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {cleanTitle}
                  </Link>
                </h2>

                <p className="project-description">{proj.description}</p>

                <div className="project-skills-list">
                  {proj.skillsRequired?.map((skill, index) => (
                    <span
                      key={index}
                      className="skill-tag"
                      style={{ cursor: 'pointer' }}
                      title={`Filter by ${skill}`}
                      onClick={() => setSelectedSkill(skill)}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="project-footer">
                  <div className="client-badge">
                    <img
                      src={
                        proj.client?.profileImage ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          proj.client?.name || 'Client'
                        )}`
                      }
                      alt={proj.client?.name}
                      className="client-avatar"
                    />
                    <div>
                      <span className="client-name">
                        {proj.client?.name || 'Verified Client'}
                      </span>
                      <span className="project-date">
                        ⏱️ {proj.deadlineDays || 14}d • {proj.proposalsCount || 0} Bid(s)
                      </span>
                    </div>
                  </div>

                  {user?.role === 'Freelancer' ? (
                    <Link
                      to={`/projects/${proj._id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Submit Proposal →
                    </Link>
                  ) : user && proj.client?._id === user._id ? (
                    <Link
                      to={`/projects/${proj._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Manage Job →
                    </Link>
                  ) : !isAuthenticated ? (
                    <Link to={`/projects/${proj._id}`} className="btn btn-secondary btn-sm">
                      View & Bid →
                    </Link>
                  ) : (
                    <Link to={`/projects/${proj._id}`} className="btn btn-secondary btn-sm">
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseProjects;
