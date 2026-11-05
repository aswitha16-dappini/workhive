import mongoose from 'mongoose';
import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';

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

// Helper to validate image size and format (if base64 data URI)
const validateImage = (img) => {
  if (!img || typeof img !== 'string' || img.trim() === '') return { valid: true };
  if (img.startsWith('data:image/')) {
    const match = img.match(/^data:(image\/(jpeg|png|webp|gif|svg\+xml));base64,/i);
    if (!match) {
      return { valid: false, message: 'Invalid image format. Supported formats: JPEG, PNG, WebP, GIF, SVG.' };
    }
    const stringLength = img.length - img.indexOf(',') - 1;
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383615;
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (sizeInBytes > maxSize) {
      return { valid: false, message: 'Image size exceeds maximum allowed limit of 2MB.' };
    }
    return { valid: true };
  }
  if (isValidUrl(img)) {
    return { valid: true };
  }
  return { valid: false, message: 'Profile image must be a valid image file or URL.' };
};

/**
 * @desc    Create or update freelancer profile (Upsert)
 * @route   POST /api/profiles (or /api/freelancer-profile)
 * @access  Private (Freelancer only)
 */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      fullName,
      professionalTitle,
      title, // Fallback if sent as title
      bio,
      skills,
      experienceLevel,
      education,
      collegeName,
      hourlyRate,
      location,
      portfolioLinks,
      githubLink,
      github, // Fallback if sent as github
      linkedinLink,
      linkedin, // Fallback if sent as linkedin
      profileImage,
    } = req.body;

    const resolvedFullName = (fullName || req.user.name || '').trim();
    const resolvedTitle = (professionalTitle || title || '').trim();
    const resolvedGithub = (githubLink || github || '').trim();
    const resolvedLinkedin = (linkedinLink || linkedin || '').trim();

    // Validations
    if (!resolvedFullName || !resolvedTitle || !bio || !hourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: professionalTitle, bio, and hourlyRate',
      });
    }

    // Skills array validation
    let skillsArray = [];
    if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (skillsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one skill',
      });
    }

    // Image validation
    const imageCheck = validateImage(profileImage);
    if (!imageCheck.valid) {
      return res.status(400).json({ success: false, message: imageCheck.message });
    }

    // URL validations
    if (resolvedGithub && !isValidUrl(resolvedGithub)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid GitHub URL (https://...)' });
    }
    if (resolvedLinkedin && !isValidUrl(resolvedLinkedin)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid LinkedIn URL (https://...)' });
    }

    let validPortfolio = [];
    if (Array.isArray(portfolioLinks)) {
      validPortfolio = portfolioLinks.map((p) => String(p).trim()).filter(Boolean);
    } else if (typeof portfolioLinks === 'string') {
      validPortfolio = portfolioLinks.split(',').map((p) => p.trim()).filter(Boolean);
    }

    for (const url of validPortfolio) {
      if (!isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          message: `Invalid portfolio URL: "${url}". Please ensure it starts with http:// or https://`,
        });
      }
    }

    const finalImage =
      profileImage ||
      req.user.profileImage ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedFullName)}`;

    const profileData = {
      userId,
      fullName: resolvedFullName,
      professionalTitle: resolvedTitle,
      bio: bio.trim(),
      skills: skillsArray,
      experienceLevel: experienceLevel || 'Intermediate',
      education: education?.trim() || '',
      collegeName: collegeName?.trim() || '',
      hourlyRate: Number(hourlyRate),
      location: location?.trim() || 'Remote',
      portfolioLinks: validPortfolio,
      githubLink: resolvedGithub,
      linkedinLink: resolvedLinkedin,
      profileImage: finalImage,
    };

    // Upsert: Find and update if exists, or insert new
    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', 'name email role');

    // Sync profile image & name with User record
    await User.findByIdAndUpdate(userId, {
      name: resolvedFullName,
      profileImage: finalImage,
    });

    return res.status(201).json({
      success: true,
      message: 'Freelancer profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Error creating freelancer profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating profile',
    });
  }
};

/**
 * @desc    Get logged-in freelancer's own profile
 * @route   GET /api/profiles/me
 * @access  Private (Freelancer)
 */
export const getMyProfile = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role'
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No profile found for your account. Please create your profile first.',
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
 * @desc    Update logged-in freelancer's profile
 * @route   PUT /api/profiles/me
 * @access  Private (Freelancer only)
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await FreelancerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please create a profile first.',
      });
    }

    // Ownership check (ensures users can only edit their own profile)
    if (profile.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own profile',
      });
    }

    const {
      fullName,
      professionalTitle,
      title,
      bio,
      skills,
      experienceLevel,
      education,
      collegeName,
      hourlyRate,
      location,
      portfolioLinks,
      githubLink,
      github,
      linkedinLink,
      linkedin,
      profileImage,
    } = req.body;

    // Process skills
    if (skills !== undefined) {
      let skillsArray = [];
      if (Array.isArray(skills)) {
        skillsArray = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (skillsArray.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide at least one skill' });
      }
      profile.skills = skillsArray;
    }

    // Validate image if provided
    if (profileImage !== undefined) {
      const imgCheck = validateImage(profileImage);
      if (!imgCheck.valid) {
        return res.status(400).json({ success: false, message: imgCheck.message });
      }
      profile.profileImage = profileImage;
      await User.findByIdAndUpdate(userId, { profileImage });
    }

    // Validate URLs if provided
    const resolvedGithub = githubLink !== undefined ? githubLink : github;
    if (resolvedGithub !== undefined) {
      if (resolvedGithub && !isValidUrl(resolvedGithub)) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub URL' });
      }
      profile.githubLink = (resolvedGithub || '').trim();
    }

    const resolvedLinkedin = linkedinLink !== undefined ? linkedinLink : linkedin;
    if (resolvedLinkedin !== undefined) {
      if (resolvedLinkedin && !isValidUrl(resolvedLinkedin)) {
        return res.status(400).json({ success: false, message: 'Invalid LinkedIn URL' });
      }
      profile.linkedinLink = (resolvedLinkedin || '').trim();
    }

    if (portfolioLinks !== undefined) {
      let validPortfolio = [];
      if (Array.isArray(portfolioLinks)) {
        validPortfolio = portfolioLinks.map((p) => String(p).trim()).filter(Boolean);
      } else if (typeof portfolioLinks === 'string') {
        validPortfolio = portfolioLinks.split(',').map((p) => p.trim()).filter(Boolean);
      }
      for (const url of validPortfolio) {
        if (!isValidUrl(url)) {
          return res.status(400).json({ success: false, message: `Invalid portfolio URL: "${url}"` });
        }
      }
      profile.portfolioLinks = validPortfolio;
    }

    if (fullName) {
      profile.fullName = fullName.trim();
      await User.findByIdAndUpdate(userId, { name: fullName.trim() });
    }
    const resolvedTitle = professionalTitle || title;
    if (resolvedTitle) profile.professionalTitle = resolvedTitle.trim();
    if (bio) profile.bio = bio.trim();
    if (experienceLevel) profile.experienceLevel = experienceLevel;
    if (education !== undefined) profile.education = education.trim();
    if (collegeName !== undefined) profile.collegeName = collegeName.trim();
    if (hourlyRate !== undefined) profile.hourlyRate = Number(hourlyRate);
    if (location !== undefined) profile.location = location.trim();

    await profile.save();

    const updatedProfile = await FreelancerProfile.findById(profile._id).populate(
      'userId',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Freelancer profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating profile',
    });
  }
};

/**
 * @desc    Get public freelancer profile by profile ID or userId
 * @route   GET /api/profiles/:id
 * @access  Public
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile or user ID format',
      });
    }

    let profile = await FreelancerProfile.findById(id).populate(
      'userId',
      'name email profileImage role createdAt'
    );

    if (!profile) {
      profile = await FreelancerProfile.findOne({ userId: id }).populate(
        'userId',
        'name email profileImage role createdAt'
      );
    }

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
      message: 'Server error fetching public profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all public freelancer profiles (with filters)
 * @route   GET /api/profiles
 * @access  Public
 */
export const getAllProfiles = async (req, res) => {
  try {
    const { skill, experienceLevel, search, minRate, maxRate } = req.query;
    const filter = {};

    if (skill) {
      filter.skills = { $in: [new RegExp(skill, 'i')] };
    }

    if (experienceLevel && experienceLevel !== 'All') {
      filter.experienceLevel = experienceLevel;
    }

    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = Number(minRate);
      if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { professionalTitle: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { collegeName: { $regex: search, $options: 'i' } },
      ];
    }

    const profiles = await FreelancerProfile.find(filter)
      .populate('userId', 'name email profileImage role')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching public profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching freelancer profiles',
      error: error.message,
    });
  }
};
