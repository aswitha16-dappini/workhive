import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PublicProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await profileService.getById(id);
        setProfile(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Freelancer profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading freelancer profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">🔍</div>
          <h2>Freelancer Profile Not Found</h2>
          <p>{error || 'This profile could not be retrieved.'}</p>
          <Link to="/freelancers" className="btn btn-primary mt-3">
            Browse All Freelancers
          </Link>
        </div>
      </div>
    );
  }

  const isOwner =
    user && (user._id === profile.userId?._id || user._id === profile.userId);

  const handleHireClick = () => {
    const confirmHire = window.confirm(
      `Hire ${profile.fullName} ($${profile.hourlyRate}/hr)?\n\nClick OK to open the Job Posting wizard to assign a project milestone to this freelancer.`
    );
    if (confirmHire) {
      navigate('/post-project', {
        state: {
          prefilledFreelancer: profile.fullName,
          prefilledSkills: profile.skills?.join(', '),
        },
      });
    }
  };

  return (
    <div className="page-container">
      {/* Profile Hero */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <img
            src={
              profile.profileImage ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`
            }
            alt={profile.fullName}
            className="profile-hero-avatar"
          />
          <div className="profile-hero-info">
            <div className="profile-hero-title-row">
              <h1 className="profile-hero-name">{profile.fullName}</h1>
              <span className="role-pill role-freelancer">Verified Freelancer</span>
            </div>
            <p className="profile-hero-headline">{profile.professionalTitle}</p>

            <div className="profile-hero-tags">
              <span className="badge-rate">${profile.hourlyRate} / hr</span>
              <span className="badge-level">{profile.experienceLevel}</span>
              <span className="badge-location">📍 {profile.location || 'Remote'}</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          {isOwner ? (
            <Link to="/profile/edit" className="btn btn-primary">
              ✏️ Edit Profile
            </Link>
          ) : user?.role === 'Client' ? (
            <button
              className="btn btn-primary"
              onClick={handleHireClick}
            >
              🤝 Hire for Project
            </button>
          ) : !user ? (
            <Link to="/login" className="btn btn-primary">
              🔑 Sign in to Hire
            </Link>
          ) : (
            <Link to="/projects" className="btn btn-secondary">
              Browse Open Jobs
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Details */}
      <div className="profile-layout-grid">
        {/* Main Column */}
        <div className="profile-main-col">
          {/* About Me */}
          <div className="content-card">
            <h3 className="content-card-title">About Me</h3>
            <p className="profile-bio-text">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="content-card">
            <h3 className="content-card-title">Skills & Tech Stack</h3>
            <div className="skills-badge-grid">
              {profile.skills?.map((skill, index) => (
                <span key={index} className="skill-tag skill-tag-lg">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio Links */}
          {profile.portfolioLinks?.length > 0 && (
            <div className="content-card">
              <h3 className="content-card-title">Portfolio & Project Work</h3>
              <div className="portfolio-links-list">
                {profile.portfolioLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-link-item"
                  >
                    <span className="portfolio-link-icon">🔗</span>
                    <span className="portfolio-link-url">{link}</span>
                    <span className="portfolio-link-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="profile-side-col">
          {/* Education Details */}
          <div className="content-card">
            <h3 className="content-card-title">Education & College</h3>
            {profile.education || profile.collegeName ? (
              <div className="education-box">
                <div className="education-degree">
                  {profile.education || 'Degree not specified'}
                </div>
                <div className="education-college">
                  🏛️ {profile.collegeName || 'Institution not specified'}
                </div>
              </div>
            ) : (
              <p className="text-muted">No education details listed.</p>
            )}
          </div>

          {/* Links & Socials */}
          <div className="content-card">
            <h3 className="content-card-title">Online Presence</h3>
            <div className="social-links-list">
              {profile.githubLink ? (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <span>🐙 GitHub Profile</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="text-muted text-sm">GitHub not provided</span>
              )}

              {profile.linkedinLink ? (
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <span>💼 LinkedIn Profile</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="text-muted text-sm">LinkedIn not provided</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

