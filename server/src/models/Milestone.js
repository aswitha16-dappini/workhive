import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client reference is required'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a milestone title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the milestone escrow amount'],
      min: [1, 'Milestone amount must be at least $1'],
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Funded_Escrow', 'In_Progress', 'Submitted', 'Approved', 'Released'],
      default: 'Funded_Escrow',
    },
    escrowStatus: {
      type: String,
      enum: ['Awaiting_Funding', 'Funded_In_Escrow', 'Released_To_Freelancer', 'Refunded'],
      default: 'Funded_In_Escrow',
    },
    submissionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    releasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

milestoneSchema.index({ project: 1, freelancer: 1 });
milestoneSchema.index({ client: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;

