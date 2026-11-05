import mongoose from 'mongoose';
import ClientProfile from '../models/ClientProfile.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';

// Helper to validate URL formats
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

/**
 * @desc    Get logged-in client's profile with actual dynamic statistics
 * @route   GET /api/client-profile/me
 * @access  Private (Client only)
 */
export const getMyClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find or initialize profile document
    let profile = await ClientProfile.findOne({ userId }).populate(
      'userId',
      'name email role profileImage lastLogin createdAt'
    );

    // If client profile doesn't exist yet, initialize default
    if (!profile) {
      profile = await ClientProfile.create({
        userId,
        companyName: req.user.name ? `${req.user.name}'s Organization` : 'My Organization',
        industry: 'Technology & Software',
        location: 'Remote / Global',
        companyDescription: '',
        hiringRequirements: '',
      });
      profile = await ClientProfile.findById(profile._id).populate(
        'userId',
        'name email role profileImage lastLogin createdAt'
      );
    }

    // 2. Fetch projects posted by this client
    const projects = await Project.find({ client: userId }).sort({ createdAt: -1 });

    // 3. Calculate totalSpent dynamically from ACTUAL released escrow milestones
    const releasedMilestones = await Milestone.find({
      client: userId,
      escrowStatus: 'Released_To_Freelancer',
    });
    const totalSpent = releasedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);

    // 4. Calculate total committed budget across active projects
    const totalCommittedBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalProposalsReceived = projects.reduce((sum, p) => sum + (p.proposalsCount || 0), 0);
    const openProjectsCount = projects.filter((p) => p.status === 'Open').length;

    return res.status(200).json({
      success: true,
      data: {
        profile,
        user: profile.userId,
        projects,
        metrics: {
          totalSpent, // Derived directly from released escrow records
          totalProjects: projects.length,
          openProjectsCount,
          totalCommittedBudget,
          totalProposalsReceived,
          releasedMilestonesCount: releasedMilestones.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving client profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Create or update logged-in client's profile (Upsert)
 * @route   PUT /api/client-profile/me
 * @access  Private (Client only)
 */
export const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      companyName,
      companyWebsite,
      industry,
      location,
      companyDescription,
      hiringRequirements,
      companyLogo,
      name,
    } = req.body;

    if (companyWebsite && !isValidUrl(companyWebsite)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website URL starting with http:// or https://',
      });
    }

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite.trim();
    if (industry !== undefined) updateData.industry = industry.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (companyDescription !== undefined) updateData.companyDescription = companyDescription.trim();
    if (hiringRequirements !== undefined) updateData.hiringRequirements = hiringRequirements.trim();
    if (companyLogo !== undefined) updateData.companyLogo = companyLogo;

    // Upsert client profile
    const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', 'name email role profileImage lastLogin createdAt');

    // Optionally sync name/avatar with User model
    if (name && name.trim()) {
      await User.findByIdAndUpdate(userId, { name: name.trim() });
    }

    return res.status(200).json({
      success: true,
      message: 'Client profile updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating client profile',
    });
  }
};

/**
 * @desc    Get public client profile by ID or userId
 * @route   GET /api/client-profile/:id
 * @access  Public
 */
export const getPublicClientProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    let profile = await ClientProfile.findById(id).populate(
      'userId',
      'name email profileImage lastLogin createdAt'
    );

    if (!profile) {
      profile = await ClientProfile.findOne({ userId: id }).populate(
        'userId',
        'name email profileImage lastLogin createdAt'
      );
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Public projects posted by this client
    const openProjects = await Project.find({ client: profile.userId._id, status: 'Open' })
      .select('title budget category skillsRequired deadlineDays createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        profile,
        user: profile.userId,
        openProjects,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving client profile',
      error: error.message,
    });
  }
};

