import User from '../models/User.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * @desc    Register a new user (Client or Freelancer)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, profileImage } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. name@example.com)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists (case-insensitive check)
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists. Please sign in or use another email.',
      });
    }

    // Role validation
    const userRole = role === 'Client' ? 'Client' : 'Freelancer';

    // Default profile avatar using clean SVG initials
    const defaultAvatar =
      profileImage ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=f59e0b,d97706,b45309`;

    // Create user (password is automatically hashed via userSchema.pre('save'))
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      role: userRole,
      profileImage: defaultAvatar,
    });

    // If registering as Freelancer, initialize baseline profile so talent directory is instantly active
    if (userRole === 'Freelancer') {
      try {
        await FreelancerProfile.create({
          userId: user._id,
          fullName: trimmedName,
          professionalTitle: 'Professional Freelancer',
          bio: `Hello! I am ${trimmedName}, excited to collaborate on high-impact projects on WorkHive.`,
          skills: ['Communication', 'Project Management'],
          experienceLevel: 'Intermediate',
          hourlyRate: 50,
          profileImage: defaultAvatar,
        });
      } catch (profErr) {
        console.warn('Initial baseline freelancer profile note:', profErr.message);
      }
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during user registration',
    });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const trimmedInput = email.trim();
    const normalizedEmail = trimmedInput.toLowerCase();

    // Find user by email first
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    // User-friendly fallback: allow signing in by exact full name if no '@' provided
    if (!user && !trimmedInput.includes('@')) {
      const escapedInput = trimmedInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ name: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password using bcryptjs
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update lastLogin timestamp in MongoDB
    const loginTime = new Date();
    await User.findByIdAndUpdate(user._id, { lastLogin: loginTime });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        lastLogin: loginTime,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

/**
 * @desc    Logout user / clear session
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

