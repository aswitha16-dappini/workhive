import mongoose from 'mongoose';

const freelancerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    professionalTitle: {
      type: String,
      required: [true, 'Please provide your professional title (e.g. MERN Stack Developer)'],
      trim: true,
      maxlength: [100, 'Professional title cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      required: [true, 'Please provide an About Me / Bio section'],
      trim: true,
      maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    },
    skills: {
      type: [String],
      required: [true, 'Please provide at least one skill'],
      validate: {
        validator: function (skillsArray) {
          return Array.isArray(skillsArray) && skillsArray.length > 0;
        },
        message: 'Please provide at least one skill',
      },
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ['Fresher', 'Intermediate', 'Expert'],
        message: 'Experience level must be Fresher, Intermediate, or Expert',
      },
      default: 'Intermediate',
    },
    education: {
      type: String,
      trim: true,
      default: '',
    },
    collegeName: {
      type: String,
      trim: true,
      default: '',
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please provide your hourly rate in USD'],
      min: [1, 'Hourly rate must be at least $1'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    githubLink: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinLink: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search capabilities
freelancerProfileSchema.index({ fullName: 'text', professionalTitle: 'text', skills: 'text' });

const FreelancerProfile = mongoose.model('FreelancerProfile', freelancerProfileSchema);

export default FreelancerProfile;
