import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },
    title: {
      type: String,
      required: [true, 'Please provide a professional headline/title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      required: [true, 'Please provide a brief bio about your skills and experience'],
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    skills: {
      type: [String],
      required: [true, 'Please provide at least one skill'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Please provide at least one skill',
      },
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please provide your hourly rate'],
      min: [5, 'Hourly rate must be at least $5'],
    },
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Intermediate', 'Expert'],
      default: 'Intermediate',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
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

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;

