import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../services/api';

const POPULAR_SKILLS = ['All', 'React', 'Node.js', 'MongoDB', 'Vite', 'Express', 'TailwindCSS', 'TypeScript', 'Python'];

const BrowseFreelancers = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSkill && selectedSkill !== 'All') params.skill = selectedSkill;

      const res = await profileService.getAll(params);
      setProfiles(res.data.data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [selectedSkill]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProfiles();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Top Freelance Talent</h1>
          <p className="page-subtitle">
            Hire vetted software engineers, designers, and specialists ready to work on milestones.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search freelancers by title, name, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Find Talent
          </button>
        </form>

        <div className="category-pills">
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              className={`cat-pill ${selectedSkill === skill ? 'cat-pill-active' : ''}`}
              onClick={() => setSelectedSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Freelancers Directory Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading talent profiles from MongoDB Atlas...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">👥</div>
          <h3>No freelancer profiles found</h3>
          <p>Be the first freelancer to create a profile on WorkHive!</p>
          <Link to="/profile/create" className="btn btn-primary mt-3">
            + Create Freelancer Profile
          </Link>
        </div>
      ) : (
        <div className="freelancers-grid">
          {profiles.map((prof) => {
            const displayName = prof.fullName || prof.userId?.name || 'Freelancer';
            const displayTitle = prof.professionalTitle || 'Software Engineer';
            const displayAvatar =
              prof.profileImage ||
              prof.userId?.profileImage ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

            return (
              <div key={prof._id} className="freelancer-card">
                <div className="freelancer-header">
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="freelancer-avatar"
                  />
                  <div className="freelancer-meta">
                    <h3 className="freelancer-name">{displayName}</h3>
                    <p className="freelancer-title">{displayTitle}</p>
                    <div className="freelancer-badge-row">
                      <span className="badge-rate">${prof.hourlyRate}/hr</span>
                      <span className="badge-level">{prof.experienceLevel || 'Intermediate'}</span>
                      <span className="badge-location">📍 {prof.location || 'Remote'}</span>
                    </div>
                  </div>
                </div>

                <p className="freelancer-bio">{prof.bio}</p>

                <div className="freelancer-skills-row">
                  {prof.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="freelancer-card-footer">
                  <div className="social-links-group">
                    {prof.collegeName && (
                      <span className="college-tag" title={prof.collegeName}>
                        🎓 {prof.collegeName}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/freelancers/${prof._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseFreelancers;
