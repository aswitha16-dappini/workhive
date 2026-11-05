import mongoose from 'mongoose';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { generateMilestoneTitle, validateMilestoneTitle } from '../utils/titleHelper.js';

/**
 * @desc    Get milestones for a project
 * @route   GET /api/milestones/project/:projectId
 * @access  Private (Client or Freelancer on project)
 */
export const getProjectMilestones = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const milestones = await Milestone.find({ project: projectId })
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching project milestones',
      error: error.message,
    });
  }
};

/**
 * @desc    Create an additional milestone (Client funds escrow)
 * @route   POST /api/milestones
 * @access  Private (Client only)
 */
export const createMilestone = async (req, res) => {
  try {
    const { projectId, title, description, amount, deliveryDays } = req.body;
    const clientId = req.user._id;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid project ID required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project client can create milestones',
      });
    }

    if (!project.hiredFreelancer) {
      return res.status(400).json({
        success: false,
        message: 'A freelancer must be hired on this project before creating new milestones',
      });
    }

    // Determine final title: validate if provided, or generate safe default
    let finalTitle = title ? title.trim() : '';
    if (!finalTitle) {
      const existingCount = await Milestone.countDocuments({ project: projectId });
      finalTitle = generateMilestoneTitle(`Milestone ${existingCount + 1}`, project.title, 120);
    } else {
      const validation = validateMilestoneTitle(finalTitle, 120);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.error });
      }
    }

    const milestoneAmount = Number(amount) || Number(project.budget) || 100;
    if (milestoneAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than $0' });
    }

    const days = Number(deliveryDays) || Number(project.deadlineDays) || 7;
    const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const milestone = await Milestone.create({
      project: projectId,
      client: clientId,
      freelancer: project.hiredFreelancer,
      title: finalTitle,
      description: (description || `Scope deliverables per milestone agreement (${days} days).`).trim(),
      amount: milestoneAmount,
      dueDate,
      status: 'Funded_Escrow',
      escrowStatus: 'Funded_In_Escrow',
    });

    const populated = await Milestone.findById(milestone._id)
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .populate('project', 'title status');

    return res.status(201).json({
      success: true,
      message: `Milestone created and $${milestoneAmount} funded into Escrow!`,
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating milestone',
    });
  }
};

/**
 * @desc    Client funds a milestone (transitions to Funded_Escrow / Funded_In_Escrow)
 * @route   PATCH /api/milestones/:id/fund
 * @access  Private (Client only)
 */
export const fundMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID format' });
    }

    const milestone = await Milestone.findById(id).populate('project');
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (milestone.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project client can fund this milestone',
      });
    }

    if (milestone.escrowStatus === 'Funded_In_Escrow') {
      return res.status(400).json({
        success: false,
        message: 'This milestone is already funded in simulated Escrow',
      });
    }

    if (milestone.escrowStatus === 'Released_To_Freelancer') {
      return res.status(400).json({
        success: false,
        message: 'This milestone has already been approved and released to the freelancer',
      });
    }

    // Ensure title does not exceed 120 chars before saving
    if (milestone.title && milestone.title.length > 120) {
      milestone.title = milestone.title.slice(0, 117).trim() + '...';
    }

    milestone.status = 'Funded_Escrow';
    milestone.escrowStatus = 'Funded_In_Escrow';
    await milestone.save();

    // Ensure project is marked In Progress
    if (milestone.project && milestone.project.status === 'Open') {
      await Project.findByIdAndUpdate(milestone.project._id, { status: 'In Progress' });
    }

    const populated = await Milestone.findById(milestone._id)
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .populate('project', 'title status');

    return res.status(200).json({
      success: true,
      message: `Milestone funded successfully! $${populated.amount} securely deposited into Escrow.`,
      data: populated,
    });
  } catch (error) {
    console.error('Error funding milestone:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while funding milestone',
    });
  }
};

/**
 * @desc    Freelancer submits work for milestone
 * @route   PATCH /api/milestones/:id/submit
 * @access  Private (Freelancer only)
 */
export const submitMilestoneWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionNotes } = req.body;
    const freelancerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (milestone.freelancer.toString() !== freelancerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned freelancer can submit work for this milestone',
      });
    }

    if (milestone.status === 'Approved' || milestone.status === 'Released') {
      return res.status(400).json({
        success: false,
        message: 'This milestone has already been approved and released',
      });
    }

    milestone.submissionNotes = (submissionNotes || 'Work completed and submitted for client review.').trim();
    milestone.status = 'Submitted';
    milestone.submittedAt = new Date();
    await milestone.save();

    const populated = await Milestone.findById(milestone._id)
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .populate('project', 'title status');

    return res.status(200).json({
      success: true,
      message: 'Milestone work submitted successfully! Awaiting client review.',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting milestone work',
    });
  }
};

/**
 * @desc    Client approves milestone & releases escrow funds to freelancer
 * @route   PATCH /api/milestones/:id/approve
 * @access  Private (Client only)
 */
export const approveMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
    }

    const milestone = await Milestone.findById(id).populate('project');
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (milestone.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can approve and release escrow funds',
      });
    }

    if (milestone.status === 'Approved' || milestone.escrowStatus === 'Released_To_Freelancer') {
      return res.status(400).json({
        success: false,
        message: 'Milestone has already been approved and released',
      });
    }

    // Release escrow
    milestone.status = 'Approved';
    milestone.escrowStatus = 'Released_To_Freelancer';
    milestone.approvedAt = new Date();
    milestone.releasedAt = new Date();
    await milestone.save();

    // Check if all milestones for this project are approved. If so, mark project Completed!
    const remainingPending = await Milestone.find({
      project: milestone.project._id,
      status: { $nin: ['Approved', 'Released'] },
    });

    let projectCompleted = false;
    if (remainingPending.length === 0) {
      await Project.findByIdAndUpdate(milestone.project._id, { status: 'Completed' });
      projectCompleted = true;
    }

    const populated = await Milestone.findById(milestone._id)
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .populate('project', 'title status');

    return res.status(200).json({
      success: true,
      message: `Milestone approved! $${milestone.amount} released from Escrow to ${populated.freelancer?.name || 'freelancer'}.${
        projectCompleted ? ' All milestones finished: Project marked as COMPLETED!' : ''
      }`,
      data: {
        milestone: populated,
        projectCompleted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error approving milestone',
    });
  }
};

/**
 * @desc    Get all milestones for logged-in freelancer
 * @route   GET /api/milestones/my
 * @access  Private (Freelancer only)
 */
export const getMyMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({ freelancer: req.user._id })
      .populate('project', 'title budget status category client')
      .populate('client', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your milestones',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all milestones across client's projects
 * @route   GET /api/milestones/client
 * @access  Private (Client only)
 */
export const getClientMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({ client: req.user._id })
      .populate('project', 'title budget status hiredFreelancer')
      .populate('freelancer', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching client milestones',
      error: error.message,
    });
  }
};

