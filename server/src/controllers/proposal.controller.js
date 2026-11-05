import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { generateMilestoneTitle } from '../utils/titleHelper.js';

/**
 * @desc    Submit a proposal for a project
 * @route   POST /api/proposals
 * @access  Private (Freelancer only)
 */
export const submitProposal = async (req, res) => {
  try {
    const { projectId, bidAmount, deliveryDays, coverLetter } = req.body;
    const freelancerId = req.user._id;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid project ID is required',
      });
    }

    if (!bidAmount || Number(bidAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid bid amount greater than $0',
      });
    }

    if (!deliveryDays || Number(deliveryDays) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Delivery timeframe must be at least 1 day',
      });
    }

    if (!coverLetter || coverLetter.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Cover letter must be at least 20 characters long',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit proposal. Project is currently ${project.status}`,
      });
    }

    if (project.client.toString() === freelancerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a proposal to your own project',
      });
    }

    // Check if proposal already submitted by this freelancer
    const existing = await Proposal.findOne({
      project: projectId,
      freelancer: freelancerId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this project',
      });
    }

    // Find linked freelancer profile if available
    const profile = await FreelancerProfile.findOne({ userId: freelancerId });

    const proposal = await Proposal.create({
      project: projectId,
      freelancer: freelancerId,
      freelancerProfile: profile ? profile._id : null,
      bidAmount: Number(bidAmount),
      deliveryDays: Number(deliveryDays),
      coverLetter: coverLetter.trim(),
    });

    // Increment proposal count on the project
    await Project.findByIdAndUpdate(projectId, { $inc: { proposalsCount: 1 } });

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name email profileImage')
      .populate('freelancerProfile', 'professionalTitle hourlyRate skills experienceLevel rating')
      .populate('project', 'title budget status');

    return res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: populatedProposal,
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting proposal',
    });
  }
};

/**
 * @desc    Get all proposals for a specific project
 * @route   GET /api/proposals/project/:projectId
 * @access  Private (Client owner sees all, Freelancer sees own)
 */
export const getProjectProposals = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const isClientOwner =
      req.user.role === 'Client' && project.client.toString() === req.user._id.toString();

    let query = { project: projectId };

    // If not the client owner, a freelancer can only see their own proposal
    if (!isClientOwner) {
      query.freelancer = req.user._id;
    }

    const proposals = await Proposal.find(query)
      .populate('freelancer', 'name email profileImage')
      .populate('freelancerProfile', 'professionalTitle hourlyRate skills experienceLevel rating location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      isOwner: isClientOwner,
      data: proposals,
    });
  } catch (error) {
    console.error('Error fetching project proposals:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching proposals',
      error: error.message,
    });
  }
};

/**
 * @desc    Get proposals submitted by the logged-in freelancer
 * @route   GET /api/proposals/my
 * @access  Private (Freelancer only)
 */
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate({
        path: 'project',
        select: 'title budget status deadlineDays category client createdAt',
        populate: { path: 'client', select: 'name email profileImage' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your proposals',
      error: error.message,
    });
  }
};

/**
 * @desc    Accept a proposal (Client hires freelancer & funds escrow)
 * @route   PATCH /api/proposals/:id/accept
 * @access  Private (Client only)
 */
export const acceptProposal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid proposal ID' });
    }

    const proposal = await Proposal.findById(id).populate('project');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const project = proposal.project;
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can accept proposals for this project',
      });
    }

    if (project.status === 'In Progress' && project.hiredFreelancer) {
      // Check if milestone was already initialized
      const existingMilestone = await Milestone.findOne({ project: project._id });
      if (existingMilestone) {
        return res.status(400).json({
          success: false,
          message: 'A freelancer has already been hired and an escrow milestone is already active for this project',
        });
      }
      // If project was marked In Progress but milestone creation previously failed, allow healing
    }

    // 1. Prepare and validate initial Escrow Milestone title and attributes FIRST
    // Guarantees title is strictly <= 120 chars and prevents partial database state
    const safeTitle = generateMilestoneTitle('Milestone 1', project.title, 120);
    const deliveryDays = Number(proposal.deliveryDays) || 7;
    const dueDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

    const initialMilestone = new Milestone({
      project: project._id,
      proposal: proposal._id,
      client: req.user._id,
      freelancer: proposal.freelancer,
      title: safeTitle,
      description: `Agreed scope delivered per accepted proposal (${deliveryDays} days). Escrow deposit active.`,
      amount: Number(proposal.bidAmount),
      dueDate,
      status: 'Funded_Escrow',
      escrowStatus: 'Funded_In_Escrow',
    });

    // Validate milestone against schema BEFORE mutating database
    await initialMilestone.validate();

    // 2. Accept this proposal
    proposal.status = 'Accepted';
    await proposal.save();

    // 3. Reject all other pending proposals for this project
    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposal._id }, status: 'Pending' },
      { $set: { status: 'Rejected' } }
    );

    // 4. Update project status to 'In Progress' and set hired freelancer
    project.status = 'In Progress';
    project.hiredFreelancer = proposal.freelancer;
    project.acceptedProposal = proposal._id;
    await project.save();

    // 5. Commit verified milestone
    const milestone = await initialMilestone.save();

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name email profileImage')
      .populate('project', 'title status hiredFreelancer');

    return res.status(200).json({
      success: true,
      message: `Proposal accepted! Escrow milestone of $${proposal.bidAmount} funded and locked. Project is now In Progress.`,
      data: {
        proposal: populatedProposal,
        project,
        milestone,
      },
    });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while accepting proposal',
    });
  }
};

/**
 * @desc    Reject a proposal
 * @route   PATCH /api/proposals/:id/reject
 * @access  Private (Client only)
 */
export const rejectProposal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid proposal ID' });
    }

    const proposal = await Proposal.findById(id).populate('project');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (proposal.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can reject proposals',
      });
    }

    proposal.status = 'Rejected';
    await proposal.save();

    return res.status(200).json({
      success: true,
      message: 'Proposal marked as declined',
      data: proposal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while rejecting proposal',
    });
  }
};

/**
 * @desc    Get all proposals across all projects owned by the logged-in client
 * @route   GET /api/proposals/client
 * @access  Private (Client only)
 */
export const getClientProposals = async (req, res) => {
  try {
    const clientProjects = await Project.find({ client: req.user._id }).select('_id');
    const projectIds = clientProjects.map((p) => p._id);

    const proposals = await Proposal.find({ project: { $in: projectIds } })
      .populate('freelancer', 'name email profileImage')
      .populate('freelancerProfile', 'professionalTitle hourlyRate skills experienceLevel rating location')
      .populate('project', 'title category budget status hiredFreelancer')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching client proposals',
      error: error.message,
    });
  }
};


