import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const CreateProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    professionalTitle: '',
    bio: '',
    experienceLevel: 'Intermediate',
    education: '',
    collegeName: '',
    hourlyRate: 45,
    location: 'Remote',
    githubLink: '',
    linkedinLink: '',
  });

  const [skills, setSkills] = useState(['React', 'Node.js', 'MongoDB']);
  const [skillInput, setSkillInput] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState(['']);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Image Upload Handler with size & type validation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (max 2MB)
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

  // Portfolio Links handlers
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

    // Form Validations
    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.professionalTitle.trim()) {
      setError('Please provide your professional title (e.g. MERN Stack Developer).');
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

    // Filter valid portfolio URLs
    const cleanedPortfolio = portfolioLinks.map((p) => p.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      await profileService.create({
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
        skills,
        portfolioLinks: cleanedPortfolio,
        profileImage,
      });

      // Redirect to own profile view
      navigate('/profile/me');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">🧑‍💻</div>
          <h2 className="auth-title">Create Your Freelancer Profile</h2>
          <p className="auth-subtitle">
            Stand out to potential clients by showcasing your skills, rate, and background.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Profile Photo Upload */}
          <div className="profile-upload-section">
            <div className="profile-avatar-wrapper">
              <img
                src={imagePreview || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.fullName || 'User'}`}
                alt="Profile Preview"
                className="profile-upload-preview"
              />
            </div>
            <div className="profile-upload-controls">
              <label className="form-label">Profile Photo (Max 2MB)</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                className="form-file-input"
              />
              <span className="form-help-text">JPG, PNG, or WebP up to 2MB</span>
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
                placeholder="e.g. Alex Morgan"
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
                placeholder="e.g. Full-Stack MERN Developer"
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
              placeholder="Tell clients about your technical background, projects you have built, and what makes you reliable..."
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
                placeholder="Type a skill and click Add (e.g. Docker, Redux)..."
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

            {/* Selected Skills Chips */}
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

            {/* Suggested Skills */}
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
                placeholder="50"
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
                placeholder="e.g. B.Tech Computer Science / Master in IT"
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
                placeholder="e.g. Stanford University / IIT Delhi"
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
                placeholder="e.g. Remote / New York"
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
                placeholder="https://github.com/yourusername"
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
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinLink}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Portfolio Links Dynamic List */}
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
                  placeholder="https://myproject.com or demo portfolio link"
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
              onClick={() => navigate('/dashboard/freelancer')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating Profile...' : '🚀 Create Freelancer Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;

