import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'MongoDB',
  'Express',
  'JavaScript',
  'TypeScript',
  'Python',
  'TailwindCSS',
  'Next.js',
  'REST APIs',
  'Git',
  'Docker',
];

const EditProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    professionalTitle: '',
    bio: '',
    experienceLevel: 'Intermediate',
    education: '',
    collegeName: '',
    hourlyRate: 50,
    location: 'Remote',
    githubLink: '',
    linkedinLink: '',
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState(['']);
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch current profile data
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const res = await profileService.getMyProfile();
        const p = res.data.data;
        if (p) {
          setFormData({
            fullName: p.fullName || '',
            professionalTitle: p.professionalTitle || '',
            bio: p.bio || '',
            experienceLevel: p.experienceLevel || 'Intermediate',
            education: p.education || '',
            collegeName: p.collegeName || '',
            hourlyRate: p.hourlyRate || 50,
            location: p.location || 'Remote',
            githubLink: p.githubLink || '',
            linkedinLink: p.linkedinLink || '',
          });
          setSkills(p.skills || []);
          setPortfolioLinks(p.portfolioLinks?.length ? p.portfolioLinks : ['']);
          setProfileImage(p.profileImage || '');
          setImagePreview(p.profileImage || '');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // If no profile exists yet, redirect to Create Profile
          navigate('/profile/create');
        } else {
          setError('Failed to load profile details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    setError(null);
    setSuccessMsg('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile image must be less than 2MB in size.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Skills handlers
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Portfolio handlers
  const handlePortfolioChange = (index, value) => {
    const updated = [...portfolioLinks];
    updated[index] = value;
    setPortfolioLinks(updated);
  };

  const handleAddPortfolioField = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const handleRemovePortfolioField = (index) => {
    if (portfolioLinks.length > 1) {
      setPortfolioLinks(portfolioLinks.filter((_, idx) => idx !== index));
    } else {
      setPortfolioLinks(['']);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.professionalTitle.trim()) {
      setError('Please provide your professional title.');
      return;
    }
    if (!formData.bio.trim()) {
      setError('Please provide an About Me / Bio section.');
      return;
    }
    if (skills.length === 0) {
      setError('Please select or add at least one skill.');
      return;
    }
    if (!formData.hourlyRate || Number(formData.hourlyRate) < 1) {
      setError('Hourly rate must be at least $1 USD.');
      return;
    }

    const cleanedPortfolio = portfolioLinks.map((p) => p.trim()).filter(Boolean);

    setSaving(true);
    try {
      await profileService.update({
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
        skills,
        portfolioLinks: cleanedPortfolio,
        profileImage,
      });

      setSuccessMsg('Profile updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/profile/me');
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile details from database...</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">✏️</div>
          <h2 className="auth-title">Edit Freelancer Profile</h2>
          <p className="auth-subtitle">Update your skills, hourly rate, and portfolio details</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Profile Photo */}
          <div className="profile-upload-section">
            <div className="profile-avatar-wrapper">
              <img
                src={imagePreview || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.fullName || 'User'}`}
                alt="Profile Preview"
                className="profile-upload-preview"
              />
            </div>
            <div className="profile-upload-controls">
              <label className="form-label">Update Profile Photo</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                className="form-file-input"
              />
              <span className="form-help-text">Max size: 2MB (JPG, PNG, WebP)</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="fullName">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                className="form-input"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="professionalTitle">
                Professional Title *
              </label>
              <input
                id="professionalTitle"
                type="text"
                name="professionalTitle"
                className="form-input"
                value={formData.professionalTitle}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">
              About Me / Bio *
            </label>
            <textarea
              id="bio"
              name="bio"
              className="form-input"
              rows="4"
              value={formData.bio}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Skills Management */}
          <div className="form-group">
            <label className="form-label">Skills *</label>
            <div className="skills-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="Type a skill and click Add..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddSkill()}
              >
                + Add Skill
              </button>
            </div>

            <div className="selected-skills-container">
              {skills.map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                  <button
                    type="button"
                    className="skill-remove-btn"
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="suggested-skills-row">
              <span className="suggested-label">Quick add:</span>
              {POPULAR_SKILLS.filter((s) => !skills.includes(s)).slice(0, 7).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="quick-skill-btn"
                  onClick={() => handleAddSkill(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="experienceLevel">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="form-input"
                value={formData.experienceLevel}
                onChange={handleInputChange}
              >
                <option value="Fresher">Fresher (0-1 yrs)</option>
                <option value="Intermediate">Intermediate (1-4 yrs)</option>
                <option value="Expert">Expert (5+ yrs)</option>
              </select>
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="hourlyRate">
                Hourly Rate ($ USD) *
              </label>
              <input
                id="hourlyRate"
                type="number"
                name="hourlyRate"
                className="form-input"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="education">
                Education Details
              </label>
              <input
                id="education"
                type="text"
                name="education"
                className="form-input"
                value={formData.education}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="collegeName">
                College / University Name
              </label>
              <input
                id="collegeName"
                type="text"
                name="collegeName"
                className="form-input"
                value={formData.collegeName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label" htmlFor="githubLink">
                GitHub Profile URL
              </label>
              <input
                id="githubLink"
                type="url"
                name="githubLink"
                className="form-input"
                value={formData.githubLink}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group form-col">
              <label className="form-label" htmlFor="linkedinLink">
                LinkedIn Profile URL
              </label>
              <input
                id="linkedinLink"
                type="url"
                name="linkedinLink"
                className="form-input"
                value={formData.linkedinLink}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Portfolio / Project Links</label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleAddPortfolioField}
              >
                + Add Link
              </button>
            </div>
            {portfolioLinks.map((link, index) => (
              <div key={index} className="portfolio-input-row">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => handlePortfolioChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className="btn-remove-link"
                  onClick={() => handleRemovePortfolioField(index)}
                  title="Remove link"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/profile/me')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : '💾 Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

