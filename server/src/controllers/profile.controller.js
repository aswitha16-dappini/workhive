import Profile from '../models/Profile.js';
import User from '../models/User.js';

/**
 * @desc    Get all freelancer profiles (with optional search/filter)
 * @route   GET /api/profiles
 * @access  Public
 */
export const getProfiles = async (req, res) => {
  try {
    const { skill, search } = req.query;
    const filter = {};

    if (skill) {
      filter.skills = { $in: [new RegExp(skill, 'i')] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const profiles = await Profile.find(filter)
      .populate('user', 'name email profileImage role')
      .sort({ rating: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profiles',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current freelancer's profile
 * @route   GET /api/profiles/me
 * @access  Private (Freelancer)
 */
export const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email profileImage role'
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No profile found for this user. Please create one.',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Get profile by user ID
 * @route   GET /api/profiles/:userId
 * @access  Public
 */
export const getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      'user',
      'name email profileImage role'
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Create or update freelancer profile
 * @route   POST /api/profiles
 * @access  Private (Freelancer)
 */
export const upsertProfile = async (req, res) => {
  try {
    const {
      title,
      bio,
      skills,
      hourlyRate,
      experienceLevel,
      github,
      portfolio,
      location,
    } = req.body;

    if (!title || !bio || !skills || !hourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, bio, skills, hourlyRate',
      });
    }

    // Process skills if comma-separated string
    const formattedSkills = Array.isArray(skills)
      ? skills
      : skills.split(',').map((s) => s.trim()).filter(Boolean);

    const profileFields = {
      user: req.user._id,
      title: title.trim(),
      bio: bio.trim(),
      skills: formattedSkills,
      hourlyRate: Number(hourlyRate),
      experienceLevel: experienceLevel || 'Intermediate',
      github: github?.trim() || '',
      portfolio: portfolio?.trim() || '',
      location: location?.trim() || 'Remote',
    };

    // Find and update or insert new profile
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: 'Freelancer profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while saving profile',
    });
  }
};

