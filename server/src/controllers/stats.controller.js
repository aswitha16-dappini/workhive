import User from '../models/User.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Milestone from '../models/Milestone.js';

/**
 * @desc    Get live platform statistics directly from MongoDB Atlas
 * @route   GET /api/stats
 * @access  Public
 */
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      totalFreelancerProfiles,
      totalProjects,
      totalProposals,
      openProjects,
      inProgressProjects,
      completedProjects,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Client' }),
      User.countDocuments({ role: 'Freelancer' }),
      FreelancerProfile.countDocuments(),
      Project.countDocuments(),
      Proposal.countDocuments(),
      Project.countDocuments({ status: 'Open' }),
      Project.countDocuments({ status: 'In Progress' }),
      Project.countDocuments({ status: 'Completed' }),
    ]);

    // Calculate total verified escrow transactions completed
    const releasedMilestones = await Milestone.find({ escrowStatus: 'Released_To_Freelancer' });
    const totalEscrowCompleted = releasedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        totalUsers,
        totalClients,
        totalFreelancers,
        totalFreelancerProfiles,
        totalProjects,
        totalProposals,
        openProjects,
        inProgressProjects,
        completedProjects,
        totalEscrowCompleted,
      },
    });
  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving platform statistics',
      error: error.message,
    });
  }
};

