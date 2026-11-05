import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed project description'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a project category'],
      enum: [
        'Web Development',
        'Mobile App Development',
        'Mobile Apps',
        'UI/UX Design',
        'Graphic Design',
        'Design & Creative',
        'Data Analytics',
        'Artificial Intelligence & Machine Learning',
        'AI & Machine Learning',
        'Content Writing',
        'Writing & Translation',
        'Digital Marketing',
        'DevOps & Cloud',
        'Video Editing',
        'Other',
      ],
      default: 'Web Development',
    },
    budget: {
      type: Number,
      required: [true, 'Please specify a project budget in USD'],
      min: [10, 'Budget must be at least $10'],
    },
    minBudget: {
      type: Number,
      default: function () {
        return this.budget;
      },
    },
    maxBudget: {
      type: Number,
      default: function () {
        return this.budget;
      },
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    skillsRequired: {
      type: [String],
      required: [true, 'Please provide at least one required skill'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Please provide at least one required skill',
      },
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Closed'],
      default: 'Open',
    },
    proposalsCount: {
      type: Number,
      default: 0,
    },
    deadlineDays: {
      type: Number,
      default: 14,
      min: 1,
    },
    hiredFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;

