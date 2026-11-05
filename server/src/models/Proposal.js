import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer reference is required'],
    },
    freelancerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreelancerProfile',
    },
    bidAmount: {
      type: Number,
      required: [true, 'Please provide your proposed bid amount in USD'],
      min: [1, 'Bid amount must be at least $1'],
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Please specify delivery timeframe in days'],
      min: [1, 'Delivery timeframe must be at least 1 day'],
      max: [365, 'Delivery timeframe cannot exceed 365 days'],
    },
    coverLetter: {
      type: String,
      required: [true, 'Please provide a proposal cover letter explaining your approach'],
      trim: true,
      minlength: [20, 'Cover letter must be at least 20 characters long'],
      maxlength: [4000, 'Cover letter cannot exceed 4000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Accepted', 'Rejected', 'Withdrawn'],
        message: 'Status must be Pending, Accepted, Rejected, or Withdrawn',
      },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate proposals from the same freelancer on the same project
proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;

