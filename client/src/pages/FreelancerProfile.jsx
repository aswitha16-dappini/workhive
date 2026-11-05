import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';

const FreelancerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getMyProfile();
        setProfile(res.data.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          setError(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">🧑‍💻</div>
          <h2>You haven't set up your freelancer profile yet</h2>
          <p>
            Create your profile to showcase your skills, set your hourly rate, and start receiving job proposals.
          </p>
          <Link to="/profile/create" className="btn btn-primary mt-3">
            + Create Freelancer Profile Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Profile Header Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <img
            src={profile.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`}
            alt={profile.fullName}
            className="profile-hero-avatar"
          />
          <div className="profile-hero-info">
            <div className="profile-hero-title-row">
              <h1 className="profile-hero-name">{profile.fullName}</h1>
              <span className="role-pill role-freelancer">Freelancer</span>
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
          <Link to="/profile/edit" className="btn btn-primary">
            ✏️ Edit Profile
          </Link>
          <Link to={`/freelancers/${profile._id}`} className="btn btn-secondary">
            👁️ View Public Profile
          </Link>
        </div>
      </div>

      {/* Main Grid: Details */}
      <div className="profile-layout-grid">
        {/* Left Column: Bio & Skills */}
        <div className="profile-main-col">
          {/* Bio */}
          <div className="content-card">
            <h3 className="content-card-title">About Me</h3>
            <p className="profile-bio-text">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="content-card">
            <h3 className="content-card-title">Skills & Expertise</h3>
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

        {/* Right Column: Background & Links */}
        <div className="profile-side-col">
          {/* Education Card */}
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
              <p className="text-muted">No education details added yet.</p>
            )}
          </div>

          {/* Links & Socials */}
          <div className="content-card">
            <h3 className="content-card-title">Professional Links</h3>
            <div className="social-links-list">
              {profile.githubLink ? (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <span>🐙 GitHub</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="text-muted text-sm">GitHub not linked</span>
              )}

              {profile.linkedinLink ? (
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <span>💼 LinkedIn</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="text-muted text-sm">LinkedIn not linked</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
