import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
      default: '',
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: 'Technology & Software',
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote / Global',
    },
    companyDescription: {
      type: String,
      trim: true,
      maxlength: [3000, 'Company description cannot exceed 3000 characters'],
      default: '',
    },
    hiringRequirements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Hiring requirements cannot exceed 2000 characters'],
      default: '',
    },
    companyLogo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

clientProfileSchema.index({ companyName: 'text', industry: 'text' });

const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

export default ClientProfile;

